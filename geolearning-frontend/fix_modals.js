const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      // Exclude node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.jsx')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const files = walkSync('./');
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern to find `fixed inset-0` with `items-center` without `overflow-y-auto`
  // We want to replace `items-center` with `items-start` and add `overflow-y-auto` and `py-4 sm:py-8`
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('fixed') && lines[i].includes('inset-0')) {
      if (!lines[i].includes('overflow-y-auto')) {
        // If it's a modal container
        if (lines[i].includes('justify-center')) {
          let orig = lines[i];
          // Replace items-center with items-start
          let updated = lines[i].replace('items-center', 'items-start overflow-y-auto');
          
          // Ensure it has vertical padding for scrolling breathing room
          if (!updated.includes('py-') && updated.includes('p-4')) {
            updated = updated.replace('p-4', 'p-4 py-8 md:py-12');
          } else if (!updated.includes('py-') && !updated.includes('p-4')) {
            // Add padding if missing
            updated = updated.replace('justify-center', 'justify-center p-4 py-8 md:py-12');
          }
          
          if (orig !== updated) {
            lines[i] = updated;
            changed = true;
          }
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`Fixed modal in ${file}`);
    count++;
  }
}

console.log(`Done! Fixed modals in ${count} files.`);
