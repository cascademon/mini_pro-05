import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { transform } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true,alert:()=>{},fetch:async()=>{throw Error('Live API disabled');}});
const React=await import('react');
const {act}=React;
const {createRoot}=await import('react-dom/client');
await mkdir('tests/.compiled',{recursive:true});
for(const [name,path] of [['AuthContext','src/context/AuthContext.jsx'],['ReadingGoalContext','src/context/ReadingGoalContext.jsx']]){
  const source=(await readFile(path,'utf8')).replace(/import ['"][^'"]+\.css['"];?/g,'').replace("from './AuthContext'","from './AuthContext.mjs'");
  const result=await transform(source,{loader:'jsx',jsx:'automatic',format:'esm'});
  await writeFile(`tests/.compiled/${name}.mjs`,result.code);
}
const {AuthProvider,useAuth}=await import('./.compiled/AuthContext.mjs');
const {ReadingGoalProvider,useReadingGoal}=await import('./.compiled/ReadingGoalContext.mjs');
const {useEphemeralApiKey}=await import('../src/hooks/useEphemeralApiKey.js');
after(()=>dom.window.close());
test('API keys are memory-only and cleared after remount', async()=>{
  localStorage.clear();
  localStorage.setItem('openaiApiKey','dummy-legacy-key');
  localStorage.setItem('darkMode','true');
  let key, setKey;
  function Probe(){[key,setKey]=useEphemeralApiKey(); return null;}
  let root=createRoot(document.getElementById('root'));
  await act(async()=>root.render(React.createElement(Probe)));
  assert.equal(key,'');
  assert.equal(localStorage.getItem('openaiApiKey'),null);
  assert.equal(localStorage.getItem('darkMode'),'true');
  await act(async()=>setKey('dummy-entered-key'));
  assert.equal(key,'dummy-entered-key');
  assert.equal(localStorage.getItem('openaiApiKey'),null);
  assert.equal(window.sessionStorage.getItem('openaiApiKey'),null);
  await act(async()=>root.unmount());
  root=createRoot(document.getElementById('root'));
  await act(async()=>root.render(React.createElement(Probe)));
  assert.equal(key,'');
  await act(async()=>root.unmount());
});
test('disabled browser storage does not break API key input', async()=>{
  const original=window.Storage.prototype.removeItem;
  window.Storage.prototype.removeItem=()=>{throw new Error('Storage disabled');};
  let key,setKey;
  function Probe(){[key,setKey]=useEphemeralApiKey();return null;}
  const root=createRoot(document.getElementById('root'));
  try {
    await act(async()=>root.render(React.createElement(Probe)));
    await act(async()=>setKey('dummy-only'));
    assert.equal(key,'dummy-only');
  } finally {
    await act(async()=>root.unmount());
    window.Storage.prototype.removeItem=original;
  }
});
test('all API key screens use the ephemeral hook and never persist the key',async()=>{
  for(const path of ['src/components/BookForm.jsx','src/pages/AiCoverGeneratePage.jsx','src/pages/BookDetailPage.jsx']){
    const source=await readFile(path,'utf8');
    assert.match(source,/= useEphemeralApiKey\(\)/);
    assert.doesNotMatch(source,/openaiApiKey/);
  }
  assert.doesNotMatch(await readFile('src/components/BookDetailSidePanel.jsx','utf8'),/openaiApiKey/);
});
test('account switching isolates goals and preserves the old shared data',async()=>{
  localStorage.clear(); localStorage.setItem('readingGoals','[{"id":"legacy"}]');
  let auth,goal;
  function Probe(){auth=useAuth();goal=useReadingGoal();return null;}
  const root=createRoot(document.getElementById('root'));
  await act(async()=>root.render(React.createElement(AuthProvider,null,React.createElement(ReadingGoalProvider,null,React.createElement(Probe)))));
  await act(async()=>auth.login({id:1}));
  await act(async()=>goal.createGoal({name:'A',goalCount:2}));
  await act(async()=>auth.login({id:2})); assert.equal(goal.goals.length,0);
  await act(async()=>goal.createGoal({name:'B',goalCount:3}));
  await act(async()=>auth.login({id:1})); assert.equal(goal.goals[0].name,'A');
  assert.equal(localStorage.getItem('readingGoals'),'[{"id":"legacy"}]');
  await act(async()=>auth.logout()); assert.equal(goal.goals.length,0);
  await act(async()=>root.unmount());
});
