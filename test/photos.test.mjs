import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { curatedPhotoStatus } from '../photos.mjs';
import { publishOnce, disclosure, linkHash } from '../core.mjs';
import { createTelegram } from '../telegram.mjs';

const read = async name => JSON.parse(await fs.readFile(name, 'utf8'));
const now = new Date('2026-10-06T22:17:00Z');
async function fixture() {
  const config = { ...await read('config.json'), cloudEnabled: true, catalogMode: 'curated_photo' };
  const bytes = await fs.readFile('imagens/redragon-cobra-m711-v3.jpg');
  const p = { itemId: 'TEST_PHOTO', retailer: 'Shopee', title: 'Mouse de teste', sourceName: 'Mouse de teste', identityTokens: ['mouse'], trackingVerified: true, offerLink: 'https://s.shopee.com.br/UNIT_TEST_ONLY', text: 'Mouse de teste\nConfira as opções no anúncio.\nhttps://s.shopee.com.br/UNIT_TEST_ONLY\n'+disclosure, photo: { itemId: 'TEST_PHOTO', path: 'imagens/redragon-cobra-m711-v3.jpg', sha256: createHash('sha256').update(bytes).digest('hex'), checkedAt: '2026-10-05T22:00:00Z', telegramUseAllowed: true, authorizationSourceUrl: 'https://affiliate.shopee.com.br/offer/product_offer/TEST_PHOTO' } };
  p.originalLinkHash = linkHash(p.offerLink);
  return { config, product: p, catalog: { products: [p] } };
}

test('fila de fotos bloqueia item divergente, imagem vencida, preço e cupom', async () => {
  for (const change of [p=>p.photo.itemId='other', p=>p.photo.checkedAt='2026-09-01T00:00:00Z', p=>p.photo.telegramUseAllowed=false, p=>p.photo.path='../secret.jpg', p=>p.sourceName='Outro item', p=>p.text+='\nR$ 100', p=>p.text+='\nCupom: TEST', p=>p.offer={price:100}]) {
    const {config,product,catalog}=await fixture(); change(product); let calls=0;
    assert.equal(curatedPhotoStatus(product,now).ready,false);
    const result=await publishOnce({config,catalog,history:{items:{}},now,persist:async()=>{},provider:{verify:async()=>calls++,sendLocalPhoto:async()=>calls++}});
    assert.equal(result.published,false); assert.equal(calls,0);
  }
});

test('foto local mantém link, reserva histórico e impede duplicata e segundo post no dia', async () => {
  const {config,catalog,product}=await fixture(),history={items:{}};let sends=0;
  const provider={verify:async()=>{},sendLocalPhoto:async(photo,text)=>{sends++; assert.equal(history.items[product.itemId].status,'enviando');assert.ok(text.includes(product.offerLink));return {message_id:8,caption:text,photo:[{file_id:'TEST_ONLY'}],chat:{id:config.channel.id,type:'channel'}}}};
  const args={config,catalog,history,now,persist:async()=>{},provider};
  assert.equal((await publishOnce(args)).published,true);
  assert.equal((await publishOnce(args)).published,false);
  assert.equal((await publishOnce({...args,now:new Date('2026-10-07T22:17:00Z')})).published,false);
  assert.equal(sends,1);
});

test('arquivo alterado bloqueia antes de reservar ou chamar o Telegram', async () => {
  const {config,catalog,product}=await fixture(),history={items:{}};product.photo.sha256='0'.repeat(64);let calls=0;
  await assert.rejects(publishOnce({config,catalog,history,now,persist:async()=>calls++,provider:{verify:async()=>calls++,sendLocalPhoto:async()=>calls++}}));
  assert.equal(calls,0);assert.deepEqual(history.items,{});
});

test('upload multipart envia JPEG, legenda e canal fixo sem opção paga', async () => {
  const {config,product}=await fixture();let body;
  const api=createTelegram(config,'123456789:UNIT_TEST_TOKEN_NO_REAL_CREDENTIAL',async(_,options)=>{body=options.body;return {ok:true,json:async()=>({ok:true,result:{message_id:8}})}});
  await api.sendLocalPhoto(product.photo,product.text);
  assert.equal(body.get('chat_id'),String(config.channel.id));assert.equal(body.get('caption'),product.text);assert.equal(body.get('allow_paid_broadcast'),'false');assert.equal(body.get('photo').type,'image/jpeg');assert.ok(body.get('photo').size>0);
});
