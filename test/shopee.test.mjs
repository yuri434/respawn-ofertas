import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createShopee, productFromNode, discoverCatalog, brlCents, endpoint, terms } from '../shopee.mjs';
import { offerStatus } from '../offers.mjs';
import { validateCatalog, publishOnce } from '../core.mjs';
const now = new Date('2026-10-06T22:00:00Z');
const node = () => ({itemId:8746727497,shopId:428062352,productName:'Mouse gamer Redragon Cobra M711',imageUrl:'https://down-aka-br.img.susercontent.com/br-exact.webp',productLink:'https://shopee.com.br/product/428062352/8746727497',offerLink:'https://s.shopee.com.br/UNIT_TEST_ONLY',priceMin:'169.99',priceMax:'199.99',periodStartTime:Math.floor(+now/1000)-3600,periodEndTime:Math.floor(+now/1000)+3600});
const config = JSON.parse(await fs.readFile(new URL('../config.json',import.meta.url),'utf8'));
test('API assina o corpo realmente enviado, usa só endpoint oficial e oculta erros sensíveis', async()=>{
  const appId='123456',secret='FAKE_TEST_SECRET',calls=[];
  const api=createShopee(appId,secret,async(url,opts)=>{calls.push({url,opts});return{ok:true,status:200,json:async()=>({data:{productOfferV2:{nodes:[node()]}}})};},()=>now);
  assert.equal((await api.search('mouse gamer')).length,1);
  const {url,opts}=calls[0]; assert.equal(url,endpoint);assert.equal(opts.redirect,'error');
  const timestamp=Math.floor(+now/1000);
  assert.equal(opts.headers.Authorization,`SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${createHash('sha256').update(appId+timestamp+opts.body+secret).digest('hex')}`);
  const body=JSON.parse(opts.body);assert.match(body.query,/productOfferV2\(keyword:"mouse gamer"/);assert.match(body.query,/offerLink/);
  await assert.rejects(api.search('fora da lista')); assert.equal(calls.length,1);
  for (const fetcher of [async()=>{throw new Error(secret);},async()=>({ok:true,status:200,json:async()=>({errors:[{message:secret,extensions:{code:10020}}]})})]) {
    await assert.rejects(createShopee(appId,secret,fetcher).search('mouse gamer'),e=>!e.message.includes(secret));
  }
  assert.throws(()=>createShopee(appId,''));
});
test('dados API exigem modelo pertinente, anúncio exato, preço válido, foto oficial e oferta vigente',()=>{
  const p=productFromNode(node(),5,now);assert.ok(p);assert.equal(offerStatus(p,now).ready,true);assert.equal(p.offerLink,node().offerLink);assert.equal(p.offer.coupon,null);
  assert.match(p.text,/Preço mínimo/);assert.match(p.text,/varia conforme a opção/);assert.doesNotMatch(p.text,/Cupom:/);
  for(const change of [{productName:'Capa mouse gamer'},{productName:'Mouse gamer usado'},{productName:'Bicicleta'},{productLink:'https://shopee.com.br/product/1/2'},{imageUrl:'https://example.com/fake.jpg'},{offerLink:'https://evil.example/tracking'},{priceMin:'NaN'},{priceMin:'0'},{priceMax:'0.01'},{periodEndTime:0},{periodStartTime:Math.floor(+now/1000)+50},{itemId:Infinity}]) assert.equal(productFromNode({...node(),...change},5,now),null,JSON.stringify(change));
  assert.equal(offerStatus(p,new Date(+now+3600000)).ready,false);
  assert.equal(brlCents('10.01'),1001);assert.equal(brlCents('10'),1000);assert.equal(brlCents('0.001'),null);
});
test('busca limitada deduplica IDs e links e nunca retorna produto publicado ou pendente',async()=>{
  const queried=[];const names=['Processador AMD Ryzen 5','Processador Intel Core i5','Placa de video RTX 4060','Memoria DDR4','Memoria DDR5','Mouse gamer','Teclado gamer','Mousepad gamer','Jogo PS5'];
  const api={search:async keyword=>{queried.push(keyword);const n={...node(),productName:names[terms.indexOf(keyword)]};return[n,n,{...n,itemId:55,productLink:'https://shopee.com.br/product/428062352/55'}];}};
  const catalog=await discoverCatalog(api,{items:{}},now);assert.equal(catalog.products.length,1);assert.ok(queried.length<=2);
  assert.equal((await discoverCatalog(api,{items:{'shopee:8746727497':{status:'publicado',link:node().offerLink}}},now)).products.length,0);
  assert.equal((await discoverCatalog(api,{items:{'shopee:8746727497':{status:'confirmacao_pendente'}}},now)).products.some(p=>p.itemId==='shopee:8746727497'),false);
});
test('produto oficial envia foto, mantém rastreamento e respeita reserva persistida e limite diário',async()=>{
  const p=productFromNode(node(),5,now), catalog={products:[p]}, history={items:{}};const c={...config,catalogMode:'verified_offer'};let sends=0,reserved=false;
  validateCatalog(c,catalog);
  const provider={verify:async()=>{},sendPhoto:async(photo,caption)=>{assert.equal(reserved,true);assert.equal(photo,p.offer.image.url);assert.ok(caption.includes(p.offerLink));sends++;return{message_id:9,chat:{type:'channel',id:c.channel.id},caption,photo:[{file_id:'fixture'}]};}};
  const args={config:c,catalog,history,provider,persist:async()=>{reserved=history.items[p.itemId]?.status==='enviando';},now};
  assert.equal((await publishOnce(args)).published,true);assert.equal((await publishOnce(args)).published,false);assert.equal(sends,1);
});
