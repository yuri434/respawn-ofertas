export const disclosure = 'Publicidade | Link de afiliado: posso receber comissão pelas compras feitas por este link.';
export const amazonDisclosure = 'Como participante do Programa de Associados da Amazon, sou remunerado pelas compras qualificadas efetuadas.';

const httpsUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } };
const ageWithin = (value, now, hours) => { const age = new Date(now) - Date.parse(value); return Number.isFinite(age) && age >= 0 && age <= hours * 3600000; };

export function offerStatus(product, now = new Date()) {
  const o = product.offer;
  if (!o || o.itemId !== product.itemId || o.verified !== true || !httpsUrl(o.sourceUrl) || !ageWithin(o.checkedAt, now, 1)) return { ready: false, reason: 'Oferta do produto exato ausente ou sem conferência na última hora.' };
  if (o.dataProvider === 'Shopee Affiliate Open API' && !(Date.parse(o.expiresAt) > new Date(now))) return { ready:false, reason:'Oferta Shopee encerrada.' };
  if (product.retailer === 'Amazon' && !['Creators API', 'PA API', 'Amazon Data Feed'].includes(o.dataProvider)) return { ready: false, reason: 'Preço Amazon precisa de dados autorizados do Programa de Associados.' };
  if (!httpsUrl(o.image?.url) || o.image.itemId !== product.itemId || o.image.telegramUseAllowed !== true || !httpsUrl(o.image.authorizationSourceUrl) || !ageWithin(o.image.checkedAt, now, 24)) return { ready: false, reason: 'Foto exata e autorização para divulgação no Telegram pendentes.' };
  if (o.price?.currency !== 'BRL' || !Number.isSafeInteger(o.price.cents) || o.price.cents <= 0 || o.price.verified !== true || !o.price.conditions?.trim() || !httpsUrl(o.price.sourceUrl)) return { ready: false, reason: 'Preço e condições sem confirmação na fonte da loja.' };
  if (o.coupon != null && (o.coupon.verified !== true || !/^[a-zA-Z0-9_-]{1,40}$/.test(o.coupon.code ?? '') || !o.coupon.conditions?.trim() || !httpsUrl(o.coupon.sourceUrl) || !ageWithin(o.coupon.checkedAt, now, 1) || !Number.isFinite(Date.parse(o.coupon.expiresAt)) || Date.parse(o.coupon.expiresAt) <= new Date(now))) return { ready: false, reason: 'Cupom sem validade ou condições verificadas para este produto.' };
  return { ready: true };
}

export function offerCaption(product) {
  const o = product.offer;
  const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.price.cents / 100);
  const checked = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(o.checkedAt));
  const parts = ['🎮 ' + product.title, '💰 Valor: ' + price + '\n' + o.price.conditions.trim()];
  if (o.coupon) parts.push('🎟 Cupom: ' + o.coupon.code + '\n' + o.coupon.conditions.trim());
  parts.push('👉 Comprar: ' + product.offerLink, 'Conferido em ' + checked + ' (São Paulo). Preço e disponibilidade podem mudar.', disclosure);
  if (product.retailer === 'Amazon') parts.push(amazonDisclosure);
  const caption = parts.join('\n\n');
  if ([...caption].length > 1024) throw new Error('Legenda excede o limite de foto do Telegram; resumir sem remover as condições ou o link.');
  return caption;
}
