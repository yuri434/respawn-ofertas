import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// Never log Git stderr: authenticated remote URLs can contain credentials.
export async function saveGitHistory({ run = args => execFileSync('git', args, { stdio: 'ignore' }), sleep = delay } = {}) {
  run(['add', '--', 'state/history.json']);
  let changed = false;
  try { run(['diff', '--cached', '--quiet']); }
  catch (error) { if (error.status !== 1) throw new Error('Não foi possível conferir o histórico Git.'); changed = true; }
  if (changed) run(['commit', '-m', 'Atualizar publicações Telegram']);
  // Retry the same commit, including when a previous call committed but did not push.
  // No force push or history replacement: divergence must fail before another send.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { run(['push', 'origin', 'HEAD:main']); return; }
    catch {
      if (attempt === 3) throw new Error('Não foi possível salvar o histórico na nuvem após três tentativas; conferir o canal antes de reenviar.');
      await sleep(attempt * 1000);
    }
  }
}
