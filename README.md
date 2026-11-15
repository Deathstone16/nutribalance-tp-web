# NutriBalance · Frontend en Vercel y API local

**Pipeline de main:** [validación en GitHub y despliegue en la PC](docs/pipeline-local.md). El agente local aplica únicamente commits aprobados por Actions y mantiene disponibles la web y un túnel separado para la API.

**Repositorio para publicar:** [Deathstone16/nutribalance-tp-web](https://github.com/Deathstone16/nutribalance-tp-web), fork propio de [Maaupelozo/nutribalance-tp-web](https://github.com/Maaupelozo/nutribalance-tp-web). La rama de producción es `main`. El remoto `origin` apunta al fork y `upstream` conserva el original.

**Exposición por Cloudflare:** `pnpm expo` inicia frontend y backend locales. El túnel existente publica la web en `https://api.neadev.com`. Ver [cómo iniciar y detener la exposición](docs/exposicion-cloudflare.md).

Next.js 16 aloja la interfaz y el gateway HTTP. Express y PostgreSQL permanecen en tu PC, accesibles mediante Cloudflare Tunnel. La misma versión está preparada para importar el fork en Vercel.

**[Guía para importar el fork en Vercel y configurar la API](docs/despliegue-vercel.md).** Falta conectar el proyecto, configurar sus variables y ejecutar el despliegue real en tu cuenta de Vercel.

Usar únicamente datos ficticios. Las credenciales profesionales se entregan por separado y se ingresan en el formulario; no se guardan en Git ni en el frontend.

## Conexión

```text
Navegador → Next.js /api/v1 en Vercel → Cloudflare Tunnel → Express/PostgreSQL en tu PC
```

El gateway mantiene la sesión en el origen del frontend con cookie `nutri.sid`, HttpOnly, Secure, SameSite=Lax y Path=/api/v1. Reenvía únicamente rutas del contrato, la sesión y CSRF. Comprueba el origen del navegador en escrituras y utiliza un destino fijo. Las credenciales opcionales de Cloudflare Access se incorporan exclusivamente en el servidor.

## Desarrollo local

Requisitos: Node.js 24 y pnpm 11.25.0, fijados en `.nvmrc` y `package.json`.

```powershell
corepack pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
corepack pnpm dev
```

Conservar `.env.local` si ya existe y editar solo los valores necesarios. Abrir `http://localhost:5173`. La API local y su túnel deben estar activos; la plantilla conserva el origen que esa API ya tiene configurado. El gateway comprueba por separado el origen real del navegador.

```powershell
corepack pnpm build
corepack pnpm start
```

`build` genera `.next`; `start` ejecuta el frontend compilado en localhost:5173. Vercel administra su propio servidor.

## Verificar

```powershell
corepack pnpm build
corepack pnpm typecheck
corepack pnpm test
corepack pnpm check:public https://tu-proyecto.vercel.app
```

Reemplazar la URL por la publicación real. `check:public` realiza ocho controles sin crear pacientes, turnos o consultas: frontend, disponibilidad, cookie, rechazo anónimo, origen ajeno y rutas antiguas desactivadas. Un 200 de `/api/health` solo comprueba el frontend; las rutas `/api/v1` verifican la conexión con Express.

La prueba optativa `tests/express-live-flow.mjs --production` permite elegir el frontend con `TEST_SITE_ORIGIN`. Recibe credenciales JSON por stdin, con entrada oculta en terminal. Su modo normal crea una ficha y consulta ficticias y cancela su turno; `--read-only` requiere el ID de una ficha ficticia con historial y no crea registros. Consultar la guía antes de ejecutarla. No poner credenciales en argumentos, archivos, Git ni capturas.

## Rutas

| Ruta | Uso |
|---|---|
| `/` | Presentación y preguntas frecuentes |
| `/solicitar-turno` | Disponibilidad y solicitud pública |
| `/ingresar` | Cuenta profesional de Express |
| `/panel` | Pacientes, agenda, ficha e historial |
| `/api/v1/*` | Gateway hacia Express |
| `/api/health` | Estado del frontend |
| `/api/panel`, `/api/solicitudes` | Desactivadas: HTTP 410; no utilizan D1 |
| `/demo-profesional`, `/demo-paciente` | Prototipos con datos locales de ejemplo |

## Código y documentación conservados

Los archivos de Vinext, Docker/Render, D1, conectores y sus pruebas históricas se conservan como referencia. Los comandos predeterminados utilizan Next.js; la interfaz operativa utiliza Express. Las pruebas `worker-flow.mjs` corresponden a la versión histórica con D1 y no validan esta publicación en Vercel.

El contrato está en [docs/api-externa](docs/api-externa/). Los documentos de entrega y las evidencias anteriores conservan sus fechas; no constituyen una verificación de Vercel. La guía nueva indica la configuración vigente de esta rama.
