// Fails if the production build (dist/) is larger than 10 MB.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const LIMIT = 10 * 1024 * 1024;
function size(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    total += st.isDirectory() ? size(p) : st.size;
  }
  return total;
}
const total = size('dist');
console.log(`build size: ${(total / 1024 / 1024).toFixed(2)} MB (limit 10 MB)`);
if (total > LIMIT) process.exit(1);
