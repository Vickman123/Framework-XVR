import{S as U,g as Y,P as _,W as $,d as re,h as J,e as Z,D as N,i as se,a as ee,j as te,f as L,k as R,I as ce,G as de,T as le,l as me,m as ue,n as pe}from"./GLTFLoader-6zSPjOJe.js";import{O as ne}from"./OrbitControls-DPEXwd_f.js";const k=document.getElementById("toast-pill");function oe(e){k&&(k.textContent=e,k.classList.add("show"),setTimeout(()=>k.classList.remove("show"),2500))}const q=document.getElementById("mobile-toggle-btn"),G=document.getElementById("mobile-drawer");q&&G&&(q.addEventListener("click",()=>{G.classList.toggle("open")}),document.querySelectorAll(".mobile-link").forEach(e=>{e.addEventListener("click",()=>G.classList.remove("open"))}));const fe=document.querySelectorAll(".nav-menu .nav-item-link"),he=["inicio","documentacion","ejemplos","playground","herramientas"];window.addEventListener("scroll",()=>{const e=window.scrollY+140;he.forEach(n=>{const t=document.getElementById(n);if(t){const o=t.offsetTop,u=t.offsetHeight;if(e>=o&&e<o+u){fe.forEach(d=>d.classList.remove("active"));const b=document.querySelector(`.nav-menu a[href="#${n}"]`);b&&b.classList.add("active")}}})});const T={npm:`# Instalar VXR Core y Three.js en tu proyecto
npm install github:Vickman123/Framework-XVR three @types/three`,ts:`import { XRApp } from 'vxr';

// 1. Inicia tu experiencia 3D y WebXR en 4 líneas
const app = new XRApp({
  container: '#app',
  autoVRButton: true,
  enableShadows: true,
  enableGrid: true,
  pixelRatioCap: 1.5
});

// 2. Carga modelo con centrado y piso automáticos
await app.loadModel('./models/artefacto.glb', {
  autoGround: true,
  autoCenter: true
});

app.start();`,rooms:`import { XRApp, XRRoom, ProceduralAudio } from 'vxr';

const app = new XRApp({ autoVRButton: true });

// 1. Construye una sala con paredes, piso y puertas
const room = new XRRoom({
  dimensions: { width: 14, height: 4.5, depth: 14 },
  materials: { floor: 'marble', walls: 'matte-white' },
  doors: [{ wall: 'north', width: 2.2, height: 3.0 }]
});
app.scene.add(room);

// 2. Audio procedural sintetizado nativo (0 MB)
const audio = new ProceduralAudio();
audio.playExhibitFanfare();

app.start();`,ar:`import { ARExperience, ARMode } from '@vxr/ar';

// 1. Inicia AR con cámara y seguimiento de imagen 6-DoF
const ar = new ARExperience({
  container: '#ar-viewport',
  mode: ARMode.IMAGE_TRACKING,
  enableGestures: true
});

// 2. Enciende la cámara y ancla el modelo
await ar.init();
await ar.loadModel('./models/robot.glb', {
  scale: 0.6,
  autoPlayAnimation: true
});

ar.start();`,cli:`# 1. Auditar salud del proyecto para Meta Quest
npx vxr doctor

# 2. Compilar build web optimizada para WebXR a 90 FPS
npx vxr build --target quest

# 3. Servir en red local con HTTPS automático para el visor
npx vxr serve --https`};let ae="npm";const we=document.getElementById("quickstart-code-view"),F=document.querySelectorAll(".quickstart-tabs .code-tab-btn");F.forEach(e=>{e.addEventListener("click",()=>{F.forEach(t=>t.classList.remove("active")),e.classList.add("active");const n=e.getAttribute("data-tab");n&&T[n]&&(ae=n,we.textContent=T[n])})});const H=document.getElementById("btn-copy-code"),B=document.getElementById("copy-btn-label");H&&H.addEventListener("click",()=>{const e=T[ae]||"";navigator.clipboard.writeText(e).then(()=>{B&&(B.textContent="¡Copiado!"),oe("Código copiado al portapapeles ✓"),setTimeout(()=>{B&&(B.textContent="Copiar")},2e3)})});const z=document.querySelectorAll(".docs-nav-item"),W=document.getElementById("docs-search"),ge=document.querySelectorAll(".doc-section-card");z.forEach(e=>{e.addEventListener("click",()=>{z.forEach(o=>o.classList.remove("active")),e.classList.add("active");const n=e.getAttribute("data-target"),t=document.getElementById(n);t&&t.scrollIntoView({behavior:"smooth"})})});W&&W.addEventListener("input",e=>{const n=e.target.value.toLowerCase().trim();ge.forEach(t=>{const u=t.textContent.toLowerCase().includes(n);t.style.display=u?"block":"none"})});const D=document.querySelectorAll(".catalog-filter-btn"),ye=document.querySelectorAll(".example-card");D.forEach(e=>{e.addEventListener("click",()=>{D.forEach(t=>t.classList.remove("active")),e.classList.add("active");const n=e.getAttribute("data-category");ye.forEach(t=>{const o=t.getAttribute("data-cat");n==="all"||o===n?t.style.display="flex":t.style.display="none"})})});const m=document.getElementById("experience-runner"),C=document.getElementById("experience-frame"),V=document.getElementById("runner-exp-title"),j=document.getElementById("btn-close-runner"),K=document.getElementById("btn-reload-frame"),O=document.getElementById("btn-fullscreen-frame"),Q=document.getElementById("btn-open-new-tab");let X="";function be(e,n){X=e,V&&(V.textContent=n),Q&&(Q.href=e),C&&(C.src=e),m&&(m.classList.add("active"),m.setAttribute("aria-hidden","false")),document.body.style.overflow="hidden"}function ie(){m&&(m.classList.remove("active"),m.setAttribute("aria-hidden","true")),C&&(C.src=""),document.body.style.overflow="auto"}document.querySelectorAll(".btn-test").forEach(e=>{e.addEventListener("click",n=>{n.preventDefault();const t=e.getAttribute("data-launch"),o=e.getAttribute("data-title")||"Experiencia VXR";t&&be(t,o)})});j&&j.addEventListener("click",ie);K&&K.addEventListener("click",()=>{C&&X&&(C.src=X)});O&&O.addEventListener("click",()=>{!document.fullscreenElement&&m?m.requestFullscreen().catch(e=>console.warn(e)):document.exitFullscreen&&document.exitFullscreen().catch(e=>console.warn(e))});window.addEventListener("keydown",e=>{e.key==="Escape"&&m&&m.classList.contains("active")&&ie()});const f=document.getElementById("hero-canvas-mount");if(f){let r=function(){requestAnimationFrame(r),o.update(),l.visible&&(l.rotation.y+=.005),t.render(e,n)};const e=new U;e.background=new Y(395539);const n=new _(45,f.clientWidth/f.clientHeight,.1,100);n.position.set(0,1.2,3.2);const t=new $({antialias:!0,alpha:!1});t.setPixelRatio(Math.min(window.devicePixelRatio,1.5)),t.setSize(f.clientWidth,f.clientHeight),t.shadowMap.enabled=!0,t.shadowMap.type=re,f.appendChild(t.domElement);const o=new ne(n,t.domElement);o.enableDamping=!0,o.dampingFactor=.05,o.autoRotate=!0,o.autoRotateSpeed=1.2,o.maxPolarAngle=Math.PI/2+.1;const u=new J(10,20,3718648,1976635);u.position.y=-.5,e.add(u);const b=new Z(16777215,.8);e.add(b);const d=new N(3718648,2);d.position.set(4,6,4),d.castShadow=!0,e.add(d);const i=new se(11032055,2.5,10);i.position.set(-3,2,-2),e.add(i);const p=new ee;e.add(p);const I=new te(.8,.9,.2,32),S=new L({color:1976635,roughness:.3,metalness:.8}),E=new R(I,S);E.position.y=-.4,E.receiveShadow=!0,p.add(E);const A=new ce(.55,1),w=new L({color:165063,roughness:.2,metalness:.7,wireframe:!1}),l=new R(A,w);l.position.y=.45,l.castShadow=!0,p.add(l),new de().load("./model.glb",c=>{l.visible=!1;const v=c.scene;v.scale.set(.6,.6,.6),v.position.y=-.3,v.traverse(P=>{P.isMesh&&(P.castShadow=!0,P.receiveShadow=!0)}),p.add(v)},void 0,()=>{l.visible=!0});const g=document.getElementById("btn-hero-wireframe");g&&g.addEventListener("click",()=>{w.wireframe=!w.wireframe,g.classList.toggle("active",w.wireframe)});let x=0;const a=[{name:"Luz: Estudio",dir:3718648,point:11032055,amb:.8},{name:"Luz: Cyber",dir:440020,point:16007006,amb:.5},{name:"Luz: Atardecer",dir:16486972,point:12616956,amb:.7}],s=document.getElementById("btn-hero-light");s&&s.addEventListener("click",()=>{x=(x+1)%a.length;const c=a[x];s.textContent=c.name,d.color.setHex(c.dir),i.color.setHex(c.point),b.intensity=c.amb});const y=document.getElementById("btn-hero-reset");y&&y.addEventListener("click",()=>{n.position.set(0,1.2,3.2),o.target.set(0,0,0),o.update()}),window.addEventListener("resize",()=>{if(!f)return;const c=f.clientWidth,v=f.clientHeight;n.aspect=c/v,n.updateProjectionMatrix(),t.setSize(c,v)}),r()}const h=document.getElementById("playground-canvas-mount");if(h){let E=function(a){for(;i.children.length>0;)i.remove(i.children[0]);if(a==="model"){const s=new le(.7,.25,16,100),y=new L({color:165063,metalness:.7,roughness:.3}),r=new R(s,y);r.position.y=.8,r.castShadow=!0,i.add(r)}else if(a==="room"){const s=new me(4,2.5,4),y=new L({color:1976635,side:ue}),r=new R(s,y);r.position.y=1.25,i.add(r);const c=new R(new te(.4,.45,.5,24),new L({color:3718648}));c.position.y=.25,i.add(c)}else if(a==="geometry"){const s=new pe(.55,.18,100,16),y=new L({color:11032055,roughness:.2,metalness:.8}),r=new R(s,y);r.position.y=.9,r.castShadow=!0,i.add(r)}p&&S[a]&&(p.textContent=S[a])},x=function(){requestAnimationFrame(x),o.update(),t.render(e,n)};const e=new U;e.background=new Y(263953);const n=new _(45,h.clientWidth/h.clientHeight,.1,100);n.position.set(0,2,4);const t=new $({antialias:!0});t.setPixelRatio(Math.min(window.devicePixelRatio,1.5)),t.setSize(h.clientWidth,h.clientHeight),t.shadowMap.enabled=!0,h.appendChild(t.domElement);const o=new ne(n,t.domElement);o.enableDamping=!0,o.autoRotate=!0,o.autoRotateSpeed=1;const u=new J(12,24,3718648,1976635);u.position.y=-.01,e.add(u);const b=new Z(16777215,.9);e.add(b);const d=new N(3718648,2);d.position.set(5,8,4),d.castShadow=!0,e.add(d);const i=new ee;e.add(i);const p=document.getElementById("playground-code-display"),I=document.getElementById("playground-preset-select"),S={model:`import { XRApp } from 'vxr';

// 1. Inicializa XRApp
const app = new XRApp({
  container: '#app',
  enableShadows: true,
  enableGrid: true,
  pixelRatioCap: 1.5
});

// 2. Carga modelo GLB centrado
await app.loadModel('./model.glb', {
  autoCenter: true,
  autoGround: true
});

app.start();`,room:`import { XRApp, XRRoom } from 'vxr';

const app = new XRApp({ autoVRButton: true });

// Construye sala con pedestal iluminado
const room = new XRRoom({
  dimensions: { width: 12, height: 4, depth: 12 },
  materials: { floor: 'marble', walls: 'matte-white' },
  doors: [{ wall: 'north', width: 2.2, height: 3.0 }]
});
app.scene.add(room);

app.start();`,geometry:`import { XRApp } from 'vxr';
import * as THREE from 'three';

const app = new XRApp();

// Malla interactiva con sombreado dinámico
const geo = new THREE.TorusKnotGeometry(0.6, 0.2, 100, 16);
const mat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  metalness: 0.8,
  roughness: 0.2
});
const mesh = new THREE.Mesh(geo, mat);
mesh.position.y = 0.8;
app.scene.add(mesh);

app.start();`};I&&I.addEventListener("change",a=>{E(a.target.value)}),E("model");const A=document.getElementById("btn-play-wireframe");A&&A.addEventListener("click",()=>{i.traverse(a=>{a.isMesh&&a.material&&(a.material.wireframe=!a.material.wireframe,A.classList.toggle("active",a.material.wireframe))})});const w=document.getElementById("btn-play-autorotate");w&&w.addEventListener("click",()=>{o.autoRotate=!o.autoRotate,w.classList.toggle("active",o.autoRotate)});const l=document.getElementById("btn-play-reset");l&&l.addEventListener("click",()=>{n.position.set(0,2,4),o.target.set(0,.5,0),o.update()});const M=document.getElementById("btn-play-copy-code"),g=document.getElementById("play-copy-label");M&&M.addEventListener("click",()=>{const a=p?p.textContent:"";navigator.clipboard.writeText(a).then(()=>{g&&(g.textContent="¡Copiado!"),oe("Código de Playground copiado ✓"),setTimeout(()=>{g&&(g.textContent="Copiar Código")},2e3)})}),window.addEventListener("resize",()=>{if(!h)return;const a=h.clientWidth,s=h.clientHeight;n.aspect=a/s,n.updateProjectionMatrix(),t.setSize(a,s)}),x()}
