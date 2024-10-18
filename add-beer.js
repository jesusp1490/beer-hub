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
    name: "Chelada Sandía Picante",
    brandId: "Modelo",
    beerType: "SPICED BEER",
    ABV: 3.5,
    IBU: "N/A",
    averageRating: 0,
    description: "Modelo is proud to add the Modelo Chelada® Sandía Picante to our line of Cheladas which honor the origin and tradition of the michelada. Just like our other flavor-forward Cheladas, the Modelo Chelada® Sandía Picante delivers the right balance for a delicious michelada-style beer.",				
    beerImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2FModelo-Chelada-Sandia-Picante-lata.webp?alt=media&token=4f9d6650-6cd9-42dd-ac20-3fc2080d7a7c",
    beerLabelUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Flabels%2FModelo-Chelada-Sandia-Picante-label.webp?alt=media&token=86b4728f-5273-4244-ac9f-f2d016c6572e",
    ingredients: [
        { name: "Water", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fwater.webp?alt=media&token=d2625213-033e-4772-8984-0f1370da5d55" },
        { name: "Barley Malt", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fbarley-malt.webp?alt=media&token=42c79a9b-cd07-4106-8bfe-e3d7913aefc0" },
        // { name: "Wheat Malt", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fwheat.webp?alt=media&token=84a0bb8d-bc55-4683-9620-59d21f69799d" },
        { name: "Maize", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcorn.webp?alt=media&token=adc4faba-02f1-4327-88b3-4ce654ea62be" },
        { name: "Hop", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fhop.webp?alt=media&token=bd73980b-21b4-4d57-911f-4d5a8400ea55"},
        // { name: "Yeast", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fyeast2.webp?alt=media&token=fa095e3c-963c-4c92-b349-7aa34c6a263a" },
        // { name: "Rice", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Frice.webp?alt=media&token=fd8348b4-7a02-474a-845a-e658b46580b8" },
        // { name: "Lemon", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Flemon.webp?alt=media&token=d3d11ae0-f960-43c1-b61e-84b4515a8dae" },
        // { name: "Orange", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Forange.webp?alt=media&token=576b6a84-d936-4491-ba48-ded56ebe8d7a" },
        { name: "Watermelon", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fwatermelon.webp?alt=media&token=5b505fe0-78ea-4434-89bd-94801b69c679" },
        // { name: "Stawberry", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fstrawberry.webp?alt=media&token=07f5c6dc-a31d-4917-b52a-af3503d92287" },
        { name: "Chilli", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fchilli.webp?alt=media&token=72822efe-63e7-43a0-a98a-371017282b65" },
        // { name: "Tomato", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Ftomato.webp?alt=media&token=57ad2070-5b2f-4937-b31f-77497a00896b" },
        { name: "Salt", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fsalt.webp?alt=media&token=e29b89cc-d112-4bb6-a144-3fe60c813e94" },
        // { name: "Spices", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fspices.webp?alt=media&token=0112b887-e6db-4426-93a2-927c49c2b3f2" },
        // { name: "Vegan", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fvegan.webp?alt=media&token=d0ebd120-6e20-4b24-9369-0d2031302b07" },
        // { name: "", ingImageUrl: "" },
    ],
    countryId: "Mexico",
    id: "Modelo-Chelada-Sandia-Picante",
    web: "https://www.modelousa.com/es",
};

// Generate a custom ID (you can use any method you prefer to generate IDs)
const customId = 'Modelo-Chelada-Sandia-Picante';

// Add the beer with the custom ID
addBeer(newBeer, customId).then(() => process.exit());