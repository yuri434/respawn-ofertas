import { createHash } from 'node:crypto';
import { offerCaption, offerStatus } from './offers.mjs';

export const endpoint = 'https://open-api.affiliate.shopee.com.br/graphql';
export const terms = ['processador ryzen', 'processador intel', 'placa de video', 'memoria ddr4', 'memoria ddr5', 'mouse gamer', 'teclado gamer', 'mousepad gamer', 'jogo ps5', 'cooler processador', 'smartphone samsung', 'smartphone motorola', 'smartphone xiaomi', 'iphone', 'notebook gamer', 'pc gamer', 'monitor gamer', 'cadeira gamer', 'console ps5', 'console xbox', 'nintendo switch', 'jogo xbox', 'jogo nintendo switch', 'ssd nvme', 'headset gamer', 'controle gamer', 'placa mae', 'fonte pc', 'gabinete gamer', 'microfone gamer'];
const clean = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const matchers = [/\bryzen\b/, /\bintel\b.*\b(i[3579]|core)\b|\bcore\b.*\bintel\b/, /\b(rtx|gtx|radeon|rx\s*\d|arc\s*[ab]\d)/, /\bddr4\b/, /\bddr5\b/, /\bmouse\b/, /\bteclado\b/, /\bmouse\s*pad\b|\bmousepad\b/, /\b(jogo|game)\b.*\bps5\b|\bps5\b.*\b(jogo|game)\b/, /\bcooler\b/, /\bsamsung\b/, /\bmotorola\b|\bmoto\b/, /\bxiaomi\b|\bredmi\b|\bpoco\b/, /\biphone\s*\d/, /\b(notebook|laptop)\b/, /\b(pc|computador|desktop)\b/, /\bmonitor\b/, /\bcadeira\b/, /\b(ps5|playstation 5)\b/, /\bxbox\b/, /\bnintendo\b.*\bswitch\b/, /\b(jogo|game)\b.*\bxbox\b|\bxbox\b.*\b(jogo|game)\b/, /\b(jogo|game)\b.*\bswitch\b|\bswitch\b.*\b(jogo|game)\b/, /\b(ssd|nvme)\b/, /\b(headset|fone)\b/, /\b(controle|joystick|gamepad)\b/, /\bplaca\s*mae\b/, /\bfonte\b/, /\bgabinete\b/, /\bmicrofone\b/];
const reject = /\b(defeito|quebrado|usado|segunda mao|recondicionado|seminovo|caixa vazia|somente caixa|miniatura|chaveiro|skin|adesivo|suporte|capa|case|reparo|pelicula|bateria|carregador|touch|display)\b/;
export function brlCents(value) {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(value))) return null;
  const [whole, fractional = ''] = String(value).split('.');
  const cents = Number(BigInt(whole) * 100n + BigInt(fractional.padEnd(2, '0')));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
function allowedUrl(value, hosts) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.port && hosts.some(h=>u.hostname === h || (h.startsWith('.') && u.hostname.endsWith(h))); }
  catch { return false; }
}

// SHA256(AppId + timestamp + exact JSON payload + secret), per official documentation.
export function authorization(appId, secret, payload, timestamp) {
  const signature = createHash('sha256').update(appId + timestamp + payload + secret).digest('hex');
  return `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`;
}
export function createShopee(appId, secret, fetchImpl = fetch, clock = () => new Date()) {
  if (!/^\d{1,30}$/.test(appId ?? '') || !secret || secret.trim() !== secret || /\s/.test(secret)) throw new Error('Configure SHOPEE_APP_ID e SHOPEE_API_SECRET nos Secrets do GitHub; não envie as chaves no chat.');
  return {
    async search(keyword) {
      if (!terms.includes(keyword)) throw new Error('Busca fora das categorias autorizadas.');
      const payload = JSON.stringify({ query: `{productOfferV2(keyword:${JSON.stringify(keyword)},sortType:1,page:1,limit:20){nodes{itemId shopId productName imageUrl productLink offerLink priceMin priceMax ratingStar sales shopType periodStartTime periodEndTime} pageInfo{hasNextPage}}}` });
      const timestamp = String(Math.floor(clock().getTime() / 1000));
      let response, data;
      try {
        response = await fetchImpl(endpoint, { method: 'POST', redirect: 'error', headers: { 'Content-Type':'application/json', Authorization: authorization(appId,secret,payload,timestamp) }, body:payload, signal:AbortSignal.timeout(20000) });
        data = await response.json();
      } catch { throw new Error('Falha de comunicação com a API oficial Shopee. Nenhuma credencial será exibida.'); }
      if (!response.ok || data.errors?.length) {
        const code = Number(data.errors?.[0]?.extensions?.code);
        throw new Error('Shopee recusou a consulta (código ' + (Number.isFinite(code) ? code : response.status) + ').');
      }
      if (!Array.isArray(data.data?.productOfferV2?.nodes)) throw new Error('Resposta Shopee sem lista de produtos válida.');
      return data.data.productOfferV2.nodes;
    }
  };
}

export function productFromNode(node, termIndex, now = new Date()) {
  const title = typeof node.productName === 'string' ? node.productName.trim() : '';
  if (!title || title.length > 200 || /[\n\r\u0000-\u001f]/.test(title) || !matchers[termIndex]?.test(clean(title)) || reject.test(clean(title))) return null;
  if (termIndex >= 10 && termIndex <= 12 && !/\b(smartphone|celular|telefone)\b/.test(clean(title))) return null;
  if ([18,19,20].includes(termIndex) && /\b(jogo|game|controle|joystick|acessorio|cabo)\b/.test(clean(title))) return null;
  const rating = Number(node.ratingStar);
  if (!Number.isFinite(rating) || rating < 4.5 || rating > 5 || !Number.isSafeInteger(node.sales) || node.sales < 10 || !Array.isArray(node.shopType) || !node.shopType.some(t=>[1,2,4].includes(t))) return null;
  if (!Number.isSafeInteger(node.itemId) || node.itemId <= 0 || !Number.isSafeInteger(node.shopId) || node.shopId <= 0) return null;
  const id = 'shopee:' + node.itemId, min = brlCents(node.priceMin), max = brlCents(node.priceMax);
  if (!min || !max || max < min) return null;
  if (!allowedUrl(node.productLink,['shopee.com.br','www.shopee.com.br']) || !allowedUrl(node.offerLink,['s.shopee.com.br','shope.ee']) || !allowedUrl(node.imageUrl,['cf.shopee.com.br','.img.susercontent.com','.img.shopee.com.br'])) return null;
  const path = new URL(node.productLink).pathname;
  if (path !== `/product/${node.shopId}/${node.itemId}` && !path.endsWith(`-i.${node.shopId}.${node.itemId}`)) return null;
  const sec = Math.floor(now.getTime()/1000);
  if (!Number.isSafeInteger(node.periodStartTime) || !Number.isSafeInteger(node.periodEndTime) || node.periodStartTime > sec || node.periodEndTime <= sec) return null;
  const checkedAt = now.toISOString();
  const p = { itemId:id, title, retailer:'Shopee', offerLink:node.offerLink, originalLinkHash:createHash('sha256').update(node.offerLink).digest('hex'), trackingVerified:true, qualitySignals:{rating,sales:node.sales,shopType:node.shopType},
    offer:{ itemId:id, verified:true, sourceUrl:node.productLink, dataProvider:'Shopee Affiliate Open API', checkedAt, expiresAt:new Date(node.periodEndTime*1000).toISOString(),
      image:{url:node.imageUrl,itemId:id,checkedAt,telegramUseAllowed:true,authorizationSourceUrl:'https://affiliate.shopee.com.br/open_api/list?type=product_offer'},
      price:{currency:'BRL',cents:min,verified:true,sourceUrl:node.productLink,conditions:min === max ? 'Preço informado pela API Shopee. Confira frete e preço final no anúncio.' : 'Preço mínimo informado pela API Shopee; varia conforme a opção. Confira o modelo, frete e preço final no anúncio.'},
      coupon:null }
  };
  p.text = offerCaption(p);
  return offerStatus(p,now).ready ? p : null;
}

export async function discoverCatalog(api, history, now = new Date(), onQuery = () => {}) {
  const day = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(now);
  const start = Math.floor(Date.parse(day+'T00:00:00Z')/86400000) % terms.length;
  const products = [], seen = new Set(), seenLinks = new Set(Object.values(history.items).filter(i=>i.status==='publicado').map(i=>i.link));
  for (let offset=0;offset<2;offset++) {
    const index = (start+offset)%terms.length;
    const nodes = await api.search(terms[index]);
    onQuery({keyword:terms[index],returned:nodes.length,sample:nodes.slice(0,3)});
    for (const node of nodes) {
      const p = productFromNode(node,index,now);
      if (!p || seen.has(p.itemId) || seenLinks.has(p.offerLink) || ['publicado','enviando','confirmacao_pendente'].includes(history.items[p.itemId]?.status)) continue;
      seen.add(p.itemId); seenLinks.add(p.offerLink); products.push(p);
      if (products.length >= 3) return { products };
    }
  }
  return { products };
}
