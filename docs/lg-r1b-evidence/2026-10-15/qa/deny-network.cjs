const fs=require('node:fs');
const evidence="/home/sebastiangarcia/.local/share/la-gaviota/lg-r1b-20261015/independent-qa/network-attempts.jsonl";
const deny=(kind)=>(...args)=>{if(evidence)fs.appendFileSync(evidence,JSON.stringify({kind})+'\n');throw new Error('LG_R1B_NETWORK_FORBIDDEN:'+kind)};
for(const name of ['node:net','node:tls']){const m=require(name);if(m.connect)m.connect=deny(name+'.connect');if(m.createConnection)m.createConnection=deny(name+'.createConnection');if(m.Socket)m.Socket.prototype.connect=deny(name+'.Socket.connect')}
for(const name of ['node:http','node:https']){const m=require(name);m.request=deny(name+'.request');m.get=deny(name+'.get')}
for(const name of ['node:dns','node:dns/promises']){const m=require(name);for(const key of Object.keys(m))if(typeof m[key]==='function'&&/^(lookup|resolve|reverse)/.test(key))m[key]=deny(name+'.'+key)}
globalThis.fetch=deny('global.fetch');globalThis.WebSocket=deny('global.WebSocket');
