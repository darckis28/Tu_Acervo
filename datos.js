
'use strict';

const GENERAL=[
 {id:'contrato',name:'Contrato',number:'01'},
 {id:'ruc',name:'RUC',number:'02'},
 {id:'multas',name:'Multas',number:'03'},
 {id:'rop',name:'ROP',number:'04'},
 {id:'redam',name:'REDAM',number:'05'},
 {id:'rnssc',name:'RNSSC (sanciones)',number:'06'},
 {id:'sirep',name:'SIREP (nepotismo)',number:'07'},
 {id:'proveedores',name:'Proveedores',number:'08'},
 {id:'pdd',name:'PDD',number:'09'},
 {id:'ccp',name:'Copia de CCP',number:'10'},
 {id:'tdr',name:'Copia de TDR',number:'11'}
];
const PROFILE=[
 {id:'ficha_cv',name:'Hoja de ficha de evaluación curricular (en caso de CLV)',number:'12.1',optional:true,conditional:true},
 {id:'formacion',name:'Formación académica',number:'12.2'},
 {id:'experiencia',name:'Experiencia laboral',number:'12.3',optional:true},
 {id:'capacitacion',name:'Capacitación',number:'12.4',optional:true},
 {id:'reporte_crediticio',name:'Otros: reporte crediticio (de ser requerido en caso CLV)',number:'12.5',optional:true,conditional:true},
 {id:'hoja_entrevista',name:'Hoja de evaluación de entrevista (en caso de CLV)',number:'12.6',optional:true,conditional:true},
 {id:'resolucion_jefatural',name:'Resolución jefatural de designación (en caso de CLV)',number:'12.7',optional:true,conditional:true},
 {id:'cv',name:'Currículum vitae + documentos restantes del CV',number:'12.8'},
 {id:'dni',name:'DNI',number:'12.9'},
 {id:'renuncia',name:'Carta de renuncia o resolución',number:'12.10',optional:true}
];
const ADENDA=[
 {id:'adenda',name:'Adenda',number:'13.1'},
 {id:'adenda_rop',name:'Reporte ROP',number:'13.2'},
 {id:'adenda_infogob',name:'INFOGOB',number:'13.3'},
 {id:'adenda_rnssc',name:'RNSSC',number:'13.4'},
 {id:'adenda_ccp',name:'Copia de nuevo CCP',number:'13.5'},
 {id:'adenda_renuncia',name:'Carta de renuncia o resolución',number:'13.6'}
];
const SLOTS=[...GENERAL,...PROFILE,...ADENDA];
const bucket=new Map(SLOTS.map(s=>[s.id,[]]));
const $=id=>document.getElementById(id);
const kb=n=>n>=1e6?(n/1e6).toFixed(1)+' MB':(n/1024).toFixed(0)+' KB';
const four=n=>String(n).padStart(4,'0');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iconUpload='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 16V4m-4 4 4-4 4 4M5 15v5h14v-5"/></svg>';
let singleEntry=null,isBusy=false,pdfLibPromise=null,pdfJsPromise=null,uid=0,toastTimer;
let editorMode=null,editorFileId=null,editorIndex=0,editorChunk=0,editorRenderVersion=0;
const pdfDocs=new Map();

// Generador pequeño de PDF válido, sin bibliotecas ni conexión, para permitir una prueba inmediata.
// Solo se utiliza con documentos DE EJEMPLO, nunca modifica documentos PDF reales.
function textoAscii(t){return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,' ').replace(/[\\()]/g,' ').slice(0,105)}
function pdfPrueba(paginas){
 const objetos=[null];
 const nuevo=(texto)=>{objetos.push(texto);return objetos.length-1};
 const catalogo=nuevo('');const raiz=nuevo('');const fuente=nuevo('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 const nodos=[];
 for(const p of paginas){
  const titulo=textoAscii(p.titulo||'DOCUMENTO DE EJEMPLO'),detalle=textoAscii(p.detalle||'PAGINA DE PRUEBA');
  const col=(p.color||'#202a39').replace('#','');let r=parseInt(col.slice(0,2),16)/255,g=parseInt(col.slice(2,4),16)/255,b=parseInt(col.slice(4,6),16)/255;
  if(!Number.isFinite(r))r=0;if(!Number.isFinite(g))g=0;if(!Number.isFinite(b))b=0;
  const instrucciones=[
   '0.13 0.30 0.65 rg','BT /F1 20 Tf 50 762 Td (ACERVO DIGITAL - DEMOSTRACION) Tj ET',
   '0.15 0.20 0.30 rg',`BT /F1 15 Tf 50 703 Td (${titulo}) Tj ET`,
   `BT /F1 12 Tf 50 668 Td (${detalle}) Tj ET`,
   '0.60 0.66 0.75 RG 50 650 m 545 650 l S',
   '0.56 0.60 0.70 rg','BT /F1 11 Tf 50 610 Td (Este es un documento de ejemplo para probar la aplicacion.) Tj ET',
   'BT /F1 11 Tf 50 589 Td (Puedes borrar hojas, omitir folios y cambiar su color.) Tj ET',
   'BT /F1 10 Tf 50 45 Td (Creado por Andi Aguirre) Tj ET'
  ];
  if(p.folio){instrucciones.push(`${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} rg`, `BT /F1 13 Tf 523 798 Td (${textoAscii(p.folio)}) Tj ET`)}
  const contenido=instrucciones.join('\n')+'\n';
  const pagina=nuevo('');const stream=nuevo(`<< /Length ${contenido.length} >>\nstream\n${contenido}endstream`);
  objetos[pagina]=`<< /Type /Page /Parent ${raiz} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fuente} 0 R >> >> /Contents ${stream} 0 R >>`;
  nodos.push(`${pagina} 0 R`);
 }
 objetos[catalogo]=`<< /Type /Catalog /Pages ${raiz} 0 R >>`;
 objetos[raiz]=`<< /Type /Pages /Kids [${nodos.join(' ')}] /Count ${nodos.length} >>`;
 let texto='%PDF-1.4\n%ACERVO\n';const posiciones=[0];
 for(let i=1;i<objetos.length;i++){posiciones[i]=texto.length;texto+=`${i} 0 obj\n${objetos[i]}\nendobj\n`}
 const inicioXref=texto.length;
 texto+=`xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
 for(let i=1;i<objetos.length;i++)texto+=`${String(posiciones[i]).padStart(10,'0')} 00000 n \n`;
 texto+=`trailer\n<< /Size ${objetos.length} /Root ${catalogo} 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;
 return new TextEncoder().encode(texto);
}
function ejemploPDF(nombre,cantidad){
 const paginas=Array.from({length:cantidad},(_,i)=>({titulo:nombre,detalle:`HOJA ${i+1} DE ${cantidad} - ${i%2===0?'FRENTE':'REVERSO'}`}));
 return new File([pdfPrueba(paginas)],`EJEMPLO_${textoAscii(nombre).trim().replace(/[^A-Za-z0-9]+/g,'_').slice(0,30)}.pdf`,{type:'application/pdf'});
}
function entradaEjemplo(nombre,cantidad){
 const entrada=makeEntry(ejemploPDF(nombre,cantidad));entrada.pages=cantidad;entrada.isDemo=true;entrada.demoLabel=nombre;return entrada;
}
function cargarEjemplo(modo){
 if(isBusy)return;
 const tieneArchivos=Array.from(bucket.values()).some(lista=>lista.length>0)||!!singleEntry;
 if(tieneArchivos&&!window.confirm('La prueba reemplazará los documentos cargados. ¿Quieres continuar?'))return;
 newAcervo();
 if(modo==='acervo'){
  for(const slot of activeSlots()){
   if(!slot.optional)bucket.get(slot.id).push(entradaEjemplo(slot.name,['contrato','ruc'].includes(slot.id)?2:1));
  }
  $('folioAcervo').checked=true;
  for(const campo of ['acervoStart','acervoDirection','acervoNoBack','acervoColor'])$(campo).disabled=false;
  $('acervoNoBack').checked=true;
  renderSlots();switchTab('acervo');updateSample('acervo');
  toast('Acervo de ejemplo cargado. Pulsa «Revisar páginas del acervo» para probarlo.','success');
 }else{
  const archivo=entradaEjemplo('PDF DE PRUEBA',6);
  singleEntry=archivo;
  $('singleName').textContent=archivo.name;$('singleMeta').textContent='6 páginas de ejemplo';
  $('singleSelected').classList.add('show');$('openSingleEditor').disabled=false;
  $('singleNoBack').checked=true;switchTab('folio');updateSample('single');
  toast('PDF de ejemplo cargado. Pulsa «Previsualizar» para probarlo.','success');
 }
 $('demoNote').classList.add('show');
}

