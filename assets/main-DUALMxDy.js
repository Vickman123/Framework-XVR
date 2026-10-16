import{S as ee,g as te,P as ne,W as oe,d as ue,h as ae,e as ie,D as se,i as fe,j as x,k as he,l as we,a as re,m as ce,f as R,I as ge,G as ye,B as be,V,T as ve,n as xe,o as Ee,p as Le}from"./GLTFLoader-CFzJ3xdz.js";import{O as de}from"./OrbitControls-BcHB8vvx.js";const k=document.getElementById("toast-pill");function le(e){k&&(k.textContent=e,k.classList.add("show"),setTimeout(()=>k.classList.remove("show"),2500))}const j=document.getElementById("mobile-toggle-btn"),q=document.getElementById("mobile-drawer");j&&q&&(j.addEventListener("click",()=>{q.classList.toggle("open")}),document.querySelectorAll(".mobile-link").forEach(e=>{e.addEventListener("click",()=>q.classList.remove("open"))}));const Re=document.querySelectorAll(".nav-menu .nav-item-link"),Ce=["inicio","documentacion","ejemplos","playground","herramientas"];window.addEventListener("scroll",()=>{const e=window.scrollY+140;Ce.forEach(n=>{const t=document.getElementById(n);if(t){const o=t.offsetTop,u=t.offsetHeight;if(e>=o&&e<o+u){Re.forEach(d=>d.classList.remove("active"));const b=document.querySelector(`.nav-menu a[href="#${n}"]`);b&&b.classList.add("active")}}})});const z={npm:`# Instalar VXR Core y Three.js en tu proyecto
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
npx vxr serve --https`};let me="npm";const Ae=document.getElementById("quickstart-code-view"),O=document.querySelectorAll(".quickstart-tabs .code-tab-btn");O.forEach(e=>{e.addEventListener("click",()=>{O.forEach(t=>t.classList.remove("active")),e.classList.add("active");const n=e.getAttribute("data-tab");n&&z[n]&&(me=n,Ae.textContent=z[n])})});const K=document.getElementById("btn-copy-code"),P=document.getElementById("copy-btn-label");K&&K.addEventListener("click",()=>{const e=z[me]||"";navigator.clipboard.writeText(e).then(()=>{P&&(P.textContent="¡Copiado!"),le("Código copiado al portapapeles ✓"),setTimeout(()=>{P&&(P.textContent="Copiar")},2e3)})});const Q=document.querySelectorAll(".docs-nav-item"),U=document.getElementById("docs-search"),Se=document.querySelectorAll(".doc-section-card");Q.forEach(e=>{e.addEventListener("click",()=>{Q.forEach(o=>o.classList.remove("active")),e.classList.add("active");const n=e.getAttribute("data-target"),t=document.getElementById(n);t&&t.scrollIntoView({behavior:"smooth"})})});U&&U.addEventListener("input",e=>{const n=e.target.value.toLowerCase().trim();Se.forEach(t=>{const u=t.textContent.toLowerCase().includes(n);t.style.display=u?"block":"none"})});const Y=document.querySelectorAll(".catalog-filter-btn"),Ie=document.querySelectorAll(".example-card");Y.forEach(e=>{e.addEventListener("click",()=>{Y.forEach(t=>t.classList.remove("active")),e.classList.add("active");const n=e.getAttribute("data-category");Ie.forEach(t=>{const o=t.getAttribute("data-cat");n==="all"||o===n?t.style.display="flex":t.style.display="none"})})});const p=document.getElementById("experience-runner"),C=document.getElementById("experience-frame"),_=document.getElementById("runner-exp-title"),$=document.getElementById("btn-close-runner"),J=document.getElementById("btn-reload-frame"),Z=document.getElementById("btn-fullscreen-frame"),N=document.getElementById("btn-open-new-tab");let F="";function Be(e,n){F=e,_&&(_.textContent=n),N&&(N.href=e),C&&(C.src=e),p&&(p.classList.add("active"),p.setAttribute("aria-hidden","false")),document.body.style.overflow="hidden"}function pe(){p&&(p.classList.remove("active"),p.setAttribute("aria-hidden","true")),C&&(C.src=""),document.body.style.overflow="auto"}document.querySelectorAll(".btn-test").forEach(e=>{e.addEventListener("click",n=>{n.preventDefault();const t=e.getAttribute("data-launch"),o=e.getAttribute("data-title")||"Experiencia VXR";t&&Be(t,o)})});$&&$.addEventListener("click",pe);J&&J.addEventListener("click",()=>{C&&F&&(C.src=F)});Z&&Z.addEventListener("click",()=>{!document.fullscreenElement&&p?p.requestFullscreen().catch(e=>console.warn(e)):document.exitFullscreen&&document.exitFullscreen().catch(e=>console.warn(e))});window.addEventListener("keydown",e=>{e.key==="Escape"&&p&&p.classList.contains("active")&&pe()});const h=document.getElementById("hero-canvas-mount");if(h){let H=function(){requestAnimationFrame(H),o.update(),m.visible&&(m.rotation.y+=.005),t.render(e,n)};const e=new ee;e.background=new te(395539);const n=new ne(45,h.clientWidth/h.clientHeight,.1,100);n.position.set(7.5,6,9.5);const t=new oe({antialias:!0,alpha:!1});t.setPixelRatio(Math.min(window.devicePixelRatio,1.5)),t.setSize(h.clientWidth,h.clientHeight),t.shadowMap.enabled=!0,t.shadowMap.type=ue,h.appendChild(t.domElement);const o=new de(n,t.domElement);o.enableDamping=!0,o.dampingFactor=.05,o.autoRotate=!1,o.target.set(0,.2,0),o.minDistance=3.5,o.maxDistance=25,o.maxPolarAngle=Math.PI/2-.05,o.update();const u=new ae(16,24,3718648,1318966);u.position.y=-.5,e.add(u);const b=new ie(16777215,.9);e.add(b);const d=new se(3718648,2.2);d.position.set(6,8,5),d.castShadow=!0,d.shadow.mapSize.width=1024,d.shadow.mapSize.height=1024,e.add(d);const r=new fe(12616956,3.5,14);r.position.set(-2.6,1.2,-1.2),e.add(r);const E=new x(new he(.06,16,16),new we({color:16777215}));r.add(E);const v=new re;e.add(v);const B=new ce(.8,.9,.2,32),M=new R({color:1976635,roughness:.3,metalness:.8}),f=new x(B,M);f.position.y=-.4,f.receiveShadow=!0,v.add(f);const A=new ge(.55,1),S=new R({color:165063,roughness:.2,metalness:.7,wireframe:!1}),m=new x(A,S);m.position.y=.45,m.castShadow=!0,v.add(m);let g=null;new ye().load("./model.glb",i=>{m.visible=!1,f.visible=!1;const s=i.scene;g=s;const T=new be().setFromObject(s),D=T.getCenter(new V),W=T.getSize(new V),L=5.2/(Math.max(W.x,W.z)||1);s.scale.set(L,L,L),s.position.x=-D.x*L,s.position.z=-D.z*L,s.position.y=-T.min.y*L-.5,s.traverse(X=>{X.isMesh&&(X.castShadow=!0,X.receiveShadow=!0)}),v.add(s),n.position.set(7.5,6,9.5),o.target.set(0,.2,0),o.update()},void 0,()=>{m.visible=!0,f.visible=!0});const a=document.getElementById("btn-hero-wireframe");if(a){let i=!1;a.addEventListener("click",()=>{i=!i,S.wireframe=i,g&&g.traverse(s=>{s.isMesh&&s.material&&(s.material.wireframe=i)}),a.classList.toggle("active",i)})}let l=0;const y=[{name:"Luz: Estudio",dir:3718648,point:12616956,amb:.9},{name:"Luz: Cyber",dir:440020,point:16007006,amb:.6},{name:"Luz: Atardecer",dir:16486972,point:14239471,amb:.8}],c=document.getElementById("btn-hero-light");c&&c.addEventListener("click",()=>{l=(l+1)%y.length;const i=y[l];c.textContent=i.name,d.color.setHex(i.dir),r.color.setHex(i.point),b.intensity=i.amb});const I=document.getElementById("btn-hero-reset");I&&I.addEventListener("click",()=>{n.position.set(7.5,6,9.5),o.target.set(0,.2,0),o.update()}),window.addEventListener("resize",()=>{if(!h)return;const i=h.clientWidth,s=h.clientHeight;n.aspect=i/s,n.updateProjectionMatrix(),t.setSize(i,s)}),H()}const w=document.getElementById("playground-canvas-mount");if(w){let M=function(a){for(;r.children.length>0;)r.remove(r.children[0]);if(a==="model"){const l=new ve(.7,.25,16,100),y=new R({color:165063,metalness:.7,roughness:.3}),c=new x(l,y);c.position.y=.8,c.castShadow=!0,r.add(c)}else if(a==="room"){const l=new xe(4,2.5,4),y=new R({color:1976635,side:Ee}),c=new x(l,y);c.position.y=1.25,r.add(c);const I=new x(new ce(.4,.45,.5,24),new R({color:3718648}));I.position.y=.25,r.add(I)}else if(a==="geometry"){const l=new Le(.55,.18,100,16),y=new R({color:11032055,roughness:.2,metalness:.8}),c=new x(l,y);c.position.y=.9,c.castShadow=!0,r.add(c)}E&&B[a]&&(E.textContent=B[a])},G=function(){requestAnimationFrame(G),o.update(),t.render(e,n)};const e=new ee;e.background=new te(263953);const n=new ne(45,w.clientWidth/w.clientHeight,.1,100);n.position.set(0,2,4);const t=new oe({antialias:!0});t.setPixelRatio(Math.min(window.devicePixelRatio,1.5)),t.setSize(w.clientWidth,w.clientHeight),t.shadowMap.enabled=!0,w.appendChild(t.domElement);const o=new de(n,t.domElement);o.enableDamping=!0,o.autoRotate=!0,o.autoRotateSpeed=1;const u=new ae(12,24,3718648,1976635);u.position.y=-.01,e.add(u);const b=new ie(16777215,.9);e.add(b);const d=new se(3718648,2);d.position.set(5,8,4),d.castShadow=!0,e.add(d);const r=new re;e.add(r);const E=document.getElementById("playground-code-display"),v=document.getElementById("playground-preset-select"),B={model:`import { XRApp } from 'vxr';

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

app.start();`};v&&v.addEventListener("change",a=>{M(a.target.value)}),M("model");const f=document.getElementById("btn-play-wireframe");f&&f.addEventListener("click",()=>{r.traverse(a=>{a.isMesh&&a.material&&(a.material.wireframe=!a.material.wireframe,f.classList.toggle("active",a.material.wireframe))})});const A=document.getElementById("btn-play-autorotate");A&&A.addEventListener("click",()=>{o.autoRotate=!o.autoRotate,A.classList.toggle("active",o.autoRotate)});const S=document.getElementById("btn-play-reset");S&&S.addEventListener("click",()=>{n.position.set(0,2,4),o.target.set(0,.5,0),o.update()});const m=document.getElementById("btn-play-copy-code"),g=document.getElementById("play-copy-label");m&&m.addEventListener("click",()=>{const a=E?E.textContent:"";navigator.clipboard.writeText(a).then(()=>{g&&(g.textContent="¡Copiado!"),le("Código de Playground copiado ✓"),setTimeout(()=>{g&&(g.textContent="Copiar Código")},2e3)})}),window.addEventListener("resize",()=>{if(!w)return;const a=w.clientWidth,l=w.clientHeight;n.aspect=a/l,n.updateProjectionMatrix(),t.setSize(a,l)}),G()}
