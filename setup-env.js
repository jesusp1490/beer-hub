const fs = require('fs');
const path = require('path');

const environmentFiles = [
    { template: 'environment.template.ts', output: 'environment.ts' },
    { template: 'environment.prod.template.ts', output: 'environment.prod.ts' }
];

environmentFiles.forEach(({ template, output }) => {
    const templatePath = path.join(__dirname, 'src', 'environments', template);
    const outputPath = path.join(__dirname, 'src', 'environments', output);

    if (!fs.existsSync(outputPath)) {
        fs.copyFileSync(templatePath, outputPath);
        console.log(`Created ${output} from template.`);
    } else {
        console.log(`${output} already exists. Skipping.`);
    }
});