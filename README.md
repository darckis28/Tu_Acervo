# Acervo Digital

Aplicación web para organizar y unir documentos PDF en el orden del acervo documentario, con foliación opcional. Incluye un segundo apartado para foliar un PDF existente y un botón **Nuevo acervo** para reiniciar la aplicación.

## Publicar en GitHub Pages

1. En GitHub, crea un repositorio nuevo, por ejemplo `acervo-digital`.
2. Selecciona **Add file > Upload files** y sube `index.html` a la **raíz** del repositorio (o todos los archivos de esta carpeta). No subas el ZIP sin extraerlo.
3. Confirma mediante **Commit changes**.
4. Ve a **Settings > Pages** y elige **Deploy from a branch**; selecciona `main` y `/(root)`, luego **Save**.
5. Abre la dirección publicada por GitHub Pages, que normalmente sigue la forma `https://USUARIO.github.io/acervo-digital/`.

## Características

- Documentos 1–11 en orden fijo y apartado 12 de sustentos del perfil.
- Apartado 13 visible solamente cuando está marcada la casilla **¿Tiene adenda?**.
- Se pueden adjuntar varios PDF por documento, ordenarlos y eliminarlos.
- Foliación opcional del acervo y foliación independiente en otro apartado, numeración `0001` a `9999`.
- Modo oscuro y botón **Nuevo acervo** para limpiar la selección.
- Créditos: Creado por Andi Aguirre.

## Notas

El código procesa archivos en tu navegador. La herramienta necesita conexión a Internet para cargar `pdf-lib` desde CDN (jsDelivr o unpkg). No incorpora servidor ni sube tus documentos a GitHub. Los archivos PDF protegidos con contraseña no son compatibles. Unir o foliar un PDF firmado puede invalidar la firma digital.
