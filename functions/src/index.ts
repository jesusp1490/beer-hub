import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";

admin.initializeApp();

const app = express();
app.use(cors({origin: true}));

// Middlewares
app.use(express.json());

// Routes
app.get("/countries", async (req, res) => {
  const countriesSnapshot = await admin.firestore()
    .collection("countries")
    .get();
  const countries = countriesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  res.status(200).send(countries);
});

app.post("/countries", async (req, res) => {
  const newCountry = req.body;
  const countryRef = await admin.firestore()
    .collection("countries")
    .add(newCountry);
  res.status(201).send({id: countryRef.id});
});

// Export API
exports.api = functions.https.onRequest(app);
