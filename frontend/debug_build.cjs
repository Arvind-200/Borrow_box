const fs = require('fs');
const c = fs.readFileSync('dist/assets/index-BFh7F0lj.js', 'utf8');
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('useState') && lines[i].includes('loading')) {
    console.log((i + 1) + ':' + lines[i].substring(0, 150));
  }
}
if (lines.some(l => l.includes('initRef'))) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('initRef')) {
      console.log((i + 1) + ':' + lines[i].substring(0, 150));
    }
  }
}
if (lines.some(l => l.includes('.catch'))) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('.catch')) {
      console.log((i + 1) + ':' + lines[i].substring(0, 200));
    }
  }
}
if (lines.some(l => l.includes('unauthenticated'))) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('unauthenticated')) {
      console.log((i + 1) + ':' + lines[i].substring(0, 200));
    }
  }
}