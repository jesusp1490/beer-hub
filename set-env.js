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
        // Replace other placeholders similarly
        fs.writeFileSync(targetPath, content);
        console.log(`Created ${target} from ${template}`);
    } else {
        console.warn(`Template file ${template} not found. Skipping creation of ${target}`);
    }
});