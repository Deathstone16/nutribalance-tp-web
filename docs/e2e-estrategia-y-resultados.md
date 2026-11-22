# Pruebas E2E de flujos de usuario: estrategia y resultados

Fecha de ejecución: 21/11/2026 · Entorno: copia local (front Next en dev `localhost:5173` + API Express + PostgreSQL local `nutri_test`), correos guardados en `backend/.local/correos`. Todas las pruebas operan **solo desde el navegador** (interfaz real), sin llamar a la API por fuera salvo para preparar o manipular datos de contexto.

## 1. Estrategia

### Actores y objetivos
| Actor | Objetivo de negocio | Flujo crítico |
|---|---|---|
| **Visitante** | Conocer el consultorio y pedir un turno | Landing → solicitud → aviso de correo |
| **Paciente (con correo)** | Confirmar su solicitud | Enlace del correo → confirmación |
| **Paciente recurrente** | Ser reconocido por DNI | Solicitud con DNI existente → "Paciente existente" en el panel |
| **Profesional** | Gestionar agenda, pacientes e historias | Login → resumen → confirmar turno → registrar consulta → historial |
| **Usuario no autorizado** | (no debe poder) ver datos clínicos | Acceso directo a `/panel`, enlaces falsos |

### Riesgos priorizados
1. **Datos clínicos expuestos** o panel accesible sin sesión (crítico).
2. **Turnos duplicados** o horarios bloqueados indefinidamente (alto).
3. **Confirmación por correo** que no funcione o que confirme sin intención (alto).
4. **Reconocimiento erróneo** de pacientes por DNI/correo (alto).
5. **Pérdida de datos** al validar formularios o al fallar la red (medio).
6. **Accesibilidad y uso en celular** (medio).

### Pirámide y alcance
Esta tanda es la capa E2E (navegador real). Debajo ya existen 47 tests de API/unidad (backend) y 25 de cliente/dominio (front). Por eso aquí se prueba **integración visible al usuario**, no reglas ya cubiertas abajo.

### Técnicas de diseño de casos
| Sigla | Técnica | Dónde se aplica |
|---|---|---|
| **PE** | Partición en clases de equivalencia | DNI, correo, teléfono, búsquedas |
| **VL** | Análisis de valores límite | DNI 6/7/9/10 dígitos, teléfono 5/6, fechas hoy/+60/+61, peso 0/500/501 |
| **TD** | Tabla de decisión | Cuándo habilitar "Confirmar" (correo × estado × ficha) |
| **ST** | Transición de estados | pendiente → confirmado → atendido / cancelado / vencido |
| **EG** | Adivinación de errores | XSS en nombre, doble clic, honeypot, enlace repetido, token cortado |
| **FL** | Pruebas de flujo completo (escenario) | Visitante→paciente→profesional de punta a punta |
| **AX** | Accesibilidad | Contraste AA, teclado, foco, `aria-*`, saltar contenido |
| **RS** | Responsive | 375 / 768 / 1366 px, desborde horizontal |
| **SEG** | Seguridad desde el cliente | Acceso sin sesión, token en URL, escapado de HTML |
| **EX** | Exploratoria con sesión acotada | Navegación libre buscando roturas visuales o de estado |

### Criterios
- **Pasa:** el resultado observable coincide con lo esperado y no hay errores de consola.
- **Falla:** resultado distinto, error de consola o pérdida de datos.
- **Hallazgo:** comportamiento correcto pero mejorable (se registra sin marcar fallo).
- Cada falla se clasifica **Crítica / Alta / Media / Baja**.

### Datos de prueba
Ficticios y reproducibles: pacientes Ana (DNI 30111222), Bruno (28999111), Carla (sin DNI); turnos del día; una solicitud sin correo confirmado. Se restablecen antes de ejecutar.

### Catálogo de casos
**Visitante / paciente (V)**
| ID | Caso | Técnica |
|---|---|---|
| V-01 | Landing: header fijo al hacer scroll y anclas sin tapar títulos | FL, RS |
| V-02 | Menú móvil de la landing abre/cierra y navega | RS |
| V-03 | Solicitud feliz completa → pantalla "confirmá en tu correo" | FL |
| V-04 | DNI: 6 / 7 / 9 / 10 dígitos, con puntos, con letras | PE, VL |
| V-05 | Correo: vacío, sin @, válido | PE |
| V-06 | Teléfono: 5 y 6 caracteres | VL |
| V-07 | Fecha: pasada, hoy, +60, +61 días, fin de semana | VL, PE |
| V-08 | Enviar sin elegir horario | TD |
| V-09 | Doble clic en "Enviar" crea una sola solicitud | EG |
| V-10 | Nombre con HTML/script se muestra escapado | EG, SEG |
| V-11 | Horario ya tomado por otra persona → mensaje y refresco | ST, EG |
| V-12 | Honeypot lleno no envía | EG |
| C-01 | Enlace válido: botón confirma y muestra fecha/hora | FL |
| C-02 | Repetir el enlace confirmado (idempotente) | EG |
| C-03 | Enlace sin token / token cortado / inventado | PE, EG |
| C-04 | Enlace vencido libera el horario y avisa | ST |
| C-05 | La página no confirma solo al cargar (sin clic) | EG, SEG |

**Profesional (P)**
| ID | Caso | Técnica |
|---|---|---|
| P-01 | `/panel` sin sesión redirige a `/ingresar` | SEG |
| P-02 | Login con clave incorrecta, vacío, correo inválido | PE |
| P-03 | Login correcto → panel; `/ingresar` con sesión redirige | FL |
| P-04 | Resumen: contadores = datos; "sin confirmar" sin botón | TD |
| P-05 | Confirmar solicitud reconocida (ficha preseleccionada) | FL, TD |
| P-06 | Crear ficha desde solicitud sin ficha (precarga) y confirmar | FL |
| P-07 | Cancelar turno y reutilizar horario | ST |
| P-08 | Agenda: filtros por estado y rango > 31 días | VL |
| P-09 | Pacientes: búsqueda por nombre, DNI, sin resultados | PE |
| P-10 | Alta de paciente: DNI duplicado, DNI inválido, mínimo válido | PE, VL |
| P-11 | Editar paciente y ver cambio en ficha | FL |
| P-12 | Ficha: historial en tabla, expandir/ocultar filas | FL, AX |
| P-13 | Registrar consulta: peso 0 / 500 / 501, campos obligatorios | VL |
| P-14 | "Registrar consulta" deshabilitada en turnos futuros | TD |
| P-15 | Datos con HTML se muestran escapados en el panel | EG, SEG |
| P-16 | Cierre de sesión y bloqueo del botón "atrás" | SEG |
| P-17 | Sesión vencida durante el uso: aviso sin perder el formulario | ST, EG |

**Transversales (T)**
| ID | Caso | Técnica |
|---|---|---|
| T-01 | Contraste AA en landing, solicitud, confirmación, login, panel | AX |
| T-02 | Navegación solo con teclado: saltar contenido, foco visible, Esc en diálogos | AX |
| T-03 | Foco al mensaje de error tras un envío fallido | AX |
| T-04 | Sin desborde horizontal a 375 / 768 / 1366 px | RS |
| T-05 | Errores de consola y de red durante todos los flujos | EX |
| T-06 | Escenario completo de tres actores | FL |
| T-07 | Exploración libre de 15 minutos en panel y solicitud | EX |

## 2. Resultados

**Resumen (primera ejecución):** 41 casos definidos · 38 pasaban · 2 fallaban (T-02 teclado, T-04 responsive) · 1 no ejecutado (T-07). Se encontraron **8 hallazgos** (2 altos, 2 medios, 4 bajos).

**Resumen tras las correcciones:** **40 pasan · 0 fallan · 1 no ejecutado** (T-07). Se corrigieron **4 de los 8 hallazgos** (H-01 a H-04) y se volvieron a probar en el navegador; quedan 4 de severidad baja (H-05 a H-08).

### 2.1 Visitante / paciente
| ID | Resultado | Observaciones |
|---|---|---|
| V-01 | ✅ Pasa | Header fijo en 5 posiciones de scroll (top 0; 16 px solo arriba del todo). Anclas dejan el título visible bajo el header. |
| V-02 | ✅ Pasa | Menú móvil abre/cierra, no desborda, botón 48×44 px. |
| V-03 | ✅ Pasa | Pantalla "Falta un paso: confirmá en tu correo" con correo, hora límite y estado; no revela si ya era paciente. |
| V-04 | ✅ Pasa | DNI: 9/9 clases (vacío, 6, 7, 8, 9, 10 dígitos, con puntos, letras, espacio). |
| V-05 | ✅ Pasa | Correo obligatorio; `a@b` pasa el navegador y lo rechaza el servidor (ver H-04). |
| V-06 | ✅ Pasa | Teléfono de 5 caracteres rechazado por el servidor (mensaje en inglés, H-04). |
| V-07 | ✅ Pasa | Límites min/max correctos; fin de semana sin horarios. Mensaje poco claro fuera de rango (H-05). |
| V-08 | ✅ Pasa | Envío vacío y sin horario: bloquea, avisa por campo y no llama a la API. |
| V-09 | ✅ Pasa | Triple clic → un solo POST. |
| V-10 | ✅ Pasa | `<img onerror>` en el nombre: sin ejecución en pantalla, panel ni correo (escapado). |
| V-11 | ✅ Pasa | Horario tomado por otra persona: mensaje, lista refrescada, datos conservados. |
| V-12 | ✅ Pasa | Honeypot lleno: no envía. |
| C-01…C-05 | ✅ Pasan | Confirmación, enlace repetido (idempotente), sin token / cortado / inventado, vencido (libera el horario) y **no confirma al cargar** sin clic. |

### 2.2 Profesional
| ID | Resultado | Observaciones |
|---|---|---|
| P-01 | ✅ Pasa | `/panel` sin sesión → `/ingresar`; API de pacientes, agenda y fichas: 401. |
| P-02 | ✅ Pasa | Mismo mensaje con correo inexistente y clave errónea; límite de intentos: avisa al 5.º y el front deja de llamar a la API. |
| P-03 | ✅ Pasa | Login correcto → panel; con sesión, `/ingresar` redirige al panel. |
| P-04 | ✅ Pasa | Contadores (3 · 4 · 3) iguales a la base de datos; "sin confirmar" sin botón. |
| P-05 | ✅ Pasa | Solicitud reconocida: ficha preseleccionada, confirma con un clic. |
| P-06 | ✅ Pasa | Ficha nueva precargada con los datos de la solicitud; confirma el turno. |
| P-07 | ✅ Pasa | Cancelar pide confirmación, libera el horario y quita las acciones. |
| P-08 | ✅ Pasa | Filtros por estado y rango > 31 días con mensaje claro. |
| P-09 | ✅ Pasa | Nombre, DNI parcial, mayúsculas, sin resultados. Ver H-06. |
| P-10 | ✅ Pasa | DNI duplicado e inválido bloqueados; alta mínima válida. |
| P-11 | ✅ Pasa | Edición se refleja; edad calculada correcta. |
| P-12 | ✅ Pasa | Historial en tabla, detalle desplegable con `aria-expanded`. |
| P-13 | ✅ Pasa | Límites de peso/talla/cintura (10/10), fecha futura bloqueada, obligatorios. |
| P-14 | ✅ Pasa | "Registrar consulta" deshabilitado para turnos de otro día, con explicación. |
| P-15 | ✅ Pasa | HTML en nombre y motivo se ve como texto. |
| P-16 | ✅ Pasa | Cerrar sesión → `/ingresar`; el botón "atrás" no muestra datos. |
| P-17 | ✅ Pasa | Sesión vencida: el formulario conserva lo escrito y ofrece reingresar en otra pestaña. |
| ST | ✅ Pasa | Registrar la consulta desde un turno confirmado lo pasa a "Atendido". |

### 2.3 Transversales
| ID | Resultado | Observaciones |
|---|---|---|
| T-01 | ✅ Pasa | Contraste AA: 4 pantallas públicas y 6 vistas del panel (≈ 600 textos). Único punto bajo el mínimo: el "." decorativo del logotipo (2,69:1, exento por ser logotipo). |
| T-02 | ❌ → ✅ | Fallaba por **H-01** (contraste del anillo de foco) y **H-03** (foco al cerrar cuadros); ambos corregidos y re-probados con teclado real. Lo demás bien: enlace "Saltar", orden de tabulación, etiquetas, honeypot fuera del foco, sin `tabindex` positivos. |
| T-03 | ✅ Pasa | El foco va al mensaje de error en el login y a la tarjeta de resultado al enviar o confirmar. |
| T-04 | ❌ → ✅ | Fallaba en celular (**H-02**, corregido y re-probado a 375/768/1366 px en las 4 pantallas públicas y el panel). |
| T-05 | ✅ Pasa | Sin excepciones de JavaScript; solo respuestas 4xx provocadas a propósito. Ver H-07. |
| T-06 | ✅ Pasa | Cubierto por la cadena V-03 → C-01 → P-06 en una misma sesión. El tramo hasta "Atendido" no puede hacerse en el mismo turno por la regla de P-14. |
| T-07 | ⏭ No ejecutado | No se hizo una sesión libre; todos los casos fueron guiados. |

### 2.4 Hallazgos
| # | Sev. | Hallazgo | Estado |
|---|---|---|---|
| H-01 | **Alta** | El anillo de foco no llegaba a 3:1. En el panel y el login una regla heredada (`workspace-legacy.css`: `input:focus-visible { outline: 3px solid #8bc9b3 }`) pisaba el anillo de `foundation.css` (arcilla); menta sobre papel ≈ 1,9:1. En la solicitud era lima sobre crema ≈ 1,1:1. WCAG 2.4.7 / 1.4.11. | **Corregido**: anillo único de dos tonos en `foundation.css` (arcilla 3 px, ≥ 4,8:1 sobre fondos claros, con halo blanco de 8,4 a 12,5:1 sobre los verdes oscuros); se eliminaron las reglas que lo pisaban. Verificado con teclado real en solicitud, login, fondo oscuro y panel. |
| H-02 | **Alta** | A 375 px la ficha ensanchaba la página y los cuadros (616 px) quedaban cortados. Causa: el encabezado oculto "Detalle" (`.sr-only`, posición absoluta) escapaba del contenedor desplazable de la tabla del historial. | **Corregido** (`.table-wrap { position: relative }`) |
| H-03 | Media | Al cerrar un cuadro con Esc el foco caía en la página y no volvía al botón que lo abrió. | **Corregido**: el foco vuelve al botón; si este desaparece al recargar la lista, pasa al contenido principal (`main` con `tabIndex=-1`). Verificado con Esc y tras confirmar/cancelar un turno. |
| H-04 | Media | Mensajes de validación del servidor en inglés ("Invalid email address", "Too small: expected string to have >=6 characters", "Too big…"). | **Corregido** en el backend (`src/shared/mensajes-validacion.ts`): "Ingresá al menos 6 caracteres.", "Ingresá un correo válido, por ejemplo nombre@dominio.com.", "Ingresá hasta 160 caracteres.", etc. Los mensajes propios de cada campo (como el del DNI) se conservan. 3 pruebas nuevas. |
| H-05 | Baja | Con una fecha fuera de rango (ayer o +61 días) el texto dice "No pudimos mostrar horarios" en lugar de explicar el rango de 60 días. | Abierto |
| H-06 | Baja | Buscar `%` devuelve todos los pacientes (se usa como comodín). | Abierto |
| H-07 | Baja | Ruido en desarrollo: peticiones duplicadas (modo estricto de React) y un 401 en consola cada vez que un visitante abre `/ingresar`. Verificar en el build de producción. | Abierto |
| H-08 | Baja | "Solicitudes por confirmar" cuenta también las que esperan el correo de la persona, que la profesional no puede accionar todavía. | Abierto |

## 3. Límites de esta prueba
- Navegador: Chromium del panel de la app, en modo desarrollo (no build de producción). No se probó Safari, Firefox ni dispositivos móviles reales.
- No se usó lector de pantalla; la accesibilidad cubre contraste, teclado, etiquetas y atributos ARIA.
- El envío por Gmail no se probó (no hay credenciales); los correos se leyeron de la bandeja local.
- Para mantener determinismo se manipularon datos de contexto en la base de pruebas (vencer un enlace, invalidar una sesión, reservar un horario "de otra persona"); las verificaciones se hicieron siempre desde la interfaz.
- Medición: en emulación móvil, `innerWidth` puede ensancharse con el desborde y enmascararlo; conviene comparar siempre contra el ancho fijo del dispositivo (así se detectó H-02).
- El scroll suave no avanza si la pestaña de pruebas está en segundo plano; dos "fallos" iniciales de V-01 fueron ese artefacto y se repitieron con la pestaña al frente.
