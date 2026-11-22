// Builds dist/ and zips it for upload (index.html at the root of the archive, Playgama 1.3.2).
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

mkdirSync('release', { recursive: true });
const out = 'release/dragon-survivor.zip';
if (existsSync(out)) rmSync(out);
const py = `import os, zipfile
z = zipfile.ZipFile('${out}', 'w', zipfile.ZIP_DEFLATED)
for root, _, files in os.walk('dist'):
    for f in files:
        p = os.path.join(root, f)
        z.write(p, os.path.relpath(p, 'dist'))
z.close()`;
execSync(`python3 -c "${py.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
console.log('wrote ' + out);
