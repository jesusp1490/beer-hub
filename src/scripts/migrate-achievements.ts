const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Marks this file as a module (rather than a global script) so its
// top-level declarations don't collide with populate-achievements.ts,
// which sits in the same folder with identically-named top-level consts
// (admin, dotenv, db, ratingAchievements, etc.). Without this, TypeScript
// treats files with no import/export as global scripts sharing one scope.
export {};

dotenv.config();

const firebaseProjectId = process.env['FIREBASE_PROJECT_ID'];
if (!firebaseProjectId) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
}

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseProjectId
});

const db = admin.firestore();

interface AchievementLevel {
    level: number;
    icon: string;
    description: string;
    requirement: number;
}

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    // NEW: drives generic progress calculation in achievement.service.ts.
    // See achievement.interface.ts for the supported forms.
    metric: string;
    levels: AchievementLevel[];
}

// NOTE: every achievement below keeps the SAME id it already had in
// Firestore (these were seeded by the original populate-achievements.ts).
// What's new is:
//   1. a `metric` field per achievement, so the service can compute
//      progress generically instead of a hardcoded switch-statement
//   2. a numeric `requirement` on every level (previously only had text
//      descriptions like "Rate 10 beers" with no machine-readable number)
//
// The numbers themselves are carried over unchanged from the thresholds
// that were already live in achievement.service.ts's hardcoded logic, so
// existing users' progress won't suddenly jump or regress when this ships.

const ratingAchievements: Achievement[] = [
  {
    id: "novice_taster",
    name: "Novice Taster",
    description: "Rate your first beers",
    icon: "🍺",
    category: "Rating",
    metric: "totalBeersRated",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 beers", requirement: 10 },
      { level: 2, icon: "🥈", description: "Rate 50 beers", requirement: 50 },
      { level: 3, icon: "🥇", description: "Rate 100 beers", requirement: 100 },
    ],
  },
  {
    id: "expert_taster",
    name: "Expert Taster",
    description: "Become a beer expert",
    icon: "🍻",
    category: "Rating",
    metric: "totalBeersRated",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 200 beers", requirement: 200 },
      { level: 2, icon: "🥈", description: "Rate 500 beers", requirement: 500 },
      { level: 3, icon: "🥇", description: "Rate 1000 beers", requirement: 1000 },
    ],
  },
  {
    id: "beer_sommelier_master",
    name: "Beer Sommelier Master",
    description: "Master the art of beer tasting",
    icon: "🏆",
    category: "Rating",
    metric: "totalBeersRated",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 1500 beers", requirement: 1500 },
      { level: 2, icon: "🥈", description: "Rate 2000 beers", requirement: 2000 },
      { level: 3, icon: "🥇", description: "Rate 3000 beers", requirement: 3000 },
    ],
  },
  {
    id: "flavor_explorer",
    name: "Flavor Explorer",
    description: "Explore different beer styles",
    icon: "🌍",
    category: "Rating",
    metric: "uniqueStylesCount",
    levels: [
      { level: 1, icon: "🥉", description: "Try 5 beer styles", requirement: 5 },
      { level: 2, icon: "🥈", description: "Try 10 beer styles", requirement: 10 },
      { level: 3, icon: "🥇", description: "Try 20 beer styles", requirement: 20 },
    ],
  },
  {
    // NOTE: this achievement previously existed in Firestore with ZERO
    // corresponding logic in achievement.service.ts — it could never
    // unlock for anyone. It's wired up now via the "newBeerRequests" metric,
    // BUT that statistic is itself never incremented anywhere in the app
    // today (requestNewBeer() in user.service.ts awards points but doesn't
    // bump statistics.newBeerRequests). This achievement will still show
    // 0 progress until that's fixed — flagging separately, not fixing here.
    id: "beer_discoverer",
    name: "Beer Discoverer",
    description: "Discover new beers",
    icon: "🔍",
    category: "Rating",
    metric: "newBeerRequests",
    levels: [
      { level: 1, icon: "🥉", description: "Request 5 new beers", requirement: 5 },
      { level: 2, icon: "🥈", description: "Request 15 beers", requirement: 15 },
      { level: 3, icon: "🥇", description: "Request 30 beers", requirement: 30 },
    ],
  },
  {
    id: "beer_critic",
    name: "Beer Critic",
    description: "Share your opinions",
    icon: "📝",
    category: "Rating",
    metric: "totalReviews",
    levels: [
      { level: 1, icon: "🥉", description: "Write 10 reviews", requirement: 10 },
      { level: 2, icon: "🥈", description: "Write 50 reviews", requirement: 50 },
      { level: 3, icon: "🥇", description: "Write 100 reviews", requirement: 100 },
    ],
  },
  {
    id: "master_reviewer",
    name: "Master Reviewer",
    description: "Become a respected reviewer",
    icon: "🏅",
    category: "Rating",
    metric: "totalReviews",
    levels: [
      { level: 1, icon: "🥉", description: "Write 200 reviews", requirement: 200 },
      { level: 2, icon: "🥈", description: "Write 500 reviews", requirement: 500 },
      { level: 3, icon: "🥇", description: "Write 1000 reviews", requirement: 1000 },
    ],
  },
  {
    id: "content_creator",
    name: "Content Creator",
    description: "Create detailed beer reviews",
    icon: "📺",
    category: "Rating",
    metric: "detailedReviews",
    levels: [
      { level: 1, icon: "🥉", description: "Write detailed reviews on 10 beers", requirement: 10 },
      { level: 2, icon: "🥈", description: "Write detailed reviews on 50 beers", requirement: 50 },
      { level: 3, icon: "🥇", description: "Write detailed reviews on 100 beers", requirement: 100 },
    ],
  },
  {
    id: "beer_influencer",
    name: "Beer Influencer",
    description: "Influence the community",
    icon: "📢",
    category: "Rating",
    metric: "totalReviewLikes",
    levels: [
      { level: 1, icon: "🥉", description: "Receive 50 likes on reviews", requirement: 50 },
      { level: 2, icon: "🥈", description: "Receive 200 likes on reviews", requirement: 200 },
      { level: 3, icon: "🥇", description: "Receive 500 likes on reviews", requirement: 500 },
    ],
  },
  {
    id: "community_legend",
    name: "Community Legend",
    description: "Become a community legend",
    icon: "⭐",
    category: "Rating",
    metric: "reputationPoints",
    levels: [
      // NOTE: the original Firestore doc had a non-numeric level 1
      // ("Get featured in the community") which can't drive a progress bar.
      // Replaced with a numeric tier consistent with the other two levels,
      // matching what achievement.service.ts already used: [1000, 2500, 5000].
      { level: 1, icon: "🥉", description: "Earn 1000 reputation points", requirement: 1000 },
      { level: 2, icon: "🥈", description: "Earn 2500 reputation points", requirement: 2500 },
      { level: 3, icon: "🥇", description: "Earn 5000 reputation points", requirement: 5000 },
    ],
  },
];

const beerTypeAchievements: Achievement[] = [
  {
    id: "stout_lover",
    name: "Stout Lover",
    description: "Experience the world of stouts",
    icon: "🖤",
    category: "Beer Type",
    metric: "beerType:STOUT",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 Stouts", requirement: 10 },
      { level: 2, icon: "🥈", description: "Rate 25 Stouts", requirement: 25 },
      { level: 3, icon: "🥇", description: "Rate 50 Stouts", requirement: 50 },
    ],
  },
  {
    id: "ipa_king",
    name: "IPA King",
    description: "Master of India Pale Ales",
    icon: "🌿",
    category: "Beer Type",
    metric: "beerType:IPA",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 IPAs", requirement: 10 },
      { level: 2, icon: "🥈", description: "Rate 30 IPAs", requirement: 30 },
      { level: 3, icon: "🥇", description: "Rate 60 IPAs", requirement: 60 },
    ],
  },
  {
    id: "lager_enthusiast",
    name: "Lager Enthusiast",
    description: "Explore the world of lagers",
    icon: "🍺",
    category: "Beer Type",
    metric: "beerType:LAGER",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 20 Lagers", requirement: 20 },
      { level: 2, icon: "🥈", description: "Rate 50 Lagers", requirement: 50 },
      { level: 3, icon: "🥇", description: "Rate 100 Lagers", requirement: 100 },
    ],
  },
  {
    id: "porter_collector",
    name: "Porter Collector",
    description: "Discover porter beers",
    icon: "🏺",
    category: "Beer Type",
    metric: "beerType:PORTER",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 Porters", requirement: 10 },
      { level: 2, icon: "🥈", description: "Rate 25 Porters", requirement: 25 },
      { level: 3, icon: "🥇", description: "Rate 50 Porters", requirement: 50 },
    ],
  },
  {
    // NOTE: highHopBeersRated is never incremented anywhere in the app
    // today (flagged previously in user.service.ts review). This will sit
    // at 0 progress until that's wired up — separate fix, not done here.
    id: "hops_master",
    name: "Hops Master",
    description: "Experience hoppy beers",
    icon: "🌱",
    category: "Beer Type",
    metric: "highHopBeersRated",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 high-hop beers", requirement: 10 },
      { level: 2, icon: "🥈", description: "Rate 25 high-hop beers", requirement: 25 },
      { level: 3, icon: "🥇", description: "Rate 50 high-hop beers", requirement: 50 },
    ],
  },
  {
    id: "sour_adventurer",
    name: "Sour Adventurer",
    description: "Explore sour beers",
    icon: "🍋",
    category: "Beer Type",
    metric: "beerType:SOUR",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 5 Sour beers", requirement: 5 },
      { level: 2, icon: "🥈", description: "Rate 15 Sour beers", requirement: 15 },
      { level: 3, icon: "🥇", description: "Rate 30 Sour beers", requirement: 30 },
    ],
  },
  {
    // NOTE: craftBeersRated is also never incremented anywhere today. Same
    // caveat as hops_master above.
    id: "craft_beer_connoisseur",
    name: "Craft Beer Connoisseur",
    description: "Experience craft beers",
    icon: "🛠️",
    category: "Beer Type",
    metric: "craftBeersRated",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 20 craft beers", requirement: 20 },
      { level: 2, icon: "🥈", description: "Rate 50 craft beers", requirement: 50 },
      { level: 3, icon: "🥇", description: "Rate 100 craft beers", requirement: 100 },
    ],
  },
  {
    id: "bock_admirer",
    name: "Bock Admirer",
    description: "Discover bock beers",
    icon: "🔥",
    category: "Beer Type",
    metric: "beerType:BOCK",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 5 Bocks", requirement: 5 },
      { level: 2, icon: "🥈", description: "Rate 15 Bocks", requirement: 15 },
      { level: 3, icon: "🥇", description: "Rate 30 Bocks", requirement: 30 },
    ],
  },
  {
    id: "barleywine_collector",
    name: "Barleywine Collector",
    description: "Experience barleywines",
    icon: "🍷",
    category: "Beer Type",
    metric: "beerType:BARLEYWINE",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 3 Barleywines", requirement: 3 },
      { level: 2, icon: "🥈", description: "Rate 10 Barleywines", requirement: 10 },
      { level: 3, icon: "🥇", description: "Rate 25 Barleywines", requirement: 25 },
    ],
  },
  {
    id: "hazy_ipa_aficionado",
    name: "Hazy IPA Aficionado",
    description: "Master of hazy IPAs",
    icon: "☁️",
    category: "Beer Type",
    metric: "beerType:NEIPA,DOUBLE INDIA PALE ALE",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 Hazy IPAs", requirement: 10 },
      { level: 2, icon: "🥈", description: "Rate 25 Hazy IPAs", requirement: 25 },
      { level: 3, icon: "🥇", description: "Rate 50 Hazy IPAs", requirement: 50 },
    ],
  },
];

const explorationAchievements: Achievement[] = [
  {
    id: "beer_explorer",
    name: "Beer Explorer",
    description: "Explore beers from different countries",
    icon: "🌍",
    category: "Exploration",
    metric: "countriesExplored.length",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 5 countries", requirement: 5 },
      { level: 2, icon: "🥈", description: "Rate beers from 15 countries", requirement: 15 },
      { level: 3, icon: "🥇", description: "Rate beers from 30 countries", requirement: 30 },
    ],
  },
  {
    id: "world_beer_tour",
    name: "World Beer Tour",
    description: "Travel the world through beer",
    icon: "✈️",
    category: "Exploration",
    metric: "continentsExplored.length",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 3 continents", requirement: 3 },
      { level: 2, icon: "🥈", description: "Rate beers from 5 continents", requirement: 5 },
      { level: 3, icon: "🥇", description: "Rate beers from 7 continents", requirement: 7 },
    ],
  },
  {
    id: "european_beer_enthusiast",
    name: "European Beer Enthusiast",
    description: "Explore European beers",
    icon: "🇪🇺",
    category: "Exploration",
    metric: "europeanCountriesExplored.length",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 5 European countries", requirement: 5 },
      { level: 2, icon: "🥈", description: "Rate beers from 10 European countries", requirement: 10 },
      { level: 3, icon: "🥇", description: "Rate beers from 15 European countries", requirement: 15 },
    ],
  },
  {
    id: "north_american_beer_fan",
    name: "North American Beer Fan",
    description: "Explore North American beers",
    icon: "🇺🇸",
    category: "Exploration",
    metric: "northAmericanCountriesExplored.length",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 5 North American countries", requirement: 5 },
      { level: 2, icon: "🥈", description: "Rate beers from 10 North American countries", requirement: 10 },
      { level: 3, icon: "🥇", description: "Rate beers from 20 North American countries", requirement: 20 },
    ],
  },
  {
    id: "south_american_explorer",
    name: "South American Explorer",
    description: "Discover South American beers",
    icon: "🌎",
    category: "Exploration",
    metric: "southAmericanCountriesExplored.length",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 3 South American countries", requirement: 3 },
      { level: 2, icon: "🥈", description: "Rate beers from 5 South American countries", requirement: 5 },
      { level: 3, icon: "🥇", description: "Rate beers from 10 South American countries", requirement: 10 },
    ],
  },
  {
    id: "asian_beer_adventurer",
    name: "Asian Beer Adventurer",
    description: "Experience Asian beers",
    icon: "🏯",
    category: "Exploration",
    metric: "asianBeersRated",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 3 Asian beers", requirement: 3 },
      { level: 2, icon: "🥈", description: "Rate 5 Asian beers", requirement: 5 },
      { level: 3, icon: "🥇", description: "Rate 10 Asian beers", requirement: 10 },
    ],
  },
  {
    id: "african_beer_master",
    name: "African Beer Master",
    description: "Discover African beers",
    icon: "🌍",
    category: "Exploration",
    metric: "africanBeersRated",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 3 African beers", requirement: 3 },
      { level: 2, icon: "🥈", description: "Rate 5 African beers", requirement: 5 },
      { level: 3, icon: "🥇", description: "Rate 10 African beers", requirement: 10 },
    ],
  },
  {
    id: "oceania_beer_enthusiast",
    name: "Oceania Beer Enthusiast",
    description: "Experience Oceanian beers",
    icon: "🏝️",
    category: "Exploration",
    metric: "oceaniaBeersRated",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 3 Oceanian beers", requirement: 3 },
      { level: 2, icon: "🥈", description: "Rate 5 Oceanian beers", requirement: 5 },
      { level: 3, icon: "🥇", description: "Rate 10 Oceanian beers", requirement: 10 },
    ],
  },
  {
    id: "high_altitude_beer_drinker",
    name: "High Altitude Beer Drinker",
    description: "Try beers from high-altitude regions",
    icon: "🏔️",
    category: "Exploration",
    metric: "highAltitudeCountriesExplored.length",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 1 high-altitude country", requirement: 1 },
      { level: 2, icon: "🥈", description: "Rate beers from 3 high-altitude countries", requirement: 3 },
      { level: 3, icon: "🥇", description: "Rate beers from 5 high-altitude countries", requirement: 5 },
    ],
  },
  {
    // NOTE: rareBeersRated is also never incremented anywhere today.
    id: "rare_beer_collector",
    name: "Rare Beer Collector",
    description: "Discover rare and unique beers",
    icon: "🏆",
    category: "Exploration",
    metric: "rareBeersRated",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 rare beers", requirement: 10 },
      { level: 2, icon: "🥈", description: "Rate 25 rare beers", requirement: 25 },
      { level: 3, icon: "🥇", description: "Rate 50 rare beers", requirement: 50 },
    ],
  },
];

// NOTE: the original populate-achievements.ts also seeded a `specialChallenges`
// array (explorer_of_the_month, 10_ipa_challenge, lager_week, stout_marathon,
// 3_country_challenge, speed_tasting, beer_hunter_pro, brewmaster_challenge,
// christmas_beer, oktoberfest_challenge) into THIS collection, tagged with
// category "Challenge". Those are intentionally excluded here — they're
// time-bound, repeatable challenges, not permanent unlockable achievements,
// and belong in the separate challenges system (see updateChallenges Cloud
// Function) which is being redesigned next. If you still want some of these
// concepts as recurring challenge templates, we'll re-introduce them there
// with the proper type/criteria/threshold shape instead.
//
// This migration does NOT delete the old "Challenge" category docs from
// Firestore automatically — see the deleteLegacyChallengeDocs() call below,
// which does that explicitly and only for the known legacy IDs, so nothing
// unrelated gets touched.

const allAchievements = [...ratingAchievements, ...beerTypeAchievements, ...explorationAchievements];

const legacyChallengeCategoryIds = [
  "explorer_of_the_month",
  "10_ipa_challenge",
  "lager_week",
  "stout_marathon",
  "3_country_challenge",
  "speed_tasting",
  "beer_hunter_pro",
  "brewmaster_challenge",
  "christmas_beer",
  "oktoberfest_challenge",
];

async function upsertAchievement(achievementData: Achievement): Promise<void> {
    try {
        await db.collection('achievements').doc(achievementData.id).set(achievementData);
        console.log("Upserted achievement:", achievementData.id);
    } catch (e) {
        console.error("Error upserting achievement:", achievementData.id, e);
        throw e;
    }
}

async function deleteLegacyChallengeDocs(): Promise<void> {
    for (const id of legacyChallengeCategoryIds) {
        try {
            await db.collection('achievements').doc(id).delete();
            console.log("Deleted legacy Challenge-category doc:", id);
        } catch (e) {
            console.error("Error deleting legacy doc:", id, e);
        }
    }
}

async function migrateAchievements(): Promise<void> {
    for (const achievement of allAchievements) {
        await upsertAchievement(achievement);
    }
    await deleteLegacyChallengeDocs();
}

migrateAchievements()
    .then(() => {
        console.log("Achievements collection migrated successfully.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error migrating achievements:", error);
        process.exit(1);
    });