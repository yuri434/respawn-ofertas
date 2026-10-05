import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { validateCatalog, chooseNext, authorizeLive, publishOnce } from './core.mjs';
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

async function checkProduct(product) {
  if (product.retailer !== 'Amazon') return true;
  try {
    const response = await fetch(product.productLink, { signal: AbortSignal.timeout(20000) });
    if (!response.ok || !new URL(response.url).pathname.includes('/dp/' + product.asin)) return false;
    const html = await response.text();
    if (/captcha|robot check|automated access/i.test(html)) return false;
    const title = html.match(/id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]?.replace(/<[^>]+>/g, '').trim();
    if (!title) return false;
    const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return product.identityTokens.every(token => normalized.includes(token.toLowerCase().replace(/[^a-z0-9]/g, '')));
  } catch { return false; }
}

if (mode === 'check') {
  console.log(JSON.stringify({ ...totals, platform: 'telegram', enabled: config.cloudEnabled, next: chooseNext(config, catalog, history).product?.title ?? null, livePublication: false }, null, 2));
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
    if (!await checkProduct(selection.product)) {
      history.items[selection.product.itemId] = { status: 'adiado', at: new Date().toISOString(), reason: 'Anúncio não pôde ser reconferido; não há confirmação de oferta ativa.' };
      await persist();
      continue;
    }
    console.log(JSON.stringify(await publishOnce({ config, catalog, history, provider: createTelegram(config, process.env.TELEGRAM_BOT_TOKEN), persist })));
    break;
  }
} else throw new Error('Modo desconhecido.');
