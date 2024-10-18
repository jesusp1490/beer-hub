const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Current working directory:', process.cwd());
console.log('Environment variables:', process.env);

const environmentFiles = [
    { example: 'environment.example.ts', target: 'environment.ts', isProd: false },
    { example: 'environment.example.ts', target: 'environment.prod.ts', isProd: true }
];

environmentFiles.forEach(({ example, target, isProd }) => {
    const examplePath = path.join(__dirname, 'src', 'environments', example);
    const targetPath = path.join(__dirname, 'src', 'environments', target);

    if (fs.existsSync(examplePath)) {
        let content = fs.readFileSync(examplePath, 'utf8');

        // Replace placeholders with actual values from .env
        content = content.replace(/YOUR_API_KEY/g, process.env.FIREBASE_API_KEY || 'API_KEY_NOT_FOUND');
        content = content.replace(/YOUR_AUTH_DOMAIN/g, process.env.FIREBASE_AUTH_DOMAIN || 'AUTH_DOMAIN_NOT_FOUND');
        content = content.replace(/YOUR_PROJECT_ID/g, process.env.FIREBASE_PROJECT_ID || 'PROJECT_ID_NOT_FOUND');
        content = content.replace(/YOUR_STORAGE_BUCKET/g, process.env.FIREBASE_STORAGE_BUCKET || 'STORAGE_BUCKET_NOT_FOUND');
        content = content.replace(/YOUR_MESSAGING_SENDER_ID/g, process.env.FIREBASE_MESSAGING_SENDER_ID || 'MESSAGING_SENDER_ID_NOT_FOUND');
        content = content.replace(/YOUR_APP_ID/g, process.env.FIREBASE_APP_ID || 'APP_ID_NOT_FOUND');

        // Set production flag based on isProd
        content = content.replace(/production:\s*(false|true)/, `production: ${isProd}`);

        fs.writeFileSync(targetPath, content);
        console.log(`Created ${target} from ${example}`);
        console.log('Content:', content);
    } else {
        console.warn(`Example file ${example} not found. Skipping creation of ${target}`);
    }
});