const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

export {};

const firebaseProjectId = process.env['FIREBASE_PROJECT_ID'];
if (!firebaseProjectId) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
}

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseProjectId,
});

const db = admin.firestore();

// NOTE: this list MUST mirror auth.service.ts's buildDefaultUserProfile()
// statistics shape exactly. If that shape ever changes, update both places
// (same duplication caveat as functions/src/index.ts's rank ladder — no
// shared package between the Angular app and these admin scripts).
const DEFAULT_STATISTICS_FIELDS: Record<string, unknown> = {
    totalBeersRated: 0,
    countriesExplored: [],
    beerTypeStats: {},
    mostActiveDay: { date: '', count: 0 },
    averageRating: 0,
    favoriteBrewery: '',
    points: 0,
    uniqueStylesCount: 0,
    uniqueCountriesCount: 0,
    totalReviews: 0,
    totalReviewLikes: 0,
    newBeerRequests: 0,
    detailedReviews: 0,
    reputationPoints: 0,
    continentsExplored: [],
    europeanCountriesExplored: [],
    northAmericanCountriesExplored: [],
    southAmericanCountriesExplored: [],
    asianBeersRated: 0,
    africanBeersRated: 0,
    oceaniaBeersRated: 0,
    highAltitudeCountriesExplored: [],
    rareBeersRated: 0,
    craftBeersRated: 0,
    highHopBeersRated: 0,
    totalBadgesEarned: 0,
};

const DEFAULT_RANK = {
    name: 'Beer Recruit',
    icon: '🍺',
    level: 'I',
    points: 0,
    progress: 0,
    pointsToNextRank: 19,
};

interface MigrationStats {
    usersScanned: number;
    usersUpdated: number;
    fieldsBackfilled: number;
}

function buildPatchForUser(docId: string, data: Record<string, any>): Record<string, unknown> {
    const patch: Record<string, unknown> = {};
    const now = admin.firestore.Timestamp.now();

    // Top-level fields that were entirely absent for old Google sign-ups.
    if (!data['username']) {
        const fallback = data['email'] ? String(data['email']).split('@')[0] : `user${docId.slice(0, 6)}`;
        patch['username'] = fallback;
        console.log(`  [${docId}] backfilling username -> "${fallback}"`);
    }

    if (!data['rank']) {
        patch['rank'] = DEFAULT_RANK;
        console.log(`  [${docId}] backfilling missing rank`);
    }

    // FIX: the old email-signup path wrote achievements as an ARRAY ([]),
    // but UserProfile.achievements is typed Record<string, UserAchievement>
    // — a map. Any doc still holding that legacy empty array gets
    // normalized to an empty object. (If a doc somehow has a NON-empty
    // array here, this intentionally does NOT touch it — that would be
    // unexpected data worth investigating by hand rather than silently
    // discarding via an automated script.)
    if (Array.isArray(data['achievements']) && data['achievements'].length === 0) {
        patch['achievements'] = {};
        console.log(`  [${docId}] normalizing legacy achievements array -> {}`);
    } else if (Array.isArray(data['achievements']) && data['achievements'].length > 0) {
        console.warn(
            `  [${docId}] WARNING: achievements is a non-empty array (${data['achievements'].length} items) — ` +
            `skipping automatic normalization, please check this account manually.`,
        );
    }

    if (typeof data['level'] !== 'number') {
        patch['level'] = 1;
    }
    if (typeof data['progress'] !== 'number') {
        patch['progress'] = 0;
    }

    // Statistics: if the whole object is missing, write the full default.
    // If it EXISTS but is missing individual fields (the old email-signup
    // path only wrote ~10 of the ~26 real fields), backfill just those
    // missing sub-fields without touching any that already have real data.
    if (!data['statistics']) {
        patch['statistics'] = {
            ...DEFAULT_STATISTICS_FIELDS,
            registrationDate: data['createdAt'] || now,
            lastRatingDate: data['createdAt'] || now,
        };
        console.log(`  [${docId}] backfilling entire missing statistics object`);
    } else {
        for (const [field, defaultValue] of Object.entries(DEFAULT_STATISTICS_FIELDS)) {
            if (data['statistics'][field] === undefined) {
                patch[`statistics.${field}`] = defaultValue;
                console.log(`  [${docId}] backfilling statistics.${field}`);
            }
        }
        if (data['statistics'].registrationDate === undefined) {
            patch['statistics.registrationDate'] = data['createdAt'] || now;
        }
        if (data['statistics'].lastRatingDate === undefined) {
            patch['statistics.lastRatingDate'] = data['createdAt'] || now;
        }
    }

    return patch;
}

async function migrateExistingUsers(): Promise<MigrationStats> {
    const stats: MigrationStats = { usersScanned: 0, usersUpdated: 0, fieldsBackfilled: 0 };
    const snapshot = await db.collection('users').get();

    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
        stats.usersScanned++;
        const data = doc.data();
        const patch = buildPatchForUser(doc.id, data);
        const patchKeys = Object.keys(patch);

        if (patchKeys.length === 0) {
            continue;
        }

        stats.usersUpdated++;
        stats.fieldsBackfilled += patchKeys.length;

        batch.update(doc.ref, patch);
        batchCount++;

        if (batchCount >= 450) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    return stats;
}

migrateExistingUsers()
    .then((stats) => {
        console.log('\nMigration complete.');
        console.log(`  Users scanned:        ${stats.usersScanned}`);
        console.log(`  Users updated:        ${stats.usersUpdated}`);
        console.log(`  Total fields backfilled: ${stats.fieldsBackfilled}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error migrating existing users:', error);
        process.exit(1);
    });
