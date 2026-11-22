# Informe de UI/UX: lo que no funciona como debería

**Aplicación:** NutriBalance (landing, solicitud de turno, confirmación por correo, login y panel profesional) · **Fecha:** 22/11/2026
**Método:** recorrido de cada flujo en navegador real sobre la copia local, a 375 px (celular), 820 px (tablet) y 1366 px (escritorio), con captura de pantalla y medición en el DOM (tamaños, solapes, desbordes, contraste). Marcos usados: crítica de diseño (primera impresión, usabilidad, jerarquía, consistencia) y auditoría de accesibilidad WCAG 2.1 AA.
**Nota sobre la skill pedida:** la skill "frontend design" de Anthropic no figura entre las habilitadas en esta sesión (ni por lista ni por nombre), así que se usaron `design:design-critique` y `design:accessibility-review`.

## Resumen

| Severidad | Cantidad | Qué significa |
|---|---|---|
| 🔴 Alta | 5 | Frena o desvía el objetivo principal del usuario |
| 🟡 Media | 8 | Genera fricción, confusión o trabajo de más |
| 🟢 Baja | 9 | Pulido visual, consistencia y detalles |

**Impresión general:** la identidad es fuerte y coherente (tipografía condensada, verde, lima y crema), el copy es cercano y claro, el selector de horarios y los cuadros del panel están bien resueltos. Los problemas importantes no son de estética sino de **flujo**: la acción principal está escondida en tres pantallas, hay callejones sin salida y el panel se vuelve incómodo en pantallas chicas.

## Estado de las correcciones (22/11/2026)

| # | Estado | Qué se hizo |
|---|---|---|
| UX-01 | ⏸ Pendiente | Fuera del pedido de corrección. |
| UX-02 | ✅ Corregido | La página del enlace ya no tiene bloque de bienvenida: el botón "Confirmar mi turno" queda en la primera pantalla (a 375 px: entre 423 y 477 de 812 px). |
| UX-03 | ✅ Corregido | La pantalla de aviso ofrece "Reenviar correo" (con cuenta regresiva de 60 s) y "Cambiar mi correo". El backend genera un token nuevo, el enlace anterior deja de servir y el vencimiento original no se extiende. Se quitó además el código UUID (UI-04 parcial). |
| UX-04 | ✅ Corregido | "Nuevo turno" en la Agenda y en la ficha: elegir paciente, fecha y horario; el turno se crea confirmado, sin correo de por medio, y la agenda salta a ese día. |
| UX-05 | ✅ Corregido | Toda la fila de paciente abre la ficha (el nombre es un botón accesible); en celular la tabla pasa a tarjetas sin desplazamiento horizontal. |

## 🔴 Severidad alta

| # | Dónde | Qué no funciona | Por qué importa | Recomendación |
|---|---|---|---|---|
| UX-01 | Landing (escritorio y celular) | El bloque principal no tiene botón de acción. En escritorio la única entrada es el botón chico del header; en celular está dentro del menú hamburguesa, y el primer botón visible aparece recién al final de las preguntas frecuentes (≈ 2300 px). | Es la página que debe convertir visitas en solicitudes. | Agregar un botón "Solicitar turno" visible dentro del bloque principal, debajo de la bajada. |
| UX-02 | Página del enlace del correo (celular) | El único botón ("Confirmar mi turno") queda debajo del pliegue: el bloque de bienvenida (título, "Un clic", párrafo) ocupa toda la pantalla, y el título se repite ("Un último paso para tu turno" + "Confirmá tu turno"). | La persona llega con una sola tarea y tiene que buscar el botón. | En esta página, mostrar el botón en la primera pantalla; achicar o eliminar el bloque de bienvenida. |
| UX-03 | Pantalla "Falta un paso: confirmá en tu correo" | Callejón sin salida: no se puede reenviar el correo ni corregir la dirección. Si la persona se equivocó o no le llegó, solo puede volver al inicio y rehacer todo, y el horario queda retenido 2 horas. | Un error de tipeo en el correo hace perder el turno. | Agregar "Reenviar correo" (con espera) y "Cambiar mi correo"; ofrecer abrir el correo del proveedor. |
| UX-04 | Panel → Agenda | La profesional no puede cargar un turno: "Solicitar un turno ↗" la saca del panel al formulario público, que además exige que el paciente confirme por correo. | Los turnos por teléfono o en persona no se pueden registrar. El ícono ↗ promete abrir algo externo y no lo hace. | Formulario interno "Nuevo turno" (elige paciente, fecha y hora) que no requiera confirmar correo. |
| UX-05 | Panel → Pacientes (celular y tablet) | "Abrir ficha" es la única forma de abrir una ficha y queda fuera de la vista: la tabla se desplaza horizontalmente. El nombre del paciente no es un enlace y la fila no es clickeable (tampoco en escritorio). | La acción más frecuente del panel está escondida. | Hacer clickeable toda la fila (o el nombre) y, en celular, mostrar tarjetas en lugar de tabla. |

## 🟡 Severidad media

| # | Dónde | Qué no funciona | Recomendación |
|---|---|---|---|
| UX-06 | Ficha → Historial (≈ 820 px) | La columna con "Ver detalle" queda fuera de la vista sin ningún indicio de que hay más a la derecha; "70.9 kg" se parte en dos líneas. | Hacer toda la fila expandible, abreviar columnas o mostrar una sombra de desplazamiento. |
| UX-07 | Solicitud de turno | El texto de introducción dice dos veces lo mismo (párrafo + lista) y empuja el formulario más de una pantalla en celular. Además el título dice "Elegí un momento", pero lo primero que se pide son datos personales; la fecha viene después. | Acortar la introducción y poner fecha y horario primero, o cambiar el título. |
| UX-08 | Solicitud de turno | El selector de fecha permite sábados y domingos y lleva a "No hay horarios para esta fecha". Con fechas fuera de rango dice "No pudimos mostrar horarios" en vez de explicar el rango. | Deshabilitar fines de semana y días sin cupo, o sugerir "Próximo día disponible". |
| UX-09 | Solicitud de turno | No hay ningún aviso de privacidad al pedir DNI y correo (datos personales vinculados a salud). | Agregar una línea breve junto al botón: para qué se usan los datos y quién los ve. |
| UX-10 | Panel → Resumen | La misma solicitud aparece en "Agenda de hoy" y en "Solicitudes por confirmar". "Turnos hoy" cuenta solicitudes cuyo correo aún no se confirmó (no son turnos) y "Solicitudes por confirmar" mezcla las que se pueden accionar con las que no. | Separar agenda (turnos confirmados) de solicitudes; contar aparte las que esperan el correo. |
| UX-11 | Panel → Estados de error | El mensaje es genérico ("No se pudo completar la operación.") y siempre ofrece "Volver a ingresar", incluso si el problema es de red. | Mensajes por causa (sin conexión, sesión vencida, error del servidor) y ofrecer reingresar solo cuando corresponde. |
| UX-12 | Panel → Resumen (celular) | Las tres tarjetas de indicadores ocupan ≈ 330 px antes del contenido útil. | Mostrarlas en una fila de tres compactas o en dos columnas. |
| UX-13 | Panel → Agenda (≈ 820 px) | El selector "Estado" se sale unos píxeles de la tarjeta y las etiquetas quedan desalineadas con los campos de fecha. | Permitir que los filtros pasen a una segunda fila a ese ancho. |

## 🟢 Severidad baja

| # | Dónde | Qué no funciona |
|---|---|---|
| UI-01 | Panel | El enlace "NutriBalance" del encabezado y "Volver a ingresar" salen con el estilo por defecto del navegador (azul subrayado), distinto de los demás enlaces. |
| UI-02 | Pacientes | La caja de búsqueda tiene doble borde (contenedor + campo); en celular el texto de ayuda se corta ("…apellido o D"). |
| UI-03 | Landing (celular) | El recuadro de la foto tapa el sello "30 minutos de consulta" y corta el texto ("…DE CONSU"). |
| UI-04 | Aviso de correo (celular) | Las filas de datos se alinean distinto entre sí (Fecha y "Confirmalo antes" apilan etiqueta y valor; Horario va en línea) y se muestra un código largo (UUID) que ya no sirve. |
| UI-05 | Panel → filas de agenda | Las acciones no tienen jerarquía: texto de estado, "Abrir ficha" y "Cancelar turno" se mezclan en dos líneas, y el estado se reparte en dos chips en lugares distintos. |
| UI-06 | Landing y solicitud | Hay textos de 10 a 11 px (sello, "Atención nutricional") y ayudas de 12 px. |
| UI-07 | Panel | "Buen día, Mauricio" y "Mauricio Pelozo" están escritos en el código: no dependen de la sesión ni de la hora. |
| UI-08 | Login y Configuración | Falta "mostrar contraseña" y una vía de recuperación; Configuración casi no tiene contenido (nombre, correo y un enlace). |
| UI-09 | Ficha del paciente | Alergias y medicación tienen el mismo peso visual que el resto; cada ficha repite el subtítulo genérico "Historia clínica y seguimiento personalizado" y "Volver a pacientes" duplica el breadcrumb. |

## Accesibilidad (WCAG 2.1 AA)

| Criterio | Estado | Detalle |
|---|---|---|
| 1.4.3 Contraste de texto | ✅ Cumple | Pantallas públicas y 6 vistas del panel sin textos bajo el mínimo (único punto: el "." decorativo del logotipo, exento). |
| 2.4.7 / 1.4.11 Foco visible | ✅ Cumple | Corregido en esta etapa: anillo arcilla con halo blanco (≥ 4,8:1 en fondos claros, 8 a 12:1 en oscuros). |
| 2.1.1 Teclado | ✅ Cumple | "Saltar al contenido", orden lógico, Esc en cuadros y retorno del foco. |
| 3.3.1 / 3.3.2 Errores y etiquetas | ✅ Cumple | Todos los campos con etiqueta; errores por campo en español. |
| 1.1.1 Alternativas de texto | ✅ Cumple | La única imagen tiene texto alternativo descriptivo. |
| 2.5.5 Tamaño de objetivos táctiles | 🟡 Parcial | Botón de menú y botones principales ≥ 44 px; el logotipo-enlace mide 35 px de alto. |
| 4.1.2 Nombre, rol, valor | ✅ Cumple | `aria-expanded` en el detalle del historial y en el menú; cuadros con `aria-labelledby`. |
| Lector de pantalla | ⏭ No probado | Esta auditoría no incluyó NVDA ni VoiceOver. |

## Lo que funciona bien
- Identidad visual coherente y reconocible en landing, solicitud y correo; tipografía con carácter.
- Copy cercano, sin jerga, con instrucciones concretas ("Abrilo y tocá 'Confirmar mi turno'").
- El selector de horarios en celular: botones de 88×47 px, tres columnas, estado seleccionado claro.
- Estados vacíos informativos ("Primero elegí una fecha", "La primera consulta va a aparecer acá…").
- Cuadros del panel: contexto del paciente arriba, botones de acción fijos al pie y foco que vuelve al botón.
- La confirmación de turnos reconocidos se resuelve en dos clics.

## Prioridades recomendadas
1. **Poner la acción principal a la vista** (UX-01 y UX-02): botón en el bloque principal de la landing y botón visible en la primera pantalla de la página del correo. Es el cambio de mayor impacto con menor esfuerzo.
2. **Cerrar los callejones sin salida** (UX-03 y UX-04): reenviar o corregir el correo, y un formulario interno de turnos para la profesional.
3. **Hacer usable el panel en pantallas chicas** (UX-05, UX-06, UX-12, UX-13): filas clickeables, tarjetas en celular y filtros que se acomoden.
4. **Ordenar el Resumen** (UX-10): separar agenda de solicitudes y no contar como turnos los que esperan el correo.
5. **Pulido de consistencia** (UI-01 a UI-09) en una sola pasada de estilos.

## Límites de esta evaluación
- Navegador Chromium del panel de la app, en modo desarrollo, sin Safari, Firefox ni dispositivos reales.
- Las capturas del panel de la app muestran 800 px de ancho: a 1366 px se evaluó con una vista reducida y con mediciones en el DOM, por lo que el detalle fino a ese ancho es menos exhaustivo que a 375 y 820 px.
- No se probó con lector de pantalla ni con usuarios reales; la evaluación es heurística.
- Los datos y las cuentas son ficticios; el envío por Gmail no se probó.
