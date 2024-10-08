const fs = require('fs');
const path = require('path');
require('dotenv').config();

const environmentFiles = [
    { example: 'environment.example.ts', target: 'environment.ts' },
    { example: 'environment.example.ts', target: 'environment.prod.ts' }
];

environmentFiles.forEach(({ example, target }) => {
    const examplePath = path.join(__dirname, 'src', 'environments', example);
    const targetPath = path.join(__dirname, 'src', 'environments', target);

    if (fs.existsSync(examplePath)) {
        let content = fs.readFileSync(examplePath, 'utf8');
        content = content.replace(/YOUR_API_KEY/g, process.env.FIREBASE_API_KEY || 'YOUR_API_KEY');
        content = content.replace(/YOUR_AUTH_DOMAIN/g, process.env.FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN');
        content = content.replace(/YOUR_PROJECT_ID/g, process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID');
        content = content.replace(/YOUR_STORAGE_BUCKET/g, process.env.FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET');
        content = content.replace(/YOUR_MESSAGING_SENDER_ID/g, process.env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID');
        content = content.replace(/YOUR_APP_ID/g, process.env.FIREBASE_APP_ID || 'YOUR_APP_ID');

        // Add any additional environment variables you need
        content = content.replace(/YOUR_API_URL/g, process.env.API_URL || 'YOUR_API_URL');

        // Set production flag based on target file name
        content = content.replace(/"production": false/, `"production": ${target.includes('prod')}`);

        fs.writeFileSync(targetPath, content);
        console.log(`Created ${target} from ${example}`);
    } else {
        console.warn(`Example file ${example} not found. Skipping creation of ${target}`);
    }
});