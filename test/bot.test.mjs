import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { validateCatalog, chooseNext, publishOnce, curatedProductStatus } from '../core.mjs';
import { createTelegram } from '../telegram.mjs';

const read = async name => JSON.parse((await fs.readFile(new URL('../' + name, import.meta.url), 'utf8')).replace(/^\uFEFF/, ''));
const base = await read('config.json'), catalog = await read('catalogo.json');
const live = () => ({ ...structuredClone(base), catalogMode: 'curated', cloudEnabled: true, botAccessApproved: true, githubFreeQuotaConfirmed: true, amazonChannelRegistered: true, channel: { name: 'Respawn Ofertas', visibility: 'public', url: 'https://t.me/respawnofertas', id: -1001234567890 }, bot: { id: 123456789, username: 'respawn_test_bot' } });
const receipt = (c, text) => ({ message_id: 123, chat: { type: 'channel', id: c.channel.id }, text });
const provider = (c, send) => ({ verify: async () => {}, send: send ?? (async text => receipt(c, text)) });
const token = '123456789:UNIT_TEST_TOKEN_NO_REAL_CREDENTIAL';

test('links inteiros de afiliado preservados e sem duplicatas', () => {
  assert.equal(validateCatalog(base, catalog).amazon, 12);
  const changed = structuredClone(catalog);
  changed.products[0].offerLink = changed.products[0].offerLink.replace('linkCode=ll2', 'linkCode=other');
  assert.throws(() => validateCatalog(base, changed));
});
test('publicação permanece desativada até configurar', async () => {
  for (const gate of ['cloudEnabled', 'botAccessApproved', 'githubFreeQuotaConfirmed']) {
    const c = live(); c[gate] = false; let sends = 0;
    await assert.rejects(publishOnce({ config: c, catalog, history: { items: {} }, provider: provider(c, async () => sends++), persist: async () => {} }));
    assert.equal(sends, 0, gate + ' precisa impedir envio');
  }
});
test('Amazon bloqueada enquanto novo canal não for cadastrado', async () => {
  const c = live(); c.amazonChannelRegistered = false; let sends = 0;
  await assert.rejects(publishOnce({ config: c, catalog, history: { items: {} }, provider: provider(c, async () => sends++), persist: async () => {} }));
  assert.equal(sends, 0);
});

test('catálogo exige fonte, modelo e data válidos sem publicar preço ou desconto', async () => {
  const c = live(), now = new Date('2026-10-05T12:00:00Z');
  for (const p of catalog.products) assert.equal(curatedProductStatus(c, p, now).ready, true, p.title);
  for (const change of [{ trackingVerified: false }, { checkedOn: '2026-08-01' }, { checkedOn: '2026-11-01' }, { sourceName: 'Outro produto' }, { text: catalog.products[0].text + '\nR$ 100' }]) {
    const changed = structuredClone(catalog); Object.assign(changed.products[0], change); let sends = 0;
    assert.equal(curatedProductStatus(c, changed.products[0], now).ready, false);
    const result = await publishOnce({ config: c, catalog: changed, history: { items: {} }, provider: provider(c, async () => sends++), persist: async () => {}, now });
    assert.equal(result.published, false); assert.equal(sends, 0);
  }
});
test('dia local correto na virada de UTC', () => {
  assert.equal(chooseNext(base, catalog, { items: { a: { status: 'publicado', confirmedAt: '2026-10-05T00:30:00Z' } } }, new Date('2026-10-05T01:00:00Z')).blocked, true);
});
test('falha na persistência anterior impede o envio', async () => {
  const c = live(); let sends = 0;
  await assert.rejects(publishOnce({ config: c, catalog, history: { items: {} }, provider: provider(c, async () => sends++), persist: async () => { throw new Error('Storage failed'); } }));
  assert.equal(sends, 0);
});
test('resposta exata confirma um envio e bloqueia outro no dia', async () => {
  const c = live(), history = { items: {} }; let sends = 0;
  const p = provider(c, async text => { sends++; return receipt(c, text); });
  const args = { config: c, catalog, history, provider: p, persist: async () => {} };
  assert.equal((await publishOnce(args)).published, true);
  assert.equal((await publishOnce(args)).published, false);
  assert.equal(sends, 1);
  assert.match(history.items[catalog.products[0].itemId].url, /^https:\/\/t.me\/respawnofertas\/123$/);
});
test('resposta perdida não causa repetição', async () => {
  const c = live(), history = { items: {} }; let sends = 0;
  const args = { config: c, catalog, history, provider: provider(c, async () => { sends++; throw new Error('Timeout'); }), persist: async () => {} };
  await assert.rejects(publishOnce(args));
  assert.equal((await publishOnce(args)).published, false);
  assert.equal(sends, 1);
});
test('resposta de outro canal não confirma', async () => {
  const c = live(), history = { items: {} };
  await assert.rejects(publishOnce({ config: c, catalog, history, provider: provider(c, async text => ({ ...receipt(c, text), chat: { id: 55, type: 'private' } })), persist: async () => {} }));
  assert.equal(history.items[catalog.products[0].itemId].status, 'confirmacao_pendente');
});

function mockApi(c, mutate = result => result) {
  const calls = [];
  const fetchMock = async (url, options) => {
    const method = url.split('/').pop(), body = JSON.parse(options.body); calls.push({ method, body });
    let result;
    if (method === 'getMe') result = { ...c.bot, is_bot: true };
    if (method === 'getChat') result = { id: c.channel.id, title: c.channel.name, username: 'respawnofertas', type: 'channel' };
    if (method === 'getChatMember') result = { user: { id: c.bot.id }, status: 'administrator', can_post_messages: true };
    if (method === 'sendMessage') result = receipt(c, body.text);
    return { ok: true, status: 200, json: async () => ({ ok: true, result: mutate(result, method) }) };
  };
  return { calls, fetchMock };
}
test('integração só chama identidade, canal, permissão e envio', async () => {
  const c = live(), mock = mockApi(c), api = createTelegram(c, token, mock.fetchMock);
  await api.verify(); await api.send('teste');
  assert.deepEqual(mock.calls.map(x => x.method), ['getMe', 'getChat', 'getChatMember', 'sendMessage']);
  assert.equal(mock.calls.at(-1).body.chat_id, c.channel.id);
  assert.equal(mock.calls.at(-1).body.allow_paid_broadcast, false);
});
test('chat pessoal é recusado antes de publicar', async () => {
  const c = live(), mock = mockApi(c, (r, method) => method === 'getChat' ? { ...r, type: 'private' } : r);
  await assert.rejects(createTelegram(c, token, mock.fetchMock).verify());
  assert.equal(mock.calls.some(x => x.method === 'sendMessage'), false);
});
test('sem permissão de postar a verificação falha', async () => {
  const c = live(), mock = mockApi(c, (r, method) => method === 'getChatMember' ? { ...r, can_post_messages: false } : r);
  await assert.rejects(createTelegram(c, token, mock.fetchMock).verify());
});
test('erro de rede não divulga token nem URL autenticada', async () => {
  const api = createTelegram(live(), token, async url => { throw new Error(url); });
  await assert.rejects(api.verify(), error => !error.message.includes(token) && !error.message.includes('api.telegram.org/bot'));
});

test('canal privado usa ID fixado e gera link de mensagem para membros', async () => {
  const c = live(); c.channel.visibility = 'private'; c.channel.url = null;
  const mock = mockApi(c), api = createTelegram(c, token, mock.fetchMock);
  await api.verify();
  assert.equal(mock.calls.find(x => x.method === 'getChat').body.chat_id, c.channel.id);
  const history = { items: {} };
  const result = await publishOnce({ config: c, catalog, history, provider: api, persist: async () => {} });
  assert.equal(result.url, 'https://t.me/c/1234567890/123');
});

test('convite privado sem ID não permite verificar nem publicar', async () => {
  const c = live(); c.channel.visibility = 'private'; c.channel.id = null; let sends = 0;
  await assert.rejects(publishOnce({ config: c, catalog, history: { items: {} }, provider: provider(c, async () => sends++), persist: async () => {} }));
  assert.equal(sends, 0);
});

test('descoberta de canal filtra eventos e nunca seleciona destino ou expõe mensagens', async () => {
  const c = live(); c.channel.visibility = 'private'; c.channel.id = null;
  const calls = [], events = [
    { message: { text: 'PRIVATE_CONTENT_FIXTURE', chat: { type: 'private' } } },
    { my_chat_member: { chat: { id: -1005555555555, type: 'channel', title: 'Other channel' }, new_chat_member: { user: { id: c.bot.id }, status: 'administrator', can_post_messages: true } } },
    { my_chat_member: { chat: { id: -1001234567890, type: 'channel', title: c.channel.name }, new_chat_member: { user: { id: c.bot.id }, status: 'administrator', can_post_messages: true } } }
  ];
  const api = createTelegram(c, token, async (url, options) => {
    const method = url.split('/').pop(); calls.push({ method, body: JSON.parse(options.body) });
    return { ok: true, status: 200, json: async () => ({ ok: true, result: method === 'getMe' ? { ...c.bot, is_bot: true } : events }) };
  });
  const result = await api.discover();
  assert.deepEqual(result.candidates, [{ id: -1001234567890, name: c.channel.name }]);
  assert.deepEqual(calls[1].body.allowed_updates, ['my_chat_member']);
  assert.equal(JSON.stringify(result).includes('PRIVATE_CONTENT_FIXTURE'), false);
  assert.equal(c.channel.id, null);
  assert.equal(result.published, false);
  assert.equal(calls.some(x => x.method === 'sendMessage'), false);
});
