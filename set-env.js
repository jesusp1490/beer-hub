const fs = require('fs');
const path = require('path');
require('dotenv').config();

const environmentFiles = [
    { template: 'environment.template.ts', target: 'environment.ts' },
    { template: 'environment.prod.template.ts', target: 'environment.prod.ts' }
];

environmentFiles.forEach(({ template, target }) => {
    const templatePath = path.join(__dirname, 'src', 'environments', template);
    const targetPath = path.join(__dirname, 'src', 'environments', target);

    if (fs.existsSync(templatePath)) {
        let content = fs.readFileSync(templatePath, 'utf8');
        content = content.replace(/YOUR_API_KEY/g, process.env.FIREBASE_API_KEY || 'YOUR_API_KEY');
        content = content.replace(/YOUR_AUTH_DOMAIN/g, process.env.FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN');
        content = content.replace(/YOUR_PROJECT_ID/g, process.env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID');
        content = content.replace(/YOUR_STORAGE_BUCKET/g, process.env.FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET');
        content = content.replace(/YOUR_MESSAGING_SENDER_ID/g, process.env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID');
        content = content.replace(/YOUR_APP_ID/g, process.env.FIREBASE_APP_ID || 'YOUR_APP_ID');
        fs.writeFileSync(targetPath, content);
        console.log(`Created ${target} from ${template}`);
    } else {
        console.warn(`Template file ${template} not found. Skipping creation of ${target}`);
    }
});