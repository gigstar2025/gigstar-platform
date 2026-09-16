import { execFileSync, spawnSync } from 'node:child_process';

const PROJECT = 'prj_7AtaoQxO2NB4WrPTCqKgXlLY9LZg';
const SCOPE = 'team_9kBeMMe6JAMhKpX4lUm0SZQN';

// Fetch decrypted env records once, in-memory only.
const raw = execFileSync(
  'vercel',
  ['api', `/v9/projects/${PROJECT}/env?decrypt=true`, '--scope', SCOPE],
  { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
);
const all = JSON.parse(raw).envs || [];

function getValue(key, env) {
  const rec = all.find(
    (e) =>
      e.key === key &&
      (Array.isArray(e.target) ? e.target.includes(env) : e.target === env)
  );
  return rec && typeof rec.value === 'string' && rec.value.length ? rec.value : null;
}

const mappings = [
  { src: 'SUPABASE_ANON_KEY', dest: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' },
  { src: 'SUPABASE_SECRET_KEY', dest: 'SUPABASE_SERVICE_ROLE_KEY' },
];
const envs = ['preview', 'development'];

for (const { src, dest } of mappings) {
  for (const env of envs) {
    const val = getValue(src, env);
    if (!val) {
      console.log(`SKIP ${dest} [${env}]: source ${src} not present for ${env}`);
      process.exitCode = 1;
      continue;
    }
    // Value passed via stdin only; never printed or written to disk.
    const res = spawnSync('vercel', ['env', 'add', dest, env], {
      input: val,
      encoding: 'utf8',
    });
    const ok = res.status === 0;
    console.log(
      `${ok ? 'OK' : 'FAIL'} ${dest} [${env}]` +
        (ok ? '' : `: ${(res.stderr || '').split('\n').filter(Boolean).pop() || 'unknown error'}`)
    );
  }
}
