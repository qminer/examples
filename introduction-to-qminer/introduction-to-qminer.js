/************************************************
 * QMINER 101 HANDS-ON TUTORIAL
 *
 * Abstract: the notebook describes basic functionalities of the QMiner platform
 * (https://github.com/qminer/qminer) - an analytics platform for real-time
 * large-scale streams containing structured and unstructured data. In this
 * tutorial we will create a spam filter using the Support Vector Machine (SVM) model.
 *
 * It shows the following functionalities:
 *
 * - importing the QMiner module into your Node.js project
 * - creating a QMiner database
 * - filling the database with new records
 * - extracting features from the records
 * - create a spam filter using the SVM model
 * - classify a new unlabelled record using the spam filter
 *
 * The QMiner documentation is available at
 * https://rawgit.com/qminer/qminer/master/nodedoc/index.html
 */



///////////////////////////////////////////////////////////////////////////////
/// PREREQUISITES
/**
 * Before we can run JavaScript we must install Node.js, which is available
 * at https://nodejs.org/en/. Follow the installation instructions and you
 * should be good to go! This will install both nodejs and NPM (Node Package
 * Manager) which allows you to install modules developed for nodejs.
 */



///////////////////////////////////////////////////////////////////////////////
/// IMPORTING QMINER MODULE
/**
 * In this section we will import the QMiner module within our Node.js project.
 * For this we need to have Node.js version 6 or higher and Node Package Manager
 * (npm) version 5.3 or higher (npm usually comes with Node.js). Afterwards, we
 * open our project (.js) file and import the module.
 *
 * To install the qminer module inside your Node.js project run
 *
 * `npm install qminer`
 *
 * in the command line. This will install the qminer module
 * into the node_modules folder - allowing you to use its functionalities by
 * `requiring` it in the project file.
 */

const qm = require('qminer');
console.log(`QMiner version ${qm.version}`);



///////////////////////////////////////////////////////////////////////////////
/// QMINER DATABASE
/**
 * To analyse data using QMiner we first need some data. This can be anything,
 * from sensor signals to news articles. Next, we create a QMiner database so
 * that we will be able to aggregate our data, query it, and extract record
 * features, as shown bellow.
 */

/**
 * As in SQL query languages, we must first define the schema of our database
 * structure. The full documentation of how to create the schema is found at
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.html#~SchemaDef
 *
 * In this tutorial, we will use the email dataset (saved as emails.json).
 * Each example of the dataset contains the following attributes:
 *
 * - `subject` of the email
 * - `body` or content of the email
 * - `spam` label where 1 means the email is spam and 0 in the email is not a spam.
 */

 /**
 * For the dataset we will define a schema, containing one store (table) named
 * `Email` which contains fields (columns) named `subject`, `body` and `spam`.
 *
 * The fields `subject` and `body` will be of type `string` while the field `spam`
 * is of type `float` (due to the type of data in the emails dataset). Since some
 * of the emails might omit the body, we will also configure the field `body` to
 * be optional (by setting the `null` attribute). For more fields settings see
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.html#~SchemaFieldDef
 *
 * The `keys` attribute in the schema is required to query records (examples) in
 * the QMiner database. If you do not query the records you can omit this attribute.
 * For more keys settings see
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.html#~SchemaKeyDef
 */
const schema = [
    {
        name: "Email", // the name of the store
        fields: [ // fields contain the structure of the records in store
            { name: "subject", type: "string" },
            { name: "body", type: "string", null: true },
            { name: "spam", type: "float" }
        ],
        keys: [ // keys are required for indexing and for querying by different fields
            { field: "subject", type: "text" },
            { field: "body", type: "text" }
        ]
    }
];

/**
 * Once the schema is defined, we create the QMiner database with the following
 * lines of code.
 * NOTE: QMiner databases can be created/opened in various ways. These options
 * or `modes` -- as used in QMiner -- are the following:
 *
 * `createClean`  - cleans the folder in which the database is stored and creates
 *                  a new database
 * `create`       - creates a database but returns an error if the folder is not
 *                  empty
 * `open`         - opens an existing database, enabling adding new records to it
 * `openReadOnly` - opens an existing database, but does not allow adding new
 *                  records (used only for reading) - default setting
 *
 * Where the database is created is specified by setting the `dbPath` attribute
 * (default `dbPath` is `./db/`).
 *
 * NOTE: even though setting the `dbPath` is optional, it is recommended to change
 * it -- for avoiding overriding the database by mistake. This happens quickly when
 * you are experimenting with the data and code.
 */

/// CLEANS THE FOLDER AND CREATES A NEW DATABASE
/// IMPORTANT: closing the database - see last section of this file
const base = new qm.Base({
    mode: 'createClean',
    schema,
    dbPath: './database/' // default: './db/'
});

/// LOADS AN EXISTING DATABASE - NEW RECORDS CAN BE ADDED
/// IMPORTANT: closing the database - see last section of this file
// const base = new qm.Base({
//     mode: 'open',
//     dbPath: './database/' // default: './db/'
// });

/// LOADS AN EXISTING DATABASE IN READ ONLY MODE - NEW RECORDS CANNOT BE ADDED
/// IMPORTANT: closing the database - see last section of this file
// const base = new qm.Base({
//     // mode: 'openReadOnly', // not required since it is the default value
//     dbPath: './database/' // default: './db/'
// });

console.log('Database created, store list:', base.getStoreList());



///////////////////////////////////////////////////////////////////////////////
/// FILLING THE DATABASE WITH RECORDS
/**
 * Now that we have it initialized we can push records into the database.
 * This process is similar to pushing items into a JavaScript array. Here
 * you need to be careful that all of the required fields -- as specified in
 * the schema -- are present and none other value is found in the object.
 *
 * Afterwards, you designate the store into which you wish to push the
 * records and use the `.push()` method to do that -- see
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.Store.html#push
 *
 * What follows is pushing the email records from our dataset into the QMiner
 * database. NOTE: when pushing the records we must first select in which
 * store we wish to do so. This is done by the `.store()` method -- see
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.Base.html#store
 */

// load the email examples
const examples = require('./emails');
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
console.log(
    'Accessing the first record of the emails record set',
    'should give the same result'
);
console.log(emails[0]);



///////////////////////////////////////////////////////////////////////////////
/// CALCULATE AGGREGATES
/**
 * Sometimes we wish to get some basic statistics -- distribution of values,
 * word importance, simple counting -- to understand what is in the database.
 * QMiner has these methods available and can be used as follows:
 *
 * - get the `spam` distribution using the `histogram` aggregate
 * - get the tf-idf measure of `subject` words using the `keywords` aggregate
 *
 * Both aggregations will be executed using the `.aggr()` method applied on the
 * `emails` record set defined in the previous step. The method's input is an
 * object containing the following attributes:
 *
 * `type`  - the aggregation type. Options: 'histogram', 'keywords', 'timeline', 'count'
 * `field` - the name of the field we wish to aggregate
 * `name`  - the name of the aggregate. Defined by the user for identification
 *
 * NOTE: the methods are not available in the documentation. This will be fixed
 * in the future.
 */

// calculates the histogram distribution of the spam count
const histogram = emails.aggr({
    type: 'histogram',
    field: 'spam',
    name: 'spam_histogram'
});
console.log('spam histogram', histogram);

// get the tf-idf measure of subject words
const keywords = emails.aggr({
    type: 'keywords',
    field: 'subject',
    name: 'subject_histogram'
});
console.log('subject keywords', keywords);



///////////////////////////////////////////////////////////////////////////////
/// QUERYING
/**
 * QMiner allows the user to query the database stores based on the query parameters.
 * To query we must first define the keys by which we wish to query (see previous
 * section: QMINER DATABASE). Once we setup the schema appropriately we can query
 * the records -- but only by the defined keys!
 *
 * The whole query documentation is described at
 * https://github.com/qminer/qminer/wiki/Query-Language
 *
 * Underneath is an example where we query for emails which mention the words
 * `deadline` or `meeting`. Afterwards, we will filter the query results to
 * contain only non-spam emails.
 */

// setting the query
const query = {
    $from: 'Email', // the target store
    $or: [ // records must match either condition specified in the array
        {
            subject: { // for field `subject`
                $or: ['meeting', 'deadline'] // containing either the words `meeting` or `deadline`
            }
        },
        {
            body: { // for field `body`
                $or: ['meeting', 'deadline'] // containing either the words `meeting` or `deadline`
            }
        }
    ]
};

// search for records that match the query criteria
let queryResults = base.search(query);
console.log('number of query results', queryResults.length);

/**
 * Accessing the record information can be done in a similar way as when accessing
 * a value in an array -- specify the position of the record in the record set.
 *
 * NOTE: this can be done for ANY record set, not only for query results.
 */
console.log(queryResults[0]);

/**
 * FILTER OUT THE NON-SPAM RESULTS
 * This can be done by using the `.filter()` method. For more documentation see
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.RecordSet.html#filter
 */
queryResults.filter(rec => !rec.spam);
console.log('number of query results that are not spam', queryResults.length);

/**
 * Similar methods can be applied on the record set. The full list of methods is
 * described at
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.RecordSet.html
 */



///////////////////////////////////////////////////////////////////////////////
/// FEATURE EXTRACTION
/**
 * One of the big features of QMiner is feature extraction. This is done with
 * the use of `FeatureSpace` object documented at
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.FeatureSpace.html
 *
 * When creating the feature space we must specify which feature extractors we
 * wish to use. These range from taking the actual value of a field to creating
 * Bag-of-Words (https://en.wikipedia.org/wiki/Bag-of-words_model) models from
 * text provided in the database. The full list of feature extractors is available
 * at https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.html#~FeatureExtractor
 *
 * The number of attributes of the feature extractor might vary -- but the three
 * attributes that must be present are:
 *
 * `type`   - The type of the feature extractor.
 * `field`  - The field used to extract the features.
 * `source` - The store in which the extractor should work.
 *
 * Once set, we can extract features for each record OR record set. The features
 * are represented as a vector where the i-th position of the vector show the weight
 * of the i-th feature in the feature space.
 */

/**
 * In this section, we will create a feature space with a single feature extractor
 * of type `text`. This type will create a tf-idf model out of the `subject` and
 * `body` fields of the email (https://en.wikipedia.org/wiki/Tf%E2%80%93idf).
 */
const featureSpace = new qm.FeatureSpace(base, [
    { type: 'text', field: ['subject', 'body'], source: 'Email' }
    // the feature space can have multiple feature extractors
]);

// need to update feature space - for text extractor
console.log('number of features, before', featureSpace.dim);
// update the feature space - setting the features from the data
featureSpace.updateRecords(emails);
// output the number of features the feature extractor gathered
console.log('number of features, after', featureSpace.dim);



///////////////////////////////////////////////////////////////////////////////
/// SPAM FILTER USING SVM MODEL
/**
 * QMiner has a lot of machine learning methods already integrated. The full list
 * of methods is found under the section `child classes` at
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.html
 *
 * All of the algorithms are found in the `qm.analytics` submodule.
 *
 * In this section we will train a classifier using the SVC model -- derived from
 * the Support Vector Machine (SVM). The full documentation of SVC is provided at
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.SVC.html
 *
 * To train the classifier we will do the following:
 *
 * - Initialize the SVC model
 *   NOTE: the model is found in the `qm.analytics` submodule
 * - Extract record features using the feature space
 * - Extract the `spam` values directly from the `emails` record set
 * - Train the SVC model using the `.fit()` method. Documentation available at
 *   https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.SVC.html#fit
 *
 * Afterwards, we will classify new emails by using the `.predict()` method. See
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.SVC.html#predict
 */

// initialize the SVC model
// full parameter list is found at
// https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.html#~SVMParam
let SVC = new qm.analytics.SVC({ maxTime: 5 });

// extract features from the emails using the feature space
let emailFeatures = featureSpace.extractSparseMatrix(emails);

// extract the target spam labels from the `emails` record set
let emailLabels = emails.getVector('spam');

// count the number of spam emails using the `.sum()` method
console.log('number of spam emails', emailLabels.sum());
// before we fit the classifier it has no weights set
console.log('SVC weights, before', SVC.weights.length);

// train the classifier model by providing the record feature vectors and their
// spam labels using the `.fit()` method. This might take some time. See
// https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.SVC.html#fit
SVC.fit(emailFeatures, emailLabels);

// show the number of weights the model trained
// should be the same number as the number features in the features space
console.log('SVC weights, after', SVC.weights.length);


///////////////////////////////////////
/// PREDICTION OF A NEW RECORD

// make the prediction -- is the email a spam or not -- for a previously unseen
// email (the Nigerian Prince spam email). Documentation available at
// https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.SVC.html#predict
let prediction = SVC.predict(featureSpace.extractSparseVector({
    subject: 'Get money quick!',
    body: `Dear Sir, SEEKING YOUR IMMEDIATE ASSISTANCE. Please permit me to make
    your acquaintance in so informal a manner. This is necessitated by my urgent
    need to reach a dependable and trust wordy foreign partner. This request may
    seem strange and unsolicited but I will crave your indulgence and pray that
    you view it seriously. My name is. DAN PATRICK of the Democratic Republic of
    Congo and One of the close aides to the former President of the Democratic
    Republic of Congo LAURENT KABILA of blessed memory, may his soul rest in
    peace. Due to the military campaign of LAURENT KABILA to force out the
    rebels in my country, I and some of my colleagues were instructed by Late
    President Kabila to go abroad to purchase arms and ammunition worth of Twenty
    Million, Five Hundred Thousand United States Dollars only (US$20,500,000.00)
    to fight the rebel group. But when President Kabila was killed in a bloody
    shoot-out by one of his aide a day before we were schedule to travel out of
    Congo, We immediately decided to divert the fund into a private security
    company here in Congo for safe keeping. The security of the said amount is
    presently being threatened here following the arrest and seizure of properties
    of Col.Rasheidi Karesava (One of the aides to Laurent Kabila) a tribesman,
    and some other Military Personnel from our same tribe, by the new President
    of the Democratic Republic of Congo, the son of late President Laurent Kabila,
    Joseph Kabila. In view of this, we need a reliable and trustworthy foreign
    partner who can assist us to move this money out of my country as the
    beneficiary. WE have sufficient ''CONTACTS'' to move the fund under Diplomatic
    Cover to a security company in the Europe in your name. This is to ensure
    that the Diplomatic Baggage is marked ''CONFIDENTIAL'' and it will not pass
    through normal custom/airport screening and clearance. Our inability to move
    this money out of Congo all This while lies on our lack of trust on our supposed
    good friends (western countries) who suddenly became hostile to those of us who
    worked with the late President Kabila, immediately after his son took office.
    Though we have neither seen nor met each other, the information we gathered from
    an associate who has worked in your country has encouraged and convinced us
    that with your sincere assistance, this transaction will be properly handled
    with modesty and honesty to a huge success within two weeks. The said money
    is a state fund and therefore requires a total confidentiality. Thus, if you
    are willing to assist us move this fund out of Congo, you can contact me
    through my email address above with your telephone, fax number and personal
    information to enable us discuss the modalities and what will be your share
    (percentage) for assisting us. I must use this opportunity and medium to
    implore You to exercise the utmost indulgence to keep this Matter extraordinarily
    confidential, Whatever your Decision, while I await your prompt response.
    NOTE: FOR CONFIDENTIALITY, I WILL ADVISE YOU REPLY ME ON MY ALTERNATIVE EMAIL
    BOX (patrickdan@rediffmail.com).Thank you and God Bless. Best Regards, MR DAN PATRICK.`
}));

// output the value of the prediction
console.log(prediction);
// show if the email was predicted as a spam or not
console.log('Get money quick!', prediction > 0 ? 'spam' : 'not-spam');



///////////////////////////////////////////////////////////////////////////////
/// SAVING THE FEATURE SPACE AND MODELS
/**
 * Loads the feature space and model from the saved file.
 *
 * IMPORTANT: the order of initializing should be the same as the order of
 * saving object. If the order is not the same, the objects will not be
 * initialized.
 */

// open a file in which we wish to write/save the models. Documentation found at
// https://rawgit.com/qminer/qminer/master/nodedoc/module-fs.html#.openWrite
var fout = qm.fs.openWrite('./database/models.bin');

// save the feature space. Method documentation found at
// https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.FeatureSpace.html#save
featureSpace.save(fout);

// save the spam filter - classifier model. Method documentation found at
// https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.SVC.html#save
SVC.save(fout);

// IMPORTANT: flush the data into the file. Without this line, the models will NOT be saved.
// https://rawgit.com/qminer/qminer/master/nodedoc/module-fs.FOut.html#close
fout.close();



///////////////////////////////////////////////////////////////////////////////
/// LOADING THE FEATURE SPACE AND MODELS
/**
 * Loads the feature space and model from the saved file.
 *
 * IMPORTANT: the order of initializing should be the same as the order of
 * saving object. If the order is not the same, the objects will not be
 * initialized.
 */

// open the file in which the models were written. Documentation found at
// https://rawgit.com/qminer/qminer/master/nodedoc/module-fs.html#.openRead
const fin = qm.fs.openRead('./database/models.bin');

// load the feature space
// NOTE: it was the first model saved in the previous section. See parameters of
// first example at
// https://rawgit.com/qminer/qminer/master/nodedoc/module-qm.FeatureSpace.html
let featureSpace2 = new qm.FeatureSpace(base, fin);

// load the classifier model
// NOTE: it was the second model saved in the previous section. See parameters of
// first example at
// https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.SVC.html
let SVC2 = new qm.analytics.SVC(fin);

// output the values to show the models were loaded correctly
console.log('Loaded feature space dimensions', featureSpace2.dim);
console.log('Loaded SVC model weight number', SVC2.weights.length);



///////////////////////////////////////////////////////////////////////////////
/// IMPORTANT: close the database
/**
 * If the database isn't closed and it wasn't in 'openReadOnly' mode
 * you will corrupt the database, and won't be able to use the records
 * in the future.
 */

// IT IS IMPORTANT TO CLOSE THE DATABASE
base.close();
