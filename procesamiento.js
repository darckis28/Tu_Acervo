function loadScript(urls,readyFn){
 return new Promise((resolve,reject)=>{let i=0;const next=()=>{
  if(readyFn()){resolve(readyFn());return}
  if(i>=urls.length){reject(new Error('No se pudieron cargar las bibliotecas PDF. Verifica tu conexión a Internet y vuelve a intentarlo.'));return}
  const s=document.createElement('script');s.src=urls[i++];s.async=true;
  s.onload=()=>readyFn()?resolve(readyFn()):next();s.onerror=()=>{s.remove();next()};document.head.appendChild(s);
 };next()});
}
async function loadPdfLib(){
 if(window.PDFLib)return window.PDFLib;
 if(!pdfLibPromise)pdfLibPromise=loadScript(['https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js','https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js'],()=>window.PDFLib);
 try{return await pdfLibPromise}catch(e){pdfLibPromise=null;throw e}
}
async function loadPdfJs(){
 if(window.pdfjsLib)return window.pdfjsLib;
 if(!pdfJsPromise)pdfJsPromise=loadScript(['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'],()=>window.pdfjsLib);
 try{
  const lib=await pdfJsPromise;
  // Usar el trabajador del mismo proveedor que pudo cargar el visor PDF.
  const carga=Array.from(document.scripts).filter(s=>/pdf(?:\.min)?\.js/.test(s.src)&&s.src.includes('pdfjs')).slice(-1)[0];
  lib.GlobalWorkerOptions.workerSrc=carga&&carga.src.includes('jsdelivr.net')
   ?'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
   :'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return lib;
 }catch(e){pdfJsPromise=null;throw e}
}
function validPdf(f){return !!f&&(/\.pdf$/i.test(f.name)||f.type==='application/pdf')}
async function readCount(item){
 try{
  const lib=await loadPdfLib();const doc=await lib.PDFDocument.load(await item.file.arrayBuffer(),{updateMetadata:false});
  item.pages=doc.getPageCount();item.error=item.pages===0?'El PDF no contiene páginas':'';
 }catch(e){item.error=/encrypt|password/i.test(e.message||'')?'PDF protegido con contraseña':'No se pudo leer este PDF: '+(e.message||'archivo no válido');item.pages=null}
 renderSlots();
}
function addFiles(id,files){
 if(isBusy||ADENDA.some(s=>s.id===id)&&!$('hasAdenda').checked)return;
 const valid=files.filter(validPdf);
 if(valid.length!==files.length)toast('Solo se admiten archivos PDF; se ignoraron otros formatos.','error');
 if(!valid.length)return;const target=bucket.get(id);
 for(const f of valid){const entry=makeEntry(f);target.push(entry);readCount(entry)}
 renderSlots();toast(valid.length+(valid.length===1?' PDF agregado.':' PDF agregados.'),'success');
}
function attachSlotActions(){
 for(const host of [$('generalSlots'),$('profileSlots'),$('adendaSlots')]){
  host.addEventListener('click',e=>{
   const add=e.target.closest('[data-add]');if(add){pickSlot(add.dataset.add);return}
   const action=e.target.closest('[data-action]');if(!action||isBusy)return;
   const list=bucket.get(action.dataset.slot),i=Number(action.dataset.index),item=list[i];if(!item)return;
   if(action.dataset.action==='remove'){list.splice(i,1);releasePreviewCache(item);renderSlots()}
   else if(action.dataset.action==='up'&&i>0){[list[i-1],list[i]]=[list[i],list[i-1]];renderSlots()}
   else if(action.dataset.action==='down'&&i<list.length-1){[list[i+1],list[i]]=[list[i],list[i+1]];renderSlots()}
   else if(action.dataset.action==='edit'){openEditor('acervo',item.id)}
  });
  host.addEventListener('dragover',e=>{const btn=e.target.closest('[data-add]');if(btn){e.preventDefault();btn.classList.add('dragging')}});
  host.addEventListener('dragleave',e=>{const btn=e.target.closest('[data-add]');if(btn)btn.classList.remove('dragging')});
  host.addEventListener('drop',e=>{const btn=e.target.closest('[data-add]');if(btn){e.preventDefault();btn.classList.remove('dragging');addFiles(btn.dataset.add,Array.from(e.dataTransfer.files||[]))}});
 }
}
function getModeEntries(mode){
 if(mode==='single')return singleEntry?[singleEntry]:[];
 return activeSlots().flatMap(s=>bucket.get(s.id));
}
function buildPlan(mode){
 const opts=getModeOptions(mode),plan=[];
 let finalIndex=0;
 for(const item of getModeEntries(mode)){
  if(!item.pages||item.error)continue;
  for(let page=1;page<=item.pages;page++){
   const deleted=item.deleted.has(page);
   if(!deleted)finalIndex++;
   plan.push({item,page,deleted,finalPage:deleted?null:finalIndex,folio:null,reason:'',eligible:false});
  }
 }
 const eligible=[];
 for(const row of plan){
  if(row.deleted){row.reason='Página eliminada';continue}
  if(!opts.enabled){row.reason='Foliado desactivado';continue}
  const skipped=itemHas(row.item,'skipped',row.page),forced=itemHas(row.item,'forced',row.page);
  const even=opts.noBack&&row.finalPage%2===0;
  if(!forced&&(skipped||even)){row.reason=skipped?'Sin folio (marcado manualmente)':'Sin folio (página posterior/par)';continue}
  row.eligible=true;eligible.push(row);
 }
 eligible.forEach((row,index)=>{
  const value=opts.start+(opts.direction==='reverse'?eligible.length-1-index:index);
  row.folio=Number.isInteger(value)&&value>=1&&value<=9999?four(value):null;
  row.reason=row.folio?'Folio '+row.folio:'Folio fuera de rango';
 });
 return {plan,opts,eligibleCount:eligible.length,pageCount:finalIndex};
}
function itemHas(item,field,page){return item[field].has(page)}
function numericStart(input){
 const n=Number(input.value);
 if(!Number.isInteger(n)||n<1||n>9999)throw new Error('Ingresa un folio inicial entre 1 y 9999.');return n;
}
function numberCheck(start,total){
 if(total<0)throw new Error('Número de páginas inválido.');
 if(total&&start+total-1>9999)throw new Error(`Se necesitan ${total} folios: el último excedería 9999. Reduce el folio inicial o la cantidad de páginas foliadas.`);
}
function updateSample(mode){
 const p=getModeOptions(mode);
 const span=$(mode==='acervo'?'previewAcervo':'previewSingle');
 span.textContent=Number.isInteger(p.start)&&p.start>=1&&p.start<=9999?four(p.start):'0001';
 span.style.color=p.color;
 const summary=$(mode==='acervo'?'acervoFolioSummary':'singleFolioSummary');
 const plan=buildPlan(mode);
 if(!p.enabled){summary.textContent='Se unirán las páginas sin añadir folios.';return}
 summary.textContent=plan.pageCount?`${plan.pageCount} páginas conservadas · ${plan.eligibleCount} con folio · ${plan.pageCount-plan.eligibleCount} sin folio.`:'Al cargar PDF se calcularán los folios.';
}
function setBusy(value,mode){
 isBusy=value;const btn=$(mode==='acervo'?'generateAcervo':'generateSingle');btn.disabled=value;
 $(mode==='acervo'?'generateAcervoText':'generateSingleText').textContent=value?'Procesando PDF…':(mode==='acervo'?'Unir y descargar acervo':'Foliar y descargar PDF');
 $(mode+'ProgressOuter').classList.toggle('hidden',!value);
 $('openAcervoEditor').disabled=value||!getModeEntries('acervo').some(e=>e.pages>0&&!e.error);
 $('openSingleEditor').disabled=value||!singleEntry||!singleEntry.pages;
 if(value)$(mode+'Progress').style.width='1%';
}
function progress(mode,pct,message){$(mode+'Progress').style.width=Math.max(1,Math.min(100,pct))+'%';$(mode+'Message').textContent=message}
function pdfColor(hex,lib){
 const safe=/^#[0-9a-fA-F]{6}$/.test(hex)?hex:'#202a39';
 return lib.rgb(parseInt(safe.slice(1,3),16)/255,parseInt(safe.slice(3,5),16)/255,parseInt(safe.slice(5,7),16)/255);
}
function folioOnPage(page,font,number,lib,color){
 const {width:w,height:h}=page.getSize(),txt=String(number),size=12,space=22;
 const textWidth=font.widthOfTextAtSize(txt,size);
 const angle=((page.getRotation().angle%360)+360)%360;
 let x,y,rotation=angle;
 if(angle===0){x=w-space-textWidth;y=h-space-size}
 else if(angle===90){x=space+size;y=h-space-textWidth}
 else if(angle===180){x=space+textWidth;y=space+size}
 else if(angle===270){x=w-space-size;y=space+textWidth}
 else{rotation=0;x=w-space-textWidth;y=h-space-size}
 page.drawText(txt,{x,y,font,size,color,rotate:lib.degrees(rotation),opacity:1});
}
function downloadPDF(bytes,filename){
 const blob=new Blob([bytes],{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),40000);
}
async function exportPlan(mode){
 const isAcervo=mode==='acervo';if(isBusy)return;
 if(isAcervo){
  const missing=activeSlots().filter(s=>!s.optional&&!bucket.get(s.id).some(e=>e.pages>0&&!e.error&&remainingPages(e)>0));
  if(missing.length){
   toast('Faltan apartados obligatorios o con páginas conservadas: '+missing.slice(0,3).map(s=>s.name).join(', ')+(missing.length>3?'…':''),'error');
   $('slot-'+missing[0].id)?.scrollIntoView({behavior:'smooth',block:'center'});return;
  }
 }else if(!singleEntry){toast('Primero selecciona el PDF que deseas foliar.','error');return}
 const entries=getModeEntries(mode);
 if(entries.some(e=>e.error||e.pages===null)){toast('Espera el análisis de todos los PDF o elimina los archivos con error.','error');return}
 const {plan,opts,eligibleCount,pageCount}=buildPlan(mode);
 if(pageCount<1){toast('No quedan páginas. Restaura al menos una página en la vista previa.','error');return}
 try{if(opts.enabled){numericStart($(isAcervo?'acervoStart':'singleStart'));numberCheck(opts.start,eligibleCount)}}catch(e){toast(e.message,'error');return}
 setBusy(true,mode);
 try{
  if(entries.every(entrada=>entrada.isDemo)){
   progress(mode,45,'Preparando PDF de prueba…');
   const paginas=plan.filter(p=>!p.deleted).map(p=>({
    titulo:p.item.demoLabel||p.item.name,
    detalle:`HOJA ${p.page} DEL ARCHIVO - ${p.page%2?'FRENTE':'REVERSO'}`,
    folio:p.folio,color:opts.color
   }));
   const bytes=pdfPrueba(paginas);
   downloadPDF(bytes,isAcervo?'ACERVO_DE_EJEMPLO.pdf':'PDF_DE_EJEMPLO_FOLIADO.pdf');
   progress(mode,100,`Prueba lista: ${pageCount} páginas, ${eligibleCount} con folio y ${pageCount-eligibleCount} sin folio.`);
   toast('Se descargó el PDF de ejemplo. Ya puedes probar tus documentos reales.','success');
   return;
  }
  const lib=await loadPdfLib(),out=await lib.PDFDocument.create();
  const font=opts.enabled&&eligibleCount?await out.embedFont(lib.StandardFonts.HelveticaBold):null;
  const color=pdfColor(opts.color,lib);
  const included=plan.filter(x=>!x.deleted);
  let done=0;
  for(const item of entries){
   const selected=included.filter(x=>x.item===item);if(!selected.length)continue;
   progress(mode,Math.round(done/pageCount*80),`Integrando ${item.name}…`);
   const src=await lib.PDFDocument.load(await item.file.arrayBuffer(),{updateMetadata:false});
   const copies=await out.copyPages(src,selected.map(x=>x.page-1));
   for(let i=0;i<copies.length;i++){
    const dest=copies[i];out.addPage(dest);
    if(selected[i].folio)folioOnPage(dest,font,selected[i].folio,lib,color);
    done++;
   }
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  progress(mode,91,'Preparando el archivo final…');
  out.setTitle(isAcervo?'Acervo Digital':'PDF revisado y foliado');out.setCreator('Acervo Digital · Andi Aguirre');
  const bytes=await out.save();
  const date=new Date().toISOString().slice(0,10);
  const filename=isAcervo?'ACERVO_'+date+'.pdf':singleEntry.name.replace(/\.pdf$/i,'').replace(/[\\/:*?"<>|]/g,'_')+'_REVISADO.pdf';
  downloadPDF(bytes,filename);
  progress(mode,100,`Listo: ${pageCount} páginas conservadas, ${eligibleCount} con folio y ${pageCount-eligibleCount} sin folio.`);
  toast('PDF descargado con los cambios seleccionados.','success');
 }catch(e){
  const msg=/encrypt|password/i.test(e.message||'')?'Uno de los PDF tiene contraseña o está cifrado.':e.message||'No fue posible procesar tus archivos.';
  progress(mode,0,'Error: '+msg);toast(msg,'error');console.error(e);
 }finally{setBusy(false,mode)}
}
