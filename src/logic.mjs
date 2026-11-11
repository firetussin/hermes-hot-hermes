// Pure planning and retention lifecycle; also bundled verbatim into desktop/plugin.js.
export function routeKey(route) {
  return JSON.stringify([route.connectionId, route.profile, route.targetProfile]);
}
export function finite(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
export function planCapacity({profiles, selected, observedReady, resources, lowMB, highMB, reservePercent=20}) {
  if (!Array.isArray(profiles) || !Array.isArray(selected) || new Set(selected).size !== selected.length || selected.some(k=>!profiles.some(p=>p.key===k))) throw new Error('Choose valid, unique profiles.');
  if (!finite(reservePercent) || reservePercent>80) throw new Error('Reserve must be between 0 and 80 percent.');
  const ready = new Set(observedReady || []);
  const additional = selected.filter(k=>!ready.has(k));
  const result={target:selected.length, additional:additional.length, selected:[...selected], basis:'operator assumption', cpuEstimate:null};
  if (lowMB == null || highMB == null || !finite(lowMB) || !finite(highMB) || lowMB>highMB || highMB>1048576) return {...result,estimate:null,reason:'Enter an incremental RAM range per additional profile, based on measurements or an explicit assumption.'};
  const low=additional.length*lowMB*1048576, high=additional.length*highMB*1048576;
  const m=resources?.memory;
  const budget=m && finite(m.total_bytes) && finite(m.available_bytes) ? Math.max(0,m.available_bytes-m.total_bytes*reservePercent/100):null;
  return {...result,estimate:{additional_low_bytes:low,additional_high_bytes:high,available_after_reserve_bytes:budget,
    fits:budget==null?'unknown':high<=budget?'within assumption':low>budget?'over budget':'uncertain'},
    reason:'Planning range only. Shared gateways and tools make per-profile costs unequal; confirm on this host.'};
}

export function compareWarmup(before, after, newlyReady, seconds) {
  if(!before?.available || !after?.available || !before.host_id || before.host_id!==after.host_id || before.memory?.scope!==after.memory?.scope || before.memory?.total_bytes!==after.memory?.total_bytes || !finite(before.sampled_at) || !finite(after.sampled_at) || after.sampled_at<=before.sampled_at || !finite(newlyReady) || newlyReady<1) return null;
  if(!finite(before.memory?.available_bytes)||!finite(after.memory?.available_bytes))return null;
  const delta=before.memory.available_bytes-after.memory.available_bytes;
  return {newlyReady,seconds,host_memory_change_bytes:delta,
    backend_rss_change_bytes:finite(before.backend_tree_rss_bytes)&&finite(after.backend_tree_rss_bytes)?after.backend_tree_rss_bytes-before.backend_tree_rss_bytes:null,
    observed_average_mib:delta>0?delta/newlyReady/1048576:null,
    note:'Observed host change, not isolated per-profile attribution. Other workloads and cache changes can affect this sample.'};
}

export function gatewayTopology(profiles,status,socketOpen) {
  const healthy=socketOpen && status?.gateway_running===true && status.gateway_state==='running' && !(status.gateway_heartbeat_stale_s>0);
  const served=new Set(healthy && Array.isArray(status.gateway_shared_with)?status.gateway_shared_with:[]);
  const known=profiles.filter(p=>served.has(p.name));
  return {served:known.length,allShared:profiles.length>0&&known.length===profiles.length&&served.size>1};
}

export function monitorRows(profiles, status, socketOpen, leaseStates={}, now=Date.now()) {
  const stale=typeof status?.gateway_heartbeat_stale_s==='number' && status.gateway_heartbeat_stale_s>0;
  const healthy=socketOpen && status?.gateway_running===true && !stale && status.gateway_state==='running';
  const served=new Set(healthy && Array.isArray(status.gateway_shared_with)?status.gateway_shared_with:[]);
  return profiles.map(p=>{
    const lease=leaseStates[p.key];
    const fresh=lease?.checkedAt && now-lease.checkedAt<45000;
    return {...p, backend: lease?.state==='failed'?'failed':lease?.state==='warming'?'warming':fresh && lease?.state==='ready'?'ready':served.has(p.name)?'served':'unknown',
      retained:lease?.retained===true, checkedAt:lease?.checkedAt||null, detail:lease?.detail||'', tools:'unknown', conversation:'unknown'};
  });
}

export class RetentionController {
  constructor({acquire, probe, onChange=()=>{}, timeoutMs=30000}) {
    this.acquire=acquire;this.probe=probe;this.onChange=onChange;this.timeoutMs=timeoutMs;
    this.releases=new Map();this.states={};this.generation=0;this.disposed=false;this.running=false;this.desired=[];
  }
  publish(key,value) {this.states={...this.states,[key]:{...this.states[key],...value}};this.onChange({...this.states});}
  async bounded(promise,onLate=()=>{}) {
    let timer,expired=false;
    const task=Promise.resolve(promise).then(v=>{if(expired){onLate(v);throw new Error('Operation completed after timeout.');}return v;});
    try{return await Promise.race([task,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(new Error('Warm-up timed out; no automatic retry.'));},this.timeoutMs);})]);}
    finally{clearTimeout(timer);}
  }
  async start(routes) {
    if(this.disposed) throw new Error('Retention controller is closed.');
    this.stop(); const revision=this.generation;this.desired=[...routes];this.running=true;
    // Sequential acquisition prevents a cold-start storm. No unselected route is probed.
    for(const route of routes) {
      if(this.disposed || revision!==this.generation) break;
      const key=routeKey(route);this.publish(key,{state:'warming',retained:false,detail:''});
      let release;
      try {
        release=await this.bounded(this.acquire(route),fn=>{if(typeof fn==='function')fn();});
        if(typeof release!=='function')throw new Error('Host did not return a retention release handle.');
        if(this.disposed || revision!==this.generation){release();break;}
        this.releases.set(key,release);
        await this.bounded(this.probe(route));
        if(revision===this.generation&&!this.disposed)this.publish(key,{state:'ready',retained:true,checkedAt:Date.now(),detail:'Retained socket and a successful metadata RPC. Tools and conversation cache are not verified.'});
      } catch(e) {
        if(this.releases.get(key)===release){this.releases.delete(key);try{release?.();}catch{}}
        if(revision===this.generation&&!this.disposed)this.publish(key,{state:'failed',retained:false,checkedAt:null,detail:String(e.message||e)});
      }
    }
    if(revision===this.generation)this.running=false;
  }
  async verify() {
    const revision=this.generation;
    for(const route of this.desired) {
      const key=routeKey(route);if(!this.releases.has(key))continue;
      try{await this.bounded(this.probe(route));if(revision===this.generation)this.publish(key,{state:'ready',checkedAt:Date.now(),retained:true});}
      catch(e){if(revision===this.generation){const release=this.releases.get(key);this.releases.delete(key);try{release?.();}catch{}this.publish(key,{state:'failed',retained:false,checkedAt:null,detail:String(e.message||e)});}}
      if(revision!==this.generation)break;
    }
  }
  stop() {
    this.generation++;this.desired=[];this.running=false;
    for(const release of this.releases.values())try{release();}catch{}
    this.releases.clear();this.states={};this.onChange({});
  }
  dispose(){this.stop();this.disposed=true;}
}
