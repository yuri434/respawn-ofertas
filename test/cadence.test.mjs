import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chooseNext, validateCatalog } from '../core.mjs';
import { discoverCatalog } from '../shopee.mjs';
const config = JSON.parse(await fs.readFile(new URL('../config.json',import.meta.url),'utf8'));
const empty = {products:[]};
const posted = (at,id='known') => ({items:{[id]:{status:'publicado',confirmedAt:at}}});

test('cadência de cinco minutos impede dois envios na mesma janela e aceita a próxima',()=>{
  const h=posted('2026-10-06T22:15:02Z');
  assert.equal(chooseNext(config,empty,h,new Date('2026-10-06T22:19:59Z')).blocked,true);
  assert.equal(chooseNext(config,empty,h,new Date('2026-10-06T22:20:01Z')).blocked,false);
  assert.equal(chooseNext(config,empty,posted('2026-10-06T22:19:00Z'),new Date('2026-10-06T22:20:01Z')).blocked,true);
  for(const change of [{postingIntervalMinutes:0},{postingIntervalMinutes:1},{maxPerDay:289},{minIntervalMinutes:0},{maxPerDay:NaN}]) assert.throws(()=>validateCatalog({...config,...change},empty));
});

test('cadência mantém teto diário, bloqueio de envio ambíguo e histórico na virada local',()=>{
  const items=Object.fromEntries(Array.from({length:288},(_,i)=>[String(i),{status:'publicado',confirmedAt:'2026-10-06T22:00:00Z'}]));
  assert.equal(chooseNext(config,empty,{items},new Date('2026-10-07T02:59:00Z')).blocked,true);
  assert.equal(chooseNext(config,empty,{items},new Date('2026-10-07T03:00:00Z')).blocked,false);
  const candidate={itemId:'known'};
  assert.equal(chooseNext(config,{products:[candidate]},posted('2026-10-06T22:00:00Z'),new Date('2026-10-07T03:00:00Z')).product,null);
  assert.equal(chooseNext(config,empty,{items:{x:{status:'confirmacao_pendente'}}},new Date('2026-10-07T03:00:00Z')).blocked,true);
});

test('novas buscas alternam categorias a cada cinco minutos e têm limite de quatro consultas',async()=>{
  const first=[],second=[];
  await discoverCatalog({search:async term=>{first.push(term);return[];}},{items:{}},new Date('2026-10-06T22:15:00Z'));
  await discoverCatalog({search:async term=>{second.push(term);return[];}},{items:{}},new Date('2026-10-06T22:20:00Z'));
  assert.equal(first.length,4);assert.equal(second.length,4);
  assert.equal(second[0],first[1]);assert.notEqual(second[0],first[0]);
});
