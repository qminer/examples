///////////////////////////////////////////////////////////////////////////////
/// QMINER: NEAREST NEIGHBOR MODEL
 /**
 * Abstract: the tutorial describes how to create a k-nearest neighbor model
 * using QMiner components.
 *
 * It shows the following functionalities:
 *
 * - importing the QMiner module into your Node.js project
 * - preparing the feature extractors
 * - create the nearest neighbor model
 * - find the most similar records for a given input
 *
 * The QMiner documentation is available at
 * https://rawgit.com/qminer/qminer/master/nodedoc/index.html
 */



///////////////////////////////////////////////////////////////////////////////
/// SETTING UP THE QMINER DATABASE
/**
 * We have already covered how to set up a database in QMiner. To refresh this
 * knowledge see 1. introduction-to-qminer.
 */

// include qminer module
const qm = require('qminer');
console.log(`QMiner version ${qm.version}`);

// set up the qminer schema
const schema = [
    {
        name: "Email", // the name of the store
        fields: [ // fields contain the structure of the records in store
            { name: "subject", type: "string" },
            { name: "body", type: "string", null: true },
            { name: "spam", type: "bool" }
        ]
        // NOTE: keys will not be required for this tutorial
    }
];

// initialize the qminer database
const base = new qm.Base({
    mode: 'createClean',
    schema,
    dbPath: './database/' // default: './db/'
});

// load the email examples
const examples = require('../emails');
console.log('Number of emails in file', examples.length);

// push each email into the `Email` store of the QMiner database
for (let email of examples) {
    base.store('Email').push(email);
}

// get all records from the `Email` store
let emails = base.store('Email').allRecords;
console.log('Number of emails in store', emails.length);

// select the first record of the `Email` record set
console.log('Accessing the first record of the Email store');
console.log(base.store('Email')[0]);



///////////////////////////////////////////////////////////////////////////////
/// NEAREST NEIGHBOR MODEL
/**
 * In this section we will prepare feature extractors and the k-nearest neighbor
 * model. Since the model is not available in the `analytics` submodule we will
 * create it by using QMiner's linear algebra submodule (`la`) components:
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-la.html.
 *
 * The section is separated into:
 * - extracting features from records
 * - creating the nearest neighbor model from scratch
 * - using the model to find the most similar emails to a given input
 */



///////////////////////////////////////
/// EXTRACTING TEXTUAL FEATURES
/**
 * We have already covered feature extraction in the previous lessons. In this
 * section, we will focus on the `text` feature extractor which enables us to
 * represent textual documents with vectors. The whole documentation of the `text`
 * feature extractor is available at
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.html#~FeatureExtractorText.
 */

/**
 * WEIGHT
 * This attribute determines how we calculate the weight of a word within the specified
 * fields. The possible options are:
 *
 * `none`  - will set 1 if the term/word is present in the specified fields, otherwise sets 0
 * `tf`    - will set the `term frequency` (counts the number of term/word occurances)
 *           in the specified fields
 * `idf`   - will set the `inverse document frequency` (counts the number of records that
 *           contain the term/word) in the specified fields
 * `tfidf` - will set the combination of `term frequency` and `inverse document frequency`
 *
 * DEFAULT: 'tfidf'
 *
 * For more detail on the `tf-idf` weight calculation see
 * https://en.wikipedia.org/wiki/Tf%E2%80%93idf.
 */

/**
 * NORMALIZE
 * This attribute determines how we calculate the weight of a word within the specified
 * fields. More on normalization: http://mathworld.wolfram.com/NormalizedVector.html
 * DEFAULT: true
 * Options:
 * true  - will normalize the feature vectors
 * false - will NOT normalize the feature vectors
 */

/**
 * TOKENIZER
 * Inside the tokenizer object we set how we wish to transform words before we
 * calculate the weight of each word in the record. Here we describe what each
 * field mean.
 * NOTE: setting the tokenizer is optional, all of the fields have a default
 * setting as shown bellow.
 *
 * - `type`
 *      Setting this field specifies the type of encoding of the fields.
 *      DEFAULT: `simple`
 *      Options:
 *      `simple`  - the simple encoding (use it as it is)
 *      `html`    - the text is shown as an html page
 *      `unicode` - the unicode encoding
 *
 * - `stopwords`
 *      Setting the field selects the pre-defined stopword list we wish to use.
 *      More on stopwords: https://en.wikipedia.org/wiki/Stop_words
 *      DEFAULT: `en`
 *      Options:
 *      `none` - no pre-defined stopword list
 *      `en`   - the english pre-defined stopword list
 *      `si`   - the slovene pre-defined stopword list
 *      `es`   - the spanish pre-defined stopword list
 *      `de`   - the german pre-defined stopword list
 *      array  - the array of user defined stopwords
 *
 * - `stemmer`
 *      Setting this field determines if we wish to use stemming in the extraction.
 *      More on stemming: https://en.wikipedia.org/wiki/Stemming
 *      DEFAULT: `none`
 *      Options:
 *      `true` or `porter` - use the porter stemmer
 *      `none`             - use no stemmer
 *
 * - `uppercase`
 *      This field determines if we wish to change all words to uppercase (ignoring
 *      capitalization).
 *      DEFAULT: true
 *      Options:
 *      true  - will uppercase words
 *      false - will NOT uppercase words
 */

//
const featureSpace = new qm.FeatureSpace(base, {
    type: 'text',
    source: 'Email',
    field: ['subject', 'body'],
    weight: 'none', // how we calculate the weights to represent a particular word in the document
    normalize: true, // if we wish to normalize feature vectors
    tokenizer: {
        type: 'simple', // the type in which the text is encoded
        stopwords: 'none', // do we remove stopwords and for which language
        stemmer: 'none', // do we use stemming, and which type of stemming
        uppercase: true // do we convert all words into uppercase before calculating the weights
    }
});

// update the feature space - seeting the features of the data
featureSpace.updateRecords(emails);

///////////////////////////////////////
/// CREATING A NEAREST NEIGHBOR MODEL


/**
 * Returns the most similar emails to the given query and its weights.
 * @param {String} query - The query for which the user wishes to find simiar emails.
 * @param {Number} [maxCount=100] - The maximum number of records the function should return.
 * @param {Number} [minSim=0.05] - The minimum similarity measure we still see as acceptable.
 * @returns {Array} The array containing the record set as the first position and an array of
 * similarity weights of the record set.
 */
function search(query, maxCount=100, minSim=0.05) {
    try {
        // creates a record using the the query text (is NOT stored in the database)
        let queryRecord = base.store('Email').newRecord({ subject: query });

        if (!queryRecord) {
            // there is no record in the record set containing the url
            // return an empty record set with weights
            // TODO: tell the user of the missing record
            return [base.store('Email').newRecordSet(), []];
        }

        // extract emails feature matrix
        let ftrMatrix = featureSpace.extractSparseMatrix(emails);
        // extract query feature
        let vector = featureSpace.extractSparseVector(queryRecord);

        // calculate similarities between query vector and content
        // similarity measured using Cosine distance. See
        // https://en.wikipedia.org/wiki/Cosine_similarity
        let sim = ftrMatrix.multiplyT(vector);

        // sort the similarities in descending order (with their record ids)
        let sort = sim.sortPerm(false);
        let idVec = qm.la.IntVector();
        let simVec = [ ];

        // fix maxCount if exceeding the number of records in the store
        if (maxCount > sort.perm.length) {
            // the threshold is larger than the similarity vector
            maxCount = sort.perm.length;
        }

        // get the first maxCount record
        for (let i = 0; i < maxCount; i++) {
            // get content id of (i+1)-th most similar content
            let maxid = sort.perm[i];
            // stop if similarity is smaller than the treshold
            if (sim[maxid] < minSim) { break; }

            // else remember the content and it's similarity
            idVec.push(maxid);
            simVec.push(sim[maxid]);
        }

        // return the record set and their similarities
        return [base.store('Email').newRecordSet(idVec), simVec];
    } catch (error) {
        return { error: error.message };
    }
}



///////////////////////////////////////
/// APPLICATION ON A NEW INPUT
/**
 * Now we can find emails similar to the given query. We will search for emails
 * that are similar (either by subject or body) to the string `learning french`.
 * The function will return an array of similar records (in a record set) and
 * their weights.
 */

// get emails that are similar to the string `learning french`
let similarEmails = search('learning french');

// output the top 5 most similar emails
for (let i = 0; i < 5; i++) {
    console.log('emails similarity', similarEmails[1][i]);
    console.log(similarEmails[0][1]);
}



///////////////////////////////////////////////////////////////////////////////
/// IMPORTANT: close the database
/**
 * If the database isn't closed and it wasn't in 'openReadOnly' mode
 * you will corrupt the database, and won't be able to use the records
 * in the future.
 */

// IT IS IMPORTANT TO CLOSE THE DATABASE
base.close();