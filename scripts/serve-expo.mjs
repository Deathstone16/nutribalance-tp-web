import {existsSync,mkdirSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {spawn,spawnSync,fork} from 'node:child_process';
import {createConnection} from 'node:net';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {setTimeout as wait} from 'node:timers/promises';

const frontend=fileURLToPath(new URL('../',import.meta.url));
const backend=path.resolve(frontend,process.env.NUTRI_BACKEND_DIR||'../backend');
const runtime=path.join(frontend,'.sites-runtime/expo');
const stopFile=path.join(runtime,'stop');
const stateFile=path.join(runtime,'state.json');
mkdirSync(runtime,{recursive:true});
if(process.argv.includes('--detener')){
  if(existsSync(stateFile)){writeFileSync(stopFile,'detener');console.log('Se solicitó detener la exposición y sus procesos propios.');}
  else console.log('No hay una exposición administrada por este comando.');
  process.exit(0);
}
if(process.argv.slice(2).some(argument=>argument!=='--sin-compilar'))throw new Error('Opciones: --sin-compilar o --detener.');
const origin=process.env.PUBLIC_SITE_ORIGIN||'https://api.neadev.com';
const publicUrl=new URL(origin);
if(publicUrl.protocol!=='https:'||publicUrl.origin!==origin)throw new Error('PUBLIC_SITE_ORIGIN debe ser un origen HTTPS exacto.');
if(!existsSync(path.join(backend,'scripts/arrancar.ts')))throw new Error('No se encuentra el backend hermano. Configurá NUTRI_BACKEND_DIR.');
const nextCli=path.join(frontend,'node_modules/next/dist/bin/next');
const environment={...process.env,NODE_ENV:'production',PUBLIC_SITE_ORIGIN:origin,EXPRESS_ALLOWED_ORIGIN:origin,EXPRESS_LOCAL_API_ORIGIN:'http://127.0.0.1:3001',CF_ACCESS_CLIENT_ID:'',CF_ACCESS_CLIENT_SECRET:''};
const children=[];
let closing=false,stopWatcher;
async function healthy(url){
  try{const response=await fetch(url,{signal:AbortSignal.timeout(1500)});return response.ok&&(await response.json()).status==='ok'}catch{return false}
}
async function portOpen(port){
  return new Promise(resolve=>{
    const socket=createConnection({host:'127.0.0.1',port});
    const finish=value=>{socket.destroy();resolve(value)};
    socket.once('connect',()=>finish(true));socket.once('error',()=>finish(false));socket.setTimeout(1000,()=>finish(false));
  });
}
async function close(code=0){
  if(closing)return;closing=true;clearInterval(stopWatcher);
  for(const {child,ipc} of [...children].reverse()){
    if(child.exitCode!==null)continue;
    const ended=new Promise(resolve=>child.once('exit',resolve));
    if(ipc&&child.connected)child.send('detener');else child.kill();
    await Promise.race([ended,wait(18000)]);
    if(child.exitCode===null)child.kill();
  }
  if(existsSync(stateFile)){
    try{if(JSON.parse(readFileSync(stateFile,'utf8')).pid===process.pid)unlinkSync(stateFile)}catch{}
  }
  if(existsSync(stopFile))unlinkSync(stopFile);
  process.exit(code);
}
function track(child,ipc){
  children.push({child,ipc});
  child.on('error',()=>{console.error('No se pudo iniciar un proceso de la exposición.');void close(1)});
  child.on('exit',code=>{if(!closing){console.error(`Un proceso de la exposición terminó (${code??'señal'}).`);void close(1)}});
  return child;
}
async function waitHealthy(url){
  for(let attempt=0;attempt<90&&!closing;attempt++){if(await healthy(url))return;await wait(500)}
  throw new Error('Un servicio no quedó disponible. Revisá los registros de la exposición.');
}
process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());
process.on('message',message=>{if(message==='detener')void close()});
try{
  const apiReady=await healthy('http://127.0.0.1:3001/health');
  if(await healthy('http://127.0.0.1:3000/api/health')&&apiReady){console.log(`La exposición ya está activa: ${origin}`);process.exit(0)}
  if(await portOpen(3000))throw new Error('El puerto 3000 está ocupado. Debe quedar para el frontend; la API de la exposición usa 3001.');
  if(!apiReady&&await portOpen(3001))throw new Error('El puerto 3001 está ocupado por otro servicio; no se modifica.');
  if(!process.argv.includes('--sin-compilar')){
    const build=spawnSync(process.execPath,[nextCli,'build'],{cwd:frontend,env:environment,stdio:'inherit',windowsHide:true});
    if(build.error||build.status!==0)throw new Error('No se pudo compilar el frontend.');
  }else if(!existsSync(path.join(frontend,'.next/BUILD_ID')))throw new Error('Compilá primero con pnpm build.');
  if(existsSync(stopFile))unlinkSync(stopFile);
  if(!apiReady){
    // The backend is private; this launcher supplies its HTTPS-proxy cookie profile.
    track(fork('scripts/arrancar.ts',['--portable'],{cwd:backend,execArgv:['--import','tsx'],env:{...environment,PORT:'3001',HOST:'127.0.0.1',APP_ORIGIN:origin,TRUST_PROXY:'loopback',SESSION_COOKIE_SECURE:'true',SESSION_COOKIE_SAME_SITE:'lax'},stdio:['ignore','inherit','inherit','ipc'],windowsHide:true}),true);
    await waitHealthy('http://127.0.0.1:3001/health');
  }
  track(spawn(process.execPath,[nextCli,'start','--port','3000','--hostname','127.0.0.1'],{cwd:frontend,env:environment,stdio:['ignore','inherit','inherit'],windowsHide:true}),false);
  await waitHealthy('http://127.0.0.1:3000/api/health');
  writeFileSync(stateFile,JSON.stringify({pid:process.pid,origin,frontendPort:3000,apiPort:3001,childPids:children.map(({child})=>child.pid),startedAt:new Date().toISOString()},null,2));
  stopWatcher=setInterval(()=>{if(existsSync(stopFile))void close()},1000);
  console.log(`EXPOSICIÓN LISTA: ${origin}`);
  console.log('Cloudflare → frontend 127.0.0.1:3000 → API privada 127.0.0.1:3001.');
  console.log('Ctrl+C o pnpm expo:stop detienen únicamente los procesos que inició este comando.');
}catch(error){console.error(error instanceof Error?error.message:'No se pudo iniciar la exposición.');await close(1)}
