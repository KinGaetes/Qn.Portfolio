# Traducciones del portafolio / Portfolio translations

El sitio admite tres idiomas: **es** (español), **en** (inglés) e **id** (indonesio). Todos los textos de las páginas, los proyectos y sus fichas extensas se traducen mediante `texts.csv`.

- **Editar traducciones:** modifica `i18n/texts.csv`. Cada ID debe tener texto para los tres idiomas. No cambies IDs que estén en uso.
- **Sincronizar la versión local:** ejecuta `python i18n/build_catalog.py` desde la raíz del proyecto después de editar el CSV. Este comando reconstruye `i18n/catalog.generated.js`, que permite abrir el sitio directamente con `file://` si el navegador no puede cargar archivos CSV.
- **Cambiar de idioma:** usa el selector de idioma de la página o agrega `?lang=es`, `?lang=en` o `?lang=id` a la URL. La selección manual se guarda en `localStorage` y se conserva al navegar entre páginas.
- **Fichas de proyectos:** `details.js` contiene únicamente IDs (`detail.<proyecto>.role`, `.did.1`, `.shows`, `.skills`); el contenido traducido vive en el CSV. Si agregas o quitas aportes, actualiza ambas estructuras.
- **No traducir:** nombres propios, nombres oficiales de productos, tecnologías, enlaces externos y el archivo del currículum (`CV_JoaquinGaete.pdf`, cuyo contenido sigue en español).

Translation changes are authored in `texts.csv` and then compiled into `catalog.generated.js`. Both files must be committed/published together.

## Revisión y control de calidad

Antes de publicar cambios en el texto, ejecutar desde la raíz del proyecto:

```bash
python i18n/build_catalog.py
python i18n/check_translations.py
```

`check_translations.py` comprueba que las entradas tengan sus tres versiones, que los marcadores dinámicos coincidan, que las fichas y los proyectos no utilicen IDs inexistentes, que el catálogo generado esté actualizado y que el HTML no contenga texto visible fuera de `data-i18n`. Esta prueba **no sustituye una revisión lingüística editorial** de nuevas descripciones.

El sistema conserva los nombres propios y los nombres oficiales de herramientas y proyectos. Las leyendas integradas directamente en imágenes (archivos WebP/JPG/SVG de autor) y el contenido del CV en PDF no forman parte de `texts.csv` y no se traducen automáticamente. Los nombres históricos de los archivos en `assets/*/sources.json` son referencias técnicas, no texto de la interfaz.
