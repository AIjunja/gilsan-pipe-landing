const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const destination = path.join(root, 'dist');
const sources = [
  'index.html', 'styles.css', 'motion.css', 'app.js', 'motion.js', '_headers',
  'assets/logo.gif', 'assets/hero-01.jpg', 'assets/hero-02.jpg',
  'assets/pipe-thumb.jpg', 'assets/coil-thumb.jpg', 'assets/bar-thumb.jpg',
  'assets/steel-pipes.svg', 'assets/favicon.svg',
  'assets/PretendardVariable.woff2', 'assets/inter-latin.woff2', 'assets/Hahmlet-Variable.woff2',
  'assets/PRETENDARD-LICENSE.txt', 'assets/INTER-LICENSE.txt', 'assets/HAHMLET-LICENSE.txt'
];
const expected = new Set(sources);
function inspect(folder) {
  if (!fs.existsSync(folder)) return;
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) inspect(file);
    else if (!expected.has(path.relative(destination, file).split(path.sep).join('/'))) {
      throw new Error('Unexpected existing build file: ' + path.relative(destination, file));
    }
  }
}
inspect(destination);
for (const source of sources) {
  const target = path.join(destination, source);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, source), target);
}
console.log(`Built ${sources.length} reviewed files into dist/`);
