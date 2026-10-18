/* Shared project strips, galleries and area/all-project panels. */
window.ProjectPanelsReady=(async()=>{
 await I18n.ready;
 const {projects,areas,featured}=PORTFOLIO_DATA;
 let activeProject=null,activeArea=null,catalogScroll=0,originFocus=null,baseURL=location.href;
 function node(tag,id,cls){const el=document.createElement(tag);if(id)I18n.bind(el,id);if(cls)el.className=cls;return el;}
 function button(id,action,cls){const b=node('button',id,cls);b.type='button';b.addEventListener('click',action);return b;}
 let coverCount=0;
 function cover(p,forStrip=false){
  const box=node('div',null,'work-cover');const item=p.cover||(p.image?{src:p.image,altId:p.nameId}:p.gallery?.[0]);
  if(forStrip&&p.stripCrop){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),img=document.createElementNS(ns,'image');svg.setAttribute('viewBox',p.stripCrop);svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.setAttribute('role','img');I18n.bind(svg,p.nameId,'aria-label');svg.classList.add('directed-cover');img.setAttribute('href','assets/'+item.src);img.setAttribute('width','1080');img.setAttribute('height','1080');svg.append(img);box.append(svg);return box;}
  if(p.coverGrid){const grid=node('div',null,'poster-cover-grid');p.coverGrid.forEach(item=>{const img=node('img');img.src='assets/'+item.src;img.loading='lazy';I18n.bind(img,item.altId,'alt');grid.append(img);});box.append(grid);return box;}
  if(p.coverFocus==='suya-logo'){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),image=document.createElementNS(ns,'image');svg.setAttribute('viewBox','108 575 864 325');svg.classList.add('brand-logo-art');svg.setAttribute('role','img');I18n.bind(svg,p.nameId,'aria-label');image.setAttribute('href','assets/'+item.src);image.setAttribute('width','1080');image.setAttribute('height','1440');const clip=document.createElementNS(ns,'clipPath'),rect=document.createElementNS(ns,'rect');clip.id='brand-crop-'+(++coverCount);rect.setAttribute('x','108');rect.setAttribute('y','575');rect.setAttribute('width','864');rect.setAttribute('height','325');clip.append(rect);image.setAttribute('clip-path','url(#'+clip.id+')');svg.append(clip,image);box.append(svg);return box;}
  if(item){const img=node('img');img.src=item.src.startsWith('https://')?item.src:'assets/'+item.src;img.loading='lazy';img.decoding='async';I18n.bind(img,item.altId,'alt');img.addEventListener('error',()=>{img.remove();const fallback=node('span',p.nameId,'cover-placeholder');box.append(fallback);I18n.apply(fallback);},{once:true});box.style.setProperty('--cover-image',`url("${img.src}")`);box.append(img);}
  else box.append(node('span',p.nameId,'cover-placeholder'));
  return box;
 }
 let stripCount=0;
 function categories(p){const row=node('p',null,'work-category');p.areaKeys.slice(0,3).forEach((key,i)=>{if(i)row.append(document.createTextNode(' · '));row.append(node('span',areas[key][0]));});return row;}
 const tooltip=node('div',null,'tool-tooltip');tooltip.id='tool-tooltip';tooltip.setAttribute('role','tooltip');tooltip.setAttribute('popover','manual');document.body.append(tooltip);
 function hideTip(){if(tooltip.matches(':popover-open'))tooltip.hidePopover();}
 function icons(p){const box=node('span',null,'brand-icons');[...(p.tools||[])].sort((a,b)=>I18n.t('tool.'+a).localeCompare(I18n.t('tool.'+b))).forEach(key=>{
  const wrap=node('span',null,'tool-logo');wrap.tabIndex=0;I18n.bind(wrap,'tool.'+key,'aria-label');const img=node('img');img.src='assets/brands/'+key+'.svg';img.alt='';wrap.append(img);
  function show(){I18n.bind(tooltip,'tool.'+key);I18n.apply(tooltip);tooltip.showPopover();const r=wrap.getBoundingClientRect(),t=tooltip.getBoundingClientRect();tooltip.style.left=Math.max(8,Math.min(innerWidth-t.width-8,r.left+r.width/2-t.width/2))+'px';tooltip.style.top=(r.top>t.height+12?r.top-t.height-8:r.bottom+8)+'px';wrap.setAttribute('aria-describedby',tooltip.id);}
  wrap.addEventListener('pointerenter',show);wrap.addEventListener('focus',show);wrap.addEventListener('pointerleave',hideTip);wrap.addEventListener('blur',hideTip);wrap.addEventListener('click',e=>e.stopPropagation());box.append(wrap);
 });return box;}
 document.addEventListener('scroll',hideTip,true);document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip();});
 function dateNode(p){const el=node('span',null,'work-date');el.dataset.projectDate=p.date;setDate(el);return el;}
 function setDate(el){const value=el.dataset.projectDate;if(value==='varies'){I18n.bind(el,'date.varies');return;}const format=part=>part.length===4?part:new Intl.DateTimeFormat(I18n.language,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(part+'-01T00:00:00Z'));el.textContent=value.split('/').map(format).join(' → ');}
 function skills(p){const box=node('div',null,'skill-tags');(p.skillIds||[]).forEach(id=>box.append(node('span',id)));return box;}
 function availableURL(p,id){if(!p.url||!(p.actionId==='project.try'||p.direct||['asoda','semantic','nda'].includes(id)))return null;try{const url=new URL(p.url);return url.protocol==='https:'&&url.hostname&&!['localhost','127.0.0.1'].includes(url.hostname)?url.href:null;}catch{return null;}}
 function share(id){const url=new URL('index.html',location.href);url.searchParams.set('project',id);I18n.openShare(url.href);}
 function shareButton(id){const b=button(null,()=>share(id),'share-icon');I18n.bind(b,'share.button','aria-label');b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 11 8-5M8 13l8 5"/><circle cx="5" cy="12" r="3"/><circle cx="19" cy="4" r="3"/><circle cx="19" cy="20" r="3"/></svg>';return b;}
 function strip(id,mini=false){
  const p=projects[id],article=node('article',null,'work-strip compact-strip'+(mini?' mini-strip':''));article.dataset.project=id;
  const visual=cover(p,true),copy=node('div',null,'work-copy');copy.append(p.roleId?node('p',p.roleId,'work-category'):categories(p));
  const row=node('div',null,'work-name-row'),h=node('h3',p.nameId,'work-title');h.id='work-name-'+(++stripCount);row.append(h,icons(p));copy.append(row);
  copy.append(node('p',p.leadId||p.textId,'work-purpose'));
  copy.append(dateNode(p));if(mini){const badges=node('div',null,'row-categories');p.areaKeys.forEach(key=>badges.append(node('span',PORTFOLIO_DATA.badgeLabels[key])));copy.append(badges);}
  article.append(visual,copy);
  if(mini){article.append(copy.querySelector('.work-category'),copy.querySelector('.work-purpose'));}
  if(!p.disabled){
   const hit=p.direct?node('a',null,'strip-hit'):button(null,()=>openProject(id),'strip-hit');
   if(p.direct){hit.href=availableURL(p,id);hit.target='_blank';hit.rel='noopener';}else hit.setAttribute('aria-haspopup','dialog');
   hit.setAttribute('aria-labelledby',h.id);article.append(hit);
   const destination=availableURL(p,id);if(destination){const action=node('a',['nda','asoda'].includes(id)?'project.company':'projects.view','work-open');action.href=destination;action.target='_blank';action.rel='noopener';article.append(action);}
  }else article.classList.add('disabled-project');return article;
 }
 const panel=node('dialog',null,'projects-panel');panel.id='projects-panel';panel.setAttribute('aria-labelledby','projects-panel-title');
 const header=node('div',null,'projects-panel-header'),back=button('project.back',()=>openCatalog(activeArea), 'panel-back'),heading=node('h2');heading.id='projects-panel-title';heading.tabIndex=-1;
 const close=button(null,()=>closePanel(),'panel-close');close.textContent='×';I18n.bind(close,'project.close','aria-label');header.append(heading,close);
 const body=node('div',null,'projects-panel-body');panel.append(header,body);document.body.append(panel);
 function open(){if(!panel.open){originFocus=document.activeElement;panel.showModal();document.body.classList.add('projects-open');}I18n.apply(panel);heading.focus({preventScroll:true});}
 function setURL(project,area){const url=new URL(location.href);url.searchParams.delete('project');url.searchParams.delete('area');if(area)url.searchParams.set('area',area);else if(!project)url.searchParams.set('area','all');if(project)url.searchParams.set('project',project);url.hash='';url.searchParams.set('lang',I18n.language);try{history.pushState({portfolioPanel:true},'',url);}catch{}}
 const defaults=()=>new Set(Object.keys(areas).filter(k=>!['grafico','apps'].includes(k)));
 function sortProjects(ids){const rank=id=>{const end=projects[id].date?.split('/').at(-1);return !end||end==='varies'?-1:Number(end.replace('-','').padEnd(6,'0'));};const original=Object.keys(projects);return [...ids].sort((a,b)=>rank(b)-rank(a)||original.indexOf(a)-original.indexOf(b));}
 function selectedIDs(selection){return sortProjects([...new Set([...selection].flatMap(k=>k==='grafico'?[]:(areas[k]?.[2]||[])))]);}
 function filtersFor(selection,onChange){const filters=node('nav',null,'catalog-filters');I18n.bind(filters,'text.003','aria-label');Object.entries(areas).forEach(([key,value])=>{const b=button(selection.has(key)?value[0]:(PORTFOLIO_DATA.shortLabels[key]||value[0]),()=>{selection.has(key)?selection.delete(key):selection.add(key);onChange(key);},'catalog-filter');b.dataset.area=key;if(key==='grafico'){b.disabled=true;b.setAttribute('aria-disabled','true');}b.setAttribute('aria-pressed',String(selection.has(key)));filters.append(b);});return filters;}
 let modalSelection=defaults();
 function openCatalog(area=null,route=true){modalSelection=area?new Set(area.split(',').filter(k=>areas[k]&&k!=='grafico')):defaults();renderCatalog(route);}
 function renderCatalog(route=true,focusKey=null){
  activeProject=null;activeArea=[...modalSelection].join(',');I18n.bind(heading,modalSelection.size===1?areas[[...modalSelection][0]][0]:'projects.title');header.querySelector('.header-extras')?.remove();body.replaceChildren();
  body.append(filtersFor(modalSelection,key=>renderCatalog(true,key)));const list=node('div',null,'catalog-list');selectedIDs(modalSelection).forEach(id=>list.append(strip(id)));if(!list.children.length)list.append(node('p','catalog.empty'));body.append(list,button('share.button',()=>I18n.openShare(location.href),'project-action catalog-share'));
  if(route)setURL(null,activeArea);open();if(focusKey)body.querySelector('[data-area="'+focusKey+'"]').focus({preventScroll:true});
 }
 function actions(p,id){const box=node('div',null,'project-actions');const destination=availableURL(p,id);if(destination){const a=node('a',['nda','asoda'].includes(id)?'project.company':'projects.view','project-action primary');a.href=destination;a.target='_blank';a.rel='noopener';box.append(a);}return box;}
 function detail(p,id,full=false){const layout=node('div',null,'project-overview');const visual=cover(p);visual.className='detail-cover';if(p.video){visual.replaceChildren();visual.classList.add('video-cover');const frame=node('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+p.video;I18n.bind(frame,p.nameId,'title');frame.allow='accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';visual.append(frame);const link=node('a','video.watch','video-fallback');link.href='https://www.youtube.com/watch?v='+p.video;link.target='_blank';link.rel='noopener';visual.append(link);}layout.append(visual);const copy=node('div',null,'project-overview-copy');copy.append(categories(p),dateNode(p),node('p',p.textId,'project-intro'));const X=(window.PROJECT_DETAILS||{})[id];if(X){const t=(tag,cls,id)=>node(tag,id,cls);if(X.role)copy.append(t('p','project-role',X.role));copy.append(node('h3','project.contrib.title'));const ul=node('ul',null,'contrib-list');X.did.forEach(x=>ul.append(t('li',null,x)));copy.append(ul);if(X.shows)copy.append(node('h3','project.shows'),t('p',null,X.shows));if(X.skills)copy.append(node('h3','project.competencies'),t('p',null,X.skills));}if(p.skillIds?.length)copy.append(node('h3','project.skills'),skills(p));
  if(p.technicalId||p.typeId){copy.append(node('h3','project.technical'),node('p',p.technicalId||p.typeId));}
  const contribution=full?p.detailId:p.contributionId;
  if(contribution){copy.append(node('h3','project.contribution'),node('p',contribution));}
  if(full&&p.assets){copy.append(node('h3','project.assets'));p.assets.forEach(asset=>{const a=node('a',asset.nameId,'asset-link');a.href=asset.url;a.target='_blank';a.rel='noopener';copy.append(a);});}copy.append(actions(p,id,!full));layout.append(copy);if(full&&p.collection){const gallery=node('div',null,'collection-grid');p.collection.forEach(item=>{const image=node('img');image.src='assets/'+item.src;image.loading='lazy';I18n.bind(image,item.altId,'alt');gallery.append(image);});layout.append(gallery);}return layout;
 }
 function openProject(id,route=true){if(!projects[id]||projects[id].disabled)return;if(projects[id].direct){const url=availableURL(projects[id],id);if(url)window.open(url,'_blank','noopener');return;}if(panel.open&&!activeProject)catalogScroll=panel.scrollTop;activeProject=id;I18n.bind(heading,projects[id].nameId);header.querySelector('.header-extras')?.remove();const extra=node('div',null,'header-extras');extra.append(icons(projects[id]),shareButton(id));heading.after(extra);body.replaceChildren(detail(projects[id],id));if(route)setURL(id,activeArea);open();panel.scrollTop=0;}
 function closePanel(){panel.close();const url=new URL(baseURL);url.searchParams.delete('project');if(url.pathname.endsWith('index.html'))url.searchParams.delete('area');url.searchParams.set('lang',I18n.language);url.hash='';try{history.pushState(null,'',url);}catch{}}
 panel.addEventListener('cancel',e=>{e.preventDefault();closePanel();});panel.addEventListener('close',()=>{document.body.classList.remove('projects-open');body.querySelectorAll('iframe').forEach(el=>el.remove());hideTip();originFocus?.focus({preventScroll:true});});
 panel.addEventListener('click',e=>{if(e.target!==panel)return;const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePanel();});
 document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const url=new URL(a.href);if(url.origin===location.origin&&url.pathname.endsWith('/explorar.html')&&url.searchParams.get('area')!=='sobre-mi'){e.preventDefault();const area=url.searchParams.get('area');if(area==='grafico')return;activeArea=areas[area]?area:null;const id=url.hash.slice(1);if(projects[id])openProject(id);else openCatalog(area);}});
 const list=document.getElementById('featured-projects');if(list){sortProjects(featured).forEach(id=>list.append(strip(id)));I18n.apply(list);}
 document.getElementById('all-projects')?.addEventListener('click',()=>openCatalog());
 const inlineSelection=defaults();let inlineExpanded=false;
 function inlineCatalog(focusKey=null){const root=document.getElementById('inline-catalog');if(!root)return;const y=scrollY;root.replaceChildren();const filters=filtersFor(inlineSelection,key=>inlineCatalog(key));
  const list=node('div',null,'inline-list');const ids=selectedIDs(inlineSelection),lim=matchMedia('(max-width:700px)').matches&&!inlineExpanded?6:ids.length;ids.slice(0,lim).forEach(id=>list.append(strip(id,true)));if(!list.children.length)list.append(node('p','catalog.empty'));root.append(filters,list);if(ids.length>lim){const more=button(null,()=>{inlineExpanded=true;inlineCatalog();},'project-action inline-more');more.textContent=I18n.t('projects.more',{n:ids.length});list.after(more);}I18n.apply(root);if(focusKey){root.querySelector('[data-area="'+focusKey+'"]').focus({preventScroll:true});scrollTo({top:y,behavior:'instant'});}
 }inlineCatalog();document.addEventListener('languagechange',()=>{inlineCatalog();document.querySelectorAll('[data-project-date]').forEach(setDate);if(panel.open&&!activeProject)renderCatalog(false);});
 const detailRoot=document.getElementById('project-detail');if(detailRoot){const id=new URL(location.href).searchParams.get('project');if(projects[id]){const title=node('h1',projects[id].nameId);const titleRow=node('div',null,'detail-title-row');titleRow.append(title,icons(projects[id]),shareButton(id));detailRoot.append(titleRow,detail(projects[id],id,true));I18n.apply(detailRoot);document.title=I18n.t(projects[id].nameId)+' · Quin.GS';}else{detailRoot.append(button('projects.all',()=>openCatalog(),'project-action'));I18n.apply(detailRoot);}}
 function route(){const params=new URL(location.href).searchParams;activeArea=params.get('area')?.split(',').filter(k=>areas[k]).join(',')||null;if(!detailRoot&&projects[params.get('project')])openProject(params.get('project'),false);else if(document.body.classList.contains('landing')&&params.has('area'))openCatalog(activeArea,false);else if(panel.open)panel.close();}
 window.addEventListener('popstate',route);route();
 document.addEventListener('languagechange',()=>{document.querySelectorAll('.work-copy').forEach(el=>el.dispatchEvent(new Event('refresh-tools')));if(detailRoot){const id=new URL(location.href).searchParams.get('project');if(projects[id])document.title=I18n.t(projects[id].nameId)+' · Quin.GS';}});

 window.ProjectPanels={openCatalog,openProject,strip,sortProjects};
 I18n.apply(panel);
})();
