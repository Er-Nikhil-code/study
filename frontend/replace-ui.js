const fs = require('fs');
const path = require('path');

const replacements = [
  // Teacher -> Knight
  { search: /"Teacher Application Approved"/g, replace: '"Knight Application Approved"' },
  { search: /"Teacher approved"/g, replace: '"Knight approved"' },
  { search: /"Teacher home"/g, replace: '"Knight home"' },
  { search: /"Submit study material for Teacher review"/g, replace: '"Submit study material for Knight review"' },
  { search: />Teacher Quota</g, replace: '>Knight Quota<' },
  { search: /"Knights \(Teachers\)"/g, replace: '"Knights"' },
  { search: />No Teacher Assigned</g, replace: '>No Knight Assigned<' },
  { search: /"Teacher approved: Priya Nair"/g, replace: '"Knight approved: Priya Nair"' },
  { search: />Teacher</g, replace: '>Knight<' },
  { search: />Teacher Contributions</g, replace: '>Knight Contributions<' },
  { search: /role: "Teacher"/g, replace: 'role: "Knight"' }, // UserTable dummy data
  
  // Intern -> Pawn
  { search: /"Intern Dashboard"/g, replace: '"Pawn Dashboard"' },
  { search: /"Intern home"/g, replace: '"Pawn home"' },
  { search: /Intern: /g, replace: 'Pawn: ' },
  { search: /"Approve or reject study materials submitted by Interns"/g, replace: '"Approve or reject study materials submitted by Pawns"' },
  { search: /By Intern ID:/g, replace: 'By Pawn ID:' },
  { search: />Interns</g, replace: '>Pawns<' },
  { search: /"Interns"/g, replace: '"Pawns"' },
  { search: /"My Interns"/g, replace: '"My Pawns"' },
  { search: /"Select an Admin or your assigned Intern to forward this to."/g, replace: '"Select an Admin or your assigned Pawn to forward this to."' },
  { search: /"Your Interns"/g, replace: '"Your Pawns"' },
  { search: /\(Intern\)</g, replace: '(Pawn)<' },
  { search: />Intern Contributions</g, replace: '>Pawn Contributions<' },
  { search: /role: "Intern"/g, replace: 'role: "Pawn"' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk('./src');

let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  replacements.forEach(({ search, replace }) => {
    newContent = newContent.replace(search, replace);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
    count++;
  }
});

console.log(`Replaced UI strings in ${count} files.`);
