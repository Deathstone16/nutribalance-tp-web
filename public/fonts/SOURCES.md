# Fuentes de NutriBalance

La web pública usa Barlow Condensed para los titulares de la landing, Instrument Serif para acentos y otras páginas públicas, y DM Sans para textos e interfaz. Los archivos WOFF2 de la variante latina se descargaron de la API oficial de Google Fonts. Incluyen los caracteres del español y se sirven localmente. Las licencias SIL Open Font License se conservan en esta carpeta.

- Instrument Serif: regular e italic. Fuente: https://fonts.google.com/specimen/Instrument+Serif · Licencia: `InstrumentSerif-LICENSE.txt`.
- DM Sans: variable, pesos 400 a 600. Fuente: https://fonts.google.com/specimen/DM+Sans · Licencia: `DM-Sans-LICENSE.txt`.
- Barlow Condensed: peso 700, variante latina, incorporada el 14 de noviembre de 2026. Fuente: https://fonts.google.com/specimen/Barlow+Condensed · Licencia: `BarlowCondensed-LICENSE.txt`.

Las fuentes usan `font-display: swap`. La landing precarga DM Sans y Barlow Condensed; Instrument Serif se carga cuando se necesita.

El panel y las demostraciones conservan las familias anteriores:

- Manrope: pesos 400 y 600, normal. Fuente original: https://fonts.google.com/specimen/Manrope
- Source Serif 4: peso 400, normal e italic. Fuente original: https://fonts.google.com/specimen/Source+Serif+4
- Licencia Manrope: https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt
- Licencia Source Serif: https://github.com/adobe-fonts/source-serif/blob/release/LICENSE.md

Los archivos anteriores se convirtieron de TTF a WOFF2 con fontTools y Brotli, conservando caracteres y metadatos. Sus cuatro variantes ocupan 170.424 bytes y se cargan solamente donde se usan.
