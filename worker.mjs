import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { validateCatalog, chooseNext, authorizeLive, publishOnce, productStatus } from './core.mjs';
import { createTelegram } from './telegram.mjs';

const read = async path => JSON.parse((await fs.readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
const config = await read('config.json'), catalog = await read('catalogo.json'), history = await read('state/history.json');
const totals = validateCatalog(config, catalog), mode = process.argv[2] ?? 'check';
async function persist() {
  await fs.writeFile('state/history.json.tmp', JSON.stringify(history, null, 2) + '\n');
  await fs.rename('state/history.json.tmp', 'state/history.json');
  if (process.env.GITHUB_ACTIONS === 'true') {
    execFileSync('git', ['add', '--', 'state/history.json'], { stdio: 'ignore' });
    try { execFileSync('git', ['diff', '--cached', '--quiet'], { stdio: 'ignore' }); return; }
    catch (error) { if (error.status !== 1) throw error; }
    execFileSync('git', ['commit', '-m', 'Atualizar publicações Telegram'], { stdio: 'ignore' });
    execFileSync('git', ['push', 'origin', 'HEAD'], { stdio: 'ignore' });
  }
}

if (mode === 'check') {
  console.log(JSON.stringify({ ...totals, platform: 'telegram', catalogMode: config.catalogMode, enabled: config.cloudEnabled, next: chooseNext(config, catalog, history).product?.title ?? null, livePublication: false }, null, 2));
} else if (mode === 'verify') {
  console.log(JSON.stringify(await createTelegram(config, process.env.TELEGRAM_BOT_TOKEN).verify(), null, 2));
} else if (mode === 'discover') {
  console.log(JSON.stringify(await createTelegram(config, process.env.TELEGRAM_BOT_TOKEN).discover(), null, 2));
} else if (mode === 'publish') {
  authorizeLive(config);
  for (let i = 0; i < config.maxCandidates; i++) {
    const selection = chooseNext(config, catalog, history);
    if (selection.blocked || !selection.product) { console.log(selection.reason ?? 'Fila concluída.'); break; }
    if (selection.product.retailer === 'Amazon' && !config.amazonChannelRegistered) throw new Error('Canal Telegram ainda precisa ser cadastrado nos Associados Amazon.');
    const source = productStatus(config, selection.product);
    if (!source.ready) {
      history.items[selection.product.itemId] = { status: 'adiado', at: new Date().toISOString(), reason: source.reason };
      await persist();
      console.log(JSON.stringify({ published: false, title: selection.product.title, reason: source.reason }));
      continue;
    }
    console.log(JSON.stringify(await publishOnce({ config, catalog, history, provider: createTelegram(config, process.env.TELEGRAM_BOT_TOKEN), persist })));
    break;
  }
} else throw new Error('Modo desconhecido.');
