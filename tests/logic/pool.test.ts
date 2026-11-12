import { expect, it } from 'vitest';
import { Pool } from '../../src/logic/pool';

it('reuses released items, resets them and tracks active count', () => {
  let created = 0;
  const pool = new Pool(() => ({ n: created++, used: true }), (o) => { o.used = false; });
  const a = pool.acquire();
  expect(pool.activeCount).toBe(1);
  pool.release(a);
  expect(pool.activeCount).toBe(0);
  expect(a.used).toBe(false);
  const b = pool.acquire();
  expect(b).toBe(a);
  expect(created).toBe(1);
  expect(pool.createdCount).toBe(1);
});
