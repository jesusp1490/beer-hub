import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express = require("express");
import cors = require("cors");

// Initialize Firebase admin SDK
admin.initializeApp();

const db = admin.firestore();

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

// ============================================================================
// CHALLENGES SYSTEM
// ============================================================================
//
// NOTE ON DUPLICATION: the Challenge type, the rank ladder, and the
// beer-type category map below are necessarily duplicated from the Angular
// app (user.service.ts, achievement.service.ts) rather than imported,
// because functions/ is a separate Node project with its own
// package.json/tsconfig and no shared library set up between it and src/app.
// If these ever drift out of sync (e.g. someone changes the rank thresholds
// in user.service.ts but not here), rank-on-challenge-completion will be
// inconsistent with rank shown elsewhere in the app. Worth setting up a
// shared types package eventually; out of scope for this round.

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: "rate_count" | "rate_beer_type" | "rate_country" | "rate_distinct_countries";
  criteria?: string; // e.g. "IPA" for rate_beer_type, a countryId for rate_country
  threshold: number;
  progress: number;
  startDate: admin.firestore.Timestamp;
  endDate: admin.firestore.Timestamp;
  completed: boolean;
  rewardXP: number;
  // Only used by "rate_distinct_countries" — tracks which countryIds have
  // already counted toward this challenge's progress, so re-rating beers
  // from a country you've already counted doesn't inflate progress.
  countedCountryIds?: string[];
}

interface UserRatingEvent {
  beerId: string;
  rating: number;
  beerType?: string;
  countryId?: string;
}

type ChallengeTemplate = Omit<
  Challenge,
  "id" | "progress" | "startDate" | "endDate" | "completed" | "countedCountryIds"
>;

const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    name: "Rate 5 IPAs",
    description: "Rate 5 different IPA beers this week",
    type: "rate_beer_type",
    criteria: "IPA",
    threshold: 5,
    rewardXP: 20,
  },
  {
    name: "Stout Enthusiast",
    description: "Rate 3 stout beers this week",
    type: "rate_beer_type",
    criteria: "STOUT",
    threshold: 3,
    rewardXP: 15,
  },
  {
    name: "Lager Run",
    description: "Rate 5 lagers this week",
    type: "rate_beer_type",
    criteria: "LAGER",
    threshold: 5,
    rewardXP: 15,
  },
  {
    name: "Global Beer Tour",
    description: "Rate beers from 3 different countries in the next 14 days",
    type: "rate_distinct_countries",
    threshold: 3,
    rewardXP: 30,
  },
  {
    name: "Tasting Streak",
    description: "Rate 10 beers this week, any style",
    type: "rate_count",
    threshold: 10,
    rewardXP: 25,
  },
];

const DURATION_7_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DURATION_14_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

// Same beer-type category matching used in achievement.service.ts — kept
// intentionally minimal here (only the categories actual challenge
// templates above reference), not the full map.
const BEER_TYPE_CATEGORIES: { [key: string]: string[] } = {
  IPA: [
    "AMERICAN INDIA PALE ALE", "DOUBLE INDIA PALE ALE", "INDIA PALE ALE",
    "IMPERIAL INDIA PALE ALE", "RED INDIA PALE ALE", "SESSION INDIA PALE ALE",
    "TRIPLE INDIA PALE ALE", "WEST COAST INDIA PALE ALE", "WHITE INDIA PALE ALE",
  ],
  STOUT: [
    "BALTIC PORTER", "DOUBLE STOUT", "DRY STOUT", "RUSSIAN IMPERIAL STOUT",
    "IMPERIAL STOUT", "IMPERIAL PORTER", "IRISH STOUT", "MILK STOUT",
    "OATMEAL STOUT", "STOUT", "PORTER", "ROBUST PORTER",
  ],
  LAGER: [
    "AMBER LAGER", "AMERICAN LAGER", "BOHEMIAN PILSNER", "DARK LAGER",
    "DORTMUNDER", "DUNKEL", "GERMAN PILSNER", "HELLES", "INDIA PALE LAGER",
    "KELLERBIER", "LAGER", "LIGHT LAGER", "MÄRZEN", "MÜNCHNER HELLES",
    "MÜNCHNER DUNKEL", "PALE LAGER", "RED LAGER", "RYE LAGER", "SCHWARZBIER",
    "STRONG LAGER", "VIENNA", "WINTER LAGER",
  ],
};

/**
 * Checks whether a beer's type string falls under a given high-level
 * category (e.g. "IPA", "STOUT") used by challenge criteria.
 * @param {string | undefined} beerType The beer's type string, as stored
 * on the rating event (e.g. "American India Pale Ale").
 * @param {string} criteria The challenge's category key (e.g. "IPA").
 * @return {boolean} Whether beerType matches the given category.
 */
function matchesBeerTypeCriteria(beerType: string | undefined, criteria: string): boolean {
  if (!beerType) return false;
  const normalizedBeerType = beerType.toUpperCase().replace(/\s+/g, "");
  const normalizedCriteria = criteria.toUpperCase().replace(/\s+/g, "");
  const categoryList = BEER_TYPE_CATEGORIES[normalizedCriteria];
  if (!categoryList) return false;
  return categoryList.some((type) => normalizedBeerType.includes(type.replace(/\s+/g, "").toUpperCase()));
}

// Same rank ladder as user.service.ts's rankDefinitions — see the
// duplication note at the top of this section.
interface RankLevel {
  name: string;
  minXP: number;
  maxXP: number;
}

interface RankDefinition {
  name: string;
  icon: string;
  levels: RankLevel[];
}

const RANK_LADDER: RankDefinition[] = [
  {
    name: "Beer Recruit",
    icon: "🍺",
    levels: [
      {name: "I", minXP: 0, maxXP: 19},
      {name: "II", minXP: 20, maxXP: 39},
      {name: "III", minXP: 40, maxXP: 59},
    ],
  },
  {
    name: "Hop Private",
    icon: "🌿",
    levels: [
      {name: "I", minXP: 60, maxXP: 99},
      {name: "II", minXP: 100, maxXP: 139},
      {name: "III", minXP: 140, maxXP: 179},
    ],
  },
  {
    name: "Malt Corporal",
    icon: "🌾",
    levels: [
      {name: "I", minXP: 180, maxXP: 249},
      {name: "II", minXP: 250, maxXP: 319},
      {name: "III", minXP: 320, maxXP: 399},
    ],
  },
  {
    name: "Ale Sergeant",
    icon: "🍺",
    levels: [
      {name: "I", minXP: 400, maxXP: 499},
      {name: "II", minXP: 500, maxXP: 599},
      {name: "III", minXP: 600, maxXP: 699},
    ],
  },
  {
    name: "Lager Lieutenant",
    icon: "🍻",
    levels: [
      {name: "I", minXP: 700, maxXP: 849},
      {name: "II", minXP: 850, maxXP: 999},
      {name: "III", minXP: 1000, maxXP: 1199},
    ],
  },
  {
    name: "Stout Captain",
    icon: "🍻",
    levels: [
      {name: "I", minXP: 1200, maxXP: 1399},
      {name: "II", minXP: 1400, maxXP: 1599},
      {name: "III", minXP: 1600, maxXP: 1799},
    ],
  },
  {
    name: "Porter Colonel",
    icon: "🏆",
    levels: [
      {name: "I", minXP: 1800, maxXP: 1999},
      {name: "II", minXP: 2000, maxXP: 2199},
      {name: "III", minXP: 2200, maxXP: 2499},
    ],
  },
  {
    name: "Imperial General",
    icon: "👑",
    levels: [
      {name: "I", minXP: 2500, maxXP: 2799},
      {name: "II", minXP: 2800, maxXP: 3099},
      {name: "III", minXP: 3100, maxXP: 3499},
    ],
  },
  {
    name: "Grand Brewmaster",
    icon: "🏆",
    levels: [
      {name: "I", minXP: 3500, maxXP: 3999},
      {name: "II", minXP: 4000, maxXP: 4499},
      {name: "III", minXP: 4500, maxXP: Number.POSITIVE_INFINITY},
    ],
  },
];

/**
 * Computes a user's rank (name, icon, level, progress) from a raw XP
 * points total, using the same rank ladder as user.service.ts's
 * rankDefinitions on the Angular side.
 * @param {number} points The user's total XP points.
 * @return {object} The computed rank info.
 */
function calculateRank(points: number) {
  for (const rank of RANK_LADDER) {
    for (const level of rank.levels) {
      if (points >= level.minXP && points <= level.maxXP) {
        const progress = ((points - level.minXP) / (level.maxXP - level.minXP)) * 100;
        return {
          name: rank.name,
          icon: rank.icon,
          level: level.name,
          progress: Math.min(progress, 100),
          pointsToNextRank: Math.max(level.maxXP - points, 0),
          points,
        };
      }
    }
  }
  const fallback = RANK_LADDER[0].levels[0];
  return {
    name: RANK_LADDER[0].name,
    icon: RANK_LADDER[0].icon,
    level: fallback.name,
    progress: 0,
    pointsToNextRank: fallback.maxXP,
    points,
  };
}

/**
 * Picks `count` random challenge templates and instantiates them as live
 * Challenge objects with start/end dates anchored to `now`.
 * @param {number} count How many new challenges to generate.
 * @param {admin.firestore.Timestamp} now The current time, used as the
 * challenge start date and as the basis for computing the end date.
 * @return {Challenge[]} The newly generated challenges.
 */
function generateNewChallenges(count: number, now: admin.firestore.Timestamp): Challenge[] {
  // Avoid handing back the exact same template repeatedly within one batch.
  const shuffled = [...CHALLENGE_TEMPLATES].sort(() => 0.5 - Math.random());
  const picks = shuffled.slice(0, Math.min(count, shuffled.length));

  return picks.map((template) => {
    const durationMs = template.type === "rate_distinct_countries" ? DURATION_14_DAYS_MS : DURATION_7_DAYS_MS;
    return {
      id: `challenge_${now.toMillis()}_${Math.random().toString(36).substr(2, 9)}`,
      ...template,
      progress: 0,
      startDate: now,
      endDate: admin.firestore.Timestamp.fromMillis(now.toMillis() + durationMs),
      completed: false,
      countedCountryIds: template.type === "rate_distinct_countries" ? [] : undefined,
    };
  });
}

// FIX (the core missing piece): this is the function that previously did
// not exist anywhere in the codebase. It fires every time a user rates a
// beer (BeerService.rateBeer() writes to this exact path transactionally)
// and updates progress on any of that user's active challenges that match
// the rating. Without this, challenges were generated by the hourly
// rotation function below but could NEVER actually be completed — nothing
// ever incremented `progress`.
export const onBeerRated = functions.firestore
  .document("users/{userId}/ratings/{beerId}")
  .onCreate(async (snap, context) => {
    const userId = context.params.userId as string;
    const rating = snap.data() as UserRatingEvent;
    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) return;

      const userData = userDoc.data() || {};
      const challenges: Challenge[] = userData.challenges || [];
      const now = admin.firestore.Timestamp.now();

      let pointsEarned = 0;

      const updatedChallenges = challenges.map((challenge) => {
        if (challenge.completed) return challenge;
        if (challenge.endDate.toMillis() < now.toMillis()) return challenge; // expired, leave for rotation fn

        let matches = false;
        const updated = {...challenge};

        switch (challenge.type) {
          case "rate_count":
            matches = true;
            break;
          case "rate_beer_type":
            matches = matchesBeerTypeCriteria(rating.beerType, challenge.criteria || "");
            break;
          case "rate_country":
            matches = !!rating.countryId && rating.countryId === challenge.criteria;
            break;
          case "rate_distinct_countries": {
            if (!rating.countryId) break;
            const counted = challenge.countedCountryIds || [];
            if (!counted.includes(rating.countryId)) {
              matches = true;
              updated.countedCountryIds = [...counted, rating.countryId];
            }
            break;
          }
        }

        if (!matches) return challenge;

        const newProgress = updated.progress + 1;
        const justCompleted = newProgress >= updated.threshold;

        if (justCompleted) {
          pointsEarned += updated.rewardXP;
        }

        return {
          ...updated,
          progress: newProgress,
          completed: justCompleted,
        };
      });

      const updates: { [key: string]: unknown } = {challenges: updatedChallenges};

      if (pointsEarned > 0) {
        const currentPoints = userData.statistics?.points || 0;
        const newPoints = currentPoints + pointsEarned;
        updates["statistics.points"] = newPoints;
        updates["rank"] = calculateRank(newPoints);
      }

      transaction.update(userRef, updates);
    });
  });

// Hourly rotation: expires/completes challenges past their end date and
// tops each user back up to 3 active challenges. This existed only as
// unwired draft code before — now using the type/criteria shape above
// instead of plain-text-only challenges, and actually exported/deployable.
export const updateChallenges = functions.pubsub.schedule("every 1 hours").onRun(async () => {
  const usersRef = db.collection("users");
  const now = admin.firestore.Timestamp.now();

  const snapshot = await usersRef.get();
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const userData = doc.data();
    const existingChallenges: Challenge[] = userData.challenges || [];

    const stillActiveOrCompleted = existingChallenges.filter((challenge) => {
      if (challenge.completed) return true;
      if (challenge.endDate.toMillis() >= now.toMillis()) return true;
      return false; // expired and incomplete -> drop it
    });

    const activeCount = stillActiveOrCompleted.filter((c) => !c.completed).length;
    const needed = Math.max(0, 3 - activeCount);

    const updatedChallenges = needed > 0 ?
      [...stillActiveOrCompleted, ...generateNewChallenges(needed, now)] :
      stillActiveOrCompleted;

    batch.update(doc.ref, {challenges: updatedChallenges});
    batchCount++;

    // Firestore batches cap at 500 writes; commit and start a new one if
    // this Firestore instance has more users than that.
    if (batchCount >= 450) {
      await batch.commit();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log("Challenges updated successfully");
  return null;
});
