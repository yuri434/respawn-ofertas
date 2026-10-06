import { disclosure } from './offers.mjs';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function checkedPhotoBytes(photo) {
  if (!/^imagens\/[a-z0-9-]+\.jpg$/.test(photo?.path ?? '')) throw new Error('Caminho de foto não autorizado.');
  const bytes = await fs.readFile(photo.path);
  if (bytes.length > 10000000 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || createHash('sha256').update(bytes).digest('hex') !== photo.sha256) throw new Error('Arquivo da foto diferente do conferido.');
  return bytes;
}

export function curatedPhotoStatus(product, now = new Date()) {
  const photo = product.photo;
  const age = new Date(now) - Date.parse(photo?.checkedAt);
  const normalize = v => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (product.retailer !== 'Shopee' || product.trackingVerified !== true || !product.sourceName || !product.identityTokens?.length || !product.identityTokens.every(t => normalize(product.sourceName).includes(normalize(t)))) return { ready: false, reason: 'Identidade ou link do produto sem conferência.' };
  if (!photo || photo.itemId !== product.itemId || photo.telegramUseAllowed !== true || !/^imagens\/[a-z0-9-]+\.jpg$/.test(photo.path ?? '') || !/^[a-f0-9]{64}$/.test(photo.sha256 ?? '') || !photo.authorizationSourceUrl?.startsWith('https://affiliate.shopee.com.br/offer/product_offer/') || !Number.isFinite(age) || age < 0 || age > 7 * 86400000) return { ready: false, reason: 'Foto exata e material de divulgação precisam de nova conferência.' };
  if (product.offer || /R\$|\d\s*%|\bcupom\s*:|\bdesconto\s*(de|:)/i.test(product.text.replaceAll(product.offerLink, ''))) return { ready: false, reason: 'Fila provisória não anuncia preço, cupom ou desconto.' };
  if (!product.text.includes(disclosure) || [...product.text].length > 1024) return { ready: false, reason: 'Legenda de foto incompleta ou longa.' };
  return { ready: true, sourceMode: 'Foto e link conferidos; preço, disponibilidade e cupons no anúncio.' };
}
