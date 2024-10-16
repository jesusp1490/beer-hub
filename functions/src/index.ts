import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";

// Initialize Firebase admin SDK
admin.initializeApp();

const app = express();

// Use CORS middleware with more specific options
app.use(cors({origin: true, methods: ["GET", "POST"]}));

// Middlewares
app.use(express.json());

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Routes
app.get("/countries", async (req: express.Request, res: express.Response) => {
  try {
    const countriesSnapshot = await admin
      .firestore()
      .collection("countries")
      .get();
    const countries = countriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(countries);
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({error: "Failed to fetch countries"});
  }
});

app.post("/countries", async (req: express.Request, res: express.Response) => {
  try {
    const newCountry = req.body;
    // Add validation for newCountry here if needed
    const countryRef = await admin
      .firestore()
      .collection("countries")
      .add(newCountry);
    res.status(201).json({id: countryRef.id});
  } catch (error) {
    console.error("Error adding new country:", error);
    res.status(500).json({error: "Failed to add new country"});
  }
});

// Export API
export const api = functions.https.onRequest(app);
