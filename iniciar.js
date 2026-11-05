function init(){
 themeInit();renderSlots();attachSlotActions();updateSample('acervo');updateSample('single');
 $('demoAcervo').addEventListener('click',()=>cargarEjemplo('acervo'));
 $('demoSingle').addEventListener('click',()=>cargarEjemplo('single'));
 $('themeToggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
 $('tabAcervo').addEventListener('click',()=>switchTab('acervo'));
 $('tabFolio').addEventListener('click',()=>switchTab('folio'));
 $('hasAdenda').addEventListener('change',()=>{renderSlots();updateSample('acervo');toast($('hasAdenda').checked?'Apartado 13 habilitado.':'Apartado 13 desactivado; no se incluirá en el PDF final.','success')});
 $('folioAcervo').addEventListener('change',event=>{
  for(const id of ['acervoStart','acervoDirection','acervoNoBack','acervoColor'])$(id).disabled=!event.target.checked;
  updateSample('acervo');
 });
 for(const mode of ['acervo','single']){
  for(const suffix of ['Start','Direction','NoBack','Color'])$(mode+suffix).addEventListener('input',()=>updateSample(mode));
 }
 $('generateAcervo').addEventListener('click',()=>exportPlan('acervo'));
 $('generateSingle').addEventListener('click',()=>exportPlan('single'));
 $('clearAcervo').addEventListener('click',newAcervo);$('newAcervoTop').addEventListener('click',newAcervo);
 $('openAcervoEditor').addEventListener('click',()=>openEditor('acervo'));
 $('openSingleEditor').addEventListener('click',()=>openEditor('single'));
 const dz=$('singleDropzone'),inp=$('singleFileInput');
 dz.addEventListener('click',()=>{if(!isBusy)inp.click()});
 dz.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!isBusy){e.preventDefault();inp.click()}});
 inp.addEventListener('change',()=>{selectSingle(inp.files&&inp.files[0]);inp.value='' });
 dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('dragging')});
 dz.addEventListener('dragleave',()=>dz.classList.remove('dragging'));
 dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('dragging');const f=Array.from(e.dataTransfer.files||[]);if(f.length>1)toast('Se usará el primer PDF: este apartado admite un solo archivo.');selectSingle(f[0])});
 $('removeSingle').addEventListener('click',()=>{
  if(isBusy)return;if(singleEntry)releasePreviewCache(singleEntry);
  singleEntry=null;$('singleSelected').classList.remove('show');$('openSingleEditor').disabled=true;$('singleMessage').textContent='';updateSample('single');
 });
 $('editorClose').addEventListener('click',closeEditor);
 $('pageEditor').addEventListener('click',e=>{if(e.target===$('pageEditor'))closeEditor()});
 $('editorPrev').addEventListener('click',()=>changeEditorPage(-1));$('editorNext').addEventListener('click',()=>changeEditorPage(1));
 $('editorChunkPrev').addEventListener('click',()=>changeEditorChunk(-1));$('editorChunkNext').addEventListener('click',()=>changeEditorChunk(1));
 $('editorPageList').addEventListener('click',e=>{
  const remove=e.target.closest('[data-remove-page]');if(remove){borrarPorIndice(Number(remove.dataset.removePage));return}
  const btn=e.target.closest('[data-editor-page]');if(!btn)return;editorIndex=Number(btn.dataset.editorPage);renderEditor();
 });
 $('editorPageList').addEventListener('change',e=>{
  const check=e.target.closest('[data-skip]');if(check)marcarPorIndice(Number(check.dataset.skip),check.checked);
 });
 $('editorDelete').addEventListener('click',toggleDeletePage);$('editorSkipCheck').addEventListener('change',e=>setPageNoFolio(editorRow(),e.target.checked));
 $('editorRestore').addEventListener('click',restoreDeletedPages);
 document.addEventListener('keydown',e=>{
  if($('pageEditor').classList.contains('hidden'))return;
  if(e.key==='Escape'){closeEditor();return}
  const tag=document.activeElement?.tagName;if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;
  if(e.key==='ArrowLeft'){e.preventDefault();changeEditorPage(-1)}
  if(e.key==='ArrowRight'){e.preventDefault();changeEditorPage(1)}
 });
}
init();

