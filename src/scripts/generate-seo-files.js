const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, terminate } = require('firebase/firestore');

const SITE_URL = 'https://beerhub.es';
const ROOT = path.join(__dirname, '..', '..');

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
if (missing.length) {
    console.error('Faltan valores en el .env para:', missing.join(', '));
    process.exit(1);
}

const xmlEscape = (text) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function main() {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('Leyendo Firestore (countries, brands, beers)...');
    const [countriesSnap, brandsSnap, beersSnap] = await Promise.all([
        getDocs(collection(db, 'countries')),
        getDocs(collection(db, 'brands')),
        getDocs(collection(db, 'beers')),
    ]);

    const countryIds = new Set(countriesSnap.docs.map((d) => d.id));
    const brandIds = new Set(brandsSnap.docs.map((d) => d.id));
    const beers = beersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const beersPerCountry = new Map();
    const beersPerBrand = new Map();
    const orphanCountries = new Set();
    const orphanBrands = new Set();

    for (const beer of beers) {
        if (beer.countryId) {
            beersPerCountry.set(beer.countryId, (beersPerCountry.get(beer.countryId) || 0) + 1);
            if (!countryIds.has(beer.countryId)) orphanCountries.add(beer.countryId);
        }
        if (beer.brandId) {
            beersPerBrand.set(beer.brandId, (beersPerBrand.get(beer.brandId) || 0) + 1);
            if (!brandIds.has(beer.brandId)) orphanBrands.add(beer.brandId);
        }
    }

    const staticRoutes = ['/', '/map', '/about', '/contact'];

    const countryRoutes = [...countryIds]
        .filter((id) => beersPerCountry.get(id) > 0)
        .sort()
        .map((id) => `/country/${encodeURIComponent(id)}`);

    const brandRoutes = [...brandIds]
        .filter((id) => beersPerBrand.get(id) > 0)
        .sort()
        .map((id) => `/brands/${encodeURIComponent(id)}/beers`);

    const beerRoutes = beers
        .map((b) => b.id)
        .sort()
        .map((id) => `/beers/${encodeURIComponent(id)}`);

    const routes = [...staticRoutes, ...countryRoutes, ...brandRoutes, ...beerRoutes];

    const sitemap =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        routes.map((r) => `  <url><loc>${xmlEscape(SITE_URL + r)}</loc></url>`).join('\n') +
        '\n</urlset>\n';

    const robots =
        'User-agent: *\n' +
        'Allow: /\n' +
        'Disallow: /dashboard\n' +
        'Disallow: /login\n' +
        'Disallow: /signup\n' +
        'Disallow: /forgot-password\n' +
        '\n' +
        `Sitemap: ${SITE_URL}/sitemap.xml\n`;

    fs.writeFileSync(path.join(ROOT, 'routes.txt'), routes.join('\n') + '\n');
    fs.writeFileSync(path.join(ROOT, 'src', 'sitemap.xml'), sitemap);
    
    
    const countryCounts = {};
    for (const [id, n] of beersPerCountry) countryCounts[id] = n;
    fs.writeFileSync(
        path.join(ROOT, 'src', 'assets', 'country-beer-counts.json'),
        JSON.stringify(countryCounts, null, 2) + '\n',
    );

    const catalog = beers.map((b) => ({
        id: b.id,
        name: b.name,
        brand: b.brand,
        brandId: b.brandId,
        beerType: b.beerType,
        ABV: b.ABV,
        averageRating: b.averageRating,
        beerLabelUrl: b.beerLabelUrl,
        ingredients: (b.ingredients || []).map((i) => ({ name: i.name })),
    }));
    fs.writeFileSync(
        path.join(ROOT, 'src', 'assets', 'beer-catalog.json'),
        JSON.stringify(catalog),
    );

    console.log('');
    console.log('Hecho. Archivos generados:');
    console.log('  routes.txt, src/sitemap.xml, src/robots.txt');
    console.log('');
    console.log(`Países en Firestore: ${countryIds.size} (con cervezas: ${countryRoutes.length})`);
    console.log(`Marcas en Firestore: ${brandIds.size} (con cervezas: ${brandRoutes.length})`);
    console.log(`Cervezas: ${beerRoutes.length}`);
    console.log(`Total de URLs: ${routes.length}`);

    if (orphanCountries.size) {
        console.warn('\nAVISO: cervezas con countryId sin documento en "countries":', [...orphanCountries]);
    }
    if (orphanBrands.size) {
        console.warn('\nAVISO: cervezas con brandId sin documento en "brands":', [...orphanBrands].slice(0, 20));
        if (orphanBrands.size > 20) console.warn(`  ... y ${orphanBrands.size - 20} más`);
    }

    await terminate(db);
}

main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
