import { createHash } from 'node:crypto';
import { offerStatus, offerCaption } from './offers.mjs';
import { curatedPhotoStatus, checkedPhotoBytes } from './photos.mjs';
import { disclosure, amazonDisclosure } from './offers.mjs';
export { disclosure, amazonDisclosure } from './offers.mjs';

export const linkHash = value => createHash('sha256').update(value).digest('hex');
export const localDay = value => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date(value));
export function validateFrequency(config) {
  if (![5,60,1440].includes(config.postingIntervalMinutes) || !Number.isInteger(config.maxPerDay) || config.maxPerDay < 1 || config.maxPerDay > 1440/config.postingIntervalMinutes || !Number.isInteger(config.minIntervalMinutes) || config.minIntervalMinutes < config.postingIntervalMinutes-1 || config.minIntervalMinutes > 1440) throw new Error('Frequência inválida.');
}

export function curatedProductStatus(config, product, now = new Date()) {
  if (config.catalogMode !== 'curated') return { ready: false, reason: 'Modo de catálogo não configurado.' };
  if (product.retailer !== 'Amazon' || product.trackingVerified !== true || product.linkSource !== 'SiteStripe da conta conectada' || product.mode !== 'Texto com link; sem preço, cupom ou desconto anunciado') return { ready: false, reason: 'Produto sem conferência original ou com formato não autorizado.' };
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!product.sourceName || !product.identityTokens?.length || !product.identityTokens.every(token => normalize(product.sourceName).includes(normalize(token)))) return { ready: false, reason: 'Identidade do modelo não corresponde à fonte conferida.' };
  const checked = Date.parse(product.checkedOn + 'T00:00:00Z');
  const age = new Date(now) - checked;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(product.checkedOn ?? '') || !Number.isFinite(checked) || new Date(checked).toISOString().slice(0, 10) !== product.checkedOn || age < 0 || age > 30 * 86400000) return { ready: false, reason: 'Conferência do catálogo vencida ou inválida; reconferir antes de publicar.' };
  if (/R\$|\d\s*%/.test(product.text.replaceAll(product.offerLink, ''))) return { ready: false, reason: 'O catálogo de indicações não publica preço ou percentual de desconto.' };
  return { ready: true, sourceMode: 'Catálogo conferido; sem consulta de preço, desconto ou estoque.' };
}

export function validateCatalog(config, catalog) {
  if (config.platform !== 'telegram' || config.timezone !== 'America/Sao_Paulo') throw new Error('Destino inválido.');
  validateFrequency(config);
  const ids = new Set(), links = new Set();
  for (const p of catalog.products) {
    if (!p.itemId || !p.title || !p.text?.includes(disclosure) || !p.text.includes(p.offerLink) || p.text.length > 4096) throw new Error('Produto incompleto.');
    if (ids.has(p.itemId) || links.has(p.offerLink)) throw new Error('Produto duplicado.');
    ids.add(p.itemId); links.add(p.offerLink);
    if (linkHash(p.offerLink) !== p.originalLinkHash) throw new Error('Link alterado em relação ao catálogo original.');
    const url = new URL(p.offerLink);
    if (url.protocol !== 'https:') throw new Error('URL inválida.');
    if (p.retailer === 'Amazon') {
      if (url.hostname !== 'www.amazon.com.br' || url.searchParams.get('tag') !== 'achadi0b92c92-20' || !url.pathname.includes('/dp/' + p.asin) || !p.text.includes(amazonDisclosure)) throw new Error('Rastreamento Amazon inválido.');
    } else if (url.hostname !== 's.shopee.com.br' && !(url.hostname === 'shope.ee' && p.offer?.dataProvider === 'Shopee Affiliate Open API')) throw new Error('Loja não configurada.');
  }
  return { total: catalog.products.length, amazon: catalog.products.filter(p => p.retailer === 'Amazon').length };
}

export function productStatus(config, product, now = new Date()) {
  if (config.catalogMode === 'curated_photo') return curatedPhotoStatus(product, now);
  if (config.catalogMode === 'verified_offer') return offerStatus(product, now);
  return curatedProductStatus(config, product, now);
}

export function channelUsername(config) {
  const url = new URL(config.channel.url);
  if (url.protocol !== 'https:' || url.hostname !== 't.me' || url.search || url.hash || !/^\/[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(url.pathname)) throw new Error('Informe o link público exato do canal Telegram.');
  return url.pathname.slice(1);
}

export function channelTarget(config) {
  if (config.channel.visibility === 'private') {
    if (!Number.isSafeInteger(config.channel.id) || config.channel.id >= 0) throw new Error('Canal privado: confirmar o ID na API oficial após adicionar seu bot. O convite não é um chat_id.');
    return config.channel.id;
  }
  return '@' + channelUsername(config);
}

export function messageUrl(config, messageId) {
  if (config.channel.visibility === 'private') {
    const peer = -config.channel.id - 1000000000000;
    return Number.isSafeInteger(peer) && peer > 0 ? 'https://t.me/c/' + peer + '/' + messageId : null;
  }
  return config.channel.url + '/' + messageId;
}

export function authorizeLive(config) {
  for (const flag of ['cloudEnabled', 'botAccessApproved', 'githubFreeQuotaConfirmed']) if (config[flag] !== true) throw new Error('Ativação pendente: ' + flag);
  channelTarget(config);
  if (!Number.isSafeInteger(config.channel.id) || config.channel.id >= 0 || !Number.isSafeInteger(config.bot.id) || config.bot.id <= 0 || !config.bot.username) throw new Error('Identidade do canal e do bot ainda não conferida.');
}

export function chooseNext(config, catalog, history, now = new Date()) {
  validateFrequency(config);
  const pending = Object.entries(history.items).find(([, p]) => ['enviando', 'confirmacao_pendente'].includes(p.status));
  if (pending) return { blocked: true, pendingId: pending[0], reason: 'Envio anterior pendente; conferir o próprio canal sem reenviar.' };
  const posted = Object.values(history.items).filter(p => p.status === 'publicado');
  if (posted.filter(p => localDay(p.confirmedAt) === localDay(now)).length >= config.maxPerDay) return { blocked: true, reason: 'Limite diário atingido.' };
  const slot = value => Math.floor(new Date(value).getTime() / (config.postingIntervalMinutes * 60000));
  if (posted.some(p => slot(p.confirmedAt) === slot(now))) return { blocked: true, reason: 'Uma publicação nesta janela de ' + config.postingIntervalMinutes + ' minutos já foi enviada.' };
  if (posted.some(p => new Date(now) - Date.parse(p.confirmedAt) < config.minIntervalMinutes * 60000)) return { blocked: true, reason: 'Aguardar intervalo mínimo de ' + config.minIntervalMinutes + ' minutos.' };
  const product = catalog.products.find(p => !history.items[p.itemId] || (history.items[p.itemId].status === 'adiado' && new Date(now) - Date.parse(history.items[p.itemId].at) >= 86400000));
  return { blocked: false, product: product ?? null };
}

export async function publishOnce({ config, catalog, history, provider, persist, now = new Date() }) {
  authorizeLive(config);
  validateCatalog(config, catalog);
  const selection = chooseNext(config, catalog, history, now);
  if (selection.blocked || !selection.product) return { published: false, reason: selection.reason ?? 'Fila concluída.' };
  const p = selection.product;
  if (p.retailer === 'Amazon' && !config.amazonChannelRegistered) throw new Error('Cadastrar o canal Telegram na conta de Associados antes de divulgar Amazon.');
  const source = productStatus(config, p, now);
  if (!source.ready) return { published: false, reason: source.reason };
  const photoMode = ['verified_offer', 'curated_photo'].includes(config.catalogMode);
  const text = config.catalogMode === 'verified_offer' ? offerCaption(p) : p.text;
  if (config.catalogMode === 'curated_photo') await checkedPhotoBytes(p.photo);
  await provider.verify();
  // Persistir na nuvem antes do envio: uma falha impede enviar, sem repetição automática.
  history.items[p.itemId] = { status: 'enviando', at: now.toISOString(), text, link: p.offerLink, channelId: config.channel.id, format: photoMode ? 'photo' : 'text' };
  await persist();
  try {
    const receipt = config.catalogMode === 'curated_photo' ? await provider.sendLocalPhoto(p.photo, text) : photoMode ? await provider.sendPhoto(p.offer.image.url, text) : await provider.send(text);
    const contentMatches = photoMode ? receipt.caption === text && Array.isArray(receipt.photo) && receipt.photo.length > 0 : receipt.text === text;
    if (receipt.chat?.type !== 'channel' || receipt.chat.id !== config.channel.id || !contentMatches || !Number.isSafeInteger(receipt.message_id)) throw new Error('Resposta não confirmou o conteúdo no canal correto.');
    history.items[p.itemId] = { ...history.items[p.itemId], status: 'publicado', confirmedAt: now.toISOString(), messageId: receipt.message_id, evidence: 'Telegram Bot API retornou a mensagem enviada ao canal correto.', url: messageUrl(config, receipt.message_id) };
  } catch (error) {
    history.items[p.itemId] = { ...history.items[p.itemId], status: 'confirmacao_pendente', reason: error.message };
    await persist();
    throw error;
  }
  // A confirmed Telegram receipt remains confirmed even if Git persistence fails.
  // The remote reservation still blocks sending again until it is reconciled.
  await persist();
  return { published: true, title: p.title, url: history.items[p.itemId].url };
}
