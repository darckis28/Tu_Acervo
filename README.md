# Acervo Digital — proyecto para GitHub Pages

Aplicación web 100 % en español creada para Andi Aguirre. Permite construir el acervo documentario en el orden de sus apartados, o foliar un PDF existente. Incluye vista previa de las páginas reales, miniaturas, casillas **No foliar**, eliminación/restauración de hojas, color del folio, modo oscuro y el apartado de adendas condicional.

## Cómo probar en tu computadora

1. **Descomprime** el ZIP (no abras `index.html` dentro del ZIP).
2. Abre la carpeta `ACERVO_DIGITAL_PROYECTO` y haz doble clic en **`index.html`**.
3. Para explorar sin documentos reales, pulsa **Probar foliado de PDF**; aparecerán seis páginas de ejemplo y podrás cambiar cuáles se folian o eliminan, y descargar el resultado.
4. Para PDF reales, necesitas **Internet** en el momento de abrirlos: el navegador carga las bibliotecas `pdf-lib` y `PDF.js` desde CDN. El sitio no envía tus documentos a un servidor; se procesan localmente en el navegador.

## Cómo subir a GitHub Pages

1. Crea un repositorio en GitHub o abre uno existente.
2. En `Add file → Upload files`, sube **`index.html`** y las carpetas **`css/`** y **`js/`**, preservando su estructura. No subas solo el HTML ni el ZIP comprimido.
3. Confirma con **Commit changes**.
4. En `Settings → Pages`, selecciona `Deploy from a branch`, rama `main`, carpeta `/ (root)` y guarda.
5. Abre la dirección que muestre GitHub Pages.

## Archivos del proyecto

- `index.html`: estructura e interfaz.
- `css/estilos.css`: colores, modo oscuro, diseños y tarjetas de miniaturas.
- `js/datos.js`: apartados, reglas y documentos de prueba.
- `js/acervo.js`: carga de archivos y gestión del acervo.
- `js/procesamiento.js`: lectura, unión, foliado y descarga de PDF.
- `js/vista-previa.js`: galería visual con miniaturas y edición página por página.
- `js/iniciar.js`: inicialización y eventos de la interfaz.

## Cómo usar la vista previa

Tras cargar los PDF, pulsa **Ver hojas y seleccionar «No foliar»**. Las miniaturas muestran las páginas, y cada una incluye una casilla **No foliar** (conserva la hoja sin número) y un botón **Eliminar** (la quita del PDF final). Una hoja eliminada puede restaurarse. La numeración se recalcula después de hacer cambios; sigue teniendo cuatro dígitos y se coloca arriba a la derecha.

En **Crear acervo**, activa previamente **Agregar folios al acervo** si deseas editar la foliación. Si desactivas los folios del acervo, el PDF final se une sin números. La opción **No foliar reversos** es adicional y trata como reversos las páginas pares del PDF final (no identifica automáticamente la cara física).

**Limitaciones:** Los PDF cifrados o protegidos con contraseña no son compatibles. Guardar/modificar un PDF que ya tiene firma digital puede invalidar esa firma. Para miles de hojas grandes, el procesamiento depende de la memoria del equipo y navegador.
