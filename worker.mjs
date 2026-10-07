import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { validateCatalog, chooseNext, authorizeLive, publishOnce, productStatus } from './core.mjs';
import { createTelegram } from './telegram.mjs';
import { checkedPhotoBytes } from './photos.mjs';
import { createShopee, discoverCatalog } from './shopee.mjs';

const read = async path => JSON.parse((await fs.readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
let config = await read('config.json');
if (!['catalogo.json', 'catalogo-fotos.json'].includes(config.catalogFile ?? 'catalogo.json')) throw new Error('Arquivo de catálogo não autorizado.');
let catalog = await read(config.catalogFile ?? 'catalogo.json');
const history = await read('state/history.json'), mode = process.argv[2] ?? 'check';
if (mode === 'api_check' || (mode === 'publish' && config.shopeeApi?.enabled === true)) {
  if (mode === 'publish') {
    authorizeLive(config);
    const gates = chooseNext(config,{products:[]},history);
    if (gates.blocked) { console.log(gates.reason); process.exit(0); }
  }
  catalog = await discoverCatalog(createShopee(process.env.SHOPEE_APP_ID,process.env.SHOPEE_API_SECRET),history,new Date(), mode === 'api_check' ? result=>console.log(JSON.stringify({apiDiagnostic:result})) : undefined);
  config = {...config,catalogMode:'verified_offer'};
}
const totals = validateCatalog(config, catalog);
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
  if (config.shopeeApi?.enabled === true) {
    const gates = chooseNext(config,{products:[]},history);
    console.log(JSON.stringify({platform:'telegram',catalogMode:'shopee_api',enabled:config.cloudEnabled,maxPerDay:config.maxPerDay,postingIntervalMinutes:config.postingIntervalMinutes,minIntervalMinutes:config.minIntervalMinutes,blockedReason:gates.reason??null,sourceCheck:'Use api_check para consultar dados atuais sem publicar.',livePublication:false},null,2));
    process.exit(0);
  }
  if (config.catalogMode === 'curated_photo') for (const product of catalog.products) await checkedPhotoBytes(product.photo);
  const selection = chooseNext(config, catalog, history);
  console.log(JSON.stringify({ ...totals, platform: 'telegram', catalogMode: config.catalogMode, enabled: config.cloudEnabled, queuedUnpublished: catalog.products.filter(p => history.items[p.itemId]?.status !== 'publicado').length, readyProducts: catalog.products.filter(p => productStatus(config,p).ready).length, next: selection.product?.title ?? null, blockedReason: selection.reason ?? null, livePublication: false }, null, 2));
} else if (mode === 'api_check') {
  console.log(JSON.stringify({source:'Shopee Affiliate Open API',readyProducts:catalog.products.length,livePublication:false,products:catalog.products.map(p=>({title:p.title,itemId:p.itemId,link:p.offerLink,photo:p.offer.image.url,priceCents:p.offer.price.cents,priceConditions:p.offer.price.conditions,caption:p.text,coupon:null}))},null,2));
  if (!catalog.products.length) throw new Error('API respondeu, mas nenhum produto completo e pertinente foi encontrado nas quatro buscas.');
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
