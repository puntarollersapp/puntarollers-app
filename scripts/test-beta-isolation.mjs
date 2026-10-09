import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const script = 'scripts/check-beta-isolation.mjs';
const base = {
  PR_NEXT_ISOLATED_BETA: 'I_HAVE_VERIFIED_ISOLATION',
  PR_NEXT_BETA_SUPABASE_REF: 'testproject123',
  PR_NEXT_PRODUCTION_SUPABASE_REF: 'production456',
  VITE_SUPABASE_URL: 'https://testproject123.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-public-key-only'
};
const cases = [
  ['valid isolated configuration', {}, true],
  ['no explicit isolation approval', { PR_NEXT_ISOLATED_BETA: '' }, false],
  ['no beta URL', { VITE_SUPABASE_URL: '' }, false],
  ['no anon key', { VITE_SUPABASE_ANON_KEY: '' }, false],
  ['wrong beta reference', { PR_NEXT_BETA_SUPABASE_REF: 'wrong' }, false],
  ['no production reference', { PR_NEXT_PRODUCTION_SUPABASE_REF: '' }, false],
  ['beta equals production', { PR_NEXT_PRODUCTION_SUPABASE_REF: 'testproject123' }, false],
  ['invalid URL', { VITE_SUPABASE_URL: 'https://example.com' }, false],
  ['URL with path', { VITE_SUPABASE_URL: 'https://testproject123.supabase.co/unsafe' }, false]
];
for (const [label, overrides, shouldPass] of cases) {
  const env = { ...process.env, ...base, ...overrides };
  const result = spawnSync(process.execPath, [script], { env, encoding: 'utf8' });
  assert.equal(result.status === 0, shouldPass, label + ': ' + (result.stderr || result.stdout));
  console.log('PASS ' + label);
}
console.log('9 beta isolation checks passed. These tests do not validate Supabase RLS or actual remote isolation.');
