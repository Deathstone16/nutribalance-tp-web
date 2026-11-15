/** Read-only deployment checks. Never print cookies, CSRF tokens or clinical data. */
const origin=process.argv[2]||process.env.TEST_SITE_ORIGIN||process.env.PUBLIC_SITE_ORIGIN;
if(!origin)throw new Error('Indicá la URL: pnpm check:public https://tu-proyecto.vercel.app');
const target=new URL(origin);
if(target.origin!==origin||!(target.protocol==='https:'||(target.protocol==='http:'&&['localhost','127.0.0.1'].includes(target.hostname)))){
  throw new Error('Usá un origen HTTPS exacto, sin ruta ni barra final, o HTTP en localhost.');
}
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const nextDay=new Date(today+'T12:00:00Z');
do{nextDay.setUTCDate(nextDay.getUTCDate()+1)}while([0,6].includes(nextDay.getUTCDay()));
const date=nextDay.toISOString().slice(0,10);
const controls=[
  {path:'/api/health',status:200,valid:body=>body.status==='ok'},
  {path:'/api/v1/availability?date='+date,status:200,valid:body=>body.date===date&&Array.isArray(body.slots)},
  {path:'/api/v1/auth/csrf',status:200,valid:(body,response)=>typeof body.csrfToken==='string'&&response.headers.getSetCookie().some(cookie=>cookie.startsWith('nutri.sid=')&&/;\s*Path=\/api\/v1(?:;|$)/i.test(cookie)&&/;\s*HttpOnly/i.test(cookie)&&/;\s*Secure/i.test(cookie)&&/;\s*SameSite=Lax/i.test(cookie))},
  {path:'/api/v1/auth/me',status:401,valid:body=>body.error?.code==='UNAUTHENTICATED'},
  {path:'/api/v1/patients',status:401,valid:body=>body.error?.code==='UNAUTHENTICATED'},
  {path:'/api/v1/auth/login',method:'POST',foreign:true,status:403,valid:body=>body.error?.code==='ORIGIN_INVALID'},
  {path:'/api/panel',status:410,valid:body=>body.error?.code==='LEGACY_API_DISABLED'},
  {path:'/api/solicitudes',method:'POST',status:410,valid:body=>body.error?.code==='LEGACY_API_DISABLED'},
];
let failures=0;
for(const control of controls){
  try{
    const response=await fetch(origin+control.path,{method:control.method||'GET',headers:{Accept:'application/json',Origin:control.foreign?'https://foreign.example.test':origin},redirect:'manual',signal:AbortSignal.timeout(20000)});
    const valid=response.status===control.status&&response.headers.get('content-type')?.includes('application/json')&&response.headers.get('cache-control')?.includes('no-store')&&control.valid(await response.json(),response);
    console.log(`${valid?'OK':'FALLO'} ${response.status} ${control.method||'GET'} ${control.path}`);
    if(!valid)failures++;
  }catch{console.log(`FALLO de conexión ${control.path}`);failures++}
}
console.log(`${controls.length-failures}/${controls.length} controles aprobados en ${origin}`);
process.exitCode=failures?1:0;
