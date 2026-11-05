// VISTA PREVIA DE PÁGINAS
function editorRows(){
 const plan=buildPlan(editorMode).plan;
 return editorFileId===null?plan:plan.filter(r=>r.item.id===editorFileId);
}
function editorRow(){return editorRows()[editorIndex]||null}
function openEditor(mode,fileId=null){
 if(isBusy)return;
 if(!getModeEntries(mode).some(item=>item.pages>0&&!item.error)){toast('Primero carga un PDF válido para revisar sus páginas.','error');return}
 editorMode=mode;editorFileId=fileId;editorIndex=0;editorChunk=0;ultimaPaginaPrincipal='';
 $('pageEditor').classList.remove('hidden');document.body.classList.add('modal-open');
 $('editorTitle').textContent=fileId===null?(mode==='acervo'?'Revisar páginas del acervo':'Revisar páginas del PDF'):'Revisar páginas del archivo';
 renderEditor();
}
function closeEditor(){
 editorRenderVersion++;++miniaturaVersion;
 $('pageEditor').classList.add('hidden');document.body.classList.remove('modal-open');
 editorMode=null;editorFileId=null;ultimaPaginaPrincipal='';
}
// Previsualización con miniaturas reales (12 por grupo) para evitar saturar la memoria.
const miniaturaCache=new Map();
let miniaturaVersion=0;
let ultimaPaginaPrincipal='';
const MINIATURAS_POR_GRUPO=12;
function actualizarFolioPrincipal(row){
 const overlay=$('editorFolioPreview');
 overlay.textContent=row.folio||'';
 overlay.style.color=getModeOptions(editorMode).color;
 overlay.classList.toggle('hidden',!row.folio||row.deleted);
 $('editorCanvas').classList.toggle('dimmed',row.deleted);
}
function renderEditor(){
 if(!editorMode)return;
 const rows=editorRows(),current=rows[editorIndex];
 if(!current){closeEditor();return}
 const fullPlan=buildPlan(editorMode);
 const chunks=Math.max(1,Math.ceil(rows.length/MINIATURAS_POR_GRUPO));
 editorChunk=Math.floor(editorIndex/MINIATURAS_POR_GRUPO);
 $('editorSummary').textContent=`${fullPlan.pageCount} páginas conservadas · ${fullPlan.eligibleCount} con folio · ${fullPlan.pageCount-fullPlan.eligibleCount} sin folio`;
 $('editorFile').textContent=current.item.name;
 $('editorPageLabel').textContent=`Hoja ${current.page} del archivo · ${current.finalPage?'posición '+current.finalPage+' del PDF final':'eliminada del PDF final'}`;
 $('editorStatus').textContent=current.deleted?'Eliminada':current.folio?'Folio '+current.folio:current.reason;
 $('editorStatus').className='editor-status '+(current.deleted?'deleted':current.folio?'with-folio':'no-folio');
 $('editorDelete').textContent=current.deleted?'↶ Restaurar página':'🗑 Eliminar página';
 const allow=getModeOptions(editorMode).enabled;
 $('editorSkipCheck').disabled=current.deleted||!allow;
 $('editorSkipCheck').checked=!current.deleted&&!current.folio&&allow;
 $('editorPrev').disabled=editorIndex===0;
 $('editorNext').disabled=editorIndex===rows.length-1;
 $('editorChunkText').textContent=`Grupo ${editorChunk+1} de ${chunks}`;
 $('editorChunkPrev').disabled=editorChunk===0;
 $('editorChunkNext').disabled=editorChunk>=chunks-1;
 const start=editorChunk*MINIATURAS_POR_GRUPO;
 const localRows=rows.slice(start,start+MINIATURAS_POR_GRUPO);
 const generation=++miniaturaVersion;
 $('editorPageList').innerHTML=localRows.map((row,i)=>{
  const ix=start+i,label=row.deleted?'Eliminada':row.folio?'Folio '+row.folio:'Sin folio';
  const key=row.item.id+':'+row.page;
  const cached=miniaturaCache.get(key);
  const img=cached?`<img src="${cached}" alt="Miniatura de hoja ${row.page}" loading="lazy">`:'<span class="miniatura-espera">Cargando vista previa…</span>';
  return `<article class="miniatura-tarjeta ${ix===editorIndex?'chosen':''} ${row.deleted?'deleted':''}" data-key="${key}">
   <button type="button" class="miniatura-seleccionar" data-editor-page="${ix}" title="Ampliar hoja ${row.page}" aria-label="Ver hoja ${row.page} de ${esc(row.item.name)}">
    <span class="miniatura-imagen" data-thumb="${key}">${img}<span class="miniatura-folio ${row.folio&&!row.deleted?'':'hidden'}" style="color:${getModeOptions(editorMode).color}">${row.folio||''}</span></span>
    <span class="miniatura-titulo">Hoja ${row.page} <small>${label}</small></span>
   </button>
   <label class="miniatura-opcion"><input type="checkbox" data-skip="${ix}" ${!row.folio&&!row.deleted&&allow?'checked':''} ${row.deleted||!allow?'disabled':''}> No foliar</label>
   <button type="button" class="miniatura-borrar" data-remove-page="${ix}">${row.deleted?'Restaurar':'Eliminar'}</button>
  </article>`;
 }).join('');
 actualizarFolioPrincipal(current);
 const mainKey=current.item.id+':'+current.page;
 if(ultimaPaginaPrincipal!==mainKey||$('editorCanvas').classList.contains('hidden')){
   ultimaPaginaPrincipal=mainKey;
   drawEditorPage(current);
 }
 // Dibujar únicamente las miniaturas visibles de este grupo.
 solicitarMiniaturas(localRows,generation);
}
function solicitarMiniaturas(rows,generation){
 requestAnimationFrame(async()=>{
  for(const row of rows){
   if(generation!==miniaturaVersion||!editorMode)return;
   const key=row.item.id+':'+row.page;
   const host=Array.from($('editorPageList').querySelectorAll('[data-thumb]')).find(n=>n.dataset.thumb===key);
   if(!host)continue;
   try{
    let src=miniaturaCache.get(key);
    if(!src){
      src=await crearMiniatura(row);
      if(!src)continue;
      miniaturaCache.set(key,src);
      if(miniaturaCache.size>80)miniaturaCache.delete(miniaturaCache.keys().next().value);
    }
    if(generation!==miniaturaVersion||!editorMode)return;
    const localHost=Array.from($('editorPageList').querySelectorAll('[data-thumb]')).find(n=>n.dataset.thumb===key);
    if(localHost){
      localHost.querySelector('.miniatura-espera')?.remove();
      if(!localHost.querySelector('img')){
       const img=new Image();img.src=src;img.alt='Vista previa real de hoja '+row.page;img.loading='lazy';
       localHost.prepend(img);
      }
    }
   }catch(error){
    if(generation!==miniaturaVersion)return;
    const hint=host.querySelector('.miniatura-espera');if(hint)hint.textContent='Sin miniatura';
    console.warn('No se pudo generar miniatura:',error);
   }
  }
 });
}
async function crearMiniatura(row){
 const cv=document.createElement('canvas');
 if(row.item.isDemo){
  cv.width=118;cv.height=166;
  const ctx=cv.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,118,166);
  ctx.fillStyle='#2456d3';ctx.fillRect(10,12,98,3);
  ctx.fillStyle='#28344c';ctx.font='bold 9px Arial';ctx.fillText('ACERVO DIGITAL',10,27);
  ctx.font='9px Arial';ctx.fillText('Documento de ejemplo',10,45);
  ctx.fillText('Hoja '+row.page,10,59);
  ctx.fillStyle='#e4e9f1';for(let i=0;i<6;i++)ctx.fillRect(10,75+i*13,98-(i%3)*10,3);
 }else{
  const doc=await getPdfJsDoc(row.item);
  const page=await doc.getPage(row.page);
  const base=page.getViewport({scale:1});
  const scale=Math.min(118/base.width,166/base.height);
  const viewport=page.getViewport({scale});
  cv.width=Math.max(1,Math.round(viewport.width));cv.height=Math.max(1,Math.round(viewport.height));
  await page.render({canvasContext:cv.getContext('2d',{alpha:false}),viewport}).promise;
 }
 return cv.toDataURL('image/jpeg',.76);
}
function changeEditorPage(delta){
 const rows=editorRows();editorIndex=Math.max(0,Math.min(rows.length-1,editorIndex+delta));renderEditor();
}
function changeEditorChunk(delta){
 const rows=editorRows(),total=Math.ceil(rows.length/MINIATURAS_POR_GRUPO);
 editorChunk=Math.max(0,Math.min(total-1,editorChunk+delta));editorIndex=editorChunk*MINIATURAS_POR_GRUPO;renderEditor();
}
function toggleDeletePage(){
 const row=editorRow();if(!row||isBusy)return;
 if(row.item.deleted.has(row.page)){row.item.deleted.delete(row.page)}else{row.item.deleted.add(row.page);row.item.skipped.delete(row.page);row.item.forced.delete(row.page)}
 if(editorMode==='acervo')renderSlots();else if(singleEntry)$('singleMeta').textContent=kb(singleEntry.size)+' · '+remainingPages(singleEntry)+'/'+singleEntry.pages+' páginas conservadas';
 updateSample(editorMode);renderEditor();
}
function setPageNoFolio(row,checked){
 if(!row||row.deleted||!getModeOptions(editorMode).enabled)return;
 const {item,page}=row;
 if(checked){item.skipped.add(page);item.forced.delete(page)}
 else{item.skipped.delete(page);item.forced.add(page)}
 updateSample(editorMode);renderEditor();
}
function togglePageFolio(){
 const row=editorRow();if(!row)return;
 setPageNoFolio(row,Boolean(row.folio));
}
function marcarPorIndice(index,checked){
 const row=editorRows()[index];if(!row||isBusy)return;
 editorIndex=index;setPageNoFolio(row,checked);
}
function borrarPorIndice(index){
 const row=editorRows()[index];if(!row||isBusy)return;
 editorIndex=index;toggleDeletePage();
}
function restoreDeletedPages(){
 if(!editorMode)return;
 const target=editorFileId===null?getModeEntries(editorMode):getModeEntries(editorMode).filter(x=>x.id===editorFileId);
 for(const item of target)item.deleted.clear();
 if(editorMode==='acervo')renderSlots();else if(singleEntry)$('singleMeta').textContent=kb(singleEntry.size)+' · '+singleEntry.pages+' páginas';
 updateSample(editorMode);renderEditor();toast('Se restauraron las páginas eliminadas.','success');
}
async function getPdfJsDoc(item){
 if(!pdfDocs.has(item.id)){
  pdfDocs.set(item.id,(async()=>{
   const lib=await loadPdfJs();const bytes=new Uint8Array(await item.file.arrayBuffer());
   const loading=lib.getDocument({data:bytes,useSystemFonts:true,disableAutoFetch:true,disableStream:true});
   return await loading.promise;
  })());
 }
 return await pdfDocs.get(item.id);
}
// Serializar el dibujo grande evita conflictos de PDF.js al cambiar de página rápidamente.
let colaDeDibujo=Promise.resolve();
function drawEditorPage(row){
 const version=++editorRenderVersion;
 colaDeDibujo=colaDeDibujo.catch(()=>{}).then(()=>ejecutarDibujoPagina(row,version));
 return colaDeDibujo;
}
async function ejecutarDibujoPagina(row,version){
 if(version!==editorRenderVersion||!editorMode)return;
 if(row.item.isDemo){
  const canvas=$('editorCanvas'),hint=$('editorCanvasMessage'),overlay=$('editorFolioPreview'),paper=$('editorPaper');
  const w=515,h=730;canvas.width=w;canvas.height=h;canvas.style.width=w+'px';canvas.style.height=h+'px';
  paper.style.width=w+'px';paper.style.height=h+'px';
  const c=canvas.getContext('2d');c.fillStyle='#ffffff';c.fillRect(0,0,w,h);
  c.fillStyle='#2456d3';c.font='bold 18px Arial';c.fillText('ACERVO DIGITAL · DOCUMENTO DE EJEMPLO',35,90);
  c.fillStyle='#273247';c.font='bold 16px Arial';
  const n=row.item.demoLabel||row.item.name;
  const words=n.split(' ');let line='',y=155;
  for(const word of words){const next=(line?line+' ':'')+word;if(c.measureText(next).width>445){c.fillText(line,35,y);y+=23;line=word}else line=next}
  if(line)c.fillText(line,35,y);
  c.font='14px Arial';c.fillStyle='#61718b';c.fillText('Página '+row.page+' · '+(row.page%2?'Frente':'Reverso'),35,y+45);
  c.fillStyle='#edf1f7';for(let i=0;i<10;i++)c.fillRect(35,y+92+i*34,410-(i%3)*45,7);
  c.fillStyle='#7c879e';c.font='12px Arial';c.fillText('Vista previa de ejemplo · Creado por Andi Aguirre',35,700);
  overlay.style.fontSize='13px';overlay.style.top='30px';overlay.style.right='24px';overlay.textContent=row.folio||'';
  overlay.style.color=getModeOptions(editorMode).color;overlay.classList.toggle('hidden',!row.folio||row.deleted);
  canvas.classList.toggle('dimmed',row.deleted);hint.classList.add('hidden');canvas.classList.remove('hidden');return;
 }
 const canvas=$('editorCanvas'),hint=$('editorCanvasMessage'),overlay=$('editorFolioPreview'),paper=$('editorPaper');
 hint.textContent='Preparando vista previa…';hint.classList.remove('hidden');
 canvas.classList.add('hidden');overlay.classList.add('hidden');
 try{
  const doc=await getPdfJsDoc(row.item);if(version!==editorRenderVersion||!editorMode)return;
  const page=await doc.getPage(row.page);if(version!==editorRenderVersion||!editorMode)return;
  const view=page.getViewport({scale:1});
  const scale=Math.min(1.48,Math.max(.2,Math.min(610/view.width,730/view.height)));
  const viewport=page.getViewport({scale});
  const dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.max(1,Math.floor(viewport.width*dpr));canvas.height=Math.max(1,Math.floor(viewport.height*dpr));
  canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
  paper.style.width=viewport.width+'px';paper.style.height=viewport.height+'px';
  overlay.style.fontSize=12*scale+'px';overlay.style.top=22*scale+'px';overlay.style.right=22*scale+'px';
  const context=canvas.getContext('2d',{alpha:false});
  await page.render({canvasContext:context,viewport,transform:dpr===1?undefined:[dpr,0,0,dpr,0,0]}).promise;
  if(version!==editorRenderVersion||!editorMode)return;
  hint.classList.add('hidden');canvas.classList.remove('hidden');
  const fresh=editorRow()||row;overlay.textContent=fresh.folio||'';overlay.style.color=getModeOptions(editorMode).color;
  overlay.classList.toggle('hidden',!fresh.folio||fresh.deleted);
  canvas.classList.toggle('dimmed',row.deleted);
 }catch(e){
  if(version!==editorRenderVersion||!editorMode)return;
  hint.textContent='No se pudo mostrar la página. Puedes continuar editando por número y descargar el PDF. Revisa la conexión para cargar la vista previa.';
  console.warn('No fue posible mostrar la vista previa PDF:',e);
 }
}
