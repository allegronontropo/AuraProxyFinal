const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.match(/\.(tsx|ts|jsx|js|md|css|html)$/)) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('c:\\\\Users\\\\badri\\\\Downloads\\\\AuraProxyFinal');
let changed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  // Replace ' - ' with ' - ' (this hits most inline AI dashes)
  newContent = newContent.replace(/ - /g, ' - ');
  
  // Replace '—' that are directly touching words but leave standalone '—' alone
  // A simple way is to match word characters touching it, but let's just do a specific replace for the remaining cases
  // Actually, there were things like "- stored encrypted" or "// Return raw key once - never stored"
  // If we just replace `- ` (em-dash followed by space) with `- `
  newContent = newContent.replace(/- /g, '- ');
  
  // And ` -` (space followed by em-dash) with ` -`
  newContent = newContent.replace(/ -/g, ' -');
  
  // There are some decorative ones like `- -` in the tables, let's turn them into `- -`
  newContent = newContent.replace(/- -/g, '- -');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated: ' + file);
    changed++;
  }
});
console.log('Total files updated: ' + changed);
