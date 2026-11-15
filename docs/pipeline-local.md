# Pipeline del frontend

Repositorio operativo: [Deathstone16/nutribalance-tp-web](https://github.com/Deathstone16/nutribalance-tp-web). El agente consulta `main` de este fork. `origin` apunta al fork propio y `upstream` al original de Mauricio.

`.github/workflows/ci-local.yml` se ejecuta al hacer push a `main`, abrir un PR hacia `main` o iniciarla manualmente. Usa Node.js 24 y pnpm 11.25.0; instala el lockfile, ejecuta las pruebas, compila Next.js y comprueba TypeScript.

Solo un push o ejecución manual en `main` con validación aprobada solicita un despliegue al entorno `local-cloudflare`. Las solicitudes de PR no despliegan.

Un agente en la PC consulta el resultado de Actions cada 30 segundos, obtiene exactamente el commit aprobado y lo prepara en una carpeta nueva. Después reinicia la web y la API con esa versión, comprueba los servicios y publica el resultado en GitHub Deployments. El backend tiene su propia pipeline y se procesa con el mismo agente, de forma serial.

La web continúa en **https://api.neadev.com/**. El backend escucha en loopback:3001 y también tiene un túnel directo separado para Postman. La dirección temporal de esa API se registra en el estado local y en la colección de Postman; permanece mientras siga activo ese túnel y puede cambiar al reiniciar la PC.

La configuración privada, las bases, los logs y las copias de preparación permanecen en la PC. GitHub no recibe contraseñas profesionales ni credenciales de PostgreSQL. No se necesita instalar un ejecutor self-hosted ni exponer un endpoint de administración.

La guía completa está en el repositorio backend: [despliegue-automatico.md](https://github.com/Deathstone16/NutriBalanceExpress/blob/main/docs/despliegue-automatico.md).

Para detener solo las actualizaciones automáticas, desde la carpeta general del proyecto:

```powershell
node deployment/ops/agent.mjs --config deployment/config.json --stop
```

La aplicación continúa activa. Para reiniciar el agente:

```powershell
& ./deployment/ops/start-agent.ps1
```

Consultar `deployment/state.json` para identificar los commits realmente activos. Una pipeline verde puede estar esperando a que la PC esté conectada; el estado de GitHub Deployments confirma el despliegue.

Al importar este mismo fork en Vercel con producción en `main`, Vercel también despliega automáticamente sus nuevos commits. Configurar ese proyecto según [despliegue-vercel.md](despliegue-vercel.md); la configuración de loopback de la PC no se copia a Vercel.
