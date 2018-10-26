///////////////////////////////////////////////////////////////////////////////
/// QMINER: DOCUMENT CLUSTERING
 /**
 * Abstract: the tutorial how to cluster documents using the k-means clustering
 * algorithm available in QMiner.
 *
 * It shows the following functionalities:
 *
 * - importing the QMiner module into your Node.js project
 * - preparing the feature extractors
 * - create a number of clusters using KMeans
 * - make a prediction -- in which cluster a new email falls into
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
            { name: "spam", type: "float" }
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

// create the feature space using the default parameters
// for `text` feature extractor
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
/// K-MEANS CLUSTERING
/**
 *
 * In this section we will cluster the emails by using the k-means clustering
 * algorithm (KMeans). The full documentation of KMeans is provided at
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.KMeans.html
 *
 * A description of how the k-means clustering algorithm works is found at
 * https://en.wikipedia.org/wiki/K-means_clustering
 *
 * To cluster the emails we will:
 *
 * - Initialize the KMeans model
 *   NOTE: the model is found in the `qm.analytics` submodule
 * - Extract record features using the feature space
 * - Train the KMeans model using the `.fit()` method. Documentation available at
 *   https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.KMeans.html#fit
 *
 * Afterwards, we will classify new emails by using the `.predict()` method. See
 * https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.KMeans.html#predict
 */

// initialize the KMeans model. The parameters that we set are:
//
// `k`            - the number of clusters we wish to have
// `distanceType` - the distance metric in which we wish to compare documents
//
// Full parameter list is found at
// https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.html#~KMeansParam
let KMeans = new qm.analytics.KMeans({ k: 4, distanceType: 'Cos' });

// extract features from the emails using the feature space
let emailFeatures = featureSpace.extractSparseMatrix(emails);

// train the classifier model by providing the record feature vectors using the
// `.fit()` method. Since k-means clustering is an unsupervised learning method
// it does not require any labels to train the model (the model is trained by
// only using the provided email feature vectors). More about the `fit` method:
// https://rawgit.com/qminer/qminer/master/nodedoc/module-analytics.KMeans.html#fit
KMeans.fit(emailFeatures);

// show the number of clusters in the model. This is retrieved by counting the
// number of centroids the model created. A centroid is the average vector of all
// records in a given cluster.
console.log('KMeans number of clusters', KMeans.centroids.cols);


///////////////////////////////////////
/// PREDICTION OF A NEW RECORD

// extract features of the spam email
let spamEmail = featureSpace.extractSparseVector({
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
});

// make the prediction -- in which cluster the email falls in -- for a previously unseen
// email (the Nigerian Prince spam email).

// first calculate the distances between the new email and the cluster centroids
let distances = KMeans.centroids.multiplyT(spamEmail);



// afterwards we search for the index with the lowest distance

let prediction = null;

///////////////////////////////////////
// DISTANCE TYPE: COS

prediction = distances.getMaxIdx();


///////////////////////////////////////
// DISTANCE TYPE: EUCLID

// let minDistance = Infinity;
//
// // iterate through distances
// for (let id = 0; id < distances.length; id++) {
//     if (distances[id] < minDistance) {
//         minDistance = distances[id];
//         prediction = id;
//     }
// }

// show in which cluster the email falls into
console.log('Get money quick! cluster id', prediction + 1);



///////////////////////////////////////////////////////////////////////////////
/// IMPORTANT: close the database
/**
 * If the database isn't closed and it wasn't in 'openReadOnly' mode
 * you will corrupt the database, and won't be able to use the records
 * in the future.
 */

// IT IS IMPORTANT TO CLOSE THE DATABASE
base.close();
