/* Curved picker interaction inspired by React Bits Option Wheel:
   https://reactbits.dev/components/option-wheel
   Independent vanilla implementation for this local, buildless prototype. */
document.documentElement.classList.add('js');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const menu=document.querySelector('.menu-toggle');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));document.getElementById('header-areas').classList.toggle('is-open',open);});
const card=document.getElementById('photo-card'),front=document.getElementById('flip-photo'),frontFace=document.getElementById('photo-front'),back=document.getElementById('photo-back');
const cv=document.getElementById('cv-dialog'),readCV=document.getElementById('read-cv'),returnPhoto=document.getElementById('flip-back');
function flip(showBack){card.classList.toggle('is-flipped',showBack);frontFace.inert=showBack;front.setAttribute('aria-hidden',String(showBack));back.inert=!showBack;back.setAttribute('aria-hidden',String(!showBack));(showBack?readCV:front).focus({preventScroll:true});}
document.getElementById('portrait').addEventListener('click',e=>{if(!e.target.closest('#read-cv, a'))flip(!card.classList.contains('is-flipped'));});
readCV.addEventListener('click',e=>{e.stopPropagation();cv.showModal();document.body.classList.add('cv-open');});
document.getElementById('close-cv').addEventListener('click',()=>cv.close());
cv.addEventListener('close',()=>{document.body.classList.remove('cv-open');readCV.focus({preventScroll:true});});
cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect();if(e.target===cv&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))cv.close();});
const hero=document.querySelector('.hero'),photo=document.querySelector('.photo-parallax'),gam=document.querySelector('.gam'),shadow=document.querySelector('.photo-shadow');
let parallaxFrame;
document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reducedMotion.matches)return;cancelAnimationFrame(parallaxFrame);parallaxFrame=requestAnimationFrame(()=>{const r=hero.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));const y=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));photo.style.transform=`rotate(2deg) rotateY(${x*4}deg) rotateX(${-y*3}deg) translate(${x*3}px,${y*3}px)`;gam.style.transform=`translate(${x*-6}px,${y*-5}px)`;shadow.style.transform=`translate(${18-x*12}px,${23-y*10}px) rotate(${2-x}deg)`;});});
function resetParallax(){cancelAnimationFrame(parallaxFrame);photo.style.transform='';gam.style.transform='';shadow.style.transform='';}
document.documentElement.addEventListener('pointerleave',resetParallax);reducedMotion.addEventListener('change',resetParallax);
const wheel=document.getElementById('option-wheel');

const options=[...wheel.querySelectorAll('.wheel-item')];
let selection=0,position=0,target=0,animation=0,lastWheel=0,drag=null,moved=false;
let autoMoving=false,hovered=false,wheelVisible=true,lastInteraction=performance.now();
function interact(){lastInteraction=performance.now();autoMoving=false;} 
const mod=n=>(n%options.length+options.length)%options.length;
function render(){
 const step=wheel.clientHeight/12;
 options.forEach((el,i)=>{
  let d=mod(i-position);if(d>options.length/2)d-=options.length;
  const amount=Math.abs(d);
  // Reserve a complete row at both edges; no mask, clipping or blurred labels.
  el.style.transform=`translate(${amount*amount*2}px,calc(${d*step}px - 50%)) rotate(${d*1.2}deg)`;
  el.style.opacity=String(1-amount*.14);
 });
}
function animate(){const delta=target-position;position=reducedMotion.matches||Math.abs(delta)<.005?target:position+delta*(autoMoving?.045:.2);render();animation=position!==target?requestAnimationFrame(animate):0;}
function select(next){target=next;selection=mod(Math.round(next));options.forEach((el,i)=>{el.dataset.active=String(i===selection);const label=el.querySelector('span');label.setAttribute('data-i18n',i===selection?label.dataset.labelFull:label.dataset.labelShort);});I18n.ready.then(()=>I18n.apply(wheel));if(!animation)animation=requestAnimationFrame(animate);}
function choose(i){let d=mod(i-mod(target));if(d>options.length/2)d-=options.length;select(Math.round(target+d));}
options.forEach(el=>el.addEventListener('click',e=>{if(moved)e.preventDefault();}));
wheel.addEventListener('keydown',e=>{interact();if(e.key==='Enter'&&e.target.matches('.wheel-item'))return;if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End','Enter'].includes(e.key)){e.preventDefault();if(e.key==='Enter'){options[selection].click();return;}wheel.focus({preventScroll:true});if(e.key==='Home')choose(0);else if(e.key==='End')choose(options.length-1);else select(Math.round(target)+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1));}});
wheel.addEventListener('wheel',e=>{interact();if(!e.deltaY)return;e.preventDefault();const now=performance.now();if(now-lastWheel>130){select(Math.round(target)+Math.sign(e.deltaY));lastWheel=now;}},{passive:false});
wheel.addEventListener('pointerdown',e=>{interact();if(e.button!==0)return;drag={y:e.clientY,start:target,id:e.pointerId};moved=false;});
wheel.addEventListener('pointermove',e=>{if(!drag)return;const dy=drag.y-e.clientY;if(Math.abs(dy)>5){moved=true;if(!wheel.hasPointerCapture(e.pointerId))wheel.setPointerCapture(e.pointerId);select(drag.start+dy/(wheel.clientHeight/12));}});
function endDrag(e){if(!drag)return;drag=null;if(wheel.hasPointerCapture(e.pointerId))wheel.releasePointerCapture(e.pointerId);select(Math.round(target));setTimeout(()=>{moved=false;},0);}
wheel.addEventListener('pointerup',endDrag);wheel.addEventListener('pointercancel',endDrag);
new ResizeObserver(render).observe(wheel);select(0);

const stickyNav=document.getElementById('scroll-nav');
new IntersectionObserver(entries=>{
 const entry=entries[0];wheelVisible=entry.isIntersecting;
 const show=!entry.isIntersecting&&entry.boundingClientRect.bottom<=0;
 stickyNav.classList.toggle('is-visible',show);stickyNav.inert=!show;stickyNav.setAttribute('aria-hidden',String(!show));
 if(!show){menu.setAttribute('aria-expanded','false');document.getElementById('header-areas').classList.remove('is-open');}
},{threshold:0}).observe(wheel);
function freezeWheel(){interact();cancelAnimationFrame(animation);animation=0;target=position;}
wheel.addEventListener('pointerenter',()=>{hovered=true;freezeWheel();});
wheel.addEventListener('pointerleave',()=>{hovered=false;interact();});
wheel.addEventListener('focusin',freezeWheel);
wheel.addEventListener('focusout',interact);
setInterval(()=>{
 if(reducedMotion.matches||hovered||drag||document.hidden||!wheelVisible||wheel.contains(document.activeElement)||document.querySelector("dialog[open]")||performance.now()-lastInteraction<5000)return;
 if(animation)return;autoMoving=true;select(Math.round(target)+1);lastInteraction=performance.now();
},400);
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){cancelAnimationFrame(animation);animation=0;position=target=Math.round(position);render();}});
