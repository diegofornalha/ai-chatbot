const fs = require('node:fs');
const path = require('node:path');
const glob = require('glob');

// Find all TSX/JSX files
const files = glob.sync('**/*.{tsx,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Fix duplicate type attributes on the same or consecutive lines
  // Pattern 1: type="button" type="button" on same line
  if (content.includes('type="button" type="button"')) {
    content = content.replace(/type="button"\s+type="button"/g, 'type="button"');
    modified = true;
  }
  
  // Pattern 2: type="button" on one line and type="something" on next line
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    // Check if current line has <button type="button" and next line has type=
    if (line.includes('<button type="button"') && nextLine && nextLine.trim().startsWith('type=')) {
      newLines.push(line);
      // Skip the duplicate type line
      i++;
      continue;
    }
    
    // Check for button tag followed by type attribute on next line
    if ((line.trim().endsWith('<button') || line.trim().endsWith('<button type="button"')) && 
        nextLine && nextLine.trim().startsWith('type=')) {
      // If current line already has type, skip next line's type
      if (line.includes('type=')) {
        newLines.push(line);
        i++; // Skip the duplicate type line
        continue;
      }
    }
    
    newLines.push(line);
  }
  
  const newContent = newLines.join('\n');
  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done!');