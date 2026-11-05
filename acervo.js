function activeSlots(){return $('hasAdenda').checked?SLOTS:[...GENERAL,...PROFILE]}
function makeEntry(file){return {id:++uid,file,name:file.name,size:file.size,pages:null,error:'',deleted:new Set(),skipped:new Set(),forced:new Set()}}
function remainingPages(item){return item.pages===null?0:Math.max(0,item.pages-item.deleted.size)}
function getModeOptions(mode){
 const acervo=mode==='acervo';
 return {enabled:acervo?$('folioAcervo').checked:true,
  start:Number($(acervo?'acervoStart':'singleStart').value),
  direction:$(acervo?'acervoDirection':'singleDirection').value,
  noBack:$(acervo?'acervoNoBack':'singleNoBack').checked,
  color:$(acervo?'acervoColor':'singleColor').value};
}
function themeInit(){
 let pref='light';try{pref=localStorage.getItem('acervo-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}
 setTheme(pref);
}
function setTheme(theme){
 document.documentElement.dataset.theme=theme;
 $('themeLabel').textContent=theme==='dark'?'Modo claro':'Modo oscuro';
 $('themeToggle').setAttribute('aria-label',theme==='dark'?'Activar modo claro':'Activar modo oscuro');
 $('themeIcon').innerHTML=theme==='dark'?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>':'<path d="M20.5 13.4A9 9 0 0 1 10.6 3.5 9 9 0 1 0 20.5 13.4Z"/>';
 try{localStorage.setItem('acervo-theme',theme)}catch{}
}
function toast(message,type=''){
 clearTimeout(toastTimer);$('toast').textContent=message;$('toast').className='toast show '+type;
 toastTimer=setTimeout(()=>$('toast').className='toast',5500);
}
function switchTab(which){
 const a=which==='acervo';$('viewAcervo').classList.toggle('hidden',!a);$('viewFolio').classList.toggle('hidden',a);
 $('tabAcervo').classList.toggle('active',a);$('tabFolio').classList.toggle('active',!a);
 $('tabAcervo').setAttribute('aria-selected',String(a));$('tabFolio').setAttribute('aria-selected',String(!a));
}
function slotItem(s){
 const files=bucket.get(s.id),count=files.length;
 const ready=files.some(f=>f.pages===null&&!f.error||remainingPages(f)>0);
 const fileHTML=files.map((f,i)=>{
  const removed=f.deleted.size;
  const countText=f.error?'Error':f.pages===null?'Analizando…':remainingPages(f)+'/'+f.pages+' pág.';
  return `<div class="file-chip${f.error?' error':''}" title="${esc(f.error||f.name)}"><span aria-hidden="true">📄</span><span class="file-name">${esc(f.name)}</span><span class="file-pages">${countText}</span><div class="file-actions"><button type="button" class="tiny-action preview-file" data-action="edit" data-slot="${s.id}" data-index="${i}" title="Previsualizar y editar páginas" aria-label="Revisar páginas de ${esc(f.name)}" ${f.pages===null||f.error?'disabled':''}>◉</button><button type="button" class="tiny-action" data-action="up" data-slot="${s.id}" data-index="${i}" title="Subir archivo" ${i===0?'disabled':''}>↑</button><button type="button" class="tiny-action" data-action="down" data-slot="${s.id}" data-index="${i}" title="Bajar archivo" ${i===files.length-1?'disabled':''}>↓</button><button type="button" class="tiny-action" data-action="remove" data-slot="${s.id}" data-index="${i}" title="Quitar archivo">×</button></div></div>`;
 }).join('');
 return `<div class="slot${ready?' is-ready':''}" id="slot-${s.id}"><div class="slot-num">${ready?'✓':s.number}</div><div class="slot-data"><div class="slot-name">${esc(s.name)}<span class="tag ${s.optional?'':'required'}">${s.optional?'Opcional':'Obligatorio'}</span>${s.conditional?'<span class="tag conditional">Solo si corresponde</span>':''}</div><div class="slot-note">${count?count+' archivo'+(count===1?'':'s')+' adjunto'+(count===1?'':'s'):'Pendiente de cargar'}</div>${count?'<div class="files">'+fileHTML+'</div>':''}</div><button class="upload-btn" data-add="${s.id}" type="button" title="Agregar PDF a ${esc(s.name)}">${iconUpload}${count?'Agregar más':'Subir PDF'}</button></div>`;
}
function renderSlots(){
 $('generalSlots').innerHTML=GENERAL.map(slotItem).join('');
 $('profileSlots').innerHTML=PROFILE.map(slotItem).join('');
 $('adendaSlots').innerHTML=ADENDA.map(slotItem).join('');
 $('adendaSection').classList.toggle('hidden',!$('hasAdenda').checked);
 $('adendaStatus').textContent=$('hasAdenda').checked?'Apartado 13 habilitado · carga los seis documentos correspondientes.':'Apartado 13 desactivado. Su contenido no se incluirá en el PDF final.';
 updateStats();updateSample('acervo');
}
function updateStats(){
 const active=activeSlots();let filled=0,required=0,optional=0,numPDF=0,total=0,pending=0,totalRequired=0,totalOptional=0;
 for(const slot of active){
  const entries=bucket.get(slot.id),ready=entries.some(e=>(e.pages===null&&!e.error)||remainingPages(e)>0);
  if(slot.optional)totalOptional++;else totalRequired++;
  if(ready){filled++;if(slot.optional)optional++;else required++}
  numPDF+=entries.length;
  for(const e of entries){if(typeof e.pages==='number')total+=remainingPages(e);else pending++}
 }
 $('loadedCounter').textContent=filled+' de '+active.length+' apartados';
 $('countDocs').textContent=numPDF;$('countPages').textContent=total+(pending?' +':'');
 $('countRequired').textContent=required+'/'+totalRequired;$('countOptional').textContent=optional+'/'+totalOptional;
 $('completeness').style.width=(totalRequired?required/totalRequired*100:0)+'%';
 $('requiredStatus').textContent=required===totalRequired?'Todos los documentos obligatorios están cargados.':'Faltan '+(totalRequired-required)+' apartados obligatorios.';
 $('openAcervoEditor').disabled=!getModeEntries('acervo').some(e=>e.pages>0&&!e.error)||isBusy;
}
function pickSlot(id){
 if(isBusy)return;const inp=document.createElement('input');inp.type='file';inp.accept='.pdf,application/pdf';inp.multiple=true;
 inp.addEventListener('change',()=>addFiles(id,Array.from(inp.files||[])));inp.click();
}

function selectSingle(file){
 if(isBusy||!file)return;
 if(!validPdf(file)){toast('Selecciona un archivo PDF válido.','error');return}
 if(singleEntry)releasePreviewCache(singleEntry);
 const entry=makeEntry(file);singleEntry=entry;
 $('singleName').textContent=file.name;$('singleMeta').textContent=kb(file.size)+' · Analizando páginas…';
 $('singleSelected').classList.add('show');$('openSingleEditor').disabled=true;
 (async()=>{
  await readCount(entry);
  if(singleEntry===entry){
   $('singleMeta').textContent=entry.error?entry.error:kb(file.size)+' · '+entry.pages+' página'+(entry.pages===1?'':'s');
   $('openSingleEditor').disabled=!!entry.error||!entry.pages;
   updateSample('single');
  }
 })();
}
function releasePreviewCache(item){
 const cached=pdfDocs.get(item.id);
 if(cached){cached.then(doc=>doc.destroy()).catch(()=>{});pdfDocs.delete(item.id)}
}
function newAcervo(){
 if(isBusy){toast('No se puede reiniciar mientras se genera un PDF.','error');return}
 closeEditor();for(const list of bucket.values())list.length=0;
 for(const cached of pdfDocs.values())cached.then(doc=>doc.destroy()).catch(()=>{});pdfDocs.clear();miniaturaCache.clear();miniaturaVersion++;
 singleEntry=null;$('singleSelected').classList.remove('show');$('singleFileInput').value='';$('openSingleEditor').disabled=true;
 for(const mode of ['single','acervo']){
  $(mode+'Start').value='1';$(mode+'Direction').value='forward';$(mode+'NoBack').checked=false;
  $(mode+'Color').value='#202a39';$(mode+'ProgressOuter').classList.add('hidden');$(mode+'Progress').style.width='0%';$(mode+'Message').textContent='';
 }
 $('hasAdenda').checked=false;$('folioAcervo').checked=false;
 $('acervoStart').disabled=true;$('acervoDirection').disabled=true;$('acervoNoBack').disabled=true;$('acervoColor').disabled=true;
 renderSlots();updateSample('acervo');updateSample('single');switchTab('acervo');
 $('demoNote').classList.remove('show');
 $('acervoMessage').textContent='Nuevo acervo listo para comenzar.';
 toast('Nuevo acervo creado. Todos los PDF y ajustes se reiniciaron.','success');
}

