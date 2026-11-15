# Publicar el fork en Vercel con la API en tu PC

Actualizado: 15 de noviembre de 2026.

## 1. Repositorio preparado

Importar **[Deathstone16/nutribalance-tp-web](https://github.com/Deathstone16/nutribalance-tp-web)**, rama **`main`**. Es tu fork de Mauricio, con Next.js 16, Node.js 24, gateway de Express y `vercel.json`. El remoto local `origin` apunta a tu fork; `upstream` conserva el original.

```text
Navegador → Next.js/gateway en Vercel → api.neadev.com por Cloudflare
          → gateway local → Express 127.0.0.1:3001 → PostgreSQL local
```

La web de exposición en `https://api.neadev.com` está protegida por Cloudflare Access. Sus rutas `/api/v1` permiten que Vercel consuma la API local cuando se configura el Service Token. La API directa de Postman tiene un segundo túnel temporal separado; no hace falta usar esa URL cambiante en Vercel.

## 2. Importar en Vercel

1. Entrar a [New Project](https://vercel.com/new) con tu cuenta vinculada a GitHub.
2. Seleccionar **Deathstone16/nutribalance-tp-web**. Si no aparece, habilitar ese fork en los permisos de la integración de GitHub de Vercel.
3. Elegir `main` como rama de producción.
4. Usar estos valores:

| Opción | Valor |
|---|---|
| Framework | Next.js |
| Root Directory | Raíz del repositorio: `.` |
| Node.js | 24.x |
| Install Command | `corepack pnpm install --frozen-lockfile` |
| Build Command | `corepack pnpm run build` |
| Output Directory | Automático de Next.js |

La carpeta local se llama `frontend`, pero GitHub contiene sus archivos en la raíz. **No poner `frontend` como Root Directory.** `vercel.json` ya fija framework y comandos.

## 3. Variables de Vercel

Agregar en Production. Configurar Preview por separado si se va a usar:

| Variable | Valor |
|---|---|
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` |
| `PUBLIC_SITE_ORIGIN` | `https://tu-proyecto.vercel.app` |
| `EXPRESS_ALLOWED_ORIGIN` | `https://api.neadev.com` |
| `CF_ACCESS_CLIENT_ID` | Client ID de tu Service Token de Cloudflare |
| `CF_ACCESS_CLIENT_SECRET` | Client Secret del mismo Service Token; marcar como sensible |

Usar en `PUBLIC_SITE_ORIGIN` el dominio HTTPS real de Vercel, sin ruta ni barra final. Si el dominio se conoce después del primer despliegue, corregirlo y volver a desplegar para regenerar metadatos y sitemap.

**Dejar `EXPRESS_LOCAL_API_ORIGIN` sin definir en Vercel.** El loopback `127.0.0.1:3001` solo corresponde al despliegue que corre en tu PC. En Vercel el destino HTTPS ya está fijado en el gateway.

Como Access ya está activo, ambas credenciales son necesarias para el dominio actual. Cargarlas solo en las variables del servidor de Vercel, sin prefijo `NEXT_PUBLIC_`, sin pegarlas en Git ni en este documento. En Cloudflare, la aplicación que cubre `api.neadev.com` debe permitir ese token con una política **Service Auth**. Volver a desplegar después de guardar las variables.

No cargar contraseñas profesionales, `DATABASE_URL`, `SESSION_SECRET`, archivos `.env` privados ni el token de cloudflared. Express conserva sus credenciales y su base en la PC.

`EXPRESS_ALLOWED_ORIGIN=https://api.neadev.com` coincide con la configuración efectiva de la exposición local. El gateway de Vercel comprueba por separado el origen del navegador y utiliza este valor únicamente en la conexión entre servidores. No hace falta cambiar el `.env` del backend para publicar Vercel con esta arquitectura.

## 4. Desplegar y verificar

Presionar **Deploy** y confirmar en los detalles que se publicó `main` de tu fork. Después de conectar el repositorio, los pushes a `main` generan nuevos despliegues de producción en Vercel.

Desde el frontend local:

```powershell
corepack pnpm check:public https://tu-proyecto.vercel.app
```

Esperado: 8/8 controles aprobados. Verifica portada, disponibilidad, cookie segura, rechazo anónimo, origen ajeno y rutas D1 antiguas desactivadas, sin crear registros. `/api/health` solo comprueba Next.js; `/api/v1` verifica la conexión con Express.

Desde otro dispositivo, abrir `/solicitar-turno`, ingresar en `/ingresar`, abrir una ficha ficticia con historial, recargar y cerrar sesión. Las credenciales profesionales se consultan de forma privada; no se guardan en Git ni en capturas.

La sesión usa cookie HttpOnly, Secure, SameSite=Lax y Path=/api/v1. Las escrituras conservan CSRF y comprobación del origen. Las rutas históricas `/api/panel` y `/api/solicitudes` devuelven 410; la interfaz utiliza Express.

## 5. Mantener la PC disponible

La PC debe seguir encendida, conectada, con el usuario iniciado y sin suspensión. El agente de despliegue inicia frontend, API y PostgreSQL después de entrar a Windows; Cloudflare ya tiene un servicio automático. No iniciar otra copia de Express ni crear otra tarea que compita por los puertos.

| Servicio | Dirección |
|---|---|
| Frontend local | `http://127.0.0.1:3000/api/health` |
| API local y base | `http://127.0.0.1:3001/health` |
| Web y gateway públicos | `https://api.neadev.com` |

El túnel fijo debe seguir apuntando a **127.0.0.1:3000**, donde corre Next.js. El gateway local comunica con Express en 3001. PostgreSQL permanece privado. No cambiar el túnel a 3001 porque se perdería la web de exposición.

La [pipeline local](pipeline-local.md) comprueba Actions de `main` del fork y aplica los cambios en la PC. El backend tiene su propia pipeline. Vercel mantiene su integración Git por separado; sus despliegues pueden coexistir con Cloudflare.

Consultar [la guía de operación y recuperación](https://github.com/Deathstone16/NutriBalanceExpress/blob/main/docs/despliegue-automatico.md) para detener/reiniciar el agente, revisar versiones activas, respaldos y logs.

## 6. Cloudflare Access existente

El gateway admite `CF_ACCESS_CLIENT_ID` y `CF_ACCESS_CLIENT_SECRET` como variables exclusivas del servidor. Configurar ambas o ninguna; una pareja incompleta devuelve 503. No usar prefijo `NEXT_PUBLIC_`.

No activar una política Access para todo `api.neadev.com` sin preparar también el acceso a la web local: ese hostname publica tanto la interfaz como `/api/v1`. Para restringir el acceso de servidores, conviene preparar un hostname estable exclusivo para Express, configurar Service Auth y adaptar el destino fijo del gateway. Verificar también los demás clientes antes de activar la restricción.

El 15/11/2026, Cloudflare Access responde 403 en ese dominio sin token; frontend, API y base responden correctamente en la PC. La comprobación completa desde Vercel queda pendiente de cargar el token y publicar allí. Este cambio no modifica tus políticas de Cloudflare. Turnstile no está integrado. Login profesional, CSRF, validación y límites de la API siguen activos.

## 7. Diagnóstico

| Síntoma | Revisar |
|---|---|
| El fork no aparece | Cuenta `Deathstone16` y permisos de la integración de Vercel |
| Error `cloudflare:workers` | Importar tu fork actualizado, rama `main`, framework Next.js |
| Error de pnpm | Node 24, Corepack y comando de instalación del proyecto |
| Portada abre pero datos fallan | API en 3001, web en 3000, túnel y `/api/v1` |
| 502/530 o gateway no disponible | PC, Internet, Cloudflared, servicios y ausencia de loopback en Vercel |
| 403 | `EXPRESS_ALLOWED_ORIGIN`, dominio y política Access |
| 503 de configuración | Pareja completa de credenciales Access o ambas sin definir |
| 401 sin sesión | Ingresar con la cuenta profesional |
| 429 | Esperar `Retry-After`; los gateways comparten límites por IP de salida |
| Sitemap incorrecto | `PUBLIC_SITE_ORIGIN` y nuevo despliegue |

Un rollback del frontend no revierte cambios de esquema ni datos del backend. Los archivos históricos de Vinext/D1 se conservan como referencia.

## 8. Qué falta en Vercel

El código, el fork y la configuración están preparados. La publicación real requiere importar el fork en tu cuenta de Vercel, cargar las variables, desplegar y verificar la URL resultante. La compilación y las pruebas locales/Actions no sustituyen esa comprobación del entorno publicado.

## Fuentes oficiales

- [Vercel: Git e integración de despliegues](https://vercel.com/docs/git).
- [Vercel: compilación y Corepack](https://vercel.com/docs/builds/configure-a-build).
- [Vercel: variables de entorno](https://vercel.com/docs/environment-variables).
- [Cloudflare Access: Service Tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).
