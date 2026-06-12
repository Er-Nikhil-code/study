const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = 0;

walkDir('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace <Loader ... animate-spin ... /> with null
    content = content.replace(/<Loader2?\s+[^>]*animate-spin[^>]*\/>/g, 'null');
    
    // Replace <div ... animate-spin ...></div> with null
    content = content.replace(/<div[^>]*animate-spin[^>]*><\/div>/g, 'null');
    content = content.replace(/<div[^>]*animate-spin[^>]*>\s*<\/div>/g, 'null');
    
    // Replace animate-spin on spans
    content = content.replace(/<span[^>]*animate-spin[^>]*><\/span>/g, 'null');
    
    // Handle animate-pulse elements. We can add 'hidden' class or replace animate-pulse with hidden
    content = content.replace(/\banimate-pulse\b/g, 'hidden');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
      modifiedFiles++;
    }
  }
});

console.log(`Finished. Modified ${modifiedFiles} files.`);
