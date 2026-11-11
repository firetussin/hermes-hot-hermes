import { host, useValue, ROUTES_AREA, SIDEBAR_NAV_AREA, Button } from '@hermes/plugin-sdk';
import * as SDK from '@hermes/plugin-sdk';
import { createElement as h, useState, useEffect } from 'react';

const VERSION='0.1.2';
const styles=`
.hh{--ember:#f17537;--hot:#c83520;--ember-wash:color-mix(in srgb,var(--ember) 9%,var(--ui-bg-secondary));height:100%;overflow:auto;color:var(--ui-text-primary);background:var(--ui-bg-primary);font:13px/1.45 system-ui,sans-serif;color-scheme:inherit}
.hh *{box-sizing:border-box}.hh main{max-width:1440px;margin:auto;padding:22px 26px 18px}.hh h1,.hh h2,.hh p{margin:0}.hh h1{font-size:27px;line-height:1.15;font-weight:750;letter-spacing:-1px}.hh h2{font-size:15px;font-weight:680;letter-spacing:-.25px}.hh small,.hh .muted{color:var(--ui-text-secondary)}.hh small{font-size:11px}.hh .row,.hh .controls{display:flex;align-items:center;gap:8px}.hh .row{justify-content:space-between}.hh .controls{flex-wrap:wrap}.hh .brand{display:flex;align-items:center;gap:12px}.hh .brand-mark{width:48px;height:48px;display:grid;place-items:center;flex:none;border-radius:14px;color:var(--ember);background:var(--ember-wash);border:1px solid color-mix(in srgb,var(--ember) 28%,var(--ui-stroke-secondary))}.hh .brand-mark svg{width:31px;height:36px}.hh .subtitle{margin-top:4px;color:var(--ui-text-secondary);font-size:12px}.hh .meta{text-align:right;font-size:11px;color:var(--ui-text-secondary);margin-top:6px}.hh .version{font:10px ui-monospace,monospace;color:var(--ui-text-secondary)}
.hh .gateway{display:flex;align-items:center;gap:12px;margin:17px 0 12px;padding:12px 15px;border:1px solid color-mix(in srgb,var(--ember) 24%,var(--ui-stroke-secondary));border-radius:11px;background:var(--ember-wash)}.hh .gateway-icon{font-size:22px;font-weight:750;color:var(--ember);line-height:1;min-width:28px;text-align:center}.hh .gateway strong{font-size:13px}.hh .gateway p{color:var(--ui-text-secondary);font-size:11px;margin-top:3px}.hh .gateway .tag{margin-left:auto;white-space:nowrap}.hh .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}.hh .stat{padding:12px 15px;border:1px solid var(--ui-stroke-secondary);border-radius:10px;background:var(--ui-bg-secondary);min-width:0}.hh .eyebrow{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--ui-text-secondary);font-weight:650}.hh .stat-value{font-size:23px;line-height:1.2;letter-spacing:-.75px;font-weight:700;margin:5px 0 3px;font-variant-numeric:tabular-nums}.hh .stat-value span{font-size:12px;letter-spacing:0;font-weight:450;color:var(--ui-text-secondary)}.hh .stat small{display:block;font-size:10px}
.hh .workspace{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);gap:14px;align-items:start}.hh .panel{min-width:0;border:1px solid var(--ui-stroke-secondary);border-radius:12px;background:var(--ui-bg-secondary);overflow:hidden}.hh .panel-head{padding:15px 16px 12px}.hh .panel-head p{font-size:11px;color:var(--ui-text-secondary);margin-top:4px}.hh .step{font:10px ui-monospace,monospace;color:var(--ember);margin-right:8px}.hh .tag{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--ui-stroke-secondary);border-radius:6px;padding:3px 7px;font-size:10px;font-weight:550;line-height:1.2;color:var(--ui-text-secondary)}.hh .preset-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:0 16px 12px}.hh .preset-bar .count{margin-left:auto;display:flex;align-items:center;gap:5px}.hh button,.hh input{font:inherit}.hh .action{min-height:31px;border-radius:7px;font-size:11px;font-weight:600;padding:6px 10px;cursor:pointer}.hh .action:disabled{cursor:default;opacity:.45}.hh .primary{font-size:14px;font-weight:750;min-height:42px;padding:10px 18px;background:var(--hot)!important;color:#fff!important;border:1px solid var(--hot)!important;box-shadow:0 2px 5px #00000010}.hh .primary:hover:enabled{background:#b83a10!important}.hh .quiet{background:transparent!important;color:var(--ui-text-secondary)!important}.hh input[type=number]{width:65px;min-height:30px;padding:5px 7px;border:1px solid var(--ui-stroke-secondary);border-radius:6px;color:var(--ui-text-primary);background:var(--ui-bg-primary)}.hh input[type=checkbox]{width:14px;height:14px;accent-color:var(--hot);cursor:pointer;margin:0}.hh label{font-size:11px}.hh .roster{max-height:280px;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;border-top:1px solid var(--ui-stroke-secondary)}.hh table{width:100%;border-collapse:separate;border-spacing:0}.hh th{text-align:left;position:sticky;top:0;z-index:1;background:var(--ui-bg-secondary);font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:var(--ui-text-secondary);font-weight:600;border-bottom:1px solid var(--ui-stroke-secondary);padding:8px}.hh td{border-bottom:1px solid var(--ui-stroke-secondary);padding:8px;font-size:11px;vertical-align:middle}.hh th:first-child,.hh td:first-child{width:36px;padding-left:16px}.hh th:last-child,.hh td:last-child{padding-right:16px}.hh tbody tr:last-child td{border-bottom:0}.hh tbody tr.selected{background:var(--ember-wash)}.hh td strong{font-size:12px;font-weight:600}.hh .profile-name{display:block;font-size:10px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hh .status{display:inline-flex;align-items:center;gap:5px;font-size:10px;white-space:nowrap}.hh .status:before{content:'';width:5px;height:5px;border-radius:50%;background:var(--ui-text-secondary)}.hh .status.served:before,.hh .status.ready:before{background:var(--ember)}.hh .status.failed:before{background:#e24b49}.hh .status.warming:before{background:#dba83c}.hh .held{color:var(--ember);font-size:10px}.hh .panel-foot{border-top:1px solid var(--ui-stroke-secondary);padding:10px 16px;font-size:10px;color:var(--ui-text-secondary)}
.hh .planner{border-top:2px solid var(--ember)}.hh .plan-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:13px}.hh .plan-actions .primary{font-size:13px;padding:10px 16px;min-height:39px}.hh .plan-body{padding:0 16px 14px}.hh .empty-plan{padding:13px 0 4px;color:var(--ui-text-secondary);font-size:12px}.hh .plan-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:13px 0;border-top:1px solid var(--ui-stroke-secondary);border-bottom:1px solid var(--ui-stroke-secondary)}.hh .plan-metrics strong{display:block;font-size:17px;letter-spacing:-.4px;line-height:1.3;margin:5px 0 3px}.hh .plan-metrics small{font-size:10px;display:block}.hh .plan-note{margin-top:10px;color:var(--ui-text-secondary);font-size:11px}.hh .confirm{border:1px solid color-mix(in srgb,var(--ember) 38%,var(--ui-stroke-secondary));background:var(--ember-wash);border-radius:8px;padding:12px;margin-bottom:13px}.hh .confirm strong{font-size:13px}.hh .confirm p{font-size:11px;color:var(--ui-text-secondary);margin-top:6px}.hh .confirm .names{max-height:42px;overflow:auto;font-size:10px}.hh .confirm .controls{margin-top:10px}.hh details{font-size:11px}.hh summary{cursor:pointer;color:var(--ui-text-secondary);font-weight:550;list-style-position:inside;padding:10px 0}.hh details[open]>summary{color:var(--ui-text-primary)}.hh .advanced{margin-top:6px}.hh .fields{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:3px 0 9px}.hh .fields label{display:grid;gap:5px;color:var(--ui-text-secondary);font-size:10px}.hh .fields input{width:100%}.hh .fields .reserve{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between}.hh .fields .reserve input{width:75px}.hh .comparison{margin-top:10px;padding:9px 11px;border:1px solid var(--ui-stroke-secondary);border-radius:7px;font-size:11px}.hh .comparison p{margin-top:4px;color:var(--ui-text-secondary);font-size:10px}.hh .comparison .action{margin-top:7px}.hh .notice{margin:0 0 12px;border-left:3px solid var(--ember);border-radius:5px;background:var(--ember-wash);padding:9px 12px;font-size:11px}.hh .notes{margin-top:12px;border-top:1px solid var(--ui-stroke-secondary)}.hh .notes summary{font-size:10px}.hh .notes-content{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:2px 0 12px;color:var(--ui-text-secondary);font-size:11px}.hh .notes-content strong{color:var(--ui-text-primary)}.hh .notes-content p{margin:6px 0}.hh .notes-content ul{padding-left:16px;margin:6px 0}.hh .notes-content li{margin:4px 0}.hh button:focus-visible,.hh input:focus-visible,.hh summary:focus-visible{outline:2px solid var(--ember);outline-offset:3px}
@media(min-width:1200px) and (min-height:850px){.hh main{padding-top:28px}.hh .roster{max-height:360px}.hh td{padding-top:9px;padding-bottom:9px}}
@media(max-width:1050px){.hh main{padding:18px}.hh .workspace{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.hh .preset-bar .count{margin-left:0}.hh .action{padding:6px 8px}.hh .profile-name{max-width:150px}}
@media(max-width:760px){.hh main{padding:16px}.hh .workspace{grid-template-columns:1fr}.hh .planner{grid-row:1}.hh .stats{gap:6px}.hh .stat{padding:10px}.hh .stat-value{font-size:20px}.hh .gateway .tag{display:none}.hh .meta{max-width:170px}.hh .notes-content{grid-template-columns:1fr}.hh .roster{max-height:300px}.hh .brand-mark{width:40px;height:44px}.hh h1{font-size:23px}}
`;

const bytes=n=>finite(n)?`${(n/1073741824).toFixed(2)} GiB`:'Unknown';
const source=()=>host.activeConnectionId?.() || 'local';
const origin=()=>JSON.stringify([source(),host.state.profile.get(),SDK.gatewayActivationEpoch?.()]);
const errorText=e=>String(e?.message||e||'Unavailable').slice(0,280);

function createModel(ctx) {
  let data={profiles:[],status:null,resources:null,leases:{},error:'',loading:false,updated:null,comparison:null};
  const listeners=new Set();let refreshing=false,verifying=false,disposed=false;
  const emit=patch=>{data={...data,...patch};for(const fn of listeners)fn(data);};
  const controller=new RetentionController({acquire:r=>host.retainProfile(r),probe:r=>host.requestProfile(r,'profiles.list',{include_sessions:false},15000),onChange:leases=>emit({leases})});
  const model={get:()=>data,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},controller,
    async refresh() {
      if(refreshing||disposed)return;refreshing=true;emit({loading:true});const captured=origin();
      try{
        const responses=await Promise.allSettled([host.profiles.list(),host.status(),typeof host.profileRoutes==='function'?host.profileRoutes():Promise.reject(new Error('Profile route inventory unavailable in this Desktop.')),ctx.rest('/status')]);
        if(disposed||origin()!==captured)return;
        const [inventory,status,routes,resources]=responses;
        const owned=(routes.status==='fulfilled'&&Array.isArray(routes.value)?routes.value:[]).filter(r=>r.connectionId===source());
        const rows=inventory.status==='fulfilled'&&Array.isArray(inventory.value?.profiles)?inventory.value.profiles:[];
        const profiles=rows.map(p=>{const route=owned.find(r=>r.targetProfile===p.name);return {name:p.name,label:p.display_name||p.name,key:route?routeKey(route):JSON.stringify([source(),p.name,p.name]),route:route||null};});
        if(inventory.status==='fulfilled'&&controller.desired.some(r=>!profiles.some(p=>p.key===routeKey(r))))controller.stop();
        const issues=responses.map((v,i)=>v.status==='rejected'?`${['Profile inventory','Gateway status','Profile routes','Host metrics'][i]}: ${errorText(v.reason)}`:null).filter(Boolean);
        emit({profiles,status:status.status==='fulfilled'?status.value:null,resources:resources.status==='fulfilled'?resources.value:null,error:issues.join(' · '),updated:Date.now()});
      }finally{refreshing=false;if(!disposed)emit({loading:false});}
    },
    async keep(keys){
      const selected=data.profiles.filter(p=>keys.includes(p.key));
      if(selected.length!==keys.length||!selected.length)throw new Error('Choose profiles from the current source.');
      if(selected.some(p=>!p.route))throw new Error('Exact profile routes unavailable. Update Desktop before retaining profiles.');
      if(!host.retainProfile||!host.requestProfile)throw new Error('This Desktop lacks the supported retention API.');
      const capturedSource=source(),began=Date.now();
      const before=await ctx.rest('/status').catch(()=>null);
      if(source()!==capturedSource)throw new Error('Connection changed before warm-up.');
      const previous=new Set(Object.entries(data.leases).filter(([,v])=>v.state==='ready').map(([k])=>k));
      await controller.start(selected.map(p=>p.route));
      // Wait for the bounded sampler cache to roll over; no model request is used.
      await new Promise(resolve=>setTimeout(resolve,2200));
      if(source()!==capturedSource||disposed)return;
      const after=await ctx.rest('/status').catch(()=>null);
      const newlyReady=Object.entries(data.leases).filter(([k,v])=>v.state==='ready'&&!previous.has(k)).length;
      if(source()===capturedSource&&!disposed)emit({resources:after,comparison:compareWarmup(before,after,newlyReady,(Date.now()-began)/1000)});
    },
    pause(){controller.stop();},
    async tick(){if(disposed||verifying)return;verifying=true;try{await model.refresh();await controller.verify();}finally{verifying=false;}},
    dispose(){disposed=true;controller.dispose();listeners.clear();}
  };
  ctx.setInterval(()=>model.tick().catch(()=>{}),15000);
  if(host.state.connectionId?.listen)ctx.onDispose(host.state.connectionId.listen(()=>{controller.stop();emit({profiles:[],status:null,resources:null,comparison:null,updated:null,error:'Connection changed. Refresh to inspect this source.'});}));
  ctx.onDispose(()=>model.dispose());return model;
}

function Page({ctx,model}) {
  const [data,setData]=useState(model.get),[selected,setSelected]=useState([]),[count,setCount]=useState(5),[low,setLow]=useState(''),[high,setHigh]=useState(''),[reserve,setReserve]=useState(20),[review,setReview]=useState(false),[notice,setNotice]=useState(''),[working,setWorking]=useState(false);
  const connection=useValue(host.state.connectionId||host.state.profile),profile=useValue(host.state.profile),socket=useValue(host.state.gateway);
  useEffect(()=>model.subscribe(setData),[model]);
  useEffect(()=>{setSelected([]);setReview(false);model.refresh().catch(e=>setNotice(errorText(e)));},[connection,profile]);
  const names=data.profiles.map(p=>p.key),valid=selected.filter(k=>names.includes(k));
  const rows=monitorRows(data.profiles,data.status,socket==='open',data.leases);
  const ready=rows.filter(p=>p.backend==='ready'),topology=gatewayTopology(data.profiles,data.status,socket==='open');
  const metrics=data.resources?.available?data.resources:null;
  const memoryScope=metrics?.memory?.scope==='machine'?'host/container view':metrics?.memory?.scope||'host/container view';
  const plan=planCapacity({profiles:data.profiles,selected:valid,observedReady:ready.map(p=>p.key),resources:metrics,lowMB:low===''?null:Number(low),highMB:high===''?null:Number(high),reservePercent:Number(reserve)||0});
  const active=Object.values(data.leases).filter(x=>x.retained).length;
  const selectedRows=rows.filter(p=>valid.includes(p.key));
  const choose=n=>{setSelected(names.slice(0,n));setReview(false);};
  async function apply(){setWorking(true);setNotice('');try{await model.keep(valid);setReview(false);setNotice('Requests completed. Profile results show what was verified.');}catch(e){setNotice(errorText(e));}finally{setWorking(false);}}
  const button=(text,action,props={})=>h(Button,{variant:'outline',size:'sm',onClick:action,...props,className:'action '+(props.className||'')},text);
  const summary=(title,value,note)=>h('div',{className:'stat'},h('div',{className:'eyebrow'},title),h('div',{className:'stat-value'},value),h('small',null,note));
  const input=(label,value,set)=>h('label',null,label,h('input',{type:'number',min:0,value,onChange:e=>{set(e.target.value);setReview(false);},'aria-label':label}));
  const flame=h('svg',{viewBox:'0 0 32 40',fill:'none','aria-hidden':true},
    h('path',{d:'M18 1C20 10 10 12 14 20C8 18 8 13 8 13C3 18 1 23 3 29C5 37 14 40 22 36C32 31 33 20 27 13C27 20 24 21 23 21C25 11 20 5 18 1Z',fill:'currentColor'}),
    h('path',{d:'M17 21C18 26 12 27 13 31C14 35 19 36 22 32C24 28 21 25 21 25C21 28 19 29 19 29C20 25 17 21 17 21Z',fill:'var(--ui-bg-primary)'}));
  return h('div',{className:'hh'},h('style',null,styles),h('main',null,
    h('header',{className:'row'},
      h('div',{className:'brand'},h('div',{className:'brand-mark'},flame),h('div',null,h('div',{className:'controls'},h('h1',null,'Hot Hermes'),h('span',{className:'version'},'v'+VERSION)),h('p',{className:'subtitle'},'Your profiles. Ready when you are.'))),
      h('div',null,h('div',{className:'controls',style:{justifyContent:'flex-end'}},h('span',{className:'tag'},socket==='open'?'Gateway connected':'Gateway offline'),button(data.loading?'Refreshing…':'Refresh',()=>model.refresh(),{disabled:data.loading})),h('p',{className:'meta'},source(),' · ',profile,' · ',data.updated?new Date(data.updated).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'Not checked'))),
    h('div',{className:'gateway'},
      h('div',{className:'gateway-icon','aria-hidden':true},topology.allShared?'1':'↗'),
      h('div',null,h('strong',null,topology.allShared?`All ${topology.served} profiles are already served by one gateway`:`${topology.served} of ${data.profiles.length} profiles reported served`),
        h('p',null,topology.allShared?'Keeping them hot may offer little speedup. Tools and session caches are still unverified.':'Choose profiles to retain and verify. Opening this page does not start cold backends.')),
      h('span',{className:'tag'},topology.allShared?'Shared gateway':'Live gateway report')),
    data.error&&h('div',{className:'notice',role:'alert'},data.error),
    notice&&h('div',{className:'notice',role:'status'},notice),
    h('div',{className:'stats'},
      summary('Verified & retained',h('span',null,h('strong',{style:{fontSize:'23px',color:'var(--ui-text-primary)'}},ready.length),` / ${data.profiles.length} profiles`),`${active} retention handles · tools and caches unverified`),
      summary('Available memory',bytes(metrics?.memory?.available_bytes),metrics?`${memoryScope} · ${bytes(metrics.memory?.total_bytes)} total`:'Host metrics unavailable'),
      summary('Sampler subtree',bytes(metrics?.backend_tree_rss_bytes),metrics?`${metrics.process_count??'?'} processes · CPU ${finite(metrics.cpu_percent_one_core)?metrics.cpu_percent_one_core.toFixed(1)+'% of one core':'sampling…'}`:'Measured subtree only; not total Hermes memory')),
    h('div',{className:'workspace'},
      h('section',{className:'panel','aria-label':'Profile selection'},
        h('div',{className:'panel-head'},h('div',{className:'row'},h('h2',null,h('span',{className:'step'},'01'),'Choose your profiles'),h('span',{className:'tag'},valid.length+' selected')),h('p',null,'Pick a few favorites, or keep the whole roster close.')),
        h('div',{className:'preset-bar'},
          button('Keep 5',()=>{setCount(5);choose(5);},{disabled:working}),
          button('Keep 8',()=>{setCount(8);choose(8);},{disabled:working}),
          button('Choose all',()=>choose(names.length),{disabled:working}),
          h('div',{className:'count'},input('Count',count,setCount),button('Select count',()=>choose(Math.max(1,Math.min(names.length,Math.floor(Number(count)||1)))),{disabled:working}))),
        h('div',{className:'roster',tabIndex:0,'aria-label':'Profiles on this source'},
          h('table',null,
            h('thead',null,h('tr',null,h('th',null,h('span',{'aria-label':'Select'},'✓')),h('th',null,'Profile'),h('th',null,'Observed state'),h('th',null,'Retention'))),
            h('tbody',null,rows.length?rows.map(p=>h('tr',{key:p.key,className:valid.includes(p.key)?'selected':'',title:p.detail||'Tools and session cache have not been verified.'},
              h('td',null,h('input',{type:'checkbox',checked:valid.includes(p.key),disabled:working,'aria-label':`Select ${p.label}`,onChange:e=>{setSelected(x=>e.target.checked?[...x.filter(k=>names.includes(k)),p.key]:x.filter(k=>k!==p.key));setReview(false);}})),
              h('td',null,h('strong',null,p.label),p.label!==p.name&&h('small',{className:'profile-name',title:p.name},p.name),!p.route&&h('small',{className:'profile-name'},'Exact route unavailable')),
              h('td',null,h('span',{className:'status '+p.backend},p.backend==='ready'?'Verified ready':p.backend==='served'?'Served':p.backend==='warming'?'Checking…':p.backend==='failed'?'Failed':'Unknown'),p.backend==='failed'&&p.detail&&h('small',{className:'profile-name',title:p.detail},p.detail)),
              h('td',null,h('span',{className:p.retained?'held':'muted'},p.retained?'Held':'—')))):
              h('tr',null,h('td',{colSpan:4},data.loading?'Reading profile inventory…':'No profiles available. Refresh after connecting.'))))),
        h('div',{className:'panel-foot'},'Served = live gateway report. Verified ready = retained socket + metadata check.')),
      h('section',{className:'panel planner','aria-label':'Keep-ready planner'},
        h('div',{className:'panel-head'},
          h('div',{className:'row'},h('h2',null,h('span',{className:'step'},'02'),review?'Confirm your request':'Keep your profiles hot'),h('span',{className:'tag'},valid.length+' selected')),
          h('p',null,review?'Review the scope below, then start.':valid.length?'Hold selected profile connections while this plugin is enabled.':'Choose a preset or select profiles to get started.'),
          h('div',{className:'plan-actions'},
            review?button(working?'Keeping profiles hot…':'Start keep-ready',apply,{className:'primary',disabled:working||!valid.length||selectedRows.some(p=>!p.route)}):button('Keep profiles hot',()=>setReview(true),{className:'primary','aria-label':'Review keep-ready request',disabled:!valid.length||working}),
            review&&button('Cancel',()=>setReview(false),{className:'quiet',disabled:working}),
            button('Release retention',()=>{model.pause();setReview(false);setNotice('Released Hot Hermes handles. Hermes controls backend shutdown; active chats were not stopped.');},{className:'quiet','aria-label':'Release Hot Hermes retention',disabled:!active&&!working}))),
        h('div',{className:'plan-body'},
          review&&h('div',{className:'confirm',role:'region','aria-label':'Confirm keep-ready request'},
            h('strong',null,`Keep ${valid.length} selected profiles ready on ${source()}?`),
            h('p',{className:'names'},selectedRows.map(p=>p.label).join(', ')),
            h('p',null,'This may start selected backends and configured services. Only metadata requests are sent. Retention lasts while this Desktop plugin is enabled.'),
            h('p',null,topology.allShared?'All profiles already share a live gateway; a speedup is not guaranteed.':'Existing Hermes limits still apply. RAM estimates are assumptions, not a capacity guarantee.'),
            selectedRows.some(p=>!p.route)&&h('p',null,'Exact routes are unavailable for some selections. Update Desktop before retaining them.')),
          h('div',{className:'plan-metrics'},
            h('div',null,h('div',{className:'eyebrow'},'Selected connections'),h('strong',null,valid.length),h('small',null,topology.allShared?'Already served through the shared gateway':`${plan.additional} still need retention verification`)),
            h('div',null,h('div',{className:'eyebrow'},'Additional RAM estimate'),h('strong',null,plan.estimate?`${bytes(plan.estimate.additional_low_bytes)}–${bytes(plan.estimate.additional_high_bytes)}`:'Not measured'),h('small',null,plan.estimate?'Assumed range · '+plan.estimate.fits:'Per-profile allocation is not exposed'))),
          h('p',{className:'plan-note'},topology.allShared?'A shared gateway does not reveal separate RAM costs for each profile. Retention verifies connections; it does not prove faster tools or cached sessions.':'Retention holds a Desktop socket, not RAM or a model prompt cache. Idle CPU and startup costs must be observed.'),
          h('details',{className:'advanced'},
            h('summary',null,'Advanced · RAM assumptions & reserve'),
            h('p',{className:'muted'},'Optional planning inputs. Enter incremental RAM per additional retained profile; these values are assumptions, not measured allocations.'),
            h('div',{className:'fields'},
              input('RAM low (MiB/profile)',low,setLow),input('RAM high (MiB/profile)',high,setHigh),
              h('label',{className:'reserve'},'Reserve percent',h('input',{type:'number',min:0,max:80,value:reserve,'aria-label':'Reserve percent',onChange:e=>{setReserve(Math.min(80,Math.max(0,Number(e.target.value)||0)));setReview(false);}}))),
            h('p',{className:'muted'},plan.reason),
            plan.estimate&&h('p',{className:'plan-note'},'Available after reserve: ',bytes(plan.estimate.available_after_reserve_bytes))),
          data.comparison&&h('div',{className:'comparison'},
            h('strong',null,'Last request · observed change'),
            h('p',null,`${data.comparison.newlyReady} newly verified profiles · ${data.comparison.seconds.toFixed(1)}s · host RAM ${data.comparison.host_memory_change_bytes<0?'−':'+'}${bytes(Math.abs(data.comparison.host_memory_change_bytes))}`),
            h('p',null,'Host change includes other workloads; it is not isolated per-profile usage.'),
            !topology.allShared&&data.comparison.observed_average_mib!=null&&button('Use observed average for planning',()=>{setLow(data.comparison.observed_average_mib.toFixed(1));setHigh(data.comparison.observed_average_mib.toFixed(1));setReview(false);}))))),
    h('details',{className:'notes'},
      h('summary',null,'Measurement, settings & compatibility'),
      h('div',{className:'notes-content'},
        h('div',null,h('strong',null,'What is measured'),
          h('p',null,'Memory and CPU cover the sampler subtree, not the total Hermes footprint. Memory availability is the reported '+memoryScope+'.'),
          h('p',null,`Sampler PID: ${metrics?.pid??'unknown'} · Gateway PID: ${data.status?.gateway_pid??'unknown'}.`,
            metrics?.pid!=null&&data.status?.gateway_pid!=null?(String(metrics.pid)===String(data.status.gateway_pid)?' PIDs match; measurements still cover only the sampled subtree.':' PIDs differ; do not attribute this subtree to the gateway.'):' Process attribution is unverified.'),
          metrics?.process_tree_coverage&&h('p',null,'Process coverage: ',
            `${metrics.process_tree_coverage.sampled_processes??'?'} sampled · ${metrics.process_tree_coverage.discovered_children??'?'} children found · ${metrics.process_tree_coverage.unreadable_processes??0} unreadable.`,
            metrics.process_tree_coverage.truncated?' Child list was truncated.':'',
            metrics.process_tree_coverage.children_query_failed?' Child enumeration was incomplete.':''),
          h('ul',null,...(metrics?.limitations||['Host resource measurements unavailable.']).map((x,i)=>h('li',{key:i},x)))),
        h('div',null,h('strong',null,'Settings & compatibility'),
          h('p',null,'No configurable backend-pool setting was found on the tested Hermes 0.23.1 build. The earlier value of five is unconfirmed. Hot Hermes does not change application settings.'),
          button('Open Hermes Settings',()=>host.navigate('/settings')),
          h('ul',null,h('li',null,'Tools and session caches remain unverified. Metadata checks do not send model prompts.'),h('li',null,'Closing Desktop, disabling this plugin or changing connections releases its handles.'),h('li',null,'Failures are not retried automatically. Release and request again to retry.')))))));
}


export default {id:'hot-hermes',name:'Hot Hermes',defaultEnabled:false,register(ctx){
  const model=createModel(ctx);
  ctx.registerMany([{id:'page',area:ROUTES_AREA,data:{path:'/hot-hermes'},render:()=>h(Page,{ctx,model})},{id:'nav',area:SIDEBAR_NAV_AREA,data:{path:'/hot-hermes',label:'Hot Hermes',codicon:'flame'}}]);
  if(ctx.registerSettingsPage)ctx.registerSettingsPage({id:'settings',title:'Hot Hermes',icon:'flame',render:()=>h('div',null,h('p',null,'Inspect readiness, plan capacity and retain selected profile sockets.'),h(Button,{onClick:()=>host.navigate('/hot-hermes')},'Open Hot Hermes'))});
}};
