# Exposición: frontend público y backend local

Rama: `codex/cloudflare-expo`. La rama `codex/vercel-local-api` conserva la preparación anterior para Vercel.

## Dirección para presentar

**https://api.neadev.com/** abre la aplicación completa. El nombre del subdominio se conserva porque el túnel existente ya lo utiliza.

```text
Navegador → HTTPS / Cloudflare Tunnel
         → frontend Next.js en 127.0.0.1:3000
         → gateway /api/v1 del frontend
         → API Express privada en 127.0.0.1:3001
         → PostgreSQL local existente
```

Cloudflare continúa apuntando a `http://127.0.0.1:3000`, que ahora corresponde al frontend. Express escucha exclusivamente en loopback en el puerto 3001. Las operaciones HTTP necesarias siguen disponibles a través del gateway de la web, con autenticación y CSRF. La base de datos no se publica.

## Iniciar

En PowerShell:

```powershell
Set-Location 'C:\Users\Bruno\Desktop\Nutri_express\frontend'
corepack pnpm expo
```

El comando compila el frontend con su dirección pública, inicia la API y la base portable si hace falta y luego inicia Next.js. Usa el backend hermano `../backend` y su `.env` privado, conservando datos y contraseñas. Se puede indicar otro directorio con `NUTRI_BACKEND_DIR`.

Si ambos servicios ya están funcionando, informa la dirección sin iniciar duplicados. Si el puerto 3000 está ocupado por la antigua API u otro programa, se detiene con un mensaje en lugar de cerrar procesos ajenos. No ejecutar a la vez el arranque anterior del backend en el puerto 3000.

El servicio de Windows `Cloudflared` debe estar activo y mantener el origen `http://127.0.0.1:3000`. La PC debe permanecer encendida, con Internet y sin suspensión durante la exposición.

Para detener los procesos que inició el comando:

```powershell
corepack pnpm expo:stop
```

También se puede usar Ctrl+C si se ejecuta en una terminal. El cierre detiene el frontend y solicita al backend apagar ordenadamente la API y la base portable que haya iniciado. No detiene el servicio de Cloudflare ni una base reutilizada de otro proceso.

## Configuración local

El archivo ignorado `.env.local` de este perfil contiene:

```dotenv
PUBLIC_SITE_ORIGIN=https://api.neadev.com
EXPRESS_ALLOWED_ORIGIN=https://api.neadev.com
EXPRESS_LOCAL_API_ORIGIN=http://127.0.0.1:3001
TEST_SITE_ORIGIN=https://api.neadev.com
```

El lanzador aplica estos valores al backend: puerto 3001, origen del frontend público, confianza únicamente en loopback, cookie Secure y SameSite=Lax. No sobrescribe el `.env` del backend. Las contraseñas profesionales permanecen en ese archivo privado.

El gateway admite un destino local configurado únicamente en `http://127.0.0.1` con puerto explícito, sin rutas, consultas ni credenciales. Reconoce la conexión HTTPS del navegador y establece el encabezado de proxy en el salto interno para mantener la cookie Secure. No transmite encabezados de IP arbitrarios del navegador.

Este modo no necesita las credenciales de Cloudflare Access entre frontend y API porque ambas partes se comunican por loopback. El lanzador las deja desactivadas en sus procesos. La publicación pública conserva el login profesional y CSRF; no configura una nueva política de Access ni Turnstile.

## Comprobar antes de exponer

```powershell
corepack pnpm check:public https://api.neadev.com
```

Esperado: 8/8 controles aprobados. La raíz muestra HTML de NutriBalance; `/api/health` identifica el frontend y `/api/v1` comprueba la integración. El antiguo `/health` directo del backend ya no es una ruta pública de esta topología.

Abrir la URL desde otro dispositivo, consultar horarios, ingresar con la cuenta profesional, abrir una ficha ficticia e historial y cerrar sesión. Para la demostración de una consulta vinculada, el turno debe estar confirmado y haber comenzado; si sigue en el futuro, usar una consulta independiente.

Los registros de ejecución y el estado del lanzador quedan en `.sites-runtime/expo/`, fuera de Git. No compartir `.env`, cookies ni credenciales del túnel. La documentación de Vercel describe otro despliegue: no configurar `EXPRESS_LOCAL_API_ORIGIN` en un servidor remoto como Vercel.

## Verificación realizada el 15/11/2026

- Compilación de Next.js y TypeScript aprobadas.
- 24 pruebas del frontend/gateway aprobadas, incluido el origen HTTPS detrás del túnel y la restricción del destino local.
- 8/8 controles públicos aprobados en `https://api.neadev.com`.
- Flujo HTTP completo aprobado: login, alta/edición de ficha ficticia, solicitud, conflicto de horario, confirmación, consulta independiente, historial, cancelación y logout. El turno de prueba quedó cancelado.
- Chrome real: formulario de acceso, panel, pacientes, agenda, sesión después de recargar, cookie Secure/HttpOnly/Lax y logout aprobados.
- La raíz pública devuelve la web; el antiguo `/health` del backend no se expone directamente y devuelve 404.
- Se comprobó la detención y el reinicio mediante el lanzador. La base utiliza los datos persistentes existentes.
