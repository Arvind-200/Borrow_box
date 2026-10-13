const fs = require('fs');
const c = fs.readFileSync('dist/assets/index-BFh7F0lj.js', 'utf8');
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.indexOf('initRef') >= 0 || line.indexOf('Bn.me') >= 0 || line.indexOf("f||l") >= 0 || (line.indexOf('useState') >= 0 && line.indexOf('loading') >= 0)) {
    console.log((i + 1) + ':' + line.substring(0, 250));
  }
}