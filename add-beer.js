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
    name: "Satan Red",
    brandId: "De Block",
    beerType: "RED ALE", 
    ABV: 8.0,
    IBU: 24.8,
    averageRating: 0,
    description: "A perfect balanced ruby-red beer, a harmony of creamy and strong aroma, sweet and fine pallet, fruity with a perfume of fresh hops. Feel the heat ... and taste the fine aroma and the sweet and delicious pallet.",
    beerImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2FDe%20Block-Satan-Red-botella.webp?alt=media&token=eb918b83-b0d5-459c-9b13-94c23f9708e0",
    beerLabelUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Flabels%2FDe%20Block-Satan-Red-label.webp?alt=media&token=fb0b52d3-fcc8-4817-a802-d82f0b1c74cb",
    ingredients: [
        { name: "Water", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fwater.webp?alt=media&token=d2625213-033e-4772-8984-0f1370da5d55" },
        { name: "Barley Malt", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fbarley-malt.webp?alt=media&token=42c79a9b-cd07-4106-8bfe-e3d7913aefc0" },
        { name: "Wheat Malt", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fwheat.webp?alt=media&token=84a0bb8d-bc55-4683-9620-59d21f69799d" },
        // { name: "Oats Malt", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Foatmeal.webp?alt=media&token=5f389bbc-fea7-474d-b1e7-bae6d844e9e8" },
        // { name: "Maize", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcorn.webp?alt=media&token=adc4faba-02f1-4327-88b3-4ce654ea62be" },
        // { name: "Roasted Barley", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fbarley.webp?alt=media&token=0f62c03e-9fb8-404d-b74b-da816e3e73fe" },
        { name: "Hop", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fhop.webp?alt=media&token=bd73980b-21b4-4d57-911f-4d5a8400ea55"},
        { name: "Yeast", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fyeast2.webp?alt=media&token=fa095e3c-963c-4c92-b349-7aa34c6a263a" },
        // { name: "Almond", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Falmond.webp?alt=media&token=d7058f1f-e0ce-43d2-ad3b-a80cb7269b1e" },
        // { name: "Agave", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fagave.webp?alt=media&token=a4ea38d4-3d8e-4a83-8984-7d583de46e56" },
        // { name: "Apple", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fapple.webp?alt=media&token=c2142596-14c3-4a87-a1ce-4a1258b8d434" },
        // { name: "Aromas", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Faroma.webp?alt=media&token=db172c7f-8bd2-4e22-8388-aa230d5b997f" },
        // { name: "Ascorbic Acid", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fascorbic-acid.webp?alt=media&token=6865921c-8bdb-4af7-9f09-72fba7c63661" },
        // { name: "Banana", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fbanana.webp?alt=media&token=249a4b46-7a2a-4aec-bf8a-ee551e004c37" },
        // { name: "Bergamot", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fbergamot.webp?alt=media&token=9faed7f2-c088-4a43-a8a5-096c3d665328" },
        // { name: "Black Currants", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fberries.webp?alt=media&token=3f682c71-370f-47c3-a4d7-8636e534be8c" },
        // { name: "Blackberries", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fraspberry.webp?alt=media&token=7d0645a7-fb03-4375-bf10-f1d513fdb969" },
        // { name: "Black Pepper", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fblack-pepper.webp?alt=media&token=cdd97f3b-bcc9-4513-9d4a-7bc3f1aa9bb2" },
        // { name: "Bottle", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fbottle.webp?alt=media&token=ada0ed1f-1258-48aa-a3fe-eea2f2ce408d" },
        // { name: "Bubblegum", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fbubblegum.webp?alt=media&token=c9f2873b-cbce-40a9-8e3f-1b896b821baa" },
        // { name: "Cane Sugar", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fsugar-cane.webp?alt=media&token=bfc694ed-e493-4ed5-98df-f9f5c7db1b8a" },
        // { name: "Caramel", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcaramel.webp?alt=media&token=2ed6ee29-c5ec-49a1-b169-a009de918c88" },
        // { name: "Carbon Dioxide", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcarbon-dioxide.webp?alt=media&token=da2da859-4c41-4351-aacf-9a602de87ae6" },
        // { name: "Carbonated Water", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcarbon-water.webp?alt=media&token=84bd0a2a-35d8-467f-8c2d-032db0751a81" },
        // { name: "Cardamom", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcardamom.webp?alt=media&token=4243197b-a5ba-4630-a481-123dce194a2b" },
        // { name: "Carrot", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcarrot.webp?alt=media&token=55d9e760-81b2-4f72-b734-de5ce4ccf13d" },
        // { name: "Carrot Juice", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcarrot-juice.webp?alt=media&token=db4444b3-da56-4cfa-b88b-b506a28cd739" },
        // { name: "Cinnamon", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcinnamon.webp?alt=media&token=e0578bca-b2e5-4cf5-b813-cc6832ed78e5" },
        // { name: "Cherry", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcherries.webp?alt=media&token=df6ab778-c0a9-4e5f-a25f-d52ad94a3746" },
        // { name: "Chilli", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fchilli.webp?alt=media&token=72822efe-63e7-43a0-a98a-371017282b65" },
        // { name: "Citric Acid", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcitric-acid.webp?alt=media&token=d531625a-a189-4374-8b3e-215357680809" },
        // { name: "Chocolate", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fchocolate.webp?alt=media&token=68a6f2fb-74cc-4bfa-8372-e2c87715add7" },
        // { name: "Cloves", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcloves.webp?alt=media&token=587f9b62-b896-4def-9f73-22fe2d02f50a" },
        // { name: "Cocoa", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcocoa.webp?alt=media&token=69306edd-15ba-4ca1-bee5-925ba0042075" },
        // { name: "Coconut", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcoconut.webp?alt=media&token=c3957a99-2123-4926-8a27-69e1f4d30540" },
        // { name: "Coffee", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcoffee.webp?alt=media&token=50dad564-25a1-4653-99ad-e86c69217f05" },
        // { name: "Coriander", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcoriander.webp?alt=media&token=88c5dc6f-90c7-4bba-990e-5b53db1b5997" },
        // { name: "Corn Syrup", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fcorn-syrup.webp?alt=media&token=00116bbe-6f40-4710-88d2-321c0060252c" },
        // { name: "Dietary Fiber", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Ffiber.webp?alt=media&token=b79da572-a6eb-492c-8365-8450222e7d6e" },
        // { name: "Dye", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fdye.webp?alt=media&token=b7c0a6d0-6dc5-44f6-895a-6f6d68c33de5" },
        // { name: "Elderberry", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Felderberry.webp?alt=media&token=0d7aed06-2091-4134-9c39-bd0a22316b33" },
        // { name: "Figs", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Ffigs.webp?alt=media&token=78af8604-eef8-46e0-a012-9f40458443b2" },
        // { name: "Ginger", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fginger.webp?alt=media&token=ee17db67-783d-4c08-bdd9-ebb6dc92f026" },
        // { name: "Gooseberries", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fgooseberries.webp?alt=media&token=ea37f9c9-9ba1-49dd-b3c5-af1683454c10" },
        // { name: "Grapefruit", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fgrapefruit.webp?alt=media&token=dadfc578-ac7d-4bc5-a57d-77efddd51e85" },
        // { name: "Grapes", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fgrapes.webp?alt=media&token=47acb60e-0351-487f-a090-d76f5fde6be6" },
        // { name: "Guava", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fguava.webp?alt=media&token=1e9d3a4b-64e9-46c9-8bf0-bdba25b8a1c3" },
        // { name: "Hibiscus", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2FFlower.webp?alt=media&token=17c01a9f-414c-4f5a-8f30-142d080da58e" },
        // { name: "Honey", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2FHoney.webp?alt=media&token=7ca194b5-d1e4-4de8-9410-bad5484a15d0" },
        // { name: "Juniper", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fjuniper.webp?alt=media&token=81f40aa8-a5a3-406f-b277-73f63cc86eaf" },
        // { name: "Lactose", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fmilk.webp?alt=media&token=15217c2c-d880-4c8c-b67d-40d8708a2b7d" },
        // { name: "Lemon", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Flemon.webp?alt=media&token=d3d11ae0-f960-43c1-b61e-84b4515a8dae" },
        // { name: "Lemongrass", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Flemongrass.webp?alt=media&token=fc74aa03-4343-4af3-bb09-fe641591e1c4" },
        // { name: "Liquid Sugar", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fsugar-liquid.webp?alt=media&token=ac220275-2851-47a8-b3c5-1f9caafaac77" },
        // { name: "Lychee", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Flychee.webp?alt=media&token=f050a856-5c14-4694-a373-91e8fee3c0b6" },
        // { name: "Mango", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fmango.webp?alt=media&token=51292187-67a8-4f64-b03e-2b5bfce3c21e" },
        // { name: "Melon", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fmelon.webp?alt=media&token=6ee73aca-bf0a-4f42-88e5-332b439afb8a" },
        // { name: "Nutmeg", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fnutmeg.webp?alt=media&token=1112939f-7576-4559-9470-a0fc7e98ff40" },
        // { name: "Nuts", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fwalnut.webp?alt=media&token=f1f33222-7129-4cad-9ccd-8be50c6f73ef" },
        // { name: "Oats", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Foats.webp?alt=media&token=a6302d7e-0c6a-4707-bd01-b24c6aab9fd8" },
        // { name: "Orange", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Forange.webp?alt=media&token=576b6a84-d936-4491-ba48-ded56ebe8d7a" },
        // { name: "Other", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fother.webp?alt=media&token=036d01b0-8d1f-4b3b-851a-5ea4c0c9ea5c" },
        // { name: "Papaya", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fpapaya.webp?alt=media&token=724b3090-0f27-4b1e-bc68-420cb6a61486" },
        // { name: "Passion Fruit", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fpassion-fruit.webp?alt=media&token=3a8d1518-b8df-485a-b974-9d4128a79e17" },
        // { name: "Peach", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fpeach.webp?alt=media&token=1e28294f-f041-4755-8ee9-0db7401c8437" },
        // { name: "Pear", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fpear.webp?alt=media&token=7e111dd9-87a0-4242-ab84-1d8072acf780" },
        // { name: "Pea", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fpeas.webp?alt=media&token=71215b1d-0aa8-4fb2-8468-30da6a9b428e" },
        // { name: "Pineapple", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fpineapple.webp?alt=media&token=cb6fac2d-888b-40a3-b416-b03284521a1f" },
        // { name: "Plum", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fplum.webp?alt=media&token=9906eef5-9fcc-4d6c-959b-2f58f754ab2e" },
        // { name: "Pomegranate", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fpomegranate.webp?alt=media&token=8e1b42a1-d13e-4f88-ba31-62f8e0e22039" },
        // { name: "Pumpkin", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fpumpkin.webp?alt=media&token=7d739d78-988c-4f4c-806d-1e3b366d4fdd" },
        // { name: "Raspberries", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fraspberry.webp?alt=media&token=7d0645a7-fb03-4375-bf10-f1d513fdb969" },
        // { name: "Rice", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Frice.webp?alt=media&token=fd8348b4-7a02-474a-845a-e658b46580b8" },
        // { name: "Salt", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fsalt.webp?alt=media&token=e29b89cc-d112-4bb6-a144-3fe60c813e94" },
        // { name: "Seeds", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fseeds.webp?alt=media&token=4737abde-a177-48b3-86cd-dff42f242bbc" },
        // { name: "Soursop", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2FSoursop.webp?alt=media&token=f407a167-26d3-45aa-9115-b56251e7ae8e" },
        // { name: "Soy Protein", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fsoy.webp?alt=media&token=73b8394b-7cbe-4529-927b-601525e7cf20" },
        // { name: "Spices", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fspices.webp?alt=media&token=0112b887-e6db-4426-93a2-927c49c2b3f2" },
        // { name: "Stabilizer", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fother.webp?alt=media&token=036d01b0-8d1f-4b3b-851a-5ea4c0c9ea5c" },
        // { name: "Starch", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fstarch.webp?alt=media&token=87ff0374-0c66-49ec-a7df-f1cb6ffd101e" },
        // { name: "Stawberry", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fstrawberry.webp?alt=media&token=07f5c6dc-a31d-4917-b52a-af3503d92287" },
        // { name: "Sugar", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2FSugar.webp?alt=media&token=33eedab3-e4fa-4de4-bc48-8022f2fd42bf" },
        // { name: "Sweet Potato", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fsweet-potato.webp?alt=media&token=0b49223b-3aca-472a-a41f-8bf4c7d0d286" },
        // { name: "Tamarind", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Ftamarind.webp?alt=media&token=c1a69a56-8adb-4282-b770-5e2f55363e7b" },
        // { name: "Tea", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Ftea.webp?alt=media&token=708970ef-2c10-47bd-9143-18faf8faafbb" },
        // { name: "Thyme", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fthyme.webp?alt=media&token=aab01b76-19e3-4831-a292-3bfadc76d44f" },
        // { name: "Toffee", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Ftoffee.webp?alt=media&token=cf91707c-8f6b-4eec-87b4-ff4e60fb2cc6" },
        // { name: "Tomato", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Ftomato.webp?alt=media&token=57ad2070-5b2f-4937-b31f-77497a00896b" },
        // { name: "Vanilla", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fvanilla.webp?alt=media&token=de44b923-422c-4cb3-a273-69ee41e2cdf6" },
        // { name: "Watermelon", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fwatermelon.webp?alt=media&token=5b505fe0-78ea-4434-89bd-94801b69c679" },
        // { name: "Vegan", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fvegan.webp?alt=media&token=d0ebd120-6e20-4b24-9369-0d2031302b07" },
        // { name: "Gluten Free", ingImageUrl: "https://firebasestorage.googleapis.com/v0/b/beer-hub.appspot.com/o/images%2Fbeers%2Fingredients%2Fgluten-free.webp?alt=media&token=b05989b1-75c0-4399-a2e7-4096f97e3af0" },
        // { name: "", ingImageUrl: "" },
    ],
    countryId: "Belgium", 
    id: "De Block-Satan-Red",
    web: "https://www.brewerydeblock.com/",
};

// Generate a custom ID (you can use any method you prefer to generate IDs)
const customId = 'De Block-Satan-Red';

// Add the beer with the custom ID
addBeer(newBeer, customId).then(() => process.exit());