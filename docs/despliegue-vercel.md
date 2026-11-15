# Publicar el frontend en Vercel con la API en tu PC

Preparación: 15 de noviembre de 2026. Rama: **`codex/vercel-local-api`**.

## 1. Qué queda preparado

El frontend usa Next.js 16 y Node.js 24. `vercel.json` fija el framework y los comandos. Se conservan la interfaz y el gateway `/api/v1`, conectado al destino fijo `https://api.neadev.com`.

Las rutas antiguas `/api/panel` y `/api/solicitudes` devuelven HTTP 410 y no cargan D1. La sesión mantiene HttpOnly, Secure, SameSite=Lax y Path=/api/v1. Las escrituras comprueban el origen del navegador y CSRF. El gateway admite credenciales opcionales de Cloudflare Access, exclusivamente en el servidor.

```text
Navegador → frontend/gateway en Vercel → Cloudflare Tunnel → Express/PostgreSQL en tu PC
```

Esta preparación no publica en Vercel, no modifica `main`, no instala tareas de Windows ni activa políticas de Cloudflare. Los archivos históricos de Vinext/D1 se conservan como referencia.

## 2. Subir la rama a GitHub

En PowerShell, dentro del repositorio independiente del frontend:

```powershell
Set-Location 'C:\Users\Bruno\Desktop\Nutri_express\frontend'
git status
git branch --show-current
git push --set-upstream origin codex/vercel-local-api
```

Debe mostrarse `codex/vercel-local-api`. Repositorio: [Maaupelozo/nutribalance-tp-web](https://github.com/Maaupelozo/nutribalance-tp-web). Si GitHub rechaza el push por permisos, el propietario debe darte acceso o debés subir la rama a un fork e importar ese fork. No reemplazar `main` ni forzar el push.

`.env*`, `.vercel`, `.next`, `node_modules` y el estado local están ignorados. `.env.example` contiene ejemplos sin secretos operativos.

## 3. Crear el proyecto y seleccionar la rama

1. Entrar a [Vercel](https://vercel.com/new) e importar el repositorio que recibió la rama. Si no aparece, revisar el acceso de la integración de GitHub.
2. Elegir `codex/vercel-local-api` si el asistente permite seleccionar la rama.
3. Usar estos valores:

| Opción | Valor |
|---|---|
| Framework | Next.js |
| Root Directory | Raíz del repositorio: `.` |
| Node.js | 24.x |
| Install Command | `corepack pnpm install --frozen-lockfile` |
| Build Command | `corepack pnpm run build` |
| Output Directory | Automático de Next.js: `.next` |

La carpeta local se llama `frontend`, pero GitHub contiene sus archivos en la raíz. **No poner `frontend` como Root Directory en Vercel.** `vercel.json` ya define los comandos.

Vercel suele elegir `main`. Ir a **Settings → Environments → Production → Branch Tracking**, colocar `codex/vercel-local-api` y guardar. Si la importación inicial tomó `main`, configurar la rama y crear otro despliegue desde **Deployments → Create Deployment** con:

```text
https://github.com/Maaupelozo/nutribalance-tp-web/tree/codex/vercel-local-api
```

Si usás un fork, reemplazar el propietario. Confirmar la rama en los detalles antes de usar la publicación definitiva.

## 4. Variables del frontend

En **Settings → Environment Variables**, agregar para **Production** y también para **Preview** si vas a probar ese entorno:

| Variable | Valor inicial | Propósito |
|---|---|---|
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | pnpm 11.25.0 fijado en el proyecto |
| `PUBLIC_SITE_ORIGIN` | `https://tu-proyecto.vercel.app` | Dominio real, metadatos y sitemap |
| `EXPRESS_ALLOWED_ORIGIN` | `https://nutribalance-mauricio.maauri.chatgpt.site` | Origen ya configurado en la API actual |
| `CF_ACCESS_CLIENT_ID` | Sin definir inicialmente | Opcional, sección 8 |
| `CF_ACCESS_CLIENT_SECRET` | Sin definir inicialmente | Opcional, sección 8 |

Reemplazar el dominio de ejemplo por el asignado o por un dominio propio ya vinculado. Usar HTTPS, sin ruta ni barra final. Después de cambiar variables, **volver a desplegar**: los metadatos se generan durante la compilación.

No cargar en Vercel la contraseña profesional, `DATABASE_URL`, `SESSION_SECRET` ni el token de `cloudflared`: pertenecen al backend local. Las credenciales de Access nunca llevan el prefijo `NEXT_PUBLIC_`.

### Mantener el backend actual en la primera publicación

El navegador llama al gateway del propio sitio de Vercel. Este comprueba el origen real y después envía `EXPRESS_ALLOWED_ORIGIN` a Express. Conservar el origen actual permite probar Vercel sin cambiar el backend ni la web anterior. Las llamadas de datos van a `api.neadev.com`, no al sitio anterior.

Si después querés cambiar también el origen de Express, editar el `.env` del **backend**:

```dotenv
TUNNEL_APP_ORIGIN=https://tu-proyecto.vercel.app
```

Reiniciar la API y colocar exactamente el mismo valor en `EXPRESS_ALLOWED_ORIGIN` de Vercel. El perfil `serve:portable:tunnel` toma `TUNNEL_APP_ORIGIN`; cambiar solamente `APP_ORIGIN` no reemplaza ese perfil. Coordinar los otros clientes que sigan usando la API. CORS controla el uso desde navegadores; la restricción entre servidores se agrega con Access.

## 5. API y túnel en la PC

Usar el `.env` privado existente, conservando URLs, contraseñas y datos. No reemplazarlo por la plantilla. Para arrancar manualmente:

```powershell
Set-Location 'C:\Users\Bruno\Desktop\Nutri_express\backend'
npm run serve:portable:tunnel
```

El comando utiliza PostgreSQL si responde o inicia la base portable existente, aplica migraciones pendientes, prepara la cuenta ficticia si falta, compila e inicia Express. No iniciar otra copia si `/health` ya responde.

Cloudflare Tunnel está instalado como servicio automático. El origen debe seguir siendo **`api.neadev.com → http://127.0.0.1:3000`**, sin `/api/v1` al final. Si cambia `PORT`, cambiar también el origen del túnel. PostgreSQL permanece privado; no publicar su puerto.

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
Invoke-RestMethod https://api.neadev.com/health
Get-Service Cloudflared
```

Ambos healthchecks deben devolver `status: ok`. Después de activar Access, el chequeo público directo requiere autorización: usar preferentemente el verificador del frontend.

## 6. Arranque automático en Windows

Cloudflare ya inicia como servicio. Para la API y su base portable, crear una tarea en **Programador de tareas → Crear tarea**:

1. Nombre: `NutriBalance API`. Elegir el usuario con acceso al proyecto y al `.env`; para el caso simple, ejecutar solo cuando ese usuario haya iniciado sesión.
2. Desencadenador: **Al iniciar sesión**, con demora de 30 segundos.
3. Acción: iniciar un programa con estos valores:

| Campo | Valor |
|---|---|
| Programa | `C:\Program Files\nodejs\node.exe` |
| Argumentos | `--import tsx scripts/arrancar.ts --portable --tunel` |
| Iniciar en | `C:\Users\Bruno\Desktop\Nutri_express\backend` |

4. Configuración: reintentar cada minuto si falla, hasta tres veces; **no iniciar una instancia nueva** si ya está ejecutándose; quitar el límite de duración.
5. Revisar las condiciones de energía para evitar que se detenga al cambiar a batería. Mantener la PC sin suspensión durante el servicio.
6. Para la primera prueba, reiniciar la PC e iniciar sesión: así la tarea no compite con la copia temporal que ya estaba ejecutándose.
7. Comprobar que la tarea esté activa, que `/health` responda y que funcione la URL pública.

Esto inicia la API **después de entrar a Windows**. Un servicio sin iniciar sesión requiere una cuenta de servicio o tarea con sus permisos y credenciales. Esta rama no instala la tarea ni cambia opciones de energía.

## 7. Verificar desde la web

Desde la carpeta del frontend, con Node 24 y dependencias instaladas:

```powershell
corepack pnpm check:public https://tu-proyecto.vercel.app
```

Esperado: **8/8 controles aprobados**, sin crear pacientes, turnos o consultas. Comprueba frontend, disponibilidad, cookie segura, rechazo anónimo, origen ajeno y HTTP 410 de las rutas D1. `/api/health` solo comprueba el frontend; `/api/v1` verifica Express.

Si Preview exige iniciar sesión en Vercel, ese bloqueo impide el chequeo automático. Usar Production pública o la configuración de acceso aprobada para ese entorno.

Desde otro equipo o un teléfono con datos móviles:

1. Abrir portada y horarios en `/solicitar-turno`.
2. Ingresar en `/ingresar` con la cuenta de Express. Las credenciales están en el `.env` privado del backend; una cuenta existente conserva su clave.
3. Crear o abrir una ficha ficticia y comprobar que persiste al recargar.
4. Solicitar un turno ficticio y confirmarlo vinculándolo a esa ficha.
5. Guardar una consulta independiente y recargar el historial. Una consulta vinculada requiere que el turno confirmado ya haya comenzado.
6. Cancelar el turno de prueba para liberar el horario.
7. Cerrar sesión y comprobar que el panel exige acceso nuevamente.

### Verificación HTTP optativa con credenciales

```powershell
$env:TEST_SITE_ORIGIN='https://tu-proyecto.vercel.app'
node tests/express-live-flow.mjs --production --read-only
```

Espera una línea JSON por stdin, oculta en terminal, con `email`, `password` y `patientId` de una ficha ficticia con historial. No poner credenciales en argumentos ni guardarlas en archivos. `--read-only` comprueba sesión, ficha, historial y logout sin crear registros. Sin esa opción crea una ficha y consulta ficticias, cancela su turno y conserva esos registros como verificación.

## 8. Cloudflare Access, opcional

El código está preparado; no se creó ni activó una política en la cuenta.

1. En Zero Trust, crear un **Service Token** para el gateway de Vercel y guardar el secreto en el gestor de credenciales del equipo.
2. Cargar sus valores en `CF_ACCESS_CLIENT_ID` y `CF_ACCESS_CLIENT_SECRET` de Vercel. Marcar el secreto como sensible y volver a desplegar.
3. Preparar también la web anterior u otros clientes que deban seguir usando la API antes de restringir el hostname.
4. Crear una aplicación Access para `api.neadev.com`, con política **Service Auth** que permita ese token. Evitar bypass generales.
5. Confirmar que el acceso directo sin token se rechace y que `check:public` mediante Vercel siga aprobando.

El gateway incorpora las credenciales desde sus variables y no acepta esos encabezados desde el navegador. Si se configura solo uno de los valores, devuelve HTTP 503 hasta completar la configuración. El login profesional y CSRF siguen activos.

Turnstile y nuevas reglas WAF quedan como mejoras posteriores; Turnstile no está integrado. Los límites por IP de la API verán las direcciones de salida de Vercel: antes de endurecerlos, ajustar la estrategia para no bloquear usuarios conjuntamente. No confiar en encabezados de IP arbitrarios del navegador.

## 9. Diagnóstico y vuelta atrás

| Síntoma | Revisar |
|---|---|
| Compilación falla por `cloudflare:workers` | Selección de rama: `main` no tiene esta adaptación |
| Error de instalación/pnpm | Node 24, Corepack habilitado y versión fijada |
| Portada abre, panel o turnos fallan | API local, túnel y controles `/api/v1` |
| 502 o 530 de Cloudflare | PC, Internet, Express, Cloudflared y origen del túnel |
| 403 | Dominio, origen del gateway, política Access y credenciales |
| 503 `GATEWAY_MISCONFIGURED` | Completar ambas variables de Access o quitar ambas si no se usa |
| 401 en pacientes sin sesión | Es esperado; ingresar con la cuenta profesional |
| 429 | Esperar `Retry-After`; revisar límites compartidos de salida de Vercel |
| Sitemap apunta al sitio anterior | Corregir `PUBLIC_SITE_ORIGIN` y volver a desplegar |
| 410 en rutas D1 antiguas | Es esperado; la interfaz utiliza `/api/v1` |

Conservar la publicación anterior y `main` para volver atrás. Un rollback del frontend no revierte migraciones del backend. Después de activar Access, un frontend anterior también necesita credenciales autorizadas para consumir la API.

## 10. Evidencia y pendientes

Verificado localmente el 15/11/2026:

| Control | Resultado |
|---|---|
| Instalación `corepack pnpm install --frozen-lockfile` | Aprobada con pnpm 11.25.0 |
| Compilación Next.js de producción | Aprobada, incluidas sus comprobaciones TypeScript |
| `pnpm typecheck` | Aprobado |
| `pnpm test` | 21 pruebas aprobadas |
| `check:public` contra Next.js compilado y Express por Cloudflare | 8/8 aprobados |
| Login, cookie, lectura de ficha ficticia existente, historial y logout | Aprobados por HTTP; cero registros nuevos |
| Navegador en Next.js compilado | 16 horarios disponibles para la fecha de prueba y redirección al login al entrar al panel sin sesión |

El frontend de verificación se ejecutó en localhost:5173 y consumió la API real mediante `api.neadev.com`. Las comprobaciones de Cloudflare Access usan credenciales ficticias en pruebas automatizadas; no se verificó una política real de Access ni se publicó en Vercel.

Una comprobación local no equivale a una publicación en Vercel. Quedan: push de la rama, proyecto de Vercel, dominio y variables, despliegue real, recorrido desde otro dispositivo y tarea automática de Windows. Access es opcional y se activa después de integrar sus credenciales.

Las pruebas `worker-flow.mjs` corresponden a D1 en `main`. Los documentos anteriores conservan sus fechas y no prueban este despliegue. No borrar ni transformar bases para cambiar de frontend.

## Fuentes oficiales

- [Vercel: Git y rama de producción](https://vercel.com/docs/git).
- [Vercel: compilación y Corepack](https://vercel.com/docs/builds/configure-a-build).
- [Vercel: vercel.json](https://vercel.com/docs/project-configuration/vercel-json).
- [Next.js: comandos](https://nextjs.org/docs/app/api-reference/cli/next).
- [Cloudflare Access: service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).
