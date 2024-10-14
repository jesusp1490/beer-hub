require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

// Load the service account key JSON file
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Initialize the app with admin privileges
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addBeer(beerData, customId) {
    try {
        let docRef;
        if (customId) {
            docRef = db.collection('beers').doc(customId);
            await docRef.set(beerData);
        } else {
            docRef = await db.collection('beers').add(beerData);
        }
        console.log("Beer added with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding beer: ", e);
    }
}

async function addBeers() {
    try {
        const beersData = JSON.parse(fs.readFileSync('beers.json', 'utf8'));

        for (const beerData of beersData) {
            await addBeer(beerData, beerData.id); 
        }
    } catch (e) {
        console.error("Error reading or parsing beers.json:", e);
    }
}

// Export the functions if you want to use them in other files
module.exports = { addBeer, addBeers };

// Example usage
const newBeer = {
    name: "Les Québécoises",
    brandId: "Thiriez",
    beerType: "BLONDE ALE",
    ABV: 5.5,
    IBU: "N/A",
    averageRating: 0,
    description: "Light and Refreshing Beer brewed by Daniel Thiriez and his team in the small village of Esquelbecq (in Northern France). Les Québécoises is a traditional blonde wheat beer, slightly spiced with a very floral aroma, and easy to drink. A must-try from Brasserie Thiriez and a perfect entry point into the world of craft beer...",
    beerImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2FThiriez-Les-Qu%C3%A9b%C3%A9coises-botella.webp?alt=media&token=feec7fd4-744b-4f2d-a03f-09d8b8439113",
    beerLabelUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Flabels%2FThiriez-Les-Qu%C3%A9b%C3%A9coises-label.webp?alt=media&token=c9d7e019-3feb-4971-976e-c9dc9901f228",
    ingredients: [
        { name: "Water", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fwater.webp?alt=media&token=d2625213-033e-4772-8984-0f1370da5d55" },
        { name: "Barley Malt", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fbarley-malt.webp?alt=media&token=42c79a9b-cd07-4106-8bfe-e3d7913aefc0" },
        { name: "Hop", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fhop.webp?alt=media&token=bd73980b-21b4-4d57-911f-4d5a8400ea55" },
        { name: "Yeast", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fyeast2.webp?alt=media&token=fa095e3c-963c-4c92-b349-7aa34c6a263a" },
        { name: "Spices", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fspices.webp?alt=media&token=0112b887-e6db-4426-93a2-927c49c2b3f2" },
    ],
    countryId: "France",
    id: "Thiriez-Les-Québécoises",
    web: "https://www.brasseriethiriez.com",
};

// Generate a custom ID (you can use any method you prefer to generate IDs)
const customId = 'Thiriez-Les-Québécoises';

// Add the beer with the custom ID
addBeer(newBeer, customId).then(() => process.exit());