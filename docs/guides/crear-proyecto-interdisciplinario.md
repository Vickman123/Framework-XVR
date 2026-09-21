# 🎓 Guía Rápida: Crear un Proyecto Interdisciplinario 3D en 15 Minutos con VXR

> **VXR Framework v0.3.0**  
> *Diseñado para docentes, estudiantes, divulgadores, diseñadores e investigadores de cualquier área (Historia, Biología, Medicina, Arquitectura, Ingeniería o Arte) que desean crear experiencias virtuales interactivas sin complicaciones técnicas.*

---

## 💡 ¿Por qué VXR para Proyectos Interdisciplinarios?

En la mayoría de instituciones educativas y proyectos colaborativos, crear una experiencia virtual interactiva solía requerir semanas de trabajo en motores pesados como Unity o Unreal, licencias costosas, o escribir miles de líneas de WebGL.

Con **VXR**, cualquier persona puede crear una experiencia interactiva funcional en minutos:
- 🏛️ **Salas y Museos en 1 línea**: Conecta galerías, laboratorios o salas temáticas sin modelar muros a mano.
- 📦 **Pedestales con Ficha Técnica (`XRExhibit`)**: Muestra modelos 3D con pantallas informativas, medidores y especificaciones generadas al instante.
- 🎯 **Checklist de Práctica / Misiones (`XRTutorial`)**: Guía a los alumnos paso a paso y evalúa el cumplimiento de actividades educativas.
- 🔊 **Audio Procedural Nativo (`XRAudio`)**: Pasos al caminar, sonidos de clic y fanfarrias de éxito sin descargar ningún archivo de audio pesado (0 MB).
- 📥 **Arrastrar y Soltar Directo (`LocalFileDrop`)**: Los alumnos pueden arrastrar sus propios archivos `.glb` desde su computadora y el sistema los escala, centra y mide en metros automáticamente.
- 🥽 **100% Compatible con Celulares, PC y Visores VR (Meta Quest, Pico, Vision Pro)**.

---

## 🏛️ Plantilla 1: Museo Virtual Interdisciplinario

Copia y pega este código en tu archivo `main.ts` para tener un museo virtual completo con dos salas conectadas, dos exhibidores interactivos y audio de pasos:

```typescript
import { XRApp } from 'vxr';

// 1. Inicializar la aplicación con soporte VR
const app = new XRApp({
  container: document.getElementById('app')!,
  enableVR: true,
  cameraPosition: [0, 1.6, 3]
});

// 2. Crear las salas del museo
const scenario = app.createScenario('Museo Interdisciplinario');

// Sala 01: Arqueología
scenario.addRoom({
  id: 'sala-arqueologia',
  name: 'Sala de Arqueología & Historia',
  dimensions: { width: 10, depth: 10, height: 3.6 },
  theme: 'gallery',
  doors: [{ wall: 'north', targetRoomId: 'sala-ciencias' }]
});

// Sala 02: Ciencias y Tecnología
scenario.addRoom({
  id: 'sala-ciencias',
  name: 'Laboratorio de Ciencias',
  center: [0, 0, -16],
  dimensions: { width: 12, depth: 10, height: 4.0 },
  theme: 'scifi',
  doors: [{ wall: 'south', targetRoomId: 'sala-arqueologia' }]
});

// Conectar ambas salas con un pasillo automático
scenario.connectRooms('sala-arqueologia', 'north', 'sala-ciencias', 'south');

// 3. Montar los pedestales interactivos con fichas técnicas
app.addExhibit({
  title: 'Vaso Ceremonial Maya',
  category: 'ARQUEOLOGÍA PREHISPÁNICA',
  description: 'Digitalizado en alta definición para su estudio y preservación digital.',
  specs: ['PERIODO: Clásico Tardío', 'MATERIAL: Cerámica policromada', 'ORIGEN: Petén'],
  themeColor: '#f59e0b',
  position: [-2.5, 0, 0],
  onInspect: (exhibit) => {
    console.log('El alumno inspeccionó la pieza maya:', exhibit.title);
  }
});

app.addExhibit({
  title: 'Célula Eucariota 3D',
  category: 'BIOLOGÍA & MEDICINA',
  description: 'Estructura celular detallada mostrando organelos y membrana lipídica.',
  specs: ['ESCALA: 10,000x', 'TIPO: Célula Animal', 'ESTRUCTURAS: Mitocondrias y Núcleo'],
  themeColor: '#10b981',
  position: [2.5, 0, -16]
});

// 4. Iniciar la experiencia
app.start();
```

---

## 🔬 Plantilla 2: Simulador de Práctica de Laboratorio con Evaluación

Si eres docente y deseas que tus estudiantes completen una serie de tareas prácticas, utiliza el módulo `XRTutorial`:

```typescript
import { XRApp } from 'vxr';

const app = new XRApp({ enableVR: true });

// 1. Crear el entorno de práctica
const room = app.createRoom({
  name: 'Laboratorio de Prácticas',
  dimensions: { width: 12, depth: 12 },
  theme: 'scifi'
});

// 2. Definir la lista de misiones para los alumnos
const tutorial = app.createTutorial({
  title: 'Práctica 01: Reconocimiento Espacial',
  tasks: [
    { id: 'camino', title: 'Explorar el laboratorio a pie', description: 'Usa W,A,S,D o el joystick táctil.' },
    { id: 'pedestal', title: 'Inspeccionar el espécimen A', description: 'Haz clic en la consola del pedestal.' },
    { id: 'subir-modelo', title: 'Subir tu propio modelo 3D', description: 'Arrastra un archivo .glb a la ventana.' }
  ],
  onTaskComplete: (task, restantes) => {
    console.log(`¡Tarea completada: ${task.title}! Faltan ${restantes} tareas.`);
  },
  onAllComplete: () => {
    alert('🎉 ¡Felicidades! Has completado todas las misiones de la práctica.');
  }
});

// 3. Agregar el pedestal que completa la tarea al hacer clic
app.addExhibit({
  title: 'Espécimen Criogénico A-102',
  category: 'INVESTIGACIÓN CIENTÍFICA',
  description: 'Muestra biológica preservada a -196 °C.',
  specs: ['ESTADO: Estable', 'CONTENEDOR: Nitrógeno Líquido'],
  position: [0, 0, -2],
  onInspect: () => {
    tutorial.completeTask('pedestal');
  }
});

// 4. Permitir que los alumnos arrastren su propio modelo 3D
app.enableLocalFileDrop({
  targetPosition: [0, 1.2, 0],
  onModelLoaded: (loaded, file) => {
    tutorial.completeTask('subir-modelo');
    const { width, height, depth } = loaded.metrics.dimensions;
    console.log(`Modelo cargado: ${file.name} (${width.toFixed(2)}m x ${height.toFixed(2)}m x ${depth.toFixed(2)}m)`);
  }
});

app.start();
```

---

## 🎨 Opciones de Temas Disponibles

Puedes ambientar cualquier sala con el parámetro `theme`:

| Tema | Ideal para | Colores y Sensación |
| :--- | :--- | :--- |
| `'gallery'` | Museos de arte, historia, arqueología, diseño de interiores | Blanco mate, piso de roble claro, luz cálida |
| `'scifi'` | Prácticas de física, química, astronomía, robótica | Muros oscuros, piso con acentos neón, luz azul cian |
| `'office'` | Presentaciones académicas, salas de juntas, sustentabilidad | Gris suave, alfombra ejecutiva, luz neutra |
| `'cozy'` | Literatura, ciencias sociales, espacios de lectura | Madera nogal, tonos marfil, luz ámbar |
| `'minimal'` | Arquitectura moderna, escultura, ingeniería estructural | Concreto oscuro pulido, alto contraste lumínico |

---

## 📁 Cómo Estructurar tus Archivos 3D (`.glb` / `.gltf`)

Para que tus modelos 3D se vean de manera óptima:
1. **Formato**: Usa preferentemente `.glb` (glTF binario), ya que incluye la malla, materiales y texturas empaquetados en un solo archivo.
2. **Polígonos**: Para una experiencia fluida en celulares y Meta Quest, mantén cada modelo entre **5,000 y 100,000 triángulos**.
3. **Escala**: VXR calcula automáticamente el tamaño métrico real en metros. Si tu modelo mide 2 metros en Blender, medirá exactamente 2 metros en el mundo virtual.

---

## 🌐 Publicación Gratuita en la Web (GitHub Pages)

Para compartir tu proyecto con tus estudiantes o colegas con un simple link de internet:

1. Sube tu proyecto a un repositorio en **GitHub**.
2. Ve a la pestaña **Settings** > **Pages**.
3. Selecciona la rama `gh-pages` o la carpeta `docs` / `dist`.
4. ¡Listo! Obtendrás una URL pública como `https://tu-usuario.github.io/tu-proyecto/` que tus alumnos pueden abrir en sus teléfonos, computadoras o gafas de realidad virtual sin instalar nada.
