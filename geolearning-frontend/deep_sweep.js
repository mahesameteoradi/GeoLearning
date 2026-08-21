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

    // emerald-* and teal-* -> green-*
    content = content.replace(/emerald-(\d+)/g, 'green-$1');
    content = content.replace(/teal-(\d+)/g, 'green-$1');
    
    // cyan-* and sky-* -> blue-*
    content = content.replace(/cyan-(\d+)/g, 'blue-$1');
    content = content.replace(/sky-(\d+)/g, 'blue-$1');
    
    // violet-* and fuchsia-* -> amber-*
    content = content.replace(/violet-(\d+)/g, 'amber-$1');
    content = content.replace(/fuchsia-(\d+)/g, 'amber-$1');
    
    // yellow-* -> amber-*
    content = content.replace(/yellow-(\d+)/g, 'amber-$1');
    
    // bg-slate-100 -> bg-slate-50
    content = content.replace(/bg-slate-100/g, 'bg-slate-50');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles++;
    }
  }
}

console.log(`Scanned ${totalFiles} files. Modified ${modifiedFiles} files to apply deep harmonization.`);
