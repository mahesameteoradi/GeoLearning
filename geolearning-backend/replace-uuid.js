const fs = require('fs');
const file = 'd:/SEMESTER 8/geo_LearningMedia/geolearning-backend/prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/@default\(uuid\(\)\)/g, '@default(dbgenerated("gen_random_uuid()"))');
fs.writeFileSync(file, content);
console.log('Replaced all occurrences successfully.');
