const fs = require('fs');
const path = require('path');

const environmentFiles = [
    { template: 'environment.example.ts', target: 'environment.ts' },
    { template: 'environment.prod.example.ts', target: 'environment.prod.ts' }
];

environmentFiles.forEach(({ template, target }) => {
    const templatePath = path.join(__dirname, 'src', 'environments', template);
    const targetPath = path.join(__dirname, 'src', 'environments', target);

    if (!fs.existsSync(targetPath)) {
        if (fs.existsSync(templatePath)) {
            fs.copyFileSync(templatePath, targetPath);
            console.log(`Created ${target} from ${template}`);
        } else {
            console.warn(`Template file ${template} not found. Skipping creation of ${target}`);
        }
    } else {
        console.log(`${target} already exists. Skipping.`);
    }
});