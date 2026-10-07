import test from 'node:test';
import assert from 'node:assert/strict';
import { saveGitHistory } from '../history-store.mjs';

test('failed push retries the same commit without recommitting', async () => {
  const calls = []; let pushes = 0;
  await saveGitHistory({run: args => {
    calls.push(args);
    if (args[0] === 'diff') throw {status:1};
    if (args[0] === 'push' && ++pushes === 1) throw new Error('temporary');
  }, sleep:async()=>{}});
  assert.equal(pushes,2);
  assert.equal(calls.filter(a=>a[0]==='commit').length,1);
  assert.deepEqual(calls.filter(a=>a[0]==='push')[0],['push','origin','HEAD:main']);
});

test('no staged diff still pushes an already committed confirmation', async () => {
  const calls=[];
  await saveGitHistory({run:args=>calls.push(args),sleep:async()=>{}});
  assert.equal(calls.filter(a=>a[0]==='commit').length,0);
  assert.equal(calls.filter(a=>a[0]==='push').length,1);
});

test('permanent failure is bounded and does not reveal raw errors', async () => {
  let pushes=0;
  await assert.rejects(saveGitHistory({run:args=>{
    if(args[0]==='push'){pushes++;throw new Error('private-credential');}
  },sleep:async()=>{}}), error=>!error.message.includes('private-credential'));
  assert.equal(pushes,3);
});
