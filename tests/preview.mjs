import {createElement as h} from 'react';
import {createRoot} from 'react-dom/client';
import plugin from '../desktop/plugin.js';
import {fixtureMetrics} from './sdk-fixture.mjs';
const disposers=[],contributions=[];
const ctx={registerMany:items=>contributions.push(...items),registerSettingsPage:()=>{},rest:async()=>({...fixtureMetrics,sampled_at:Date.now()/1000,memory:{...fixtureMetrics.memory,available_bytes:fixtureMetrics.memory.available_bytes-window.fixture.acquired*100*1048576}}),
 setInterval:fn=>{window.fixture.tick=fn;return()=>{};},onDispose:fn=>disposers.push(fn)};
plugin.register(ctx);window.fixture.dispose=()=>disposers.forEach(fn=>fn());
createRoot(document.getElementById('root')).render(h('div',null,h('div',{style:{padding:'8px 30px',background:'#3a3024',color:'#ffe1b5',font:'12px system-ui'}},'SYNTHETIC PREVIEW · no live Hermes instance'),contributions.find(c=>c.id==='page').render()));
