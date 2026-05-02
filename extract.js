const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('d:/taskmanager railway/server_backend.js', 'utf8');
const lines = content.split('\n');

let currentFile = null;
let currentContent = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(/^\/\/\s*───\s*(.+?)\s*──/);
  if (match) {
    if (currentFile && currentContent.length > 0) {
      let text = currentContent.join('\n');
      text = text.replace(/^\/\*+/, '').replace(/\*+\/$/, '').trim();
      fs.writeFileSync(path.join('d:/taskmanager railway/server', currentFile), text);
      console.log('Created', currentFile);
    }
    
    let fileName = match[1].trim();
    if (fileName.includes('(')) {
      fileName = fileName.split('(')[0].trim();
    }
    currentFile = fileName;
    currentContent = [];
    
    // Skip the next line if it's '/*'
    if (lines[i+1] && lines[i+1].trim() === '/*') {
      i++;
    }
  } else {
    if (currentFile) {
      currentContent.push(line);
    }
  }
}

// Write the last file
if (currentFile && currentContent.length > 0) {
  let text = currentContent.join('\n');
  text = text.replace(/^\/\*+/, '').replace(/\*+\/$/, '').trim();
  fs.writeFileSync(path.join('d:/taskmanager railway/server', currentFile), text);
  console.log('Created', currentFile);
}
