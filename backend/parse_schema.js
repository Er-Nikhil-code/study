const fs = require('fs');
const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = schema.split('\n');
let currentModel = '';
lines.forEach((line, i) => {
  if (line.startsWith('model ')) currentModel = line.split(' ')[1];
  if (line.includes('@relation') && !line.includes('onDelete')) {
    if (line.includes('fields: [') && line.includes('references: [')) {
      console.log(`Missing onDelete in ${currentModel} at line ${i + 1}: ${line.trim()}`);
    }
  }
});
