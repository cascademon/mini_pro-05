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
after(()=>dom.window.close());
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
