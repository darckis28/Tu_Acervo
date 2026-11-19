# ACERVO DIGITAL — ARCHIVOS CONECTADOS

Aplicación para crear un acervo de documentos PDF o foliar un PDF existente. Incluye vista previa de las páginas reales, casillas **No foliar**, eliminar/restaurar hojas, colores de folio, adendas y modo oscuro.

## ¡IMPORTANTE! Todos los archivos van JUNTOS en UNA carpeta

```text
ACERVO_DIGITAL_GITHUB_CONECTADO/
├── index.html
├── estilos.css
├── datos.js
├── procesamiento.js
├── acervo.js
├── vista-previa.js
├── iniciar.js
└── README.md
```

**No cambies los nombres ni subas solo `index.html`.** La versión anterior podía fallar si las carpetas `css` y `js` no se conservaban; esta versión usa rutas `./archivo` para que todos estén al mismo nivel.

## Probar en Windows
1. Descarga el ZIP.
2. Clic derecho al ZIP → **Extraer todo**.
3. Abre la carpeta extraída y haz doble clic en `index.html`.
4. En la esquina superior aparecerá **«✓ Archivos conectados»**.
5. Pulsa **«Probar foliado de PDF»** y luego **«Ver hojas y seleccionar No foliar»**.
6. Marca las páginas sin folio, elimina/restaura y descarga el PDF de ejemplo.

## Subir a GitHub Pages
1. Abre el repositorio de GitHub → **Add file → Upload files**.
2. **Selecciona todos estos archivos extraídos juntos**: `index.html`, `estilos.css`, `datos.js`, `procesamiento.js`, `acervo.js`, `vista-previa.js`, `iniciar.js` (opcional `README.md`).
3. Confirma los cambios (**Commit changes**).
4. En **Settings → Pages**, selecciona **Deploy from a branch**, rama **main** y carpeta **/(root)**.
5. Abre el enlace que indique GitHub Pages. Si actualizaste el proyecto, recarga con **Ctrl + F5**.

## Girar una hoja

En la vista previa, selecciona la hoja y pulsa **Girar a la izquierda** o **Girar a la derecha**. Cada pulsación aplica un giro de 90° a esa hoja. El giro se muestra en la miniatura y se conserva en el PDF descargado.

## 06.1 · Filtro de INFOGOB

Carga el PDF del filtro de INFOGOB en **Documentos generales**. Se incluye como documento obligatorio después de **RNSSC (sanciones)** y antes de **SIREP (nepotismo)**.

## 09 · PDD con observación

Marca **PDD con observación** para habilitar la carga de **Antecedentes penales** y **Antecedentes judiciales**. Puedes adjuntar uno o ambos, según corresponda. Los archivos se incluyen después del PDD y antes de la copia de CCP mientras la casilla esté marcada.

## 10 y 11 · Copias de CCP y TDR

Puedes cargar las copias en dos campos separados o elegir **CCP y TDR en un solo PDF**. Para el archivo conjunto, coloca la copia de CCP antes de la de TDR. Puedes cambiar de opción sin perder los archivos cargados. Se incluyen los archivos de la opción seleccionada después del PDD y sus antecedentes, cuando correspondan.

## 12 · Sustentos del perfil

- **Por separado** muestra cada tipo de sustento para cargar sus archivos.
- **En un solo PDF** acepta un archivo con todo el perfil. Sus páginas se insertan en su orden original entre el apartado 11 y el 13, cuando hay adenda.
- Puedes cambiar de opción sin perder los archivos cargados. La vista previa y el PDF final usan los documentos de la opción seleccionada.

## Nota de bibliotecas PDF
La prueba incorporada funciona sin Internet. Para abrir, mostrar y editar **PDF reales**, la aplicación utiliza dos bibliotecas PDF desde una CDN (pdf-lib y PDF.js), por lo que requiere conexión a Internet para cargarlas. **Los documentos no se envían a esa CDN**: se procesan en tu navegador. La numeración comienza en 0001 y utiliza cuatro dígitos.

Los PDF protegidos con contraseña no son compatibles. Procesar un PDF firmado digitalmente puede invalidar su firma.

Creado por Andi Aguirre.
