const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const dirs = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'components')
];

let totalFiles = 0;
let modifiedFiles = 0;

for (const dir of dirs) {
  const files = walkSync(dir);
  for (const file of files) {
    totalFiles++;
    const originalContent = fs.readFileSync(file, 'utf8');
    let content = originalContent;

    // Replace indigo with blue for all utility classes
    content = content.replace(/indigo-(\d+)/g, 'blue-$1');
    
    // Replace text-slate-900 with text-slate-800
    content = content.replace(/slate-900/g, 'slate-800');
    
    // Simplify shadows
    content = content.replace(/shadow-xl/g, 'shadow-md');
    content = content.replace(/shadow-2xl/g, 'shadow-md');
    
    // Normalize border radius to rounded-2xl maximum (as per guidelines "rounded-xl or rounded-2xl")
    content = content.replace(/rounded-3xl/g, 'rounded-2xl');
    
    // Remove complex blur textures (just in case any remain, replacing blur-3xl with nothing or smaller)
    // Actually the user said "hanya mengubah pewarnaan bukan logika", replacing utility colors is exactly what is needed.

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles++;
    }
  }
}

console.log(`Scanned ${totalFiles} files. Modified ${modifiedFiles} files to apply unified design system.`);
