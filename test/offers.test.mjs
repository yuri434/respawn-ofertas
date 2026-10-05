import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { publishOnce } from '../core.mjs';
import { offerStatus, offerCaption } from '../offers.mjs';
import { createTelegram } from '../telegram.mjs';

// Todas as ofertas abaixo são fixtures sintéticas; nunca são inseridas no catálogo real.
const read = async name => JSON.parse((await fs.readFile(new URL('../' + name, import.meta.url), 'utf8')).replace(/^\uFEFF/, ''));
const originalConfig = await read('config.json'), originalCatalog = await read('catalogo.json');
const now = new Date('2026-10-05T12:00:00Z');
function fixture() {
  const config = { ...originalConfig, cloudEnabled: true, catalogMode: 'verified_offer' };
  const catalog = structuredClone(originalCatalog), product = catalog.products[0];
  product.offer = { itemId: product.itemId, verified: true, sourceUrl: 'https://example.com/test-offer', checkedAt: now.toISOString(), image: { itemId: product.itemId, url: 'https://example.com/test-photo.jpg', checkedAt: now.toISOString(), telegramUseAllowed: true, authorizationSourceUrl: 'https://example.com/test-authorization' }, price: { currency: 'BRL', cents: 1, verified: true, conditions: 'Condição de teste, sem oferta real.', sourceUrl: 'https://example.com/test-offer' }, coupon: null };
  return { config, catalog, product };
}

test('sem foto, autorização, oferta recente ou cupom válido não envia', async () => {
  for (const change of [p => { delete p.offer; }, p => { p.offer.image = null; }, p => { p.offer.image.telegramUseAllowed = false; }, p => { p.offer.image.itemId = 'other'; }, p => { p.offer.checkedAt = '2026-10-04T12:00:00Z'; }, p => { p.offer.price.verified = false; }, p => { p.offer.coupon = { code: 'TEST', verified: true, checkedAt: now.toISOString(), expiresAt: '2026-10-04T12:00:00Z', sourceUrl: 'https://example.com/test-coupon', conditions: 'Somente teste.' }; }]) {
    const { config, catalog, product } = fixture(); change(product); let sends = 0, verifies = 0;
    assert.equal(offerStatus(product, now).ready, false);
    const result = await publishOnce({ config, catalog, now, history: { items: {} }, persist: async () => {}, provider: { verify: async () => verifies++, sendPhoto: async () => sends++, send: async () => sends++ } });
    assert.equal(result.published, false); assert.equal(sends, 0); assert.equal(verifies, 0);
  }
});

test('foto exige legenda e destino corretos e mantém link inteiro', async () => {
  const { config, catalog, product } = fixture(), history = { items: {} }; let sends = 0;
  const caption = offerCaption(product); assert.ok(caption.includes(product.offerLink)); assert.equal(caption.includes('Cupom:'), false);
  product.offer.coupon = { code: 'TEST_ONLY', verified: true, checkedAt: now.toISOString(), expiresAt: '2026-10-05T13:00:00Z', sourceUrl: 'https://example.com/test-coupon', conditions: 'Somente fixture sintética.' };
  assert.ok(offerCaption(product).includes('TEST_ONLY\nSomente fixture sintética.'));
  const provider = { verify: async () => {}, send: async () => { throw new Error('Não pode usar texto como alternativa à foto'); }, sendPhoto: async (url, text) => { sends++; assert.equal(url, product.offer.image.url); assert.equal(history.items[product.itemId].status, 'enviando'); return { message_id: 7, chat: { id: config.channel.id, type: 'channel' }, caption: text, photo: [{ file_id: 'TEST_FILE' }] }; } };
  const args = { config, catalog, history, now, provider, persist: async () => {} };
  assert.equal((await publishOnce(args)).published, true); assert.equal((await publishOnce(args)).published, false); assert.equal(sends, 1);
});

test('resposta sem foto bloqueia repetição e legenda longa não chama API', async () => {
  const { config, catalog, product } = fixture(), history = { items: {} }; let sends = 0;
  const args = { config, catalog, history, now, persist: async () => {}, provider: { verify: async () => {}, sendPhoto: async (_, caption) => { sends++; return { message_id: 7, chat: { id: config.channel.id, type: 'channel' }, caption }; } } };
  await assert.rejects(publishOnce(args)); assert.equal(history.items[product.itemId].status, 'confirmacao_pendente'); assert.equal((await publishOnce(args)).published, false); assert.equal(sends, 1);
  product.offer.price.conditions = 'X'.repeat(1200); let verifies = 0;
  await assert.rejects(publishOnce({ ...args, history: { items: {} }, provider: { verify: async () => verifies++ } })); assert.equal(verifies, 0);
});

test('sendPhoto usa só canal fixado, URL e legenda, sem transmissão paga', async () => {
  const { config, product } = fixture(), calls = [];
  const api = createTelegram(config, '123456789:UNIT_TEST_TOKEN_NO_REAL_CREDENTIAL', async (url, options) => { calls.push({ method: url.split('/').pop(), body: JSON.parse(options.body) }); return { ok: true, status: 200, json: async () => ({ ok: true, result: { message_id: 7 } }) }; });
  await api.sendPhoto(product.offer.image.url, offerCaption(product));
  assert.equal(calls[0].method, 'sendPhoto'); assert.equal(calls[0].body.chat_id, config.channel.id); assert.equal(calls[0].body.photo, product.offer.image.url); assert.equal(calls[0].body.allow_paid_broadcast, false);
});
