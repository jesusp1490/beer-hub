const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const firebaseProjectId = process.env['FIREBASE_PROJECT_ID'];
if (!firebaseProjectId) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
}

// Initialize Firebase Admin using the credentials file path from env
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseProjectId
});

const db = admin.firestore();

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    levels: {
        level: number;
        icon: string;
        description: string;
    }[];
}

const ratingAchievements: Achievement[] = [
  {
    id: "novice_taster",
    name: "Novice Taster",
    description: "Rate your first beers",
    icon: "🍺",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 beers" },
      { level: 2, icon: "🥈", description: "Rate 50 beers" },
      { level: 3, icon: "🥇", description: "Rate 100 beers" },
    ],
  },
  {
    id: "expert_taster",
    name: "Expert Taster",
    description: "Become a beer expert",
    icon: "🍻",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 200 beers" },
      { level: 2, icon: "🥈", description: "Rate 500 beers" },
      { level: 3, icon: "🥇", description: "Rate 1000 beers" },
    ],
  },
  {
    id: "beer_sommelier_master",
    name: "Beer Sommelier Master",
    description: "Master the art of beer tasting",
    icon: "🏆",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 1500 beers" },
      { level: 2, icon: "🥈", description: "Rate 2000 beers" },
      { level: 3, icon: "🥇", description: "Rate 3000 beers" },
    ],
  },
  {
    id: "flavor_explorer",
    name: "Flavor Explorer",
    description: "Explore different beer styles",
    icon: "🌍",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 5 beer styles" },
      { level: 2, icon: "🥈", description: "Rate 10 beer styles" },
      { level: 3, icon: "🥇", description: "Rate 20 beer styles" },
    ],
  },
  {
    id: "beer_discoverer",
    name: "Beer Discoverer",
    description: "Discover new beers",
    icon: "🔍",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Request 5 new beers" },
      { level: 2, icon: "🥈", description: "Request 15 beers" },
      { level: 3, icon: "🥇", description: "Request 30 beers" },
    ],
  },
  {
    id: "beer_critic",
    name: "Beer Critic",
    description: "Share your opinions",
    icon: "📝",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Write 10 reviews" },
      { level: 2, icon: "🥈", description: "Write 50 reviews" },
      { level: 3, icon: "🥇", description: "Write 100 reviews" },
    ],
  },
  {
    id: "master_reviewer",
    name: "Master Reviewer",
    description: "Become a respected reviewer",
    icon: "🏅",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Write 200 reviews" },
      { level: 2, icon: "🥈", description: "Write 500 reviews" },
      { level: 3, icon: "🥇", description: "Write 1000 reviews" },
    ],
  },
  {
    id: "content_creator",
    name: "Content Creator",
    description: "Create detailed beer reviews",
    icon: "📺",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Write detailed reviews on 10 beers" },
      { level: 2, icon: "🥈", description: "Write detailed reviews on 50 beers" },
      { level: 3, icon: "🥇", description: "Write detailed reviews on 100 beers" },
    ],
  },
  {
    id: "beer_influencer",
    name: "Beer Influencer",
    description: "Influence the community",
    icon: "📢",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Receive 50 likes on reviews" },
      { level: 2, icon: "🥈", description: "Receive 200 likes on reviews" },
      { level: 3, icon: "🥇", description: "Receive 500 likes on reviews" },
    ],
  },
  {
    id: "community_legend",
    name: "Community Legend",
    description: "Become a community legend",
    icon: "⭐",
    category: "Rating",
    levels: [
      { level: 1, icon: "🥉", description: "Get featured in the community" },
      { level: 2, icon: "🥈", description: "Earn 1000 reputation points" },
      { level: 3, icon: "🥇", description: "Earn 5000 reputation points" },
    ],
  },
]

const beerTypeAchievements: Achievement[] = [
  {
    id: "stout_lover",
    name: "Stout Lover",
    description: "Experience the world of stouts",
    icon: "🖤",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 Stouts" },
      { level: 2, icon: "🥈", description: "Rate 25 Stouts" },
      { level: 3, icon: "🥇", description: "Rate 50 Stouts" },
    ],
  },
  {
    id: "ipa_king",
    name: "IPA King",
    description: "Master of India Pale Ales",
    icon: "🌿",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 IPAs" },
      { level: 2, icon: "🥈", description: "Rate 30 IPAs" },
      { level: 3, icon: "🥇", description: "Rate 60 IPAs" },
    ],
  },
  {
    id: "lager_enthusiast",
    name: "Lager Enthusiast",
    description: "Explore the world of lagers",
    icon: "🍺",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 20 Lagers" },
      { level: 2, icon: "🥈", description: "Rate 50 Lagers" },
      { level: 3, icon: "🥇", description: "Rate 100 Lagers" },
    ],
  },
  {
    id: "porter_collector",
    name: "Porter Collector",
    description: "Discover porter beers",
    icon: "🏺",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 Porters" },
      { level: 2, icon: "🥈", description: "Rate 25 Porters" },
      { level: 3, icon: "🥇", description: "Rate 50 Porters" },
    ],
  },
  {
    id: "hops_master",
    name: "Hops Master",
    description: "Experience hoppy beers",
    icon: "🌱",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 high-hop beers" },
      { level: 2, icon: "🥈", description: "Rate 25 beers" },
      { level: 3, icon: "🥇", description: "Rate 50 beers" },
    ],
  },
  {
    id: "sour_adventurer",
    name: "Sour Adventurer",
    description: "Explore sour beers",
    icon: "🍋",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 5 Sour beers" },
      { level: 2, icon: "🥈", description: "Rate 15 beers" },
      { level: 3, icon: "🥇", description: "Rate 30 beers" },
    ],
  },
  {
    id: "craft_beer_connoisseur",
    name: "Craft Beer Connoisseur",
    description: "Experience craft beers",
    icon: "🛠️",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 20 craft beers" },
      { level: 2, icon: "🥈", description: "Rate 50 beers" },
      { level: 3, icon: "🥇", description: "Rate 100 beers" },
    ],
  },
  {
    id: "bock_admirer",
    name: "Bock Admirer",
    description: "Discover bock beers",
    icon: "🔥",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 5 Bocks" },
      { level: 2, icon: "🥈", description: "Rate 15 Bocks" },
      { level: 3, icon: "🥇", description: "Rate 30 Bocks" },
    ],
  },
  {
    id: "barleywine_collector",
    name: "Barleywine Collector",
    description: "Experience barleywines",
    icon: "🍷",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 3 Barleywines" },
      { level: 2, icon: "🥈", description: "Rate 10 Barleywines" },
      { level: 3, icon: "🥇", description: "Rate 25 Barleywines" },
    ],
  },
  {
    id: "hazy_ipa_aficionado",
    name: "Hazy IPA Aficionado",
    description: "Master of hazy IPAs",
    icon: "☁️",
    category: "Beer Type",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 Hazy IPAs" },
      { level: 2, icon: "🥈", description: "Rate 25 Hazy IPAs" },
      { level: 3, icon: "🥇", description: "Rate 50 Hazy IPAs" },
    ],
  },
]

const explorationAchievements: Achievement[] = [
  {
    id: "beer_explorer",
    name: "Beer Explorer",
    description: "Explore beers from different countries",
    icon: "🌍",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 5 countries" },
      { level: 2, icon: "🥈", description: "Rate beers from 15 countries" },
      { level: 3, icon: "🥇", description: "Rate beers from 30 countries" },
    ],
  },
  {
    id: "world_beer_tour",
    name: "World Beer Tour",
    description: "Travel the world through beer",
    icon: "✈️",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 3 continents" },
      { level: 2, icon: "🥈", description: "Rate beers from 5 continents" },
      { level: 3, icon: "🥇", description: "Rate beers from all continents" },
    ],
  },
  {
    id: "european_beer_enthusiast",
    name: "European Beer Enthusiast",
    description: "Explore European beers",
    icon: "🇪🇺",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 5 European countries" },
      { level: 2, icon: "🥈", description: "Rate beers from 10 countries" },
      { level: 3, icon: "🥇", description: "Rate beers from 15 countries" },
    ],
  },
  {
    id: "north_american_beer_fan",
    name: "North American Beer Fan",
    description: "Explore North American beers",
    icon: "🇺🇸",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 5 states/provinces" },
      { level: 2, icon: "🥈", description: "Rate beers from 10 states" },
      { level: 3, icon: "🥇", description: "Rate beers from 20 states" },
    ],
  },
  {
    id: "south_american_explorer",
    name: "South American Explorer",
    description: "Discover South American beers",
    icon: "🌎",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from 3 countries" },
      { level: 2, icon: "🥈", description: "Rate beers from 5 countries" },
      { level: 3, icon: "🥇", description: "Rate beers from 10 countries" },
    ],
  },
  {
    id: "asian_beer_adventurer",
    name: "Asian Beer Adventurer",
    description: "Experience Asian beers",
    icon: "🏯",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 3 Asian beers" },
      { level: 2, icon: "🥈", description: "Rate 5 beers" },
      { level: 3, icon: "🥇", description: "Rate 10 beers" },
    ],
  },
  {
    id: "african_beer_master",
    name: "African Beer Master",
    description: "Discover African beers",
    icon: "🌍",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 3 African beers" },
      { level: 2, icon: "🥈", description: "Rate 5 beers" },
      { level: 3, icon: "🥇", description: "Rate 10 beers" },
    ],
  },
  {
    id: "oceania_beer_enthusiast",
    name: "Oceania Beer Enthusiast",
    description: "Experience Oceanian beers",
    icon: "🏝️",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 3 Oceanian beers" },
      { level: 2, icon: "🥈", description: "Rate 5 beers" },
      { level: 3, icon: "🥇", description: "Rate 10 beers" },
    ],
  },
  {
    id: "high_altitude_beer_drinker",
    name: "High Altitude Beer Drinker",
    description: "Try beers from high-altitude regions",
    icon: "🏔️",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate beers from high-altitude countries" },
      { level: 2, icon: "🥈", description: "Rate beers from 3 countries" },
      { level: 3, icon: "🥇", description: "Rate beers from 5 countries" },
    ],
  },
  {
    id: "rare_beer_collector",
    name: "Rare Beer Collector",
    description: "Discover rare and unique beers",
    icon: "🏆",
    category: "Exploration",
    levels: [
      { level: 1, icon: "🥉", description: "Rate 10 rare beers" },
      { level: 2, icon: "🥈", description: "Rate 25 rare beers" },
      { level: 3, icon: "🥇", description: "Rate 50 rare beers" },
    ],
  },
]

const specialChallenges: Achievement[] = [
  {
    id: "explorer_of_the_month",
    name: "Explorer of the Month",
    description: "Monthly exploration challenge",
    icon: "🌐",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "30 days - Badge & +50 XP" }],
  },
  {
    id: "10_ipa_challenge",
    name: "10 IPA Challenge",
    description: "Rate different IPAs",
    icon: "🔥",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "7 days - Badge & +30 XP" }],
  },
  {
    id: "lager_week",
    name: "Lager Week",
    description: "Experience lager beers",
    icon: "🍺",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "7 days - Badge & +20 XP" }],
  },
  {
    id: "stout_marathon",
    name: "Stout Marathon",
    description: "Explore stout beers",
    icon: "🖤",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "1 month - Badge & +40 XP" }],
  },
  {
    id: "3_country_challenge",
    name: "3-Country Challenge",
    description: "Try beers from different countries",
    icon: "✈️",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "1 week - Badge & +25 XP" }],
  },
  {
    id: "speed_tasting",
    name: "Speed Tasting",
    description: "Quick tasting challenge",
    icon: "⚡",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "24 hours - Badge & +50 XP" }],
  },
  {
    id: "beer_hunter_pro",
    name: "Beer Hunter Pro",
    description: "Find and rate specific beers",
    icon: "🎯",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "1 month - Badge & +40 XP" }],
  },
  {
    id: "brewmaster_challenge",
    name: "Brewmaster Challenge",
    description: "Master brewing knowledge",
    icon: "🏆",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "1 year - Badge & +100 XP" }],
  },
  {
    id: "christmas_beer",
    name: "Christmas Beer",
    description: "Holiday special",
    icon: "🎄",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "1 day - Badge & +20 XP" }],
  },
  {
    id: "oktoberfest_challenge",
    name: "Oktoberfest Challenge",
    description: "Celebrate Oktoberfest",
    icon: "🍻",
    category: "Challenge",
    levels: [{ level: 1, icon: "🏆", description: "1 month - Badge & +30 XP" }],
  },
]

const allAchievements = [
  ...ratingAchievements,
  ...beerTypeAchievements,
  ...explorationAchievements,
  ...specialChallenges,
]

async function addAchievement(achievementData: Achievement, customId: string): Promise<void> {
    try {
        let docRef;
        if (customId) {
            docRef = db.collection('achievements').doc(customId);
            await docRef.set(achievementData);
        } else {
            docRef = await db.collection('achievements').add(achievementData);
        }
        console.log("Achievement added with ID: ", customId || docRef.id);
    } catch (e) {
        console.error("Error adding achievement: ", e);
        throw e;
    }
}

async function populateAchievements(): Promise<void> {
    for (const achievement of allAchievements) {
        await addAchievement(achievement, achievement.id);
    }
}

// Run the populate achievements function
populateAchievements()
    .then(() => {
        console.log("All achievements have been added to Firestore.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error populating achievements:", error);
        process.exit(1);
    });