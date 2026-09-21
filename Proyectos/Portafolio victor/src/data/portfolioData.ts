export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  badge: string;
  technologies: string[];
  description: string;
  longDescription: string;
  highlights: string[];
  demoUrl?: string;
  githubUrl?: string;
  color?: string;
}

export interface MetricItem {
  id: string;
  value: string;
  label: string;
  description: string;
  category: string;
}

export interface TimelineMilestone {
  year: string;
  organization: string;
  role: string;
  description: string;
  highlights: string[];
}

export interface CertificationItem {
  name: string;
  issuer: string;
  focus: string;
  year: string;
}

export const PORTFOLIO_DATA = {
  profile: {
    name: "Victor Carreño",
    title: "Software Engineer · Spatial Computing / WebXR · IT Systems Lead",
    location: "Mexico City, Mexico",
    summary:
      "Software Engineer and spatial computing architect with expertise spanning enterprise IT service management, large-scale systems operations at UNAM, and cutting-edge WebGL/WebXR simulation frameworks. Creator of the VXR Framework for spatial computing.",
    links: {
      github: "https://github.com/Vickman123",
      linkedin: "https://www.linkedin.com/in/victorcarg/",
      email: "mailto:victorcarg@gmail.com",
    },
  },

  metrics: [
    {
      id: "users",
      value: "300K+",
      label: "Users Impacted",
      description:
        "High-density community of students, faculty, and academic researchers served across UNAM university campuses.",
      category: "Scale & Reach",
    },
    {
      id: "entities",
      value: "72+",
      label: "Academic Entities",
      description:
        "Faculties, national research institutes, preparatory schools, and interdisciplinary centers connected via IT operations.",
      category: "Infrastructure",
    },
    {
      id: "devices",
      value: "6,000+",
      label: "Devices Managed",
      description:
        "Mobile fleet, computing workstations, network access nodes, and peripheral hardware orchestrations.",
      category: "Fleet Management",
    },
    {
      id: "coordination",
      value: "20+",
      label: "Entities Coordinated",
      description:
        "Multi-stakeholder technical divisions, vendor support teams, and governance councils unified under ITIL standards.",
      category: "Operations",
    },
  ] as MetricItem[],

  timeline: [
    {
      year: "2022",
      organization: "IBM / Microsoft Programs",
      role: "Cloud Systems & Cognitive Solutions",
      description:
        "Initiated deep dive into cloud architecture, cognitive AI chatbots, cybersecurity fundamentals, and enterprise computing pipelines.",
      highlights: [
        "Earned foundational cloud and cybersecurity credentials",
        "Engineered scalable microservice proof-of-concepts",
        "Formulated modular systems architecture practices",
      ],
    },
    {
      year: "2023",
      organization: "Agencia Espacial Mexicana (AEM)",
      role: "Systems Analyst & Platform Developer",
      description:
        "Conducted systems analysis and software optimization for national aerospace initiatives, including the ENMICE digital platform.",
      highlights: [
        "Analyzed operational workflows and telemetry data pipelines",
        "Engineered responsive scientific web interfaces",
        "Collaborated with national aerospace specialists and engineers",
      ],
    },
    {
      year: "2024",
      organization: "Space Tech Labs",
      role: "Lead Engineer & R&D Coordinator",
      description:
        "Led student and research teams in developing space technology software, orbital simulations, and interactive educational platforms.",
      highlights: [
        "Spearheaded international hackathon solutions (NASA Space Apps)",
        "Designed real-time 3D planetary and satellite orbital visualizers",
        "Fostered institutional partnerships across universities and labs",
      ],
    },
    {
      year: "2025",
      organization: "Dr. Rodolfo Neri Vela Collaboration",
      role: "Technology & Outreach Specialist",
      description:
        "Collaborated on technology initiatives and digital dissemination honoring Mexico's first astronaut, developing interactive historical archives.",
      highlights: [
        "Created digital historical archiving systems for aerospace artifacts",
        "Formulated interactive educational modules for aerospace students",
        "Bridged historical space missions with modern spatial computing",
      ],
    },
    {
      year: "2026",
      organization: "PC PUMA / UNAM",
      role: "IT Service Operations & Digital Transformation Lead",
      description:
        "Directing operational service delivery, IT asset monitoring, and digital transformation for one of the largest academic IT ecosystems in Latin America.",
      highlights: [
        "Overseeing technical delivery across 72+ university schools and faculties",
        "Implementing automated diagnostics and service delivery standards",
        "Building 3D simulation tools for operational training and logistics",
      ],
    },
  ] as TimelineMilestone[],

  vxrFramework: {
    title: "VXR Framework",
    subtitle: "Virtual & Extended Reality Framework for Three.js",
    version: "v0.1.0",
    description:
      "A high-level, modular spatial computing framework engineered by Victor Carreño. VXR abstracts WebXR session management, controller raycasting, automatic 3D model bounding & ground alignment, and desktop/VR locomotion into a unified, developer-friendly architecture.",
    technologies: ["TypeScript", "Three.js", "WebXR", "WebGL", "Vite"],
    architecture: [
      { step: "Application Layer", desc: "User application code, scenes, and custom spatial logic" },
      { step: "XRApp Engine", desc: "Master orchestrator connecting scene, renderer, session, and asset pipelines" },
      { step: "Subsystem Core", desc: "XRScene · XRRenderer · XRSession · XRAssetManager" },
      { step: "Hardware Runtime", desc: "Three.js WebGL Engine + WebXR Device API (Meta Quest / PCVR)" },
    ],
    demoUrl: "https://vickman123.github.io/Framework-XVR/",
    githubUrl: "https://github.com/Vickman123/Framework-XVR",
  },

  projects: [
    {
      id: "virus-purge",
      title: "Virus Purge",
      category: "WebXR / Spatial Gaming",
      badge: "Flagship XR",
      technologies: ["Three.js", "WebXR", "TypeScript", "Spatial Audio", "Game Loop"],
      description:
        "High-performance immersive first-person shooter running natively in the browser on desktop and Meta Quest headsets.",
      longDescription:
        "Virus Purge is a fast-paced WebXR first-person action simulation where operators are deployed into a contaminated digital bio-containment facility to eliminate mutating viral threats. Features custom spatial audio, smooth VR locomotion, real-time particle effects, and responsive desktop controls.",
      highlights: [
        "60-90 FPS sustained frame rate across standalone VR headsets",
        "Adaptive dual-input pipeline supporting mouse look and 6DoF VR motion controllers",
        "Procedural particle dynamics and reactive sound synthesis",
      ],
      demoUrl: "https://vickman123.github.io/FPS-WEBXR-VIRUS-PURGE/",
      githubUrl: "https://github.com/Vickman123/FPS-WEBXR-VIRUS-PURGE",
      color: "#00f0ff",
    },
    {
      id: "visor-xr",
      title: "XR Model Viewer",
      category: "Spatial Computing / 3D Inspection",
      badge: "Spatial Tool",
      technologies: ["Three.js", "WebXR", "Draco Loader", "PBR Materials", "TypeScript"],
      description:
        "Industrial-grade WebXR 3D model inspection station for inspecting complex CAD, architectural, and sculptural assets.",
      longDescription:
        "The XR Model Viewer (Visor XR) delivers an intuitive spatial inspection workstation. Users can load GLTF/GLB models, analyze mesh metrics (vertex count, bounding box, triangle density), manipulate lighting presets, and transition directly from desktop browser into full 1:1 scale immersive VR inspection.",
      highlights: [
        "Automatic model centering, scale normalization, and ground alignment",
        "Integrated Draco geometry decompression for rapid asset streaming",
        "Real-time surface material inspection and wireframe toggle",
      ],
      demoUrl: "https://vickman123.github.io/visor-xr/",
      githubUrl: "https://github.com/Vickman123/visor-xr",
      color: "#10b981",
    },
    {
      id: "simulador-pcpuma",
      title: "PC PUMA Operator Simulator",
      category: "Enterprise Simulation / Training",
      badge: "Operational VR",
      technologies: ["Three.js", "WebGL", "TypeScript", "State Machines", "UI Systems"],
      description:
        "Interactive 3D simulation environment built for training service operators in device lifecycle and ITIL protocols.",
      longDescription:
        "Commissioned to optimize technical training at UNAM, this 3D simulator recreates the operational protocols and troubleshooting scenarios of PC PUMA service centers. Operators interact with virtualized laptops, diagnostic terminals, and customer delivery queues to master standard operating procedures before on-site deployment.",
      highlights: [
        "Recreates physical device handover, diagnostics, and inventory tagging",
        "Reduces onboarding friction for technical operators across campus nodes",
        "Web-accessible with zero software installation required",
      ],
      demoUrl: "https://vickman123.github.io/Simulador-operador-pcpuma/",
      githubUrl: "https://github.com/Vickman123/Simulador-operador-pcpuma",
      color: "#f59e0b",
    },
    {
      id: "space-tech-labs",
      title: "Space Tech Labs Initiatives",
      category: "Aerospace / Innovation",
      badge: "R&D Initiative",
      technologies: ["Orbital Mechanics", "Three.js", "Systems Engineering", "Education"],
      description:
        "Aerospace software R&D hub developing orbital visualizations, space robotics simulations, and educational outreach.",
      longDescription:
        "Space Tech Labs serves as a collaborative incubator uniting aerospace students, engineers, and scientists. Projects include orbital mechanics simulations, satellite constellation trackers, and spatial science demonstrations designed to democratize aerospace concepts for Latin American students.",
      highlights: [
        "Simulated satellite orbits and celestial telemetry visualization",
        "Mentored multi-disciplinary student teams in space systems architecture",
        "Participated in international hackathons and university aerospace forums",
      ],
      color: "#38bdf8",
    },
    {
      id: "aem-enmice",
      title: "Agencia Espacial Mexicana (AEM)",
      category: "National Aerospace Systems",
      badge: "Government / Space",
      technologies: ["Systems Analysis", "Web Architecture", "Data Visualization", "Aerospace"],
      description:
        "Systems analysis and digital platform development for Mexico's National Space Agency initiatives.",
      longDescription:
        "Contributed to systems analysis and platform development for the Agencia Espacial Mexicana, specifically supporting ENMICE (Encuentro Nacional de Medicina Espacial y Ciencias de la Vida en el Espacio) and related digital initiatives. Focused on robust information architecture, scientific content delivery, and mission tracking.",
      highlights: [
        "Conducted systems analysis and stakeholder requirements gathering",
        "Delivered intuitive interfaces for aerospace research conferences",
        "Standardized web architectures for institutional space outreach",
      ],
      color: "#818cf8",
    },
    {
      id: "geogpt",
      title: "GeoGPT & Emerging Concepts",
      category: "AI & Spatial Intelligence",
      badge: "Emerging Tech",
      technologies: ["LLM Integration", "Geospatial Data", "WebGL", "Three.js", "Python"],
      description:
        "Experimental spatial AI concept blending large language model reasoning with 3D geospatial environment exploration.",
      longDescription:
        "An exploratory prototype examining how generative AI and natural language queries can interact with 3D spatial terrain models and satellite telemetry data. Users query spatial concepts in plain language and receive real-time 3D camera waypoints, environmental data overlays, and contextual geographical insights.",
      highlights: [
        "Natural language prompt translation into 3D camera coordinates and spatial markers",
        "Multi-modal geospatial knowledge retrieval and interactive elevation meshes",
        "Pioneering user interface paradigms for spatial artificial intelligence",
      ],
      color: "#a855f7",
    },
  ] as ProjectItem[],

  education: {
    degree: "Licenciatura en Ciencias de la Informática",
    institution: "UPIICSA — Instituto Politécnico Nacional (IPN)",
    period: "2020 – 2024",
    status: "Graduated / Professional Degree",
    description:
      "Comprehensive computer science and information systems engineering curriculum covering advanced data structures, systems architecture, computer networks, database design, software engineering methodologies, and IT service delivery.",
    additionalTraining: [
      "Microcontroller Programming & IoT Systems (ESP32, Arduino, Raspberry Pi)",
      "Robotics, Sensor Interfacing & Real-Time Telemetry Systems",
      "Computer Graphics & 3D Shading Pipeline Fundamentals",
    ],
  },

  certifications: [
    {
      name: "Build Your Own Chatbot",
      issuer: "IBM / Cognitive Class",
      focus: "Natural Language Processing, Watson AI, Conversational Pipelines",
      year: "2022",
    },
    {
      name: "Introduction to Cybersecurity",
      issuer: "Cisco Networking Academy",
      focus: "Network defense, vulnerability assessment, threat landscape",
      year: "2022",
    },
    {
      name: "Cloud Engineer Journey",
      issuer: "Google Cloud / Microsoft Programs",
      focus: "Cloud infrastructure, containerization, microservices deployment",
      year: "2023",
    },
    {
      name: "Alibaba Cloud Certified Associate",
      issuer: "Alibaba Cloud",
      focus: "Cloud Computing, ECS, Serverless Architecture, Global CDN",
      year: "2023",
    },
  ] as CertificationItem[],

  skills: {
    core: ["TypeScript", "Three.js", "WebXR", "WebGL", "VXR Framework", "JavaScript"],
    frontend: ["React", "Vue.js", "Vite", "HTML5 Canvas", "Tailwind CSS", "CSS3 / Sass"],
    backendCloud: ["Node.js", "Python", "Docker", "Express", "REST / WebSockets", "AWS / Cloud"],
    specialties: [
      "Spatial Computing",
      "Interactive 3D Simulation",
      "ITIL Service Operations",
      "Systems Analysis",
      "Performance Optimization",
    ],
  },
};
