import{q as aa,V as f,Q as te,R as sa,O as Nt,l as se,L as ra,m as I,n as g,r as Lo,F as ko,j as l,s as pt,t as re,T as ue,k as to,E as ia,c as Bn,u as Ge,v as oo,h as ca,w as la,x as da,y as kt,z as Bo,M as oe,f as L,B as ma,a as q,g as no,J as pa,i as ua,p as ha,K as Cn,N as st,U as ao,X as Co,Y as fa}from"./GLTFLoader-CFzJ3xdz.js";import{X as ya}from"./XRApp-B1rn2eyX.js";import"./OrbitControls-BcHB8vvx.js";import"./DRACOLoader-aLVTkEug.js";const me=new sa,H=new f,ie=new f,M=new te,Ho={X:new f(1,0,0),Y:new f(0,1,0),Z:new f(0,0,1)},Bt={type:"change"},Xo={type:"mouseDown",mode:null},_o={type:"mouseUp",mode:null},Yo={type:"objectChange"};class ga extends aa{constructor(t,o=null){super(void 0,o);const n=new Ma(this);this._root=n;const s=new Sa;this._gizmo=s,n.add(s);const r=new Ia;this._plane=r,n.add(r);const a=this;function i(Z,le){let Ie=le;Object.defineProperty(a,Z,{get:function(){return Ie!==void 0?Ie:le},set:function(de){Ie!==de&&(Ie=de,r[Z]=de,s[Z]=de,a.dispatchEvent({type:Z+"-changed",value:de}),a.dispatchEvent(Bt))}}),a[Z]=le,r[Z]=le,s[Z]=le}i("camera",t),i("object",void 0),i("enabled",!0),i("axis",null),i("mode","translate"),i("translationSnap",null),i("rotationSnap",null),i("scaleSnap",null),i("space","world"),i("size",1),i("dragging",!1),i("showX",!0),i("showY",!0),i("showZ",!0),i("minX",-1/0),i("maxX",1/0),i("minY",-1/0),i("maxY",1/0),i("minZ",-1/0),i("maxZ",1/0);const c=new f,p=new f,m=new te,E=new te,S=new f,k=new te,Y=new f,C=new f,z=new f,V=0,ne=new f;i("worldPosition",c),i("worldPositionStart",p),i("worldQuaternion",m),i("worldQuaternionStart",E),i("cameraPosition",S),i("cameraQuaternion",k),i("pointStart",Y),i("pointEnd",C),i("rotationAxis",z),i("rotationAngle",V),i("eye",ne),this._offset=new f,this._startNorm=new f,this._endNorm=new f,this._cameraScale=new f,this._parentPosition=new f,this._parentQuaternion=new te,this._parentQuaternionInv=new te,this._parentScale=new f,this._worldScaleStart=new f,this._worldQuaternionInv=new te,this._worldScale=new f,this._positionStart=new f,this._quaternionStart=new te,this._scaleStart=new f,this._getPointer=wa.bind(this),this._onPointerDown=ba.bind(this),this._onPointerHover=Ea.bind(this),this._onPointerMove=va.bind(this),this._onPointerUp=xa.bind(this),o!==null&&this.connect()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointermove",this._onPointerHover),this.domElement.addEventListener("pointerup",this._onPointerUp),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerHover),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.style.touchAction="auto"}getHelper(){return this._root}pointerHover(t){if(this.object===void 0||this.dragging===!0)return;t!==null&&me.setFromCamera(t,this.camera);const o=Ct(this._gizmo.picker[this.mode],me);o?this.axis=o.object.name:this.axis=null}pointerDown(t){if(!(this.object===void 0||this.dragging===!0||t!=null&&t.button!==0)&&this.axis!==null){t!==null&&me.setFromCamera(t,this.camera);const o=Ct(this._plane,me,!0);o&&(this.object.updateMatrixWorld(),this.object.parent.updateMatrixWorld(),this._positionStart.copy(this.object.position),this._quaternionStart.copy(this.object.quaternion),this._scaleStart.copy(this.object.scale),this.object.matrixWorld.decompose(this.worldPositionStart,this.worldQuaternionStart,this._worldScaleStart),this.pointStart.copy(o.point).sub(this.worldPositionStart)),this.dragging=!0,Xo.mode=this.mode,this.dispatchEvent(Xo)}}pointerMove(t){const o=this.axis,n=this.mode,s=this.object;let r=this.space;if(n==="scale"?r="local":(o==="E"||o==="XYZE"||o==="XYZ")&&(r="world"),s===void 0||o===null||this.dragging===!1||t!==null&&t.button!==-1)return;t!==null&&me.setFromCamera(t,this.camera);const a=Ct(this._plane,me,!0);if(a){if(this.pointEnd.copy(a.point).sub(this.worldPositionStart),n==="translate")this._offset.copy(this.pointEnd).sub(this.pointStart),r==="local"&&o!=="XYZ"&&this._offset.applyQuaternion(this._worldQuaternionInv),o.indexOf("X")===-1&&(this._offset.x=0),o.indexOf("Y")===-1&&(this._offset.y=0),o.indexOf("Z")===-1&&(this._offset.z=0),r==="local"&&o!=="XYZ"?this._offset.applyQuaternion(this._quaternionStart).divide(this._parentScale):this._offset.applyQuaternion(this._parentQuaternionInv).divide(this._parentScale),s.position.copy(this._offset).add(this._positionStart),this.translationSnap&&(r==="local"&&(s.position.applyQuaternion(M.copy(this._quaternionStart).invert()),o.search("X")!==-1&&(s.position.x=Math.round(s.position.x/this.translationSnap)*this.translationSnap),o.search("Y")!==-1&&(s.position.y=Math.round(s.position.y/this.translationSnap)*this.translationSnap),o.search("Z")!==-1&&(s.position.z=Math.round(s.position.z/this.translationSnap)*this.translationSnap),s.position.applyQuaternion(this._quaternionStart)),r==="world"&&(s.parent&&s.position.add(H.setFromMatrixPosition(s.parent.matrixWorld)),o.search("X")!==-1&&(s.position.x=Math.round(s.position.x/this.translationSnap)*this.translationSnap),o.search("Y")!==-1&&(s.position.y=Math.round(s.position.y/this.translationSnap)*this.translationSnap),o.search("Z")!==-1&&(s.position.z=Math.round(s.position.z/this.translationSnap)*this.translationSnap),s.parent&&s.position.sub(H.setFromMatrixPosition(s.parent.matrixWorld)))),s.position.x=Math.max(this.minX,Math.min(this.maxX,s.position.x)),s.position.y=Math.max(this.minY,Math.min(this.maxY,s.position.y)),s.position.z=Math.max(this.minZ,Math.min(this.maxZ,s.position.z));else if(n==="scale"){if(o.search("XYZ")!==-1){let i=this.pointEnd.length()/this.pointStart.length();this.pointEnd.dot(this.pointStart)<0&&(i*=-1),ie.set(i,i,i)}else H.copy(this.pointStart),ie.copy(this.pointEnd),H.applyQuaternion(this._worldQuaternionInv),ie.applyQuaternion(this._worldQuaternionInv),ie.divide(H),o.search("X")===-1&&(ie.x=1),o.search("Y")===-1&&(ie.y=1),o.search("Z")===-1&&(ie.z=1);s.scale.copy(this._scaleStart).multiply(ie),this.scaleSnap&&(o.search("X")!==-1&&(s.scale.x=Math.round(s.scale.x/this.scaleSnap)*this.scaleSnap||this.scaleSnap),o.search("Y")!==-1&&(s.scale.y=Math.round(s.scale.y/this.scaleSnap)*this.scaleSnap||this.scaleSnap),o.search("Z")!==-1&&(s.scale.z=Math.round(s.scale.z/this.scaleSnap)*this.scaleSnap||this.scaleSnap))}else if(n==="rotate"){this._offset.copy(this.pointEnd).sub(this.pointStart);const i=20/this.worldPosition.distanceTo(H.setFromMatrixPosition(this.camera.matrixWorld));let c=!1;o==="XYZE"?(this.rotationAxis.copy(this._offset).cross(this.eye).normalize(),this.rotationAngle=this._offset.dot(H.copy(this.rotationAxis).cross(this.eye))*i):(o==="X"||o==="Y"||o==="Z")&&(this.rotationAxis.copy(Ho[o]),H.copy(Ho[o]),r==="local"&&H.applyQuaternion(this.worldQuaternion),H.cross(this.eye),H.length()===0?c=!0:this.rotationAngle=this._offset.dot(H.normalize())*i),(o==="E"||c)&&(this.rotationAxis.copy(this.eye),this.rotationAngle=this.pointEnd.angleTo(this.pointStart),this._startNorm.copy(this.pointStart).normalize(),this._endNorm.copy(this.pointEnd).normalize(),this.rotationAngle*=this._endNorm.cross(this._startNorm).dot(this.eye)<0?1:-1),this.rotationSnap&&(this.rotationAngle=Math.round(this.rotationAngle/this.rotationSnap)*this.rotationSnap),r==="local"&&o!=="E"&&o!=="XYZE"?(s.quaternion.copy(this._quaternionStart),s.quaternion.multiply(M.setFromAxisAngle(this.rotationAxis,this.rotationAngle)).normalize()):(this.rotationAxis.applyQuaternion(this._parentQuaternionInv),s.quaternion.copy(M.setFromAxisAngle(this.rotationAxis,this.rotationAngle)),s.quaternion.multiply(this._quaternionStart).normalize())}this.dispatchEvent(Bt),this.dispatchEvent(Yo)}}pointerUp(t){t!==null&&t.button!==0||(this.dragging&&this.axis!==null&&(_o.mode=this.mode,this.dispatchEvent(_o)),this.dragging=!1,this.axis=null)}dispose(){this.disconnect(),this._root.dispose()}attach(t){return this.object=t,this._root.visible=!0,this}detach(){return this.object=void 0,this.axis=null,this._root.visible=!1,this}reset(){this.enabled&&this.dragging&&(this.object.position.copy(this._positionStart),this.object.quaternion.copy(this._quaternionStart),this.object.scale.copy(this._scaleStart),this.dispatchEvent(Bt),this.dispatchEvent(Yo),this.pointStart.copy(this.pointEnd))}getRaycaster(){return me}getMode(){return this.mode}setMode(t){this.mode=t}setTranslationSnap(t){this.translationSnap=t}setRotationSnap(t){this.rotationSnap=t}setScaleSnap(t){this.scaleSnap=t}setSize(t){this.size=t}setSpace(t){this.space=t}}function wa(e){if(this.domElement.ownerDocument.pointerLockElement)return{x:0,y:0,button:e.button};{const t=this.domElement.getBoundingClientRect();return{x:(e.clientX-t.left)/t.width*2-1,y:-(e.clientY-t.top)/t.height*2+1,button:e.button}}}function Ea(e){if(this.enabled)switch(e.pointerType){case"mouse":case"pen":this.pointerHover(this._getPointer(e));break}}function ba(e){this.enabled&&(document.pointerLockElement||this.domElement.setPointerCapture(e.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.pointerHover(this._getPointer(e)),this.pointerDown(this._getPointer(e)))}function va(e){this.enabled&&this.pointerMove(this._getPointer(e))}function xa(e){this.enabled&&(this.domElement.releasePointerCapture(e.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.pointerUp(this._getPointer(e)))}function Ct(e,t,o){const n=t.intersectObject(e,!0);for(let s=0;s<n.length;s++)if(n[s].object.visible||o)return n[s];return!1}const ut=new ia,x=new f(0,1,0),Ao=new f(0,0,0),Zo=new Bn,ht=new te,bt=new te,J=new f,Go=new Bn,We=new f(1,0,0),pe=new f(0,1,0),qe=new f(0,0,1),ft=new f,Fe=new f,De=new f;class Ma extends Nt{constructor(t){super(),this.isTransformControlsRoot=!0,this.controls=t,this.visible=!1}updateMatrixWorld(t){const o=this.controls;o.object!==void 0&&(o.object.updateMatrixWorld(),o.object.parent===null?console.error("TransformControls: The attached 3D object must be a part of the scene graph."):o.object.parent.matrixWorld.decompose(o._parentPosition,o._parentQuaternion,o._parentScale),o.object.matrixWorld.decompose(o.worldPosition,o.worldQuaternion,o._worldScale),o._parentQuaternionInv.copy(o._parentQuaternion).invert(),o._worldQuaternionInv.copy(o.worldQuaternion).invert()),o.camera.updateMatrixWorld(),o.camera.matrixWorld.decompose(o.cameraPosition,o.cameraQuaternion,o._cameraScale),o.camera.isOrthographicCamera?o.camera.getWorldDirection(o.eye).negate():o.eye.copy(o.cameraPosition).sub(o.worldPosition).normalize(),super.updateMatrixWorld(t)}dispose(){this.traverse(function(t){t.geometry&&t.geometry.dispose(),t.material&&t.material.dispose()})}}class Sa extends Nt{constructor(){super(),this.isTransformControlsGizmo=!0,this.type="TransformControlsGizmo";const t=new se({depthTest:!1,depthWrite:!1,fog:!1,toneMapped:!1,transparent:!0}),o=new ra({depthTest:!1,depthWrite:!1,fog:!1,toneMapped:!1,transparent:!0}),n=t.clone();n.opacity=.15;const s=o.clone();s.opacity=.5;const r=t.clone();r.color.setHex(16711680);const a=t.clone();a.color.setHex(65280);const i=t.clone();i.color.setHex(255);const c=t.clone();c.color.setHex(16711680),c.opacity=.5;const p=t.clone();p.color.setHex(65280),p.opacity=.5;const m=t.clone();m.color.setHex(255),m.opacity=.5;const E=t.clone();E.opacity=.25;const S=t.clone();S.color.setHex(16776960),S.opacity=.25,t.clone().color.setHex(16776960);const Y=t.clone();Y.color.setHex(7895160);const C=new I(0,.04,.1,12);C.translate(0,.05,0);const z=new g(.08,.08,.08);z.translate(0,.04,0);const V=new Lo;V.setAttribute("position",new ko([0,0,0,1,0,0],3));const ne=new I(.0075,.0075,.5,3);ne.translate(0,.25,0);function Z($,ct){const O=new ue($,.0075,3,64,ct*Math.PI*2);return O.rotateY(Math.PI/2),O.rotateX(Math.PI/2),O}function le(){const $=new Lo;return $.setAttribute("position",new ko([0,0,0,1,1,1],3)),$}const Ie={X:[[new l(C,r),[.5,0,0],[0,0,-Math.PI/2]],[new l(C,r),[-.5,0,0],[0,0,Math.PI/2]],[new l(ne,r),[0,0,0],[0,0,-Math.PI/2]]],Y:[[new l(C,a),[0,.5,0]],[new l(C,a),[0,-.5,0],[Math.PI,0,0]],[new l(ne,a)]],Z:[[new l(C,i),[0,0,.5],[Math.PI/2,0,0]],[new l(C,i),[0,0,-.5],[-Math.PI/2,0,0]],[new l(ne,i),null,[Math.PI/2,0,0]]],XYZ:[[new l(new pt(.1,0),E.clone()),[0,0,0]]],XY:[[new l(new g(.15,.15,.01),m.clone()),[.15,.15,0]]],YZ:[[new l(new g(.15,.15,.01),c.clone()),[0,.15,.15],[0,Math.PI/2,0]]],XZ:[[new l(new g(.15,.15,.01),p.clone()),[.15,0,.15],[-Math.PI/2,0,0]]]},de={X:[[new l(new I(.2,0,.6,4),n),[.3,0,0],[0,0,-Math.PI/2]],[new l(new I(.2,0,.6,4),n),[-.3,0,0],[0,0,Math.PI/2]]],Y:[[new l(new I(.2,0,.6,4),n),[0,.3,0]],[new l(new I(.2,0,.6,4),n),[0,-.3,0],[0,0,Math.PI]]],Z:[[new l(new I(.2,0,.6,4),n),[0,0,.3],[Math.PI/2,0,0]],[new l(new I(.2,0,.6,4),n),[0,0,-.3],[-Math.PI/2,0,0]]],XYZ:[[new l(new pt(.2,0),n)]],XY:[[new l(new g(.2,.2,.01),n),[.15,.15,0]]],YZ:[[new l(new g(.2,.2,.01),n),[0,.15,.15],[0,Math.PI/2,0]]],XZ:[[new l(new g(.2,.2,.01),n),[.15,0,.15],[-Math.PI/2,0,0]]]},Nn={START:[[new l(new pt(.01,2),s),null,null,null,"helper"]],END:[[new l(new pt(.01,2),s),null,null,null,"helper"]],DELTA:[[new re(le(),s),null,null,null,"helper"]],X:[[new re(V,s.clone()),[-1e3,0,0],null,[1e6,1,1],"helper"]],Y:[[new re(V,s.clone()),[0,-1e3,0],[0,0,Math.PI/2],[1e6,1,1],"helper"]],Z:[[new re(V,s.clone()),[0,0,-1e3],[0,-Math.PI/2,0],[1e6,1,1],"helper"]]},Vn={XYZE:[[new l(Z(.5,1),Y),null,[0,Math.PI/2,0]]],X:[[new l(Z(.5,.5),r)]],Y:[[new l(Z(.5,.5),a),null,[0,0,-Math.PI/2]]],Z:[[new l(Z(.5,.5),i),null,[0,Math.PI/2,0]]],E:[[new l(Z(.75,1),S),null,[0,Math.PI/2,0]]]},Jn={AXIS:[[new re(V,s.clone()),[-1e3,0,0],null,[1e6,1,1],"helper"]]},Kn={XYZE:[[new l(new to(.25,10,8),n)]],X:[[new l(new ue(.5,.1,4,24),n),[0,0,0],[0,-Math.PI/2,-Math.PI/2]]],Y:[[new l(new ue(.5,.1,4,24),n),[0,0,0],[Math.PI/2,0,0]]],Z:[[new l(new ue(.5,.1,4,24),n),[0,0,0],[0,0,-Math.PI/2]]],E:[[new l(new ue(.75,.1,2,24),n)]]},ea={X:[[new l(z,r),[.5,0,0],[0,0,-Math.PI/2]],[new l(ne,r),[0,0,0],[0,0,-Math.PI/2]],[new l(z,r),[-.5,0,0],[0,0,Math.PI/2]]],Y:[[new l(z,a),[0,.5,0]],[new l(ne,a)],[new l(z,a),[0,-.5,0],[0,0,Math.PI]]],Z:[[new l(z,i),[0,0,.5],[Math.PI/2,0,0]],[new l(ne,i),[0,0,0],[Math.PI/2,0,0]],[new l(z,i),[0,0,-.5],[-Math.PI/2,0,0]]],XY:[[new l(new g(.15,.15,.01),m),[.15,.15,0]]],YZ:[[new l(new g(.15,.15,.01),c),[0,.15,.15],[0,Math.PI/2,0]]],XZ:[[new l(new g(.15,.15,.01),p),[.15,0,.15],[-Math.PI/2,0,0]]],XYZ:[[new l(new g(.1,.1,.1),E.clone())]]},ta={X:[[new l(new I(.2,0,.6,4),n),[.3,0,0],[0,0,-Math.PI/2]],[new l(new I(.2,0,.6,4),n),[-.3,0,0],[0,0,Math.PI/2]]],Y:[[new l(new I(.2,0,.6,4),n),[0,.3,0]],[new l(new I(.2,0,.6,4),n),[0,-.3,0],[0,0,Math.PI]]],Z:[[new l(new I(.2,0,.6,4),n),[0,0,.3],[Math.PI/2,0,0]],[new l(new I(.2,0,.6,4),n),[0,0,-.3],[-Math.PI/2,0,0]]],XY:[[new l(new g(.2,.2,.01),n),[.15,.15,0]]],YZ:[[new l(new g(.2,.2,.01),n),[0,.15,.15],[0,Math.PI/2,0]]],XZ:[[new l(new g(.2,.2,.01),n),[.15,0,.15],[-Math.PI/2,0,0]]],XYZ:[[new l(new g(.2,.2,.2),n),[0,0,0]]]},oa={X:[[new re(V,s.clone()),[-1e3,0,0],null,[1e6,1,1],"helper"]],Y:[[new re(V,s.clone()),[0,-1e3,0],[0,0,Math.PI/2],[1e6,1,1],"helper"]],Z:[[new re(V,s.clone()),[0,0,-1e3],[0,-Math.PI/2,0],[1e6,1,1],"helper"]]};function ae($){const ct=new Nt;for(const O in $)for(let Re=$[O].length;Re--;){const A=$[O][Re][0].clone(),lt=$[O][Re][1],dt=$[O][Re][2],mt=$[O][Re][3],na=$[O][Re][4];A.name=O,A.tag=na,lt&&A.position.set(lt[0],lt[1],lt[2]),dt&&A.rotation.set(dt[0],dt[1],dt[2]),mt&&A.scale.set(mt[0],mt[1],mt[2]),A.updateMatrix();const Po=A.geometry.clone();Po.applyMatrix4(A.matrix),A.geometry=Po,A.renderOrder=1/0,A.position.set(0,0,0),A.rotation.set(0,0,0),A.scale.set(1,1,1),ct.add(A)}return ct}this.gizmo={},this.picker={},this.helper={},this.add(this.gizmo.translate=ae(Ie)),this.add(this.gizmo.rotate=ae(Vn)),this.add(this.gizmo.scale=ae(ea)),this.add(this.picker.translate=ae(de)),this.add(this.picker.rotate=ae(Kn)),this.add(this.picker.scale=ae(ta)),this.add(this.helper.translate=ae(Nn)),this.add(this.helper.rotate=ae(Jn)),this.add(this.helper.scale=ae(oa)),this.picker.translate.visible=!1,this.picker.rotate.visible=!1,this.picker.scale.visible=!1}updateMatrixWorld(t){const n=(this.mode==="scale"?"local":this.space)==="local"?this.worldQuaternion:bt;this.gizmo.translate.visible=this.mode==="translate",this.gizmo.rotate.visible=this.mode==="rotate",this.gizmo.scale.visible=this.mode==="scale",this.helper.translate.visible=this.mode==="translate",this.helper.rotate.visible=this.mode==="rotate",this.helper.scale.visible=this.mode==="scale";let s=[];s=s.concat(this.picker[this.mode].children),s=s.concat(this.gizmo[this.mode].children),s=s.concat(this.helper[this.mode].children);for(let r=0;r<s.length;r++){const a=s[r];a.visible=!0,a.rotation.set(0,0,0),a.position.copy(this.worldPosition);let i;if(this.camera.isOrthographicCamera?i=(this.camera.top-this.camera.bottom)/this.camera.zoom:i=this.worldPosition.distanceTo(this.cameraPosition)*Math.min(1.9*Math.tan(Math.PI*this.camera.fov/360)/this.camera.zoom,7),a.scale.set(1,1,1).multiplyScalar(i*this.size/4),a.tag==="helper"){a.visible=!1,a.name==="AXIS"?(a.visible=!!this.axis,this.axis==="X"&&(M.setFromEuler(ut.set(0,0,0)),a.quaternion.copy(n).multiply(M),Math.abs(x.copy(We).applyQuaternion(n).dot(this.eye))>.9&&(a.visible=!1)),this.axis==="Y"&&(M.setFromEuler(ut.set(0,0,Math.PI/2)),a.quaternion.copy(n).multiply(M),Math.abs(x.copy(pe).applyQuaternion(n).dot(this.eye))>.9&&(a.visible=!1)),this.axis==="Z"&&(M.setFromEuler(ut.set(0,Math.PI/2,0)),a.quaternion.copy(n).multiply(M),Math.abs(x.copy(qe).applyQuaternion(n).dot(this.eye))>.9&&(a.visible=!1)),this.axis==="XYZE"&&(M.setFromEuler(ut.set(0,Math.PI/2,0)),x.copy(this.rotationAxis),a.quaternion.setFromRotationMatrix(Zo.lookAt(Ao,x,pe)),a.quaternion.multiply(M),a.visible=this.dragging),this.axis==="E"&&(a.visible=!1)):a.name==="START"?(a.position.copy(this.worldPositionStart),a.visible=this.dragging):a.name==="END"?(a.position.copy(this.worldPosition),a.visible=this.dragging):a.name==="DELTA"?(a.position.copy(this.worldPositionStart),a.quaternion.copy(this.worldQuaternionStart),H.set(1e-10,1e-10,1e-10).add(this.worldPositionStart).sub(this.worldPosition).multiplyScalar(-1),H.applyQuaternion(this.worldQuaternionStart.clone().invert()),a.scale.copy(H),a.visible=this.dragging):(a.quaternion.copy(n),this.dragging?a.position.copy(this.worldPositionStart):a.position.copy(this.worldPosition),this.axis&&(a.visible=this.axis.search(a.name)!==-1));continue}a.quaternion.copy(n),this.mode==="translate"||this.mode==="scale"?(a.name==="X"&&Math.abs(x.copy(We).applyQuaternion(n).dot(this.eye))>.99&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),a.name==="Y"&&Math.abs(x.copy(pe).applyQuaternion(n).dot(this.eye))>.99&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),a.name==="Z"&&Math.abs(x.copy(qe).applyQuaternion(n).dot(this.eye))>.99&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),a.name==="XY"&&Math.abs(x.copy(qe).applyQuaternion(n).dot(this.eye))<.2&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),a.name==="YZ"&&Math.abs(x.copy(We).applyQuaternion(n).dot(this.eye))<.2&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1),a.name==="XZ"&&Math.abs(x.copy(pe).applyQuaternion(n).dot(this.eye))<.2&&(a.scale.set(1e-10,1e-10,1e-10),a.visible=!1)):this.mode==="rotate"&&(ht.copy(n),x.copy(this.eye).applyQuaternion(M.copy(n).invert()),a.name.search("E")!==-1&&a.quaternion.setFromRotationMatrix(Zo.lookAt(this.eye,Ao,pe)),a.name==="X"&&(M.setFromAxisAngle(We,Math.atan2(-x.y,x.z)),M.multiplyQuaternions(ht,M),a.quaternion.copy(M)),a.name==="Y"&&(M.setFromAxisAngle(pe,Math.atan2(x.x,x.z)),M.multiplyQuaternions(ht,M),a.quaternion.copy(M)),a.name==="Z"&&(M.setFromAxisAngle(qe,Math.atan2(x.y,x.x)),M.multiplyQuaternions(ht,M),a.quaternion.copy(M))),a.visible=a.visible&&(a.name.indexOf("X")===-1||this.showX),a.visible=a.visible&&(a.name.indexOf("Y")===-1||this.showY),a.visible=a.visible&&(a.name.indexOf("Z")===-1||this.showZ),a.visible=a.visible&&(a.name.indexOf("E")===-1||this.showX&&this.showY&&this.showZ),a.material._color=a.material._color||a.material.color.clone(),a.material._opacity=a.material._opacity||a.material.opacity,a.material.color.copy(a.material._color),a.material.opacity=a.material._opacity,this.enabled&&this.axis&&(a.name===this.axis||this.axis.split("").some(function(c){return a.name===c}))&&(a.material.color.setHex(16776960),a.material.opacity=1)}super.updateMatrixWorld(t)}}class Ia extends l{constructor(){super(new Ge(1e5,1e5,2,2),new se({visible:!1,wireframe:!0,side:oo,transparent:!0,opacity:.1,toneMapped:!1})),this.isTransformControlsPlane=!0,this.type="TransformControlsPlane"}updateMatrixWorld(t){let o=this.space;switch(this.position.copy(this.worldPosition),this.mode==="scale"&&(o="local"),ft.copy(We).applyQuaternion(o==="local"?this.worldQuaternion:bt),Fe.copy(pe).applyQuaternion(o==="local"?this.worldQuaternion:bt),De.copy(qe).applyQuaternion(o==="local"?this.worldQuaternion:bt),x.copy(Fe),this.mode){case"translate":case"scale":switch(this.axis){case"X":x.copy(this.eye).cross(ft),J.copy(ft).cross(x);break;case"Y":x.copy(this.eye).cross(Fe),J.copy(Fe).cross(x);break;case"Z":x.copy(this.eye).cross(De),J.copy(De).cross(x);break;case"XY":J.copy(De);break;case"YZ":J.copy(ft);break;case"XZ":x.copy(De),J.copy(Fe);break;case"XYZ":case"E":J.set(0,0,0);break}break;case"rotate":default:J.set(0,0,0)}J.length()===0?this.quaternion.copy(this.cameraQuaternion):(Go.lookAt(H.set(0,0,0),J,x),this.quaternion.setFromRotationMatrix(Go)),super.updateMatrixWorld(t)}}function Ra(e){const t=e.rooms||[],o=e.connections||[],s=(e.props||[]).map(a=>{const i=a.roomId?t.find(k=>k.id===a.roomId):t.length>0?t[0]:null,c=i?i.center[0]:0,p=i?i.center[2]:0,m=parseFloat((c+(a.relX||0)).toFixed(3)),E=parseFloat((a.relY||0).toFixed(3)),S=parseFloat((p+(a.relZ||0)).toFixed(3));return{id:a.id,roomId:a.roomId||(i?i.id:""),name:a.name||"Objeto",category:a.category||"basic",subtype:a.subtype||"box",position:[m,E,S],relativePosition:[parseFloat((a.relX||0).toFixed(3)),parseFloat((a.relY||0).toFixed(3)),parseFloat((a.relZ||0).toFixed(3))],rotationDeg:[parseFloat((a.rotX||0).toFixed(1)),parseFloat((a.rotY||0).toFixed(1)),parseFloat((a.rotZ||0).toFixed(1))],scale:[parseFloat((a.scaleX||1).toFixed(3)),parseFloat((a.scaleY||1).toFixed(3)),parseFloat((a.scaleZ||1).toFixed(3))],color:a.color||"#38bdf8",text:a.text||void 0,intensity:a.intensity,textureUrl:a.textureUrl||void 0,imageUrl:a.imageUrl||void 0,videoUrl:a.videoUrl||void 0,linkUrl:a.linkUrl||void 0,modelUrl:a.modelUrl||void 0}}),r=e.environmentPreset==="daylight"?"daylight":e.environmentPreset==="dark"?"dark":"studio";return{schemaVersion:"1.0.0",generator:"VXR Studio",exportedAt:new Date().toISOString(),projectName:e.projectName||"Proyecto VXR",environment:{preset:r,backgroundColor:e.backgroundColor||"#080d1a"},camera:{fov:e.fov||50,initialPosition:e.cameraPosition||[0,16,20],initialTarget:e.cameraTarget||[0,0,0]},rooms:JSON.parse(JSON.stringify(t)),connections:JSON.parse(JSON.stringify(o)),props:s}}function Ta(e){const t=[];if(!e||typeof e!="object")return{valid:!1,errors:["El archivo no contiene un objeto JSON válido."]};if(e.schemaVersion!=="1.0.0"&&t.push(`Versión de esquema incompatible: ${e.schemaVersion||"desconocida"}`),!Array.isArray(e.rooms))t.push('La propiedad "rooms" debe ser un arreglo.');else for(const[o,n]of e.rooms.entries())n.id||t.push(`La sala en el índice ${o} carece de identificador único (id).`),(!n.dimensions||typeof n.dimensions.width!="number"||typeof n.dimensions.depth!="number")&&t.push(`La sala "${n.name||n.id}" tiene dimensiones inválidas.`);return Array.isArray(e.props)||t.push('La propiedad "props" debe ser un arreglo.'),{valid:t.length===0,errors:t}}function Pa(e){try{const t=JSON.parse(e),o=Ta(t);return o.valid?{success:!0,data:t}:{success:!1,error:o.errors.join(" | ")}}catch(t){return{success:!1,error:`Error de sintaxis JSON: ${t.message}`}}}function La(e){return JSON.stringify(e,null,2)}function ka(e){const t=e.environment.backgroundColor.replace("#","0x"),o=e.camera.initialPosition.join(", "),n=e.camera.fov,s=e.environment.preset,r=e.rooms.map(c=>`scenario.addRoom({
  id: '${X(c.id)}',
  name: '${X(c.name)}',
  theme: '${c.theme}',
  dimensions: { width: ${c.dimensions.width}, depth: ${c.dimensions.depth}, height: ${c.dimensions.height} },
  center: [${c.center.join(", ")}],
  spawnPoint: [${(c.spawnPoint||[c.center[0],1.6,c.center[2]]).join(", ")}],
  ceiling: { enabled: false },
});`).join(`

`),a=e.connections.map(c=>`scenario.connectRooms(
  '${X(c.fromRoomId)}',
  '${c.fromWall}',
  '${X(c.toRoomId)}',
  '${c.toWall}',
  { width: ${c.width}, height: ${c.height} }
);`).join(`
`),i=e.props.map((c,p)=>{const m=(c.rotationDeg[0]*Math.PI/180).toFixed(4),E=(c.rotationDeg[1]*Math.PI/180).toFixed(4),S=(c.rotationDeg[2]*Math.PI/180).toFixed(4);return`// Objeto ${p+1}: ${c.name} (${c.category} / ${c.subtype})
{
  const obj = createPropMesh({
    subtype: '${X(c.subtype)}',
    color: '${X(c.color)}',
    name: '${X(c.name)}',
    ${c.text?`text: '${X(c.text)}',`:""}
    ${c.imageUrl?`imageUrl: '${X(c.imageUrl)}',`:""}
    ${c.videoUrl?`videoUrl: '${X(c.videoUrl)}',`:""}
    ${c.linkUrl?`linkUrl: '${X(c.linkUrl)}',`:""}
  });
  obj.name = '${X(c.name)}';
  obj.position.set(${c.position.join(", ")});
  obj.rotation.set(${m}, ${E}, ${S});
  obj.scale.set(${c.scale.join(", ")});
  app.scene.nativeScene.add(obj);
}`}).join(`

`);return`/**
 * =============================================================================
 * Experiencia 3D & WebXR generada automáticamente por VXR Studio
 * Proyecto: ${X(e.projectName)}
 * Fecha de exportación: ${e.exportedAt}
 * Versión de Esquema: ${e.schemaVersion}
 * =============================================================================
 * Instrucciones de ejecución:
 *   1. Instala las dependencias en tu proyecto:
 *        npm install @vxr/core three
 *        npm install --save-dev @types/three typescript
 *   2. Compila o ejecuta con Vite, Webpack o ts-node.
 */

import * as THREE from 'three';
import { XRApp } from '@vxr/core';

// 1. Inicialización de la Aplicación VXR
const container = document.getElementById('app') || document.body;

const app = new XRApp({
  container,
  enableShadows: true,
  enableGrid: false,
  autoVRButton: true,
  cameraPosition: [${o}],
  fov: ${n},
});

app.scene.setEnvironmentPreset('${s}');
app.scene.setBackground(${t});

// Cuadrícula arquitectónica técnica
const gridHelper = new THREE.GridHelper(60, 60, 0x38bdf8, 0x334155);
gridHelper.position.y = 0;
app.scene.nativeScene.add(gridHelper);

// 2. Construcción de Arquitectura Espacial
const scenario = app.createScenario('${X(e.projectName)}');

${r||"// No hay salas definidas"}

${a?`// Conexiones de Pasillos entre Salas
${a}`:"// Sin conexiones de pasillos"}

// 3. Fábrica de Objetos y Mobiliario Procedural
interface PropOptions {
  subtype: string;
  color: string;
  name: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
}

function createPropMesh(options: PropOptions): THREE.Object3D {
  const { subtype, color } = options;
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.35,
    metalness: 0.15,
  });

  if (subtype === 'sphere') {
    return new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16), mat);
  } else if (subtype === 'cylinder') {
    return new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 32), mat);
  } else if (subtype === 'plane') {
    return new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 2.0), mat);
  } else if (subtype === 'cone') {
    return new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 32), mat);
  } else if (subtype === 'torus') {
    return new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.25, 16, 32), mat);
  } else if (subtype === 'chair') {
    const chairGroup = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.6), mat);
    seat.position.y = 0.5;
    chairGroup.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.06), mat);
    back.position.set(0, 0.85, -0.27);
    chairGroup.add(back);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 }));
    base.position.y = 0.25;
    chairGroup.add(base);
    return chairGroup;
  } else if (subtype === 'desk') {
    const deskGroup = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), mat);
    top.position.y = 0.74;
    deskGroup.add(top);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
    for (const [lx, lz] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.74, 12), legMat);
      leg.position.set(lx, 0.37, lz);
      deskGroup.add(leg);
    }
    return deskGroup;
  } else if (subtype === 'pedestal') {
    const pedGroup = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.7), mat);
    base.position.y = 0.5;
    pedGroup.add(base);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.6, 0.66), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, roughness: 0.05 }));
    glass.position.y = 1.3;
    pedGroup.add(glass);
    return pedGroup;
  } else if (subtype === 'frame_art') {
    const frameGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.06), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
    frameGroup.add(frame);
    const canvasMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.08), canvasMat);
    canvas.position.z = 0.035;
    frameGroup.add(canvas);
    return frameGroup;
  } else {
    // Default box primitive
    return new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat);
  }
}

// 4. Instanciación de Objetos en la Escena
${i||"// No hay objetos adicionales"}

// 5. Iniciar Renderizado WebGL y WebXR
app.start();
console.log('✓ Experiencia VXR iniciada: "${X(e.projectName)}"');
`}function Ba(e){const t=Hn(e.projectName||"Experiencia VXR"),o=e.environment.backgroundColor||"#080d1a",n=e.camera.initialPosition,s=e.camera.fov,r=e.camera.initialTarget,a=JSON.stringify(e.rooms),i=JSON.stringify(e.connections),c=JSON.stringify(e.props);return`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>${t} — Experiencia 3D VXR</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: ${o};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      color: #fff;
    }
    #canvas-container {
      width: 100%;
      height: 100%;
      display: block;
      position: absolute;
      inset: 0;
    }
    /* Floating Minimal HUD */
    .hud-overlay {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 100;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .hud-title-box {
      background: rgba(8, 13, 26, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 10px;
      padding: 10px 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    }
    .hud-title {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hud-badge {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }
    .hud-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .hud-tips {
      background: rgba(8, 13, 26, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 10.5px;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 10px;
      width: fit-content;
    }
    /* WebGL Error Banner */
    #webgl-error {
      display: none;
      position: absolute;
      inset: 0;
      background: #080d1a;
      z-index: 1000;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 24px;
      text-align: center;
    }
    #webgl-error h2 { font-size: 20px; color: #ef4444; margin-bottom: 8px; }
    #webgl-error p { font-size: 13px; color: #94a3b8; max-width: 480px; line-height: 1.6; }
  </style>

  <!-- Modern Three.js via Official ES Module Import Maps -->
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
      }
    }
  <\/script>
</head>
<body>
  <div id="canvas-container"></div>

  <!-- Minimalist HUD -->
  <div class="hud-overlay">
    <div class="hud-title-box">
      <div class="hud-title">
        <span>${t}</span>
        <span class="hud-badge">VXR 3D</span>
      </div>
      <div class="hud-sub">Exportado desde VXR Studio · Three.js Autónomo</div>
    </div>
    <div class="hud-tips">
      <span>🖱️ Clic izquierdo: Rotar</span>
      <span>•</span>
      <span>🖱️ Clic derecho: Mover (Pan)</span>
      <span>•</span>
      <span>🔍 Rueda: Zoom</span>
    </div>
  </div>

  <!-- WebGL Error Container -->
  <div id="webgl-error">
    <h2>⚠️ WebGL no disponible</h2>
    <p>Tu navegador o dispositivo no tiene activada la aceleración de hardware para WebGL. Actívala en la configuración para ver esta experiencia 3D.</p>
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    // 1. Validar compatibilidad WebGL
    const container = document.getElementById('canvas-container');
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL deshabilitado');
    } catch (e) {
      document.getElementById('webgl-error').style.display = 'flex';
      throw e;
    }

    // 2. Escena, Cámara y Renderizador
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('${o}');

    const camera = new THREE.PerspectiveCamera(${s}, window.innerWidth / window.innerHeight, 0.1, 250);
    camera.position.set(${n[0]}, ${n[1]}, ${n[2]});

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Controles OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(${r[0]}, ${r[1]}, ${r[2]});
    controls.minDistance = 1.0;
    controls.maxDistance = 150.0;
    controls.screenSpacePanning = true;

    // 4. Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(12, 22, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.5);
    scene.add(hemiLight);

    // 5. Cuadrícula de Referencia y Ejes
    const grid = new THREE.GridHelper(60, 60, 0x38bdf8, 0x334155);
    grid.position.y = 0;
    scene.add(grid);

    const axes = new THREE.AxesHelper(5);
    axes.position.set(0, 0.01, 0);
    scene.add(axes);

    // 6. Temas Visuales para Salas
    const THEMES = {
      gallery: { floor: 0xe2d9cc, wall: 0xf8fafc, trim: 0xcbd5e1 },
      scifi: { floor: 0x0f172a, wall: 0x1e293b, trim: 0x00f0ff },
      office: { floor: 0x334155, wall: 0xf1f5f9, trim: 0x94a3b8 },
      cozy: { floor: 0x78350f, wall: 0xfef3c7, trim: 0x92400e },
      minimal: { floor: 0x18181b, wall: 0x27272a, trim: 0x52525b },
    };

    // 7. Carga de Datos de la Escena
    const roomsData = ${a};
    const connectionsData = ${i};
    const propsData = ${c};

    // Construir Salas Arquitectónicas
    for (const r of roomsData) {
      const theme = THEMES[r.theme] || THEMES.gallery;
      const w = r.dimensions.width;
      const d = r.dimensions.depth;
      const h = r.dimensions.height || 4;
      const cx = r.center[0];
      const cz = r.center[2];
      const wallT = 0.25;

      const roomGroup = new THREE.Group();
      roomGroup.position.set(cx, 0, cz);

      // Suelo
      const floorGeo = new THREE.BoxGeometry(w, 0.2, d);
      const floorMat = new THREE.MeshStandardMaterial({ color: theme.floor, roughness: 0.5 });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(0, -0.1, 0);
      floorMesh.receiveShadow = true;
      roomGroup.add(floorMesh);

      // Muros perimetrales
      const wallMat = new THREE.MeshStandardMaterial({ color: theme.wall, roughness: 0.85 });

      // Muro Norte
      const wN = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallT), wallMat);
      wN.position.set(0, h / 2, -d / 2 + wallT / 2);
      wN.castShadow = true;
      roomGroup.add(wN);

      // Muro Sur
      const wS = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallT), wallMat);
      wS.position.set(0, h / 2, d / 2 - wallT / 2);
      wS.castShadow = true;
      roomGroup.add(wS);

      // Muro Este
      const wE = new THREE.Mesh(new THREE.BoxGeometry(wallT, h, d), wallMat);
      wE.position.set(w / 2 - wallT / 2, h / 2, 0);
      wE.castShadow = true;
      roomGroup.add(wE);

      // Muro Oeste
      const wW = new THREE.Mesh(new THREE.BoxGeometry(wallT, h, d), wallMat);
      wW.position.set(-w / 2 + wallT / 2, h / 2, 0);
      wW.castShadow = true;
      roomGroup.add(wW);

      scene.add(roomGroup);
    }

    // Construir Pasillos entre Salas Conectadas
    for (const c of connectionsData) {
      const fromRoom = roomsData.find((r) => r.id === c.fromRoomId);
      const toRoom = roomsData.find((r) => r.id === c.toRoomId);
      if (!fromRoom || !toRoom) continue;

      const corridorGroup = new THREE.Group();
      const midX = (fromRoom.center[0] + toRoom.center[0]) / 2;
      const midZ = (fromRoom.center[2] + toRoom.center[2]) / 2;
      const dx = Math.abs(fromRoom.center[0] - toRoom.center[0]);
      const dz = Math.abs(fromRoom.center[2] - toRoom.center[2]);

      const corridorLen = Math.max(dx, dz, 2);
      const corridorW = c.width || 3.0;

      const fGeo = dx >= dz
        ? new THREE.BoxGeometry(corridorLen, 0.2, corridorW)
        : new THREE.BoxGeometry(corridorW, 0.2, corridorLen);
      const fMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
      const fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.position.set(midX, -0.1, midZ);
      fMesh.receiveShadow = true;
      scene.add(fMesh);
    }

    // Fábrica de Objetos Procedurales
    function createMesh(p) {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(p.color || '#38bdf8'),
        roughness: 0.35,
        metalness: 0.15,
      });

      if (p.subtype === 'sphere') {
        return new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16), mat);
      } else if (p.subtype === 'cylinder') {
        return new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 32), mat);
      } else if (p.subtype === 'plane') {
        return new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 2.0), mat);
      } else if (p.subtype === 'cone') {
        return new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 32), mat);
      } else if (p.subtype === 'torus') {
        return new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.25, 16, 32), mat);
      } else if (p.subtype === 'chair') {
        const chairGroup = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.6), mat);
        seat.position.y = 0.5;
        chairGroup.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.06), mat);
        back.position.set(0, 0.85, -0.27);
        chairGroup.add(back);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 }));
        base.position.y = 0.25;
        chairGroup.add(base);
        return chairGroup;
      } else if (p.subtype === 'desk') {
        const deskGroup = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), mat);
        top.position.y = 0.74;
        deskGroup.add(top);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
        for (const [lx, lz] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.74, 12), legMat);
          leg.position.set(lx, 0.37, lz);
          deskGroup.add(leg);
        }
        return deskGroup;
      } else if (p.subtype === 'pedestal') {
        const pedGroup = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.7), mat);
        base.position.y = 0.5;
        pedGroup.add(base);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.6, 0.66), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.05 }));
        glass.position.y = 1.3;
        pedGroup.add(glass);
        return pedGroup;
      } else if (p.subtype === 'frame_art') {
        const frameGroup = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.06), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
        frameGroup.add(frame);
        const canvasMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color || '#38bdf8') });
        const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.08), canvasMat);
        canvas.position.z = 0.035;
        frameGroup.add(canvas);
        return frameGroup;
      } else {
        return new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat);
      }
    }

    // Instanciar Objetos
    for (const p of propsData) {
      const obj = createMesh(p);
      obj.name = p.name;
      obj.position.set(p.position[0], p.position[1], p.position[2]);
      obj.rotation.set(
        (p.rotationDeg[0] * Math.PI) / 180,
        (p.rotationDeg[1] * Math.PI) / 180,
        (p.rotationDeg[2] * Math.PI) / 180
      );
      obj.scale.set(p.scale[0], p.scale[1], p.scale[2]);
      obj.castShadow = true;
      obj.receiveShadow = true;
      scene.add(obj);
    }

    // 8. Bucle de Renderizado Continuo
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    // 9. Manejador de Redimensionamiento
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    console.log('✓ Escena 3D VXR cargada con éxito.');
  <\/script>
</body>
</html>`}function Ca(e,t){if(!e)return"";const o=Hn(e);if(t==="json")return o.replace(/(&quot;(?:(?!&quot;).)*&quot;)\s*:/g,'<span class="hl-func">$1</span>:').replace(/:\s*(&quot;(?:(?!&quot;).)*&quot;)/g,': <span class="hl-string">$1</span>').replace(/:\s*(-?\d+\.?\d*)/g,': <span class="hl-number">$1</span>').replace(/:\s*(true|false|null)/g,': <span class="hl-keyword">$1</span>');if(t==="ts"){let n=o.replace(/\b(import|export|from|const|let|var|function|return|if|else|new|type|interface|as|true|false|async|await)\b/g,'<span class="hl-keyword">$1</span>');return n=n.replace(/(\/\/[^\n]*)/g,'<span class="hl-comment">$1</span>'),n=n.replace(/('(?:\\'|[^'])*')/g,'<span class="hl-string">$1</span>'),n=n.replace(/\b(\d+\.?\d*)\b/g,'<span class="hl-number">$1</span>'),n}if(t==="html"){let n=o.replace(/(&lt;!--[\s\S]*?--&gt;)/g,s=>`<span class="hl-comment">${s}</span>`);return n=n.replace(/([a-zA-Z\-]+)=(&quot;(?:(?!&quot;).)*&quot;)/g,(s,r,a)=>`<span class="hl-func">${r}</span>=<span class="hl-string">${a}</span>`),n=n.replace(/(&lt;\/?)([a-zA-Z0-9\-]+)/g,(s,r,a)=>`${r}<span class="hl-tag">${a}</span>`),n}return o}function X(e){return e?e.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g,"\\n"):""}function Hn(e){return e?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}let u=[],j=[],v=[],w=null,h=null,Vt="select",jo=null,Q="edit",Xn=!1,Ke=!0,Te=!1,Ha=8;const G={KeyW:!1,KeyA:!1,KeyS:!1,KeyD:!1,KeyQ:!1,KeyE:!1,Space:!1,ShiftLeft:!1,ShiftRight:!1};new f;let Qe=0,Jt=0,D=!1;const Mt=new f(0,1.6,2);let ot=0,Ne=0;const K={},P=new Map,Xa=new Map,_=document.getElementById("app"),d=new ya({container:_,enableShadows:!0,enableGrid:!1,autoVRButton:!1,cameraPosition:[0,16,20],fov:50});d.scene.setEnvironmentPreset("studio");d.scene.setBackground(527642);const et=new ca(60,60,3718648,3359061);et.position.y=0;d.scene.nativeScene.add(et);const _n=new la(6);_n.position.set(0,.01,0);d.scene.nativeScene.add(_n);const _a=new da(.45,.52,32),Ya=new se({color:3718648,side:oo}),so=new l(_a,Ya);so.rotation.x=-Math.PI/2;so.position.y=.005;d.scene.nativeScene.add(so);d.controls&&(d.controls.enableDamping=!0,d.controls.dampingFactor=.08,d.controls.minDistance=1,d.controls.maxDistance=150,d.controls.screenSpacePanning=!0,d.controls.target.set(0,0,0),d.controls.mouseButtons={LEFT:kt.ROTATE,MIDDLE:kt.DOLLY,RIGHT:kt.PAN},d.controls.touches={ONE:Bo.ROTATE,TWO:Bo.DOLLY_PAN});let yt=d.createScenario("VXR Studio Level");const R=new ga(d.camera,d.renderer.nativeRenderer.domElement);R.size=.85;d.scene.nativeScene.add(R.getHelper());R.addEventListener("dragging-changed",e=>{d.controls&&Q!=="fly"&&Q!=="walk"&&(d.controls.enabled=!e.value)});R.addEventListener("change",()=>{if(!h)return;const e=v.find(n=>n.id===h),t=P.get(h),o=e!=null&&e.roomId?u.find(n=>n.id===e.roomId):null;if(e&&t){const n=o?o.center[0]:0,s=o?o.center[2]:0;e.relX=parseFloat((t.position.x-n).toFixed(2)),e.relY=parseFloat(t.position.y.toFixed(2)),e.relZ=parseFloat((t.position.z-s).toFixed(2)),e.rotX=parseFloat(oe.radToDeg(t.rotation.x).toFixed(1)),e.rotY=parseFloat(oe.radToDeg(t.rotation.y).toFixed(1)),e.rotZ=parseFloat(oe.radToDeg(t.rotation.z).toFixed(1)),e.scaleX=parseFloat(t.scale.x.toFixed(2)),e.scaleY=parseFloat(t.scale.y.toFixed(2)),e.scaleZ=parseFloat(t.scale.z.toFixed(2)),bo(e),T()}});function Aa(e){let t;const o=new no(e.color),n=new L({color:o,roughness:.35,metalness:.15});e.subtype==="sphere"?t=new to(.7,32,16):e.subtype==="cylinder"?t=new I(.6,.6,1.4,32):e.subtype==="plane"?t=new g(2,.04,2):e.subtype==="tube"?t=new ue(.7,.2,16,32):e.subtype==="cone"?t=new Co(.7,1.4,32):e.subtype==="torus"?t=new ue(.7,.25,16,32):e.subtype==="pyramid"?t=new Co(.85,1.3,4):t=new g(1.2,1.2,1.2);const s=new l(t,n);return s.castShadow=!0,s.receiveShadow=!0,s}function Za(e){if(!e)return null;const t=/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,o=e.match(t);return o?o[1]:null}function Ga(e){const t=new q,o=new no(e.color||"#1e293b"),n=new L({color:o,roughness:.5}),s=new L({color:13751771,metalness:.9,roughness:.1}),r=new L({color:988970,roughness:.8}),a=new q;for(let k=0;k<5;k++){const Y=k*Math.PI*2/5,C=new l(new I(.015,.02,.35,8),s);C.rotation.z=Math.PI/2,C.rotation.y=Y,C.position.set(Math.cos(Y)*.18,.04,Math.sin(Y)*.18);const z=new l(new I(.025,.025,.02,8),r);z.position.set(Math.cos(Y)*.35,.025,Math.sin(Y)*.35),a.add(C,z)}const i=new l(new I(.03,.03,.45,16),s);i.position.y=.25,a.add(i),t.add(a);const c=new l(new g(.55,.08,.52),n);c.position.y=.5,t.add(c);const p=new l(new g(.5,.65,.05),n);p.position.set(0,.85,-.24),p.rotation.x=-.08,t.add(p);const m=new l(new g(.3,.14,.05),n);m.position.set(0,1.22,-.28),t.add(m);const E=new l(new g(.06,.25,.3),n);E.position.set(-.3,.65,-.05);const S=new l(new g(.06,.25,.3),n);return S.position.set(.3,.65,-.05),t.add(E,S),t}function ja(e){const t=new q,o=new no(e.color||"#451a03"),n=new L({color:o,roughness:.6}),s=new L({color:1120295,metalness:.85,roughness:.25}),r=new l(new g(1.9,.05,.85),n);r.position.y=.74,t.add(r);const a=new l(new g(.05,.72,.75),s);a.position.set(-.88,.36,0);const i=new l(new g(.05,.72,.75),s);i.position.set(.88,.36,0),t.add(a,i);const c=new l(new g(.42,.35,.65),n);c.position.set(.62,.52,0);const p=new l(new g(.18,.02,.02),s);return p.position.set(.62,.55,.34),t.add(c,p),t}function za(e){const t=new q,o=new L({color:16317180,roughness:.2}),n=new L({color:12248829,transparent:!0,opacity:.35,roughness:.05,metalness:.1}),s=new L({color:14251782,metalness:.9,roughness:.15}),r=new l(new I(.45,.45,.95,32),o);r.position.y=.475,t.add(r);const a=new l(new I(.46,.46,.03,32),s);a.position.y=.965,t.add(a);const i=new l(new g(.65,.65,.65),n);i.position.y=1.3,t.add(i);const c=new l(new pa(.12),s);c.position.y=1.15,t.add(c);const p=new ua(16772565,1.2,4);return p.position.y=1.55,t.add(p),t}function $a(e){const t=new q,o=new L({color:593174,roughness:.2}),n=new L({color:3718648,metalness:.92,roughness:.12}),s=new l(new I(.55,.55,.08,32),o);s.position.y=.04,t.add(s);const r=new l(new ha(.42,.11,128,16,2,3),n);return r.position.y=.65,r.castShadow=!0,t.add(r),t}function Fa(e){const t=new q,o=new L({color:593176,metalness:.85,roughness:.3}),n=new se({color:61695}),s=new L({color:223649,transparent:!0,opacity:.5,roughness:.1}),r=new l(new g(.7,1.4,.7),o);r.position.y=.7,t.add(r);const a=[[-.34,.7,-.34],[.34,.7,-.34],[-.34,.7,.34],[.34,.7,.34]];for(const[p,m,E]of a){const S=new l(new g(.02,1.35,.02),n);S.position.set(p,m,E),t.add(S)}const i=new l(new g(.64,1.3,.02),s);i.position.set(0,.7,.355),t.add(i);const c=new l(new Ge(.5,.35),new se({color:3718648,transparent:!0,opacity:.75,side:oo}));return c.position.set(0,1.6,0),c.rotation.x=-.25,t.add(c),t}function Da(e){const t=new q,o=new L({color:3359061,metalness:.8,roughness:.3}),n=new se({color:3718648}),s=new l(new g(.48,.015,.32),o);s.position.y=.008,t.add(s);const r=new l(new g(.48,.32,.012),o);r.position.set(0,.16,-.16),r.rotation.x=-.22;const a=new l(new Ge(.44,.28),n);return a.position.set(0,.16,-.15),a.rotation.x=-.22,t.add(r,a),t}function Oa(e){const t=new q,o=new L({color:15857145,roughness:.3,metalness:.05}),n=new l(new g(.65,.9,.65),o);n.position.y=.45,t.add(n);const s=new l(new I(.22,.18,.55,16),o);s.position.y=1.15;const r=new l(new to(.18,24,16),o);return r.position.y=1.55,t.add(s,r),t}function Ua(e,t){const o=document.createElement("canvas");o.width=1024,o.height=768;const n=o.getContext("2d"),s=n.createLinearGradient(0,0,o.width,o.height);s.addColorStop(0,"#0a1020"),s.addColorStop(.5,"#1e293b"),s.addColorStop(1,"#0f172a"),n.fillStyle=s,n.fillRect(0,0,o.width,o.height),n.strokeStyle=t||"#38bdf8",n.lineWidth=12,n.strokeRect(30,30,o.width-60,o.height-60),n.fillStyle="#ffffff",n.font="bold 44px sans-serif",n.textAlign="center",n.fillText(e||"Obra Maestra VXR",o.width/2,o.height/2),n.font="24px monospace",n.fillStyle="#38bdf8",n.fillText("Haz clic para ver en pantalla completa",o.width/2,o.height/2+50);const r=new ao(o);return r.colorSpace=st,r.needsUpdate=!0,{canvas:o,texture:r}}function Wa(e){const t=new q,o=e.frameWidth||2.2,n=e.frameHeight||1.6,s=new L({color:1120295,roughness:.4}),r=new l(new g(o+.15,n+.15,.08),s);if(t.add(r),e.imageUrl){const a=new Cn,i=new se({color:16777215});a.load(e.imageUrl,p=>{p.colorSpace=st,i.map=p,i.needsUpdate=!0});const c=new l(new Ge(o,n),i);c.position.z=.045,t.add(c)}else{const a=Ua(e.name,e.color);Xa.set(e.id,a);const i=new l(new Ge(o,n),new se({map:a.texture}));i.position.z=.045,t.add(i)}return t}function qa(e){const t=new q,o=new l(new g(2.8,1.6,.08),new L({color:329745}));t.add(o);const n=document.createElement("canvas");n.width=640,n.height=360;const s=n.getContext("2d");s.fillStyle="#020617",s.fillRect(0,0,640,360),s.fillStyle="#38bdf8",s.font="bold 36px sans-serif",s.textAlign="center",s.fillText("▶ REPRODUCTOR DE VIDEO",320,160),s.font="20px sans-serif",s.fillStyle="#94a3b8",s.fillText(e.videoUrl?"Haz clic para reproducir":"URL de YouTube requerida",320,205);const r=new ao(n);r.colorSpace=st;const a=new l(new Ge(2.65,1.45),new se({map:r}));return a.position.z=.045,t.add(a),t}function Qa(e){const t=new q,o=document.createElement("canvas");o.width=512,o.height=256;const n=o.getContext("2d");n.fillStyle="#030712",n.fillRect(0,0,512,256),n.strokeStyle="#38bdf8",n.lineWidth=8,n.strokeRect(10,10,492,236),n.fillStyle="#38bdf8",n.font="bold 32px sans-serif",n.textAlign="center",n.fillText(e.text||"ANUNCIO VXR",256,120),n.font="18px monospace",n.fillStyle="#ffffff",n.fillText("🔗 Clic para abrir enlace",256,165);const s=new ao(o);s.colorSpace=st;const r=new l(new g(2.8,1.4,.06),new L({map:s,emissive:805486,emissiveIntensity:.35}));return t.add(r),t}function ro(e){const t=e.roomId?u.find(c=>c.id===e.roomId):u.length>0?u[0]:null,o=t?t.center[0]:0,n=t?t.center[2]:0,s=o+e.relX,r=e.relY,a=n+e.relZ;let i;return e.subtype==="chair"?i=Ga(e):e.subtype==="desk"?i=ja(e):e.subtype==="pedestal"?i=za():e.subtype==="sculpture"?i=$a():e.subtype==="server"?i=Fa():e.subtype==="laptop"?i=Da():e.subtype==="statue"?i=Oa():e.subtype==="panel"||e.subtype==="partition_glass"?i=new l(new g(2.4,2.2,.08),new L({color:3718648,transparent:!0,opacity:.35,roughness:.05})):e.subtype==="frame_art"?i=Wa(e):e.subtype==="screen_video"?i=qa(e):e.subtype==="billboard_floating"?i=Qa(e):i=Aa(e),i.userData={...i.userData,propId:e.id},i.position.set(s,r,a),i.rotation.set(oe.degToRad(e.rotX||0),oe.degToRad(e.rotY||0),oe.degToRad(e.rotZ||0)),i.scale.set(e.scaleX||1,e.scaleY||1,e.scaleZ||1),d.scene.nativeScene.add(i),P.set(e.id,i),i}function N(){for(const[,e]of P)d.scene.nativeScene.remove(e);P.clear(),yt.clear(),yt=d.createScenario("VXR Studio Level");for(const e of u)yt.addRoom({id:e.id,name:e.name,theme:e.theme,dimensions:e.dimensions,center:e.center,doors:e.doors,spawnPoint:e.spawnPoint,ceiling:{enabled:!1}});for(const e of j)yt.connectRooms(e.fromRoomId,e.fromWall,e.toRoomId,e.toWall,{width:e.width,height:e.height});for(const e of v)ro(e);xo(),Mo(),es()}function Rt(e){var t;if(d.audio.playWarp(),e==="empty"){u=[],j=[],v=[],w=null,h=null,document.getElementById("lbl-project-name").textContent="Proyecto: Escenario en Blanco",N(),d.resetCamera([0,18,16],[0,0,0]),y("✨ Escenario reiniciado en blanco"),T();return}e==="museum"?(u=[{id:"room-museum",name:"Galería de Arte Central",theme:"gallery",dimensions:{width:18,depth:14,height:4.5},center:[0,0,0],doors:[],spawnPoint:[0,1.6,5]}],j=[],v=[{id:"prop-ped-1",roomId:"room-museum",category:"furniture",subtype:"pedestal",name:"Pedestal Escultura",relX:-4,relY:0,relZ:-2,rotX:0,rotY:0,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#f8fafc"},{id:"prop-sculp-1",roomId:"room-museum",category:"decoration",subtype:"sculpture",name:"Mobius Holográfico",relX:-4,relY:1.25,relZ:-2,rotX:0,rotY:45,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#38bdf8"},{id:"prop-ped-2",roomId:"room-museum",category:"furniture",subtype:"pedestal",name:"Pedestal Escultura Clásica",relX:4,relY:0,relZ:-2,rotX:0,rotY:0,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#f8fafc"},{id:"prop-statue-1",roomId:"room-museum",category:"decoration",subtype:"statue",name:"Busto de Mármol",relX:4,relY:1.1,relZ:-2,rotX:0,rotY:-30,rotZ:0,scaleX:.9,scaleY:.9,scaleZ:.9,color:"#f1f5f9"},{id:"prop-art-1",roomId:"room-museum",category:"exhibition",subtype:"frame_art",name:"Obra de Vanguardia",relX:0,relY:2.2,relZ:-6.8,rotX:0,rotY:0,rotZ:0,scaleX:1.2,scaleY:1.2,scaleZ:1,color:"#d97706",imageUrl:"https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop"}],document.getElementById("lbl-project-name").textContent="Proyecto: Museo Interdisciplinario"):e==="scifi"?(u=[{id:"room-scifi",name:"Laboratorio de Ciencias XR",theme:"scifi",dimensions:{width:16,depth:12,height:4},center:[0,0,0],doors:[],spawnPoint:[0,1.6,4]}],j=[],v=[{id:"prop-server-1",roomId:"room-scifi",category:"decoration",subtype:"server",name:"Servidor Cuántico",relX:-5,relY:0,relZ:-3.5,rotX:0,rotY:30,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#00f0ff"},{id:"prop-desk-1",roomId:"room-scifi",category:"furniture",subtype:"desk",name:"Estación de Trabajo A",relX:-1.5,relY:0,relZ:-2,rotX:0,rotY:0,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#111827"},{id:"prop-laptop-1",roomId:"room-scifi",category:"furniture",subtype:"laptop",name:"Terminal Móvil",relX:-1.5,relY:.76,relZ:-2,rotX:0,rotY:10,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#38bdf8"},{id:"prop-chair-1",roomId:"room-scifi",category:"furniture",subtype:"chair",name:"Silla Ergonómica",relX:-1.5,relY:0,relZ:-1.2,rotX:0,rotY:180,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#1e293b"},{id:"prop-video-1",roomId:"room-scifi",category:"exhibition",subtype:"screen_video",name:"Pantalla Holográfica",relX:2.5,relY:1.8,relZ:-5.8,rotX:0,rotY:0,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#0284c7",videoUrl:"https://www.youtube.com/watch?v=k1BneeJTDcU"}],document.getElementById("lbl-project-name").textContent="Proyecto: Laboratorio de Ciencias"):e==="office"?(u=[{id:"room-office",name:"Oficina Corporativa VXR",theme:"office",dimensions:{width:16,depth:14,height:3.8},center:[0,0,0],doors:[],spawnPoint:[0,1.6,5]}],j=[],v=[{id:"prop-desk-off-1",roomId:"room-office",category:"furniture",subtype:"desk",name:"Escritorio Ejecutivo",relX:-3,relY:0,relZ:-2,rotX:0,rotY:0,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#451a03"},{id:"prop-chair-off-1",roomId:"room-office",category:"furniture",subtype:"chair",name:"Silla Directiva",relX:-3,relY:0,relZ:-1.2,rotX:0,rotY:180,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#0f172a"},{id:"prop-glass-1",roomId:"room-office",category:"architecture",subtype:"partition_glass",name:"Mampara Acristalada",relX:.5,relY:0,relZ:-2,rotX:0,rotY:90,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#38bdf8"}],document.getElementById("lbl-project-name").textContent="Proyecto: Oficina Moderna"):e==="cyber"&&(u=[{id:"room-cyber",name:"Showroom Espacial XR",theme:"minimal",dimensions:{width:20,depth:16,height:5},center:[0,0,0],doors:[],spawnPoint:[0,1.6,6]}],j=[],v=[{id:"prop-bill-cyber",roomId:"room-cyber",category:"exhibition",subtype:"billboard_floating",name:"Cartelera Neón",relX:0,relY:2.6,relZ:-4,rotX:0,rotY:0,rotZ:0,scaleX:1.2,scaleY:1.2,scaleZ:1,color:"#00f0ff",text:"VXR SPATIAL SHOWROOM 2026",linkUrl:"https://github.com/Vickman123/Framework-XVR"},{id:"prop-sculp-cyber",roomId:"room-cyber",category:"decoration",subtype:"sculpture",name:"Artefacto Flotante",relX:0,relY:1,relZ:0,rotX:0,rotY:0,rotZ:0,scaleX:1.4,scaleY:1.4,scaleZ:1,color:"#7c3aed"}],document.getElementById("lbl-project-name").textContent="Proyecto: Showroom Futurista"),w=((t=u[0])==null?void 0:t.id)||null,h=null,N(),d.resetCamera([0,18,16],[0,0,0]),y("🏛️ Plantilla cargada con éxito"),T()}const he=document.getElementById("btn-mode-edit"),fe=document.getElementById("btn-mode-explore"),ye=document.getElementById("btn-mode-fly"),ge=document.getElementById("btn-mode-walk"),F=document.getElementById("fly-mode-callout");function je(e){var t;Q=e,[he,fe,ye,ge].forEach(o=>o==null?void 0:o.classList.remove("active")),e==="edit"?(he==null||he.classList.add("active"),F==null||F.classList.remove("show"),d.controls&&(d.controls.enabled=!0),h&&P.has(h)&&R.attach(P.get(h)),document.exitPointerLock&&document.pointerLockElement&&document.exitPointerLock(),D=!1,y("↖ Modo Edición: Órbita con controles de transformación")):e==="explore"?(fe==null||fe.classList.add("active"),F==null||F.classList.remove("show"),d.controls&&(d.controls.enabled=!0),R.detach(),document.exitPointerLock&&document.pointerLockElement&&document.exitPointerLock(),D=!1,y("👁 Modo Explorar: Órbita libre y suave")):e==="fly"?(ye==null||ye.classList.add("active"),F==null||F.classList.add("show"),d.controls&&(d.controls.enabled=!1),R.detach(),D=!1,Qe=d.camera.rotation.x,Jt=d.camera.rotation.y,(t=_.requestPointerLock)==null||t.call(_),y("🛸 ¡Modo Vuelo Creativo Activo! Usa W,A,S,D para volar, Q/E subir/bajar")):e==="walk"&&(ge==null||ge.classList.add("active"),F==null||F.classList.remove("show"),Wn(!0))}he==null||he.addEventListener("click",()=>je("edit"));fe==null||fe.addEventListener("click",()=>je("explore"));ye==null||ye.addEventListener("click",()=>je("fly"));ge==null||ge.addEventListener("click",()=>je("walk"));document.addEventListener("pointerlockchange",()=>{Xn=document.pointerLockElement===_});window.addEventListener("mousemove",e=>{Xn&&(Q==="fly"?(Jt-=e.movementX*.0022,Qe-=e.movementY*.0022,Qe=Math.max(-Math.PI/2+.02,Math.min(Math.PI/2-.02,Qe)),d.camera.rotation.order="YXZ",d.camera.rotation.y=Jt,d.camera.rotation.x=Qe):D&&(ot-=e.movementX*.0022,Ne-=e.movementY*.0022,Ne=Math.max(-Math.PI/2.2,Math.min(Math.PI/2.2,Ne)),d.camera.rotation.order="YXZ",d.camera.rotation.y=ot,d.camera.rotation.x=Ne))});window.addEventListener("keydown",e=>{var t;["input","textarea"].includes((((t=document.activeElement)==null?void 0:t.tagName)||"").toLowerCase())||(G.hasOwnProperty(e.code)&&(G[e.code]=!0),K[e.code]=!0,e.code==="KeyF"&&(e.preventDefault(),Fn()),e.code==="Escape"&&(Q==="fly"||D)&&je("edit"))});window.addEventListener("keyup",e=>{G.hasOwnProperty(e.code)&&(G[e.code]=!1),K[e.code]=!1});function Na(e){if(Q!=="fly")return;const t=G.ShiftLeft||G.ShiftRight?2.5:1,o=Ha*t,n=new f;d.camera.getWorldDirection(n);const s=new f().crossVectors(n,new f(0,1,0)).normalize(),r=new f;G.KeyW&&r.add(n),G.KeyS&&r.sub(n),G.KeyD&&r.add(s),G.KeyA&&r.sub(s),(G.KeyE||G.Space)&&(r.y+=1),G.KeyQ&&(r.y-=1),r.lengthSq()>.001&&(r.normalize().multiplyScalar(o*e),d.camera.position.add(r))}const U=document.getElementById("minimap-canvas"),b=U?U.getContext("2d"):null;function Va(){if(!b||!U)return;const e=U.width,t=U.height;b.fillStyle="#040711",b.fillRect(0,0,e,t),b.strokeStyle="rgba(56, 189, 248, 0.08)",b.lineWidth=1;const o=e/2,n=t/2,s=3.2;for(let p=0;p<e;p+=20)b.beginPath(),b.moveTo(p,0),b.lineTo(p,t),b.stroke();for(let p=0;p<t;p+=20)b.beginPath(),b.moveTo(0,p),b.lineTo(e,p),b.stroke();b.strokeStyle="#38bdf8",b.lineWidth=1.5;for(const p of u){const m=o+p.center[0]*s-p.dimensions.width*s/2,E=n+p.center[2]*s-p.dimensions.depth*s/2,S=p.dimensions.width*s,k=p.dimensions.depth*s;b.fillStyle="rgba(2, 132, 199, 0.12)",b.fillRect(m,E,S,k),b.strokeRect(m,E,S,k)}for(const p of v){const m=p.roomId?u.find(C=>C.id===p.roomId):null,E=m?m.center[0]:0,S=m?m.center[2]:0,k=o+(E+p.relX)*s,Y=n+(S+p.relZ)*s;b.fillStyle=p.id===h?"#f59e0b":"#38bdf8",b.beginPath(),b.arc(k,Y,2.5,0,Math.PI*2),b.fill()}const r=o+d.camera.position.x*s,a=n+d.camera.position.z*s,i=new f;d.camera.getWorldDirection(i);const c=Math.atan2(i.x,i.z);b.fillStyle="rgba(56, 189, 248, 0.25)",b.beginPath(),b.moveTo(r,a),b.arc(r,a,18,c-.45,c+.45),b.closePath(),b.fill(),b.fillStyle="#ffffff",b.beginPath(),b.arc(r,a,3,0,Math.PI*2),b.fill()}U==null||U.addEventListener("click",e=>{const t=U.getBoundingClientRect(),o=e.clientX-t.left,n=e.clientY-t.top,s=U.width/2,r=U.height/2,a=3.2,i=(o-s)/a,c=(n-r)/a;Q==="fly"||D?d.camera.position.set(i,d.camera.position.y,c):d.resetCamera([i,18,c+16],[i,0,c]),y("📍 Cámara desplazada en el mapa")});const tt=document.getElementById("orientation-gizmo"),B=tt?tt.getContext("2d"):null;function Ja(){if(!B||!tt)return;const e=tt.width,t=tt.height;B.clearRect(0,0,e,t);const o=e/2,n=t/2,s=18,r=new f(1,0,0).applyMatrix4(d.camera.matrixWorldInverse),a=new f(0,1,0).applyMatrix4(d.camera.matrixWorldInverse),i=new f(0,0,1).applyMatrix4(d.camera.matrixWorldInverse),c=[{vec:r,label:"X",color:"#ef4444"},{vec:a,label:"Y",color:"#22c55e"},{vec:i,label:"Z",color:"#38bdf8"}];c.sort((p,m)=>p.vec.z-m.vec.z);for(const p of c){const m=o+p.vec.x*s,E=n-p.vec.y*s;B.strokeStyle=p.color,B.lineWidth=2.5,B.beginPath(),B.moveTo(o,n),B.lineTo(m,E),B.stroke(),B.fillStyle=p.color,B.beginPath(),B.arc(m,E,5,0,Math.PI*2),B.fill(),B.fillStyle="#ffffff",B.font="bold 8px sans-serif",B.textAlign="center",B.textBaseline="middle",B.fillText(p.label,m,E)}}const Kt=document.getElementById("panel-properties"),Be=document.getElementById("btn-dock-collapse"),io=document.getElementById("lbl-panel-right-title");function Yn(){const e=Kt.classList.toggle("collapsed");Be.textContent=e?"»":"«",Be.title=e?"Mostrar panel inspector":"Ocultar panel inspector",setTimeout(()=>{window.dispatchEvent(new Event("resize"))},260)}Be==null||Be.addEventListener("click",Yn);var en;(en=document.getElementById("btn-collapse-right"))==null||en.addEventListener("click",Yn);function Se(e){document.querySelectorAll(".dock-btn").forEach(s=>s.classList.remove("active")),document.querySelectorAll(".tab-content").forEach(s=>s.classList.remove("active"));const t=document.querySelector(`.dock-btn[data-dock-tab="${e}"]`);t==null||t.classList.add("active");const o=document.getElementById(`tab-content-${e}`);o==null||o.classList.add("active"),Kt.classList.contains("collapsed")&&(Kt.classList.remove("collapsed"),Be.textContent="«",setTimeout(()=>{window.dispatchEvent(new Event("resize"))},260));const n={props:"Propiedades",mats:"Materiales & PBR",env:"Entorno & Iluminación",scene:"Jerarquía de Escena",settings:"Configuración"};io.textContent=n[e]||"Propiedades",e==="scene"&&Ka()}document.querySelectorAll(".dock-btn[data-dock-tab]").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-dock-tab");Se(t)})});var tn;(tn=document.getElementById("top-tab-scene"))==null||tn.addEventListener("click",()=>Se("props"));var on;(on=document.getElementById("top-tab-resources"))==null||on.addEventListener("click",()=>{var e;(e=document.getElementById("search-objects"))==null||e.focus()});var nn;(nn=document.getElementById("top-tab-lighting"))==null||nn.addEventListener("click",()=>Se("env"));var an;(an=document.getElementById("top-tab-environment"))==null||an.addEventListener("click",()=>Se("env"));var sn;(sn=document.getElementById("top-tab-collaborate"))==null||sn.addEventListener("click",()=>{y("👥 Enlace de colaboración copiado al portapapeles")});function Ka(){const e=document.getElementById("scene-hierarchy-list");if(e){e.innerHTML="";for(const t of v){const o=document.createElement("div");o.style.padding="6px 8px",o.style.background=t.id===h?"rgba(56, 189, 248, 0.2)":"rgba(255, 255, 255, 0.03)",o.style.border="1px solid "+(t.id===h?"#38bdf8":"var(--vxr-border)"),o.style.borderRadius="6px",o.style.fontSize="11px",o.style.color="#fff",o.style.cursor="pointer",o.style.display="flex",o.style.alignItems="center",o.style.justifyContent="space-between",o.innerHTML=`<span>⬡ ${t.name}</span><span style="font-size: 9px; color: var(--vxr-text-dim);">${t.subtype}</span>`,o.addEventListener("click",()=>{rt(t.id),$n(),Se("props")}),e.appendChild(o)}}}function es(){const e=document.getElementById("stat-objects"),t=document.getElementById("stat-rooms");e&&(e.textContent=v.length.toString()),t&&(t.textContent=u.length.toString())}document.querySelectorAll("[data-apply-tex]").forEach(e=>{e.addEventListener("click",()=>{if(!h){y("⚠️ Selecciona un objeto primero para aplicar la textura");return}const t=P.get(h);if(!t)return;const o=e.getAttribute("data-apply-tex");let n="";o==="wood"?n="assets/textures/tex_wood_floor.jpg":o==="marble"?n="assets/textures/tex_marble_white.jpg":o==="cyber"&&(n="assets/textures/tex_cyber_grid.jpg"),n&&new Cn().load(n,r=>{r.colorSpace=st,r.wrapS=r.wrapT=fa,r.repeat.set(2,2),t.traverse(a=>{if(a.isMesh&&a.material){const i=a.material;i.map=r,i.needsUpdate=!0}}),y(`✓ Textura ${(o||"").toUpperCase()} aplicada`),T()})})});document.querySelectorAll("[data-apply-mat]").forEach(e=>{e.addEventListener("click",()=>{if(!h){y("⚠️ Selecciona un objeto primero");return}const t=P.get(h);if(!t)return;const o=e.getAttribute("data-apply-mat");t.traverse(n=>{if(n.isMesh&&n.material){const s=n.material;s.map=null,o==="gold"?(s.color.set(16096779),s.metalness=.95,s.roughness=.15):o==="chrome"?(s.color.set(16777215),s.metalness=1,s.roughness=.05):o==="glass"&&(s.color.set(3718648),s.transparent=!0,s.opacity=.4,s.roughness=.1),s.needsUpdate=!0}}),y(`✓ Acabado ${o==null?void 0:o.toUpperCase()} aplicado`),T()})});const Ht=document.getElementById("btn-theme-toggle");Ht==null||Ht.addEventListener("click",()=>{Ke=!Ke,Ke?(d.scene.setBackground(395538),d.scene.setEnvironmentPreset("studio"),y("🌙 Modo Cyberpunk Noche")):(d.scene.setBackground(1976635),d.scene.setEnvironmentPreset("daylight"),y("☀️ Modo Estudio Fotográfico Día"))});const we=document.getElementById("tool-select"),Ee=document.getElementById("tool-translate"),be=document.getElementById("tool-rotate"),ve=document.getElementById("tool-scale"),Xt=document.getElementById("tool-duplicate"),_t=document.getElementById("tool-delete"),Yt=document.getElementById("tool-align"),At=document.getElementById("tool-group"),gt=document.getElementById("tool-snap");function Tt(e){Vt=e,[we,Ee,be,ve].forEach(t=>t==null?void 0:t.classList.remove("active")),e==="select"?(we==null||we.classList.add("active"),R.detach()):(e==="translate"?Ee==null||Ee.classList.add("active"):e==="rotate"?be==null||be.classList.add("active"):e==="scale"&&(ve==null||ve.classList.add("active")),R.setMode(e),h&&P.has(h)&&R.attach(P.get(h)))}we==null||we.addEventListener("click",()=>Tt("select"));Ee==null||Ee.addEventListener("click",()=>Tt("translate"));be==null||be.addEventListener("click",()=>Tt("rotate"));ve==null||ve.addEventListener("click",()=>Tt("scale"));Xt==null||Xt.addEventListener("click",()=>{h&&zn(h)});_t==null||_t.addEventListener("click",()=>{h&&vo(h)});Yt==null||Yt.addEventListener("click",()=>{if(!h)return;const e=v.find(o=>o.id===h),t=P.get(h);e&&t&&(e.relY=0,t.position.y=0,bo(e),y("⬡ Objeto alineado al suelo (Y=0)"),T())});At==null||At.addEventListener("click",()=>{y("⛶ Agrupación espacial activada")});gt==null||gt.addEventListener("click",()=>{Te=!Te,R.setTranslationSnap(Te?.5:null),R.setRotationSnap(Te?oe.degToRad(15):null),gt.classList.toggle("active",Te),y(Te?"⩪ Ajuste a cuadrícula (Snap: 0.5m / 15°) ACTIVO":"⩪ Ajuste libre desactivado")});var rn;(rn=document.getElementById("btn-grid-toggle"))==null||rn.addEventListener("click",()=>{et.visible=!et.visible,y(et.visible?"▦ Cuadrícula visible":"▦ Cuadrícula oculta")});var cn;(cn=document.getElementById("btn-fullscreen-toggle"))==null||cn.addEventListener("click",()=>{var e,t,o;document.fullscreenElement?(o=document.exitFullscreen)==null||o.call(document):(t=(e=document.documentElement).requestFullscreen)==null||t.call(e)});var ln;(ln=document.getElementById("btn-cam-home"))==null||ln.addEventListener("click",()=>{Fn()});var dn;(dn=document.getElementById("btn-cam-snapshot"))==null||dn.addEventListener("click",()=>{const e=d.renderer.nativeRenderer.domElement.toDataURL("image/png"),t=document.createElement("a");t.href=e,t.download=`vxr-studio-${Date.now()}.png`,t.click(),y("📷 Captura de pantalla guardada")});const Zt=document.getElementById("btn-proj-dropdown"),An=document.getElementById("proj-selector-menu"),wt=document.getElementById("lbl-current-proj");Zt==null||Zt.addEventListener("click",()=>{An.classList.toggle("show")});document.querySelectorAll("[data-proj-set]").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-proj-set");An.classList.remove("show"),t==="top"?(wt.textContent="Superior (Top)",d.resetCamera([0,30,0],[0,0,0])):t==="front"?(wt.textContent="Frontal",d.resetCamera([0,2,22],[0,2,0])):t==="side"?(wt.textContent="Lateral",d.resetCamera([22,2,0],[0,2,0])):(wt.textContent="Perspectiva",d.resetCamera([0,18,16],[0,0,0]))})});const Gt=document.getElementById("btn-project-select"),vt=document.getElementById("project-selector-dropdown");Gt==null||Gt.addEventListener("click",()=>{vt.classList.toggle("show")});document.querySelectorAll("[data-template-load]").forEach(e=>{e.addEventListener("click",()=>{var o;const t=e.getAttribute("data-template-load");vt==null||vt.classList.remove("show"),(o=document.getElementById("welcome-modal"))==null||o.classList.remove("active"),Rt(t)})});document.querySelectorAll("[data-primitive]").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-primitive");ee({category:"basic",subtype:t,name:t.charAt(0).toUpperCase()+t.slice(1)})})});document.querySelectorAll("[data-preset-model]").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-preset-model");t==="chair"?ee({category:"furniture",subtype:"chair",name:"Silla Ergonómica"}):t==="desk"?ee({category:"furniture",subtype:"desk",name:"Escritorio Ejecutivo"}):t==="pedestal"?ee({category:"furniture",subtype:"pedestal",name:"Pedestal Vitrina"}):t==="sculpture"?ee({category:"decoration",subtype:"sculpture",name:"Escultura Mobius"}):t==="server"?ee({category:"decoration",subtype:"server",name:"Servidor Holográfico"}):t==="laptop"?ee({category:"furniture",subtype:"laptop",name:"Laptop Workstation"}):t==="statue"?ee({category:"decoration",subtype:"statue",name:"Busto Esculpido"}):t==="panel"&&ee({category:"architecture",subtype:"partition_glass",name:"Panel Acristalado"})})});function ee(e){const t=w?u.find(c=>c.id===w):u.length>0?u[0]:null,o=t?t.id:"",n=t?t.name:"el lienzo",s=1,r=parseFloat(((Math.random()-.5)*s).toFixed(2)),a=parseFloat(((Math.random()-.5)*s).toFixed(2)),i={id:`prop-${Date.now().toString(36)}`,roomId:o,category:e.category,subtype:e.subtype,name:`${e.name}`,relX:r,relY:0,relZ:a,rotX:0,rotY:0,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#38bdf8"};v.push(i),ro(i),rt(i.id),d.audio.playSuccess(),y(`¡${i.name} añadido a ${n}!`),T()}const Pe=document.getElementById("file-import-glb");var mn;(mn=document.getElementById("btn-trigger-glb"))==null||mn.addEventListener("click",()=>Pe.click());var pn;(pn=document.getElementById("btn-import-card"))==null||pn.addEventListener("click",()=>Pe.click());Pe==null||Pe.addEventListener("change",async()=>{var t;const e=(t=Pe.files)==null?void 0:t[0];if(e)try{y("Cargando modelo 3D...");const o=await d.assets.loadModel(e,{autoGround:!0,autoCenter:!0}),n=w?u.find(a=>a.id===w):u.length>0?u[0]:null,s=n?n.id:"",r={id:`prop-glb-${Date.now().toString(36)}`,roomId:s,category:"model_glb",subtype:"custom_glb",name:e.name.replace(/\.[^/.]+$/,""),relX:0,relY:0,relZ:0,rotX:0,rotY:0,rotZ:0,scaleX:1,scaleY:1,scaleZ:1,color:"#ffffff"};v.push(r),o.group.userData={...o.group.userData,propId:r.id},d.scene.nativeScene.add(o.group),P.set(r.id,o.group),rt(r.id),y(`✓ Modelo 3D "${e.name}" cargado con éxito`),T()}catch{y("Error al importar archivo GLB/GLTF")}});const co=document.getElementById("prop-selected-container"),lo=document.getElementById("prop-empty-container");document.getElementById("prop-thumb");const Zn=document.getElementById("prop-title"),ts=document.getElementById("prop-type-tag"),Ve=document.getElementById("prop-name-input"),mo=document.getElementById("prop-pos-x"),po=document.getElementById("prop-pos-y"),uo=document.getElementById("prop-pos-z"),ho=document.getElementById("prop-rot-x"),fo=document.getElementById("prop-rot-y"),yo=document.getElementById("prop-rot-z"),go=document.getElementById("prop-scale-x"),wo=document.getElementById("prop-scale-y"),Eo=document.getElementById("prop-scale-z"),Gn=document.getElementById("prop-color-swatch"),jn=document.getElementById("prop-color-hex"),Je=document.getElementById("prop-color-picker");function rt(e){h=e;const t=v.find(n=>n.id===e),o=P.get(e);if(!t||!o){nt(),R.detach();return}lo.style.display="none",co.style.display="flex",Vt!=="select"&&Q==="edit"?(R.setMode(Vt),R.attach(o)):R.detach(),Zn.textContent=t.name,ts.textContent=`Tipo: ${t.category.toUpperCase()} (${t.subtype})`,Ve.value=t.name,bo(t)}function nt(){co.style.display="none",lo.style.display="block"}function bo(e){mo.value=e.relX.toFixed(2),po.value=e.relY.toFixed(2),uo.value=e.relZ.toFixed(2),ho.value=e.rotX.toFixed(1),fo.value=e.rotY.toFixed(1),yo.value=e.rotZ.toFixed(1),go.value=e.scaleX.toFixed(2),wo.value=e.scaleY.toFixed(2),Eo.value=e.scaleZ.toFixed(2),Gn.style.background=e.color,jn.value=e.color,Je.value=e.color}function os(){if(!h)return;const e=v.find(r=>r.id===h),t=P.get(h);if(!e||!t)return;const o=e.roomId?u.find(r=>r.id===e.roomId):null,n=o?o.center[0]:0,s=o?o.center[2]:0;e.relX=parseFloat(mo.value)||0,e.relY=parseFloat(po.value)||0,e.relZ=parseFloat(uo.value)||0,e.rotX=parseFloat(ho.value)||0,e.rotY=parseFloat(fo.value)||0,e.rotZ=parseFloat(yo.value)||0,e.scaleX=Math.max(.05,parseFloat(go.value)||1),e.scaleY=Math.max(.05,parseFloat(wo.value)||1),e.scaleZ=Math.max(.05,parseFloat(Eo.value)||1),t.position.set(n+e.relX,e.relY,s+e.relZ),t.rotation.set(oe.degToRad(e.rotX),oe.degToRad(e.rotY),oe.degToRad(e.rotZ)),t.scale.set(e.scaleX,e.scaleY,e.scaleZ),T()}[mo,po,uo,ho,fo,yo,go,wo,Eo].forEach(e=>e==null?void 0:e.addEventListener("input",os));Ve==null||Ve.addEventListener("input",()=>{if(!h)return;const e=v.find(t=>t.id===h);e&&(e.name=Ve.value,Zn.textContent=e.name,T())});Je==null||Je.addEventListener("input",()=>{const e=Je.value;if(jn.value=e,Gn.style.background=e,!h)return;const t=v.find(n=>n.id===h),o=P.get(h);t&&o&&(t.color=e,o.traverse(n=>{n.isMesh&&n.material&&n.material.color.set(e)}),T())});function zn(e){const t=v.find(n=>n.id===e);if(!t)return;const o={...t,id:`prop-${Date.now().toString(36)}`,name:`${t.name} (Copia)`,relX:parseFloat((t.relX+.6).toFixed(2)),relZ:parseFloat((t.relZ+.6).toFixed(2))};v.push(o),ro(o),rt(o.id),d.audio.playSuccess(),y(`¡${o.name} duplicado!`),T()}function vo(e){const t=v.findIndex(n=>n.id===e);if(t===-1)return;const o=P.get(e);o&&(d.scene.nativeScene.remove(o),P.delete(e)),v.splice(t,1),h===e&&(h=null,R.detach(),nt()),y("Objeto eliminado"),T()}var un;(un=document.getElementById("btn-prop-duplicate"))==null||un.addEventListener("click",()=>{h&&zn(h)});var hn;(hn=document.getElementById("btn-prop-delete"))==null||hn.addEventListener("click",()=>{h&&vo(h)});var fn;(fn=document.getElementById("btn-quick-delete"))==null||fn.addEventListener("click",()=>{h&&vo(h)});let eo={x:0,y:0};_.addEventListener("pointerdown",e=>{eo={x:e.clientX,y:e.clientY}});_.addEventListener("pointerup",e=>{var n;if(R.dragging||Math.hypot(e.clientX-eo.x,e.clientY-eo.y)>6)return;if(Q==="walk"||D){ns(e);return}if(Q==="fly"){(n=_.requestPointerLock)==null||n.call(_);return}const o=d.raycastPointer(e);if(o.length>0)for(const s of o){let r=s.object;for(;r&&r!==d.scene.nativeScene;){if(r.userData&&r.userData.propId){rt(r.userData.propId),d.audio.playClick();return}if(r.name&&(r.name.includes("_floor")||r.name.startsWith("XRRoom_"))){const a=r.name.startsWith("XRRoom_")?r.name.replace("XRRoom_",""):r.name.replace("_floor",""),i=u.find(c=>c.id===a);if(i){Dn(i.id),d.audio.playClick();return}}r=r.parent}}h=null,R.detach(),w?Mo():nt()});function ns(e){const t=d.raycastPointer(e);if(t.length!==0)for(const o of t){let n=o.object;for(;n&&n!==d.scene.nativeScene;){if(n.userData&&n.userData.propId){const s=n.userData.propId,r=v.find(a=>a.id===s);if(r){if(r.subtype==="frame_art"&&r.imageUrl){const a=document.getElementById("lightbox-modal"),i=document.getElementById("lightbox-img");a&&i&&(i.src=r.imageUrl,a.classList.add("active"));return}else if(r.subtype==="screen_video"){const a=document.getElementById("video-modal"),i=document.getElementById("video-player-container"),c=Za(r.videoUrl||"");a&&i&&(c?i.innerHTML=`<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${c}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope" allowfullscreen></iframe>`:i.innerHTML=`<video controls autoplay style="width: 100%; height: 100%; object-fit: contain;"><source src="${r.videoUrl}" type="video/mp4"></video>`,a.classList.add("active"));return}}}n=n.parent}}}function $n(){if(!h)return;const e=P.get(h);if(!e)return;const t=new ma().setFromObject(e),o=new f;t.getCenter(o);const n=new f;t.getSize(n);const s=Math.max(n.length()*1.8,3.5);d.resetCamera([o.x+s*.7,o.y+s*.5,o.z+s*.8],[o.x,o.y,o.z]),y(`🎯 Enfocado: ${e.name||"Objeto"}`)}function ze(){if(!w)return;const e=u.find(o=>o.id===w);if(!e)return;const t=Math.max(e.dimensions.width,e.dimensions.depth)*1.35;d.resetCamera([e.center[0],Math.max(t*.9,14),e.center[2]+Math.max(t*.85,12)],[e.center[0],0,e.center[2]]),y(`🎯 Enfocada: ${e.name}`)}function Fn(){if(h){$n();return}if(w){ze();return}d.resetCamera([0,16,20],[0,0,0]),y("🎯 Vista centrada en el origen")}function xo(){var o;const e=document.getElementById("rooms-list"),t=document.getElementById("rooms-count-badge");if(e){if(e.innerHTML="",t&&(t.textContent=u.length.toString()),u.length===0){e.innerHTML=`
      <div style="padding: 16px; border: 1px dashed var(--vxr-border); border-radius: 10px; text-align: center; color: var(--vxr-text-dim); font-size: 11.5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <span>No hay salas creadas aún.</span>
        <button id="btn-empty-create-room" class="btn-top btn-top-export" style="padding: 6px 14px; font-size: 11.5px; cursor: pointer;">
          ✨ Crear Primera Sala
        </button>
      </div>
    `,(o=document.getElementById("btn-empty-create-room"))==null||o.addEventListener("click",()=>{Un()});return}for(const n of u){const s=document.createElement("div");s.className=`room-card ${n.id===w?"selected":""}`,s.innerHTML=`
      <div class="room-thumb">🏛️</div>
      <div class="room-meta">
        <div class="room-name">${n.name}</div>
        <div class="room-sub">${n.dimensions.width}m x ${n.dimensions.depth}m · Tema: ${n.theme}</div>
      </div>
      <button class="btn-room-del" title="Eliminar sala">🗑️</button>
    `,s.addEventListener("click",r=>{if(r.target.closest(".btn-room-del")){Io(n.id);return}Dn(n.id)}),e.appendChild(s)}}}const Oe=document.getElementById("room-selected-container"),St=document.getElementById("room-hero-title"),zo=document.getElementById("room-hero-theme"),Le=document.getElementById("room-prop-name"),ke=document.getElementById("room-prop-theme"),Ce=document.getElementById("room-prop-w"),He=document.getElementById("room-prop-h"),Xe=document.getElementById("room-prop-d"),_e=document.getElementById("room-prop-x"),Ye=document.getElementById("room-prop-z");function Mo(){if(!Oe)return;if(h){Oe.style.display="none";return}if(!w){Oe.style.display="none",nt();return}const e=u.find(t=>t.id===w);if(!e){Oe.style.display="none",nt();return}co.style.display="none",lo.style.display="none",Oe.style.display="flex",io.textContent=`Sala: ${e.name}`,St&&(St.textContent=e.name),zo&&(zo.textContent=`Tema: ${e.theme} · [${e.center[0]}, ${e.center[2]}]`),Le&&(Le.value=e.name),ke&&(ke.value=e.theme),Ce&&(Ce.value=e.dimensions.width.toString()),He&&(He.value=(e.dimensions.height||4).toString()),Xe&&(Xe.value=e.dimensions.depth.toString()),_e&&(_e.value=e.center[0].toString()),Ye&&(Ye.value=e.center[2].toString())}function Dn(e){w=e,e&&(h=null,R.detach()),xo(),Mo(),e&&u.find(o=>o.id===e)&&(ze(),Se("props"))}Le==null||Le.addEventListener("input",()=>{if(!w)return;const e=u.find(t=>t.id===w);e&&(e.name=Le.value||"Sala",St&&(St.textContent=e.name),io.textContent=`Sala: ${e.name}`,xo(),T())});ke==null||ke.addEventListener("change",()=>{if(!w)return;const e=u.find(t=>t.id===w);e&&(e.theme=ke.value,N(),T())});function So(){if(!w)return;const e=u.find(t=>t.id===w);e&&(e.dimensions.width=Math.max(4,parseInt(Ce.value)||10),e.dimensions.height=Math.max(2.4,parseFloat(He.value)||4),e.dimensions.depth=Math.max(4,parseInt(Xe.value)||10),N(),T())}Ce==null||Ce.addEventListener("change",So);He==null||He.addEventListener("change",So);Xe==null||Xe.addEventListener("change",So);function On(){if(!w)return;const e=u.find(t=>t.id===w);if(e){const t=parseFloat(_e.value)||0,o=parseFloat(Ye.value)||0,n=t-e.center[0],s=o-e.center[2];e.center[0]=t,e.center[2]=o,e.spawnPoint&&(e.spawnPoint[0]+=n,e.spawnPoint[2]+=s),N(),T()}}_e==null||_e.addEventListener("change",On);Ye==null||Ye.addEventListener("change",On);var yn;(yn=document.getElementById("btn-prop-room-focus"))==null||yn.addEventListener("click",()=>{ze()});var gn;(gn=document.getElementById("btn-prop-room-del"))==null||gn.addEventListener("click",()=>{w&&Io(w)});var wn;(wn=document.getElementById("btn-quick-del-room"))==null||wn.addEventListener("click",()=>{w&&Io(w)});function Io(e){const t=u.findIndex(o=>o.id===e);t!==-1&&(u.splice(t,1),j=j.filter(o=>o.fromRoomId!==e&&o.toRoomId!==e),v=v.filter(o=>o.roomId!==e),w===e&&(w=u.length>0?u[0].id:null),N(),y("Sala eliminada del escenario"),T())}const $e=document.getElementById("add-room-modal"),jt=document.getElementById("btn-add-room-dialog"),zt=document.getElementById("btn-close-room-modal"),$o=document.getElementById("group-initial-room"),Fo=document.getElementById("group-connected-room"),Ae=document.getElementById("btn-create-initial-room");function Un(){const e=document.getElementById("modal-room-name");e&&(e.value=u.length===0?"Sala Central":`Sala ${u.length+1}`),u.length===0?($o.style.display="block",Fo.style.display="none"):($o.style.display="none",Fo.style.display="block"),$e.classList.add("active")}jt==null||jt.addEventListener("click",Un);zt==null||zt.addEventListener("click",()=>$e.classList.remove("active"));Ae==null||Ae.addEventListener("click",()=>{const e=document.getElementById("modal-room-name").value||"Sala Central",t=document.getElementById("modal-room-theme").value,o=parseInt(document.getElementById("modal-room-w").value)||12,n=parseInt(document.getElementById("modal-room-d").value)||10,s={id:`room-${Date.now().toString(36)}`,name:e,theme:t,dimensions:{width:o,depth:n,height:4},center:[0,0,0],doors:[],spawnPoint:[0,1.6,0]};u.push(s),w=s.id,h=null,$e.classList.remove("active"),N(),ze(),y(`¡${s.name} creada en el centro!`),T()});document.querySelectorAll(".btn-dir-room").forEach(e=>{e.addEventListener("click",()=>{const t=e.getAttribute("data-dir"),o=w?u.find(E=>E.id===w):u[0];if(!o){Ae==null||Ae.click();return}const n=document.getElementById("modal-room-name").value||`Sala ${u.length+1}`,s=document.getElementById("modal-room-theme").value,r=parseInt(document.getElementById("modal-room-w").value)||12,a=parseInt(document.getElementById("modal-room-d").value)||10;let i=o.center[0],c=o.center[2];const p=4;t==="north"?c-=o.dimensions.depth/2+a/2+p:t==="south"?c+=o.dimensions.depth/2+a/2+p:t==="east"?i+=o.dimensions.width/2+r/2+p:t==="west"&&(i-=o.dimensions.width/2+r/2+p);const m={id:`room-${Date.now().toString(36)}`,name:n,theme:s,dimensions:{width:r,depth:a,height:4},center:[Math.round(i),0,Math.round(c)],doors:[],spawnPoint:[Math.round(i),1.6,Math.round(c)]};u.push(m),j.push({id:`conn-${Date.now().toString(36)}`,fromRoomId:o.id,fromWall:t,toRoomId:m.id,toWall:t==="north"?"south":t==="south"?"north":t==="east"?"west":"east",width:3,height:3}),w=m.id,h=null,$e.classList.remove("active"),N(),ze(),y(`¡${m.name} conectada al ${t}!`),T()})});var En;(En=document.getElementById("btn-create-free-room"))==null||En.addEventListener("click",()=>{const e=document.getElementById("modal-room-name").value||`Sala ${u.length+1}`,t=document.getElementById("modal-room-theme").value,o=parseInt(document.getElementById("modal-room-w").value)||12,n=parseInt(document.getElementById("modal-room-d").value)||10;let s=0;for(const c of u)s=Math.max(s,c.center[0]+c.dimensions.width/2);const r=u.length>0?s+o/2+6:0,a=0,i={id:`room-${Date.now().toString(36)}`,name:e,theme:t,dimensions:{width:o,depth:n,height:4},center:[Math.round(r),0,a],doors:[],spawnPoint:[Math.round(r),1.6,a]};u.push(i),w=i.id,h=null,$e.classList.remove("active"),N(),ze(),y(`¡${i.name} añadida al nivel!`),T()});const Do=document.getElementById("lbl-btn-3d"),xe=document.getElementById("btn-test-3d");function Wn(e){var o;const t=e!==void 0?e:!D;if(D!==t)if(D=t,d.audio.playWarp(),D){Do.textContent="Modo Editor",xe.style.borderColor="#38bdf8",xe.style.background="rgba(56, 189, 248, 0.2)",d.controls&&(d.controls.enabled=!1),R.detach();const n=w?u.find(a=>a.id===w):u.length>0?u[0]:null,s=n?n.center[0]:0,r=n?n.center[2]:2;Mt.set(s,1.6,r),Ne=0,ot=0,d.camera.position.copy(Mt),(o=_.requestPointerLock)==null||o.call(_),y("🚶 ¡Modo Paseo Activo! Usa W,A,S,D para caminar")}else Do.textContent="Probar 3D",xe.style.borderColor="",xe.style.background="",document.exitPointerLock&&document.exitPointerLock(),d.controls&&(d.controls.enabled=!0,d.resetCamera([0,22,22],[0,0,-4])),h&&P.has(h)&&R.attach(P.get(h)),y("🛸 Modo Editor / Vista Aérea")}xe==null||xe.addEventListener("click",()=>Wn());var bn;(bn=document.getElementById("btn-test-vr"))==null||bn.addEventListener("click",async()=>{try{d.audio.playWarp(),y("Iniciando sesión WebXR en Meta Quest..."),await d.session.toggleVR()}catch{y("WebXR no disponible o visor no detectado.")}});function T(){clearTimeout(jo),jo=setTimeout(()=>{const e={rooms:u,connections:j,props:v};localStorage.setItem("vxr_studio_autosave",JSON.stringify(e))},1e3)}function as(){try{const e=localStorage.getItem("vxr_studio_autosave");if(!e)return!1;const t=JSON.parse(e);return!t.rooms||!Array.isArray(t.rooms)?!1:t.rooms.length===2&&t.rooms.some(o=>o.id==="lobby")?(localStorage.removeItem("vxr_studio_autosave"),!1):(u=t.rooms,j=t.connections||[],v=t.props||[],w=u.length>0?u[0].id:null,!0)}catch{return!1}}const Me=document.getElementById("export-modal"),Oo=document.getElementById("export-code-display"),It=document.getElementById("export-line-numbers"),Ue=document.getElementById("export-scroll-container"),Uo=document.getElementById("export-filename"),Wo=document.getElementById("export-line-count"),qo=document.getElementById("export-file-size"),Qo=document.getElementById("export-desc-text"),No=document.getElementById("export-status-tip"),Et=document.getElementById("lbl-copy-code"),$t=document.getElementById("btn-copy-code"),Ft=document.getElementById("btn-download-file");let Ze="ts",Ro="";var vn;(vn=document.getElementById("btn-export"))==null||vn.addEventListener("click",()=>{Me==null||Me.classList.add("active"),qn()});var xn;(xn=document.getElementById("btn-close-export"))==null||xn.addEventListener("click",()=>{Me==null||Me.classList.remove("active")});function qn(){var E;const e=document.getElementById("lbl-project-name"),t=((E=e==null?void 0:e.textContent)==null?void 0:E.replace("Proyecto:","").trim())||"Experiencia VXR Studio",o=Ra({projectName:t,rooms:u,connections:j,props:v,environmentPreset:Ke?"dark":"studio",backgroundColor:Ke?"#080d1a":"#1e293b",fov:50,cameraPosition:[0,16,20],cameraTarget:[0,0,0]});let n="",s="",r="",a="";Ze==="ts"?(n=ka(o),s="vxr-experience.ts",r="Código TypeScript 100% ejecutable basado en @vxr/core con tipado estricto.",a="Requiere Node.js / Vite y las dependencias @vxr/core y three."):Ze==="html"?(n=Ba(o),s="index.html",r="Documento HTML5 autónomo con Three.js vía import map. Abre directamente en cualquier navegador.",a="100% independiente: no requiere servidor de build ni bundler, sólo Three.js CDN."):(n=La(o),s="vxr-scene.json",r="Especificación JSON declarativa de arquitectura, conexiones y objetos 3D.",a="Compatible con el importador de VXR Studio y el ScenarioManager de VXR Core."),Ro=n,Oo&&(Oo.innerHTML=Ca(n,Ze));const i=n.split(`
`),c=Array.from({length:i.length},(S,k)=>k+1).join(`
`);It&&(It.textContent=c),Uo&&(Uo.textContent=s),Wo&&(Wo.textContent=`${i.length} líneas`);const p=new Blob([n]).size,m=p>1024?`${(p/1024).toFixed(1)} KB`:`${p} B`;qo&&(qo.textContent=m),Qo&&(Qo.textContent=r),No&&(No.textContent=a)}Ue==null||Ue.addEventListener("scroll",()=>{It&&Ue&&(It.scrollTop=Ue.scrollTop)});document.querySelectorAll("[data-export-tab]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-export-tab]").forEach(t=>t.classList.remove("active")),e.classList.add("active"),Ze=e.getAttribute("data-export-tab"),qn()})});$t==null||$t.addEventListener("click",async()=>{const e=Ro;let t=!1;try{if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(e),t=!0;else throw new Error("Clipboard API no disponible")}catch{const o=document.createElement("textarea");o.value=e,o.style.position="fixed",o.style.left="-9999px",o.style.top="0",document.body.appendChild(o),o.focus(),o.select();try{t=document.execCommand("copy")}catch{t=!1}document.body.removeChild(o)}t?(Et&&(Et.textContent="✓ ¡Copiado!"),y("✓ Código copiado al portapapeles"),setTimeout(()=>{Et&&(Et.textContent="📋 Copiar Código")},2e3)):y("⚠ No se pudo copiar automáticamente. Selecciónalo manualmente.")});Ft==null||Ft.addEventListener("click",()=>{const e=Ro;let t="vxr-experience.ts",o="text/typescript;charset=utf-8";Ze==="html"?(t="index.html",o="text/html;charset=utf-8"):Ze==="json"&&(t="vxr-scene.json",o="application/json;charset=utf-8");const n=new Blob([e],{type:o}),s=URL.createObjectURL(n),r=document.createElement("a");r.href=s,r.download=t,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(s),y(`💾 Archivo "${t}" descargado con éxito`)});const ce=document.getElementById("input-import-json");var Mn;(Mn=document.getElementById("btn-menu-import"))==null||Mn.addEventListener("click",()=>{Pt.classList.remove("show"),ce==null||ce.click()});ce==null||ce.addEventListener("change",e=>{var n;const t=(n=e.target.files)==null?void 0:n[0];if(!t)return;const o=new FileReader;o.onload=s=>{var r;try{const a=(r=s.target)==null?void 0:r.result,i=Pa(a);if(!i.success||!i.data){y(`❌ Error al importar JSON: ${i.error||"Archivo inválido"}`);return}const c=i.data;u=c.rooms||[],j=c.connections||[],v=(c.props||[]).map(m=>{const E=m.roomId?u.find(Y=>Y.id===m.roomId):u[0]||null,S=E?E.center[0]:0,k=E?E.center[2]:0;return{id:m.id,roomId:m.roomId,category:m.category,subtype:m.subtype,name:m.name,relX:m.relativePosition?m.relativePosition[0]:m.position[0]-S,relY:m.relativePosition?m.relativePosition[1]:m.position[1],relZ:m.relativePosition?m.relativePosition[2]:m.position[2]-k,rotX:m.rotationDeg?m.rotationDeg[0]:0,rotY:m.rotationDeg?m.rotationDeg[1]:0,rotZ:m.rotationDeg?m.rotationDeg[2]:0,scaleX:m.scale?m.scale[0]:1,scaleY:m.scale?m.scale[1]:1,scaleZ:m.scale?m.scale[2]:1,color:m.color||"#38bdf8",text:m.text,intensity:m.intensity,textureUrl:m.textureUrl,imageUrl:m.imageUrl,videoUrl:m.videoUrl,linkUrl:m.linkUrl,modelUrl:m.modelUrl}}),w=u.length>0?u[0].id:null,h=null;const p=document.getElementById("lbl-project-name");p&&c.projectName&&(p.textContent=`Proyecto: ${c.projectName}`),N(),d.audio.playWarp(),y(`✓ Proyecto "${c.projectName}" importado (${u.length} salas, ${v.length} objetos)`),T()}catch(a){y(`❌ Error al procesar archivo JSON: ${a.message}`)}finally{ce&&(ce.value="")}},o.readAsText(t)});const Dt=document.getElementById("toast"),Vo=document.getElementById("toast-msg");let Jo;function y(e){!Dt||!Vo||(Vo.textContent=e,Dt.style.display="flex",clearTimeout(Jo),Jo=setTimeout(()=>{Dt.style.display="none"},2800))}const it=document.getElementById("welcome-modal");var Sn;(Sn=document.getElementById("btn-close-welcome"))==null||Sn.addEventListener("click",()=>it.classList.remove("active"));var In;(In=document.getElementById("btn-welcome-blank"))==null||In.addEventListener("click",()=>{it.classList.remove("active"),Rt("empty")});var Rn;(Rn=document.getElementById("btn-welcome-learn"))==null||Rn.addEventListener("click",()=>{it.classList.remove("active"),Qn()});var Tn;(Tn=document.getElementById("btn-menu-welcome"))==null||Tn.addEventListener("click",()=>{Pt.classList.remove("show"),it.classList.add("active")});const Ot=document.getElementById("btn-more-options"),Pt=document.getElementById("dropdown-menu");Ot==null||Ot.addEventListener("click",()=>Pt.classList.toggle("show"));var Pn;(Pn=document.getElementById("btn-menu-empty"))==null||Pn.addEventListener("click",()=>{Pt.classList.remove("show"),Rt("empty")});[$e,Me,it].forEach(e=>{e==null||e.addEventListener("click",t=>{t.target===e&&e.classList.remove("active")})});const To=document.getElementById("tutorial-card"),ss=document.getElementById("tut-step-badge"),rs=document.getElementById("tut-progress-fill"),is=document.getElementById("tut-headline"),cs=document.getElementById("tut-description"),xt=document.getElementById("btn-tut-prev"),Ut=document.getElementById("btn-tut-auto"),Wt=document.getElementById("btn-tut-next");let W=0;const at=[{title:"Paso 1 de 6",headline:"1. Estructura y Espacio 3D",description:'VXR Studio organiza las experiencias en salas 3D. Pulsa "＋ Añadir Sala al Nivel" para crear tu primera sala en el centro del escenario.',auto:()=>{Rt("museum")}},{title:"Paso 2 de 6",headline:"2. Navegación de Cámara",description:'Arrastra con clic izquierdo para orbitar, rueda para zoom y clic derecho para pan. Pulsa "Volar" para el modo creativo libre.',auto:()=>{d.resetCamera([0,18,16],[0,0,0])}},{title:"Paso 3 de 6",headline:"3. Catálogo de Modelos",description:"Inserta mobiliario, pedestales con vitrina o esculturas abstractas desde el panel izquierdo.",auto:()=>{ee({category:"furniture",subtype:"chair",name:"Silla Ergonómica"})}},{title:"Paso 4 de 6",headline:"4. Materiales y Texturas PBR",description:'En el dock derecho, abre la pestaña "Materiales" para aplicar mármol, madera o acabados metálicos.',auto:()=>{Se("mats")}},{title:"Paso 5 de 6",headline:"5. Modo Creativo de Vuelo",description:'Activa "🛸 Volar" para explorar tu entorno libremente con controles estilo Minecraft (W,A,S,D + Q/E).',auto:()=>{je("fly")}},{title:"Paso 6 de 6",headline:"6. Inmersión WebXR en Meta Quest",description:'¡Tu experiencia espacial está lista! Pulsa "Probar en VR" para abrirla de inmediato en tu visor.',auto:()=>{y("🎉 ¡Tutorial completado con éxito!")}}];function Lt(){const e=at[W];ss.textContent=e.title,rs.style.width=`${(W+1)/at.length*100}%`,is.textContent=e.headline,cs.textContent=e.description,xt.disabled=W===0}function Qn(){W=0,To.style.display="block",Lt()}xt==null||xt.addEventListener("click",()=>{W>0&&(W--,Lt())});Wt==null||Wt.addEventListener("click",()=>{W<at.length-1?(W++,Lt()):(To.style.display="none",y("🎉 ¡Felicitaciones! Has completado el tutorial de VXR Studio."))});Ut==null||Ut.addEventListener("click",()=>{at[W].auto(),W<at.length-1&&(W++,Lt())});var Ln;(Ln=document.getElementById("btn-tut-close"))==null||Ln.addEventListener("click",()=>To.style.display="none");var kn;(kn=document.getElementById("btn-top-tutorial"))==null||kn.addEventListener("click",Qn);let Ko=0,qt=0,Qt=0;d.onUpdate(e=>{if(Ko+=e,Qt+=e,qt++,Qt>=1){const t=document.getElementById("stat-fps");t&&(t.textContent=qt.toString()),qt=0,Qt=0}for(const t of v)if(t.subtype==="billboard_floating"){const o=P.get(t.id);o&&(o.position.y=t.relY+Math.sin(Ko*2+(t.relX+t.relZ))*.05)}if(Q==="fly"&&Na(e),D){const t=new f(0,0,-1).applyAxisAngle(new f(0,1,0),ot),o=new f(1,0,0).applyAxisAngle(new f(0,1,0),ot),n=new f;(K.KeyW||K.ArrowUp)&&n.add(t),(K.KeyS||K.ArrowDown)&&n.sub(t),(K.KeyD||K.ArrowRight)&&n.add(o),(K.KeyA||K.ArrowLeft)&&n.sub(o),n.lengthSq()>.001&&(n.normalize().multiplyScalar(4.5*e),Mt.add(n),d.camera.position.copy(Mt))}Ja(),Va()});as();N();d.start();requestAnimationFrame(()=>{d.renderer.handleResize()});typeof ResizeObserver<"u"&&_&&new ResizeObserver(()=>{d.renderer.handleResize()}).observe(_);
