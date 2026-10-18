(async()=>{
 await ProjectPanelsReady;
 const {projects,areas}=PORTFOLIO_DATA;
 const key=new URLSearchParams(location.search).get('area');if(key==='grafico'){const url=new URL('index.html',location.href);url.searchParams.set('lang',I18n.language);location.replace(url.href);return;}
 const list=document.getElementById('lista'),heading=document.getElementById('titulo'),description=document.getElementById('descripcion');
 document.querySelectorAll('.area-links a[href]').forEach(a=>{if(new URL(a.href).searchParams.get('area')===key&&key)a.setAttribute('aria-current','page');});
 if(key==='sobre-mi'){
  I18n.bind(heading,'about.name');I18n.bind(description,'about.description');
  const img=document.createElement('img');I18n.bind(img,'about.portrait','alt');img.src='assets/portrait.png';img.style.maxWidth='380px';list.append(img);
 }else{
  const area=areas[key];I18n.bind(heading,area?area[0]:'projects.title');if(area)I18n.bind(description,area[1]);
  ProjectPanels.sortProjects(area?area[2]:Object.keys(projects)).forEach(id=>{const item=ProjectPanels.strip(id);item.id=id;list.append(item);});
 }
 function updateTitle(){I18n.apply(list);I18n.apply(heading);I18n.apply(description);document.title=I18n.t('page.title',{name:heading.textContent});}
 document.addEventListener('languagechange',updateTitle);updateTitle();
 const id=decodeURIComponent(location.hash.slice(1));if(projects[id])ProjectPanels.openProject(id);
})();
