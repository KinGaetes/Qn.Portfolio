/* Shared localization. Authored text lives exclusively in texts.csv. */
(() => {
 'use strict';
 const scriptURL=new URL(document.currentScript.src);
 const baseURL=new URL('../',scriptURL);
 const supported=['es','en','id'];
 const spanishFamily=new Set(['es','pt','it','ca','gl','eu','ast','an','oc','lad','qu','ay','gn','nah']);
 let catalog=new Map(),language='en';
 let resolveReady;const ready=new Promise(resolve=>resolveReady=resolve);
 function parseCSV(csv){
  const rows=[];let row=[],field='',quoted=false;
  csv=csv.replace(/^\uFEFF/,'');
  for(let i=0;i<csv.length;i++){
   const ch=csv[i];
   if(ch==='"'){if(quoted&&csv[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
   else if(ch===','&&!quoted){row.push(field);field='';}
   else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&csv[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field='';}
   else field+=ch;
  }
  if(quoted)throw new Error('Unclosed CSV quote');
  if(field||row.length){row.push(field);rows.push(row);}
  const header=rows.shift();if(!header||header.join(',')!=='ID,es,en,id')throw new Error('Invalid CSV header');
  const map=new Map();
  for(const r of rows){if(r.length!==4||!r.every(Boolean)||map.has(r[0]))throw new Error('Invalid or duplicate CSV row: '+r[0]);map.set(r[0],{es:r[1],en:r[2],id:r[3]});}
  return map;
 }
 function detect(locale){const root=String(locale||'').toLowerCase().replace('_','-').split('-')[0];return root==='id'||root==='in'||root==='ms'?'id':spanishFamily.has(root)?'es':'en';}
 function initialLanguage(){const explicit=new URL(location.href).searchParams.get('lang');if(supported.includes(explicit))return explicit;let saved;try{saved=localStorage.getItem('quin.language');}catch{}return supported.includes(saved)?saved:detect(navigator.languages?.[0]||navigator.language);}
 function t(id,values={}){const entry=catalog.get(id);if(!entry){console.error('Missing text ID',id);return id;}return (entry[language]||entry.en).replace(/\{(\w+)\}/g,(match,key)=>values[key]??match);}
 function bind(el,id,attribute){el.setAttribute(attribute?'data-i18n-'+attribute:'data-i18n',id);return el;}
 function apply(root=document){
  const all=root===document?[...document.querySelectorAll('*')]:[root,...root.querySelectorAll('*')];
  for(const el of all){
   for(const attr of [...el.attributes]){
    if(attr.name==='data-i18n'){el.textContent=t(attr.value);}
    else if(attr.name.startsWith('data-i18n-')){const target=attr.name.slice(10);el.setAttribute(target,t(attr.value));}
   }
  }
  document.documentElement.lang=language;
  const picker=document.getElementById('language-select');if(picker)picker.value=language;
  preserveLinks();
 }
 function preserveLinks(){
  document.querySelectorAll('a[href]').forEach(a=>{
   const href=a.getAttribute('href');
   if(!href||a.hasAttribute('download')||href.startsWith('#'))return;
   let url;try{url=new URL(href,location.href);}catch{return;}
   // Preserve the selected language on page links AND same-page query links
   // (such as explorar.html?area=datos, whose links use ?area=datos).
   if(url.origin===baseURL.origin&&url.pathname.startsWith(baseURL.pathname)&&
      (/\.html$/i.test(url.pathname)||
       (href.startsWith('?')&&url.pathname===location.pathname))){
    url.searchParams.set('lang',language);a.href=url.href;
   }
  });
 }
 function setLanguage(next,{manual=false}={}){
  if(!supported.includes(next))next='en';language=next;
  if(manual){try{localStorage.setItem('quin.language',next);}catch{}const url=new URL(location.href);url.searchParams.set('lang',next);try{history.replaceState(null,'',url);}catch{}}
  apply();document.dispatchEvent(new CustomEvent('languagechange',{detail:{language}}));
 }
 function el(tag,id,attrs={}){const n=document.createElement(tag);if(id)bind(n,id);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
 let shareTarget=null;
 function shareURL(lang,target=location.href){const url=new URL(target,location.href);url.searchParams.set('lang',lang);return url.href;}
 function openShare(target=location.href){shareTarget=target;const status=document.getElementById('share-status');status.removeAttribute('data-i18n');status.textContent='';document.getElementById('share-url').value=shareURL(language,target);document.getElementById('share-dialog').showModal();}
 async function copyURL(value){
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return true;}}catch{}
  const field=document.getElementById('share-url');field.value=value;field.focus();field.select();
  try{return document.execCommand('copy');}catch{return false;}
 }
 function mountSharedUI(){
  const control=el('div',null,{class:'language-control'});
  const label=el('label','language.label',{for:'language-select'});const select=el('select',null,{id:'language-select'});
  supported.forEach(code=>select.append(el('option','language.'+code,{value:code})));select.addEventListener('change',()=>setLanguage(select.value,{manual:true}));control.append(label,select);document.body.prepend(control);
  let footer=document.querySelector('footer');if(!footer){footer=el('footer');document.body.append(footer);}
  const button=el('button','share.button',{class:'share-button',type:'button','aria-haspopup':'dialog'});footer.append(button);
  const dialog=el('dialog',null,{id:'share-dialog','aria-labelledby':'share-title'});
  const heading=el('h2','share.title',{id:'share-title'}),close=el('button',null,{class:'share-close',type:'button'});close.textContent='×';bind(close,'share.close','aria-label');
  const choices=el('div',null,{class:'share-choices'});
  const status=el('p',null,{id:'share-status',role:'status','aria-live':'polite'});
  const field=el('input',null,{id:'share-url',type:'text',readonly:''});bind(field,'share.link','aria-label');
  supported.forEach(code=>{const option=el('button','share.'+code,{type:'button','data-share-lang':code});option.addEventListener('click',async()=>{const value=shareURL(code,shareTarget);field.value=value;const ok=await copyURL(value);status.setAttribute('data-i18n',ok?'share.copied':'share.failed');apply(status);if(!ok){field.focus();field.select();}});choices.append(option);});
  dialog.append(close,heading,el('p','share.help'),choices,field,status);
  if(location.protocol==='file:')dialog.append(el('p','share.local',{class:'local-link-note'}));
  document.body.append(dialog);
  button.addEventListener('click',()=>openShare());
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
 }
 window.I18n={ready,t,bind,apply,setLanguage,detect,parseCSV,shareURL,openShare,get language(){return language;}};
 async function start(){
  let csv=window.PORTFOLIO_CSV;
  if(location.protocol!=='file:')try{const response=await fetch(new URL('texts.csv',scriptURL),{cache:'no-cache'});if(!response.ok)throw new Error(response.status);csv=await response.text();}catch(error){console.warn('Using generated CSV fallback',error);}
  try{catalog=parseCSV(csv);}catch(error){console.error(error);catalog=parseCSV(window.PORTFOLIO_CSV);}
  language=initialLanguage();mountSharedUI();apply();resolveReady();document.dispatchEvent(new CustomEvent('languagechange',{detail:{language}}));
 }
 window.addEventListener('popstate',()=>setLanguage(initialLanguage()));
 start();
})();
