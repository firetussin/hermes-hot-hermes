import {useSyncExternalStore} from 'react';
function atom(value){const listeners=new Set();return {get:()=>value,listen:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},set:v=>{value=v;for(const f of listeners)f(v);}};}
export const useValue=a=>useSyncExternalStore(a.listen,a.get);
export const ROUTES_AREA='routes',SIDEBAR_NAV_AREA='sidebar.nav';
export function Button({children,variant,size,...props}){return ReactCreate('button',props,children);}
import {createElement as ReactCreate} from 'react';
const names=['default','Research','Finance','Builder','Writer','Ops','Planner','Reviewer','Analyst','Scout','Archive'];
const routes=names.map(profile=>({connectionId:'demo-host',profile,targetProfile:profile,mode:'remote'}));
window.fixture={acquired:0,released:0,probes:0,fail:false,shared:new URLSearchParams(location.search).get('shared')==='1',dispose:null};
export const gatewayActivationEpoch=()=>1;
export const host={state:{connectionId:atom('demo-host'),profile:atom('default'),gateway:atom('open')},activeConnectionId:()=>host.state.connectionId.get(),
 profiles:{list:async()=>({profiles:names.map(name=>({name}))})},profileRoutes:async()=>routes,
 status:async()=>({gateway_running:true,gateway_state:'running',gateway_shared_with:window.fixture.shared?names:['default','Research','Finance']}),
 retainProfile:async()=>{window.fixture.acquired++;return()=>window.fixture.released++;},
 requestProfile:async()=>{window.fixture.probes++;if(window.fixture.fail)throw new Error('Fixture backend disconnected');return {profiles:[]};},navigate:p=>{window.fixture.navigated=p;}
};
export const fixtureMetrics={host_id:'fixture-host',sampled_at:1,api:1,version:'0.1.1',available:true,memory:{scope:'container/cgroup',total_bytes:16*1073741824,available_bytes:9*1073741824},backend_tree_rss_bytes:1.25*1073741824,process_count:4,process_tree_coverage:{sampled_processes:4,discovered_children:3,unreadable_processes:0,truncated:false,children_query_failed:false},cpu_percent_one_core:null,limitations:['Synthetic fixture only; no live host was measured.']};
