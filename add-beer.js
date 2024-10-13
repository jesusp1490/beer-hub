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
            await addBeer(beerData, beerData.id); // Assuming each beer in JSON has an 'id' field
        }
    } catch (e) {
        console.error("Error reading or parsing beers.json:", e);
    }
}

// Export the functions if you want to use them in other files
module.exports = { addBeer, addBeers };

// Example usage
const newBeer = {
    name: "Pelforth Radler Pamplemousse Rose",
    brandId: "Pelforth",
    beerType: "RADLER",
    ABV: 2.5,
    IBU: 0,
    averageRating: 0,
    description: "Find in Pelforth Radler Pink Grapefruit the double refreshment created by the delicious combination of beer and citrus juice. Discover the Pelforth Radler recipe inspired by a Bavarian brewing tradition. A unique blend of blonde beer and pink grapefruit juice for an extremely flavorful and refreshing moment.",
    beerImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2FPelforth-Radler-Pamplemousse-Rose-botella.webp?alt=media&token=69394567-d6d4-403e-83ae-657a1d6ff51d",
    beerLabelUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Flabels%2FPelforth-Radler-Pamplemousse-Rose-label.webp?alt=media&token=675c7a7f-8ddd-47f2-b685-ab6e1eb4d890",
    ingredients: [
        { name: "Water", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fwater.webp?alt=media&token=d2625213-033e-4772-8984-0f1370da5d55" },
        { name: "Barley Malt", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fbarley-malt.webp?alt=media&token=42c79a9b-cd07-4106-8bfe-e3d7913aefc0" },
        { name: "Hop Extract", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fhop.webp?alt=media&token=bd73980b-21b4-4d57-911f-4d5a8400ea55" },
        { name: "Carbon Water", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcarbon-water.webp?alt=media&token=84bd0a2a-35d8-467f-8c2d-032db0751a81" },
        { name: "Sugar", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2FSugar.webp?alt=media&token=33eedab3-e4fa-4de4-bc48-8022f2fd42bf" },
        { name: "Glucose Syrup", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fsugar-liquid.webp?alt=media&token=ac220275-2851-47a8-b3c5-1f9caafaac77" },
        { name: "Pink Grapefruit Juice", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Forange.webp?alt=media&token=576b6a84-d936-4491-ba48-ded56ebe8d7a" },
        { name: "Orange Juice", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fgrapefruit.webp?alt=media&token=dadfc578-ac7d-4bc5-a57d-77efddd51e85" },
        { name: "Gum Arabic", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Facacia.webp?alt=media&token=c37ca688-f001-46d6-9bc7-42f68a8ecbbe" },
    ],
    countryId: "France",
    id: "Pelforth-Radler-Pamplemousse-Rose",
    web: "https://www.heinekenfrance.fr/nos-produits/nos-marques/pelforth/",
};

// Generate a custom ID (you can use any method you prefer to generate IDs)
const customId = 'Pelforth-Radler-Pamplemousse-Rose';

// Add the beer with the custom ID
addBeer(newBeer, customId).then(() => process.exit());