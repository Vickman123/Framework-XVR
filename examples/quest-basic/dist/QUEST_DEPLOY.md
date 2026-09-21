# Guía de Despliegue y Acceso en Meta Quest Browser

> **Proyecto:** VXR Experience  
> **Target:** Meta Quest WebXR Build

Esta compilación web está especialmente optimizada para ejecutarse en **Meta Quest Browser** (Meta Quest 2, 3, 3S y Pro) mediante la **WebXR Device API**.

---

## 🔒 Requisito Crítico: HTTPS Obligatorio

En Meta Quest Browser, la API WebXR está estrictamente deshabilitada bajo conexiones HTTP no seguras. Para que el botón **"ENTER VR"** funcione en el visor físico, la experiencia debe servirse mediante **HTTPS** (o `http://localhost` en depuración conectada por cable ADB).

### Opciones Rápidas de Despliegue Seguro:

1. **GitHub Pages (Gratuito y Directo):**
   - Sube esta carpeta `dist/` a tu repositorio GitHub.
   - En Configuración -> Pages, activa GitHub Pages.
   - Tu URL `https://<usuario>.github.io/<repo>/` tendrá certificado SSL automático.

2. **Vercel o Netlify:**
   - Ejecuta `npx vercel deploy --prod` o arrastra la carpeta a Netlify Drop.
   - Ambas plataformas proveen HTTPS automático de inmediato.

3. **Prueba Local Inalámbrica con Túnel Seguro (ngrok o Cloudflare Tunnel):**
   - Si corres un servidor local en el puerto 5173:
     ```bash
     npx ngrok http 5173
     ```
   - Copia la URL `https://xxxx.ngrok-free.app` generada y ábrela en el navegador de tu visor Meta Quest.

---

## 🥽 Cómo abrir la experiencia en Meta Quest

1. Colócate tu visor **Meta Quest 2 / 3 / 3S / Pro**.
2. Abre la aplicación integrada **Meta Quest Browser**.
3. Ingresa la dirección URL HTTPS de tu experiencia.
4. Una vez cargada la escena 3D, pulsa el botón flotante **"🥽 ENTER VR"**.
5. ¡Listo! Estarás inmerso en la experiencia con seguimiento 6DoF y mandos Touch interactivos.
