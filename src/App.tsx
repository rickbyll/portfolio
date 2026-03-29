import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Sun,
  Zap,
  Wrench,
  Truck,
  Users,
  ChevronDown,
  Briefcase,
  MapPin,
  Mail,
  Download,
  Phone,
  Calendar,
  Linkedin,
  User,
  Lock,
  X,
  Upload,
  Save,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";
import { skills, experiences, studies } from "./data";

// ============================================
// FUNCIONES DE SEGURIDAD Y VALIDACIÓN
// ============================================

// Sanitizar URLs para evitar javascript: y data:
const sanitizeUrl = (url: string): string => {
  if (!url) return "";
  const trimmed = url.trim().toLowerCase();
  // Bloquear javascript: data: y protocolos maliciosos
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    console.warn("URL maliciosa detectada:", url);
    return "";
  }
  // Debe ser http/https o mailto/tel
  if (!trimmed.match(/^(https?|mailto|tel):/)) {
    // Si no tiene protocolo, asumir https
    return /^https?:\/\//.test(trimmed) ? url : `https://${url}`;
  }
  return url;
};

// Validar email según formato básico
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar teléfono
const isValidPhone = (phone: string): boolean => {
  // Aceptar números, espacios, guiones, paréntesis, +
  return /^[\d\s\-()++]+$/.test(phone) && phone.replace(/\D/g, "").length >= 8;
};

// Sanitizar nombre de archivo para evitar inyección de caminos
const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/\.\./g, "") // Evitar recorrido de directorio
    .replace(/[<>:"|?*]/g, "") // Caracteres inválidos en Windows/Unix
    .substring(0, 255); // Limitar longitud
};

// Validar tamaño de archivo en MB
const isValidFileSize = (file: File, maxMB: number): boolean => {
  return file.size <= maxMB * 1024 * 1024;
};

// Validar que JSON.parse recuperado tenga la estructura correcta
const isValidPortfolioData = (data: any): boolean => {
  return (
    typeof data === "object" &&
    data !== null &&
    (data.heroInfo === undefined || typeof data.heroInfo === "object") &&
    (data.contactInfo === undefined || typeof data.contactInfo === "object") &&
    (data.footerInfo === undefined || typeof data.footerInfo === "object") &&
    (data.appData === undefined || typeof data.appData === "object")
  );
};

// Limitar tamaño total de localStorage
const getLocalStorageSize = (): number => {
  let size = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      size += localStorage[key].length + key.length;
    }
  }
  return Math.round(size / 1024); // Retornar en KB
};

const MAX_STORAGE_KB = 4000; // Límite de 4MB (el usual es 5MB)
const MAX_IMAGE_MB = 2;
const MAX_CV_MB = 10;

const iconMap: Record<string, React.ElementType> = {
  Sun,
  Zap,
  Wrench,
  Truck,
  Users,
};

function SectionHeading({ title }: { title: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center mb-12"
    >
      <ChevronDown className="text-brand w-6 h-6 mb-4" strokeWidth={3} />
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>
    </motion.div>
  );
}

function Badge({ text }: { text: string; key?: React.Key }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-brand/15 text-blue-300 border border-brand/30 shadow-[0_0_10px_rgba(59,130,246,0.15)] backdrop-blur-sm">
      {text}
    </span>
  );
}

export default function App() {
  // --- Estados de Autenticación y Modales ---
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("adminToken");
    const tokenTime = localStorage.getItem("adminTokenTime");
    
    if (!token || !tokenTime) return false;
    
    // Verificar si el token ha expirado
    const expiryDays = parseInt(import.meta.env.VITE_TOKEN_EXPIRY_DAYS || "30");
    const expiryMs = expiryDays * 24 * 60 * 60 * 1000;
    const isExpired = Date.now() - parseInt(tokenTime) > expiryMs;
    
    if (isExpired) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminTokenTime");
      return false;
    }
    
    return true;
  });
  const [loginError, setLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tokenExpiredWarning, setTokenExpiredWarning] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [autoSaveIndicator, setAutoSaveIndicator] = useState(false);

  // Validar token en cada montura
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const tokenTime = localStorage.getItem("adminTokenTime");
    
    if (token && tokenTime) {
      const expiryDays = parseInt(import.meta.env.VITE_TOKEN_EXPIRY_DAYS || "30");
      const expiryMs = expiryDays * 24 * 60 * 60 * 1000;
      const isExpired = Date.now() - parseInt(tokenTime) > expiryMs;
      
      if (isExpired) {
        setTokenExpiredWarning(true);
        setIsAuthenticated(false);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminTokenTime");
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("adminToken", "active");
      localStorage.setItem("adminTokenTime", Date.now().toString());
    } else {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminTokenTime");
    }
  }, [isAuthenticated]);

  // --- Estados de Datos del Portfolio con localStorage ---
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string>("cv.pdf");
  
  const [heroInfo, setHeroInfo] = useState({
    name: "José Ricardo Casdelo Navarro",
    title: "Ayudante de instalador fotovoltaico y Técnico en Electrónica.",
    description: "Experiencia en montaje básico de paneles, apoyo en instalaciones en techos de placa y estructuras en suelo. Perfil proactivo y resolutivo, con alta capacidad de aprendizaje."
  });

  const [contactInfo, setContactInfo] = useState({
    email: "ricardo.casdelo99@gmail.com",
    phone: "614 68 72 73",
    linkedin: "https://linkedin.com/",
    location: "C/ Comunidad Extremeña 9, La Macarena, Sevilla"
  });

  const [footerInfo, setFooterInfo] = useState({
    title: "¿Quieres trabajar conmigo?",
    description: "Incorporación inmediata, movilidad en transporte público y disponibilidad para curso PRL 20h."
  });

  const [appData, setAppData] = useState({
    skills,
    experiences,
    studies
  });

  // --- Cargar datos del localStorage al montar el componente ---
  useEffect(() => {
    const saved = localStorage.getItem("portfolioData");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.heroInfo) setHeroInfo(data.heroInfo);
        if (data.contactInfo) setContactInfo(data.contactInfo);
        if (data.footerInfo) setFooterInfo(data.footerInfo);
        if (data.appData) setAppData(data.appData);
      } catch (e) {
        console.error("Error cargando datos guardados:", e);
      }
    }

    const savedProfilePic = localStorage.getItem("profilePic");
    if (savedProfilePic) {
      setProfilePic(savedProfilePic);
    }

    const savedCvFileName = localStorage.getItem("cvFileName");
    if (savedCvFileName) {
      setCvFileName(savedCvFileName);
    }
  }, []);

  // --- Guardar datos en localStorage cuando cambien ---
  useEffect(() => {
    const dataToSave = {
      heroInfo,
      contactInfo,
      footerInfo,
      appData
    };
    localStorage.setItem("portfolioData", JSON.stringify(dataToSave));
    
    // Mostrar indicador de guardado
    setAutoSaveIndicator(true);
    const timer = setTimeout(() => setAutoSaveIndicator(false), 800);
    return () => clearTimeout(timer);
  }, [heroInfo, contactInfo, footerInfo, appData]);

  useEffect(() => {
    if (profilePic) {
      localStorage.setItem("profilePic", profilePic);
    }
  }, [profilePic]);

  // --- Funciones de Lógica ---
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = username.trim();
    const pass = password.trim();

    const correctUser = import.meta.env.VITE_ADMIN_USER;
    const correctPass = import.meta.env.VITE_ADMIN_PASS;

    if (user === correctUser && pass === correctPass) {
      setIsAuthenticated(true);
      setIsLoginOpen(false);
      setIsAdminOpen(true);
      setLoginError("");
      setUsername("");
      setPassword("");
      setTokenExpiredWarning(false);
    } else {
      setLoginError("Credenciales incorrectas");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        alert("⚠️ Solo se permiten imágenes");
        return;
      }
      
      // Validar tamaño
      if (!isValidFileSize(file, MAX_IMAGE_MB)) {
        alert(`⚠️ La imagen no debe exceder ${MAX_IMAGE_MB}MB`);
        return;
      }
      
      // Validar espacio en localStorage
      if (getLocalStorageSize() > MAX_STORAGE_KB) {
        alert("⚠️ Almacenamiento lleno. Limpia datos antiguos.");
        return;
      }
      
      const url = URL.createObjectURL(file);
      setProfilePic(url);
    }
  };

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (file.type !== "application/pdf") {
        alert("⚠️ Solo se permiten archivos PDF");
        return;
      }
      
      // Validar tamaño
      if (!isValidFileSize(file, MAX_CV_MB)) {
        alert(`⚠️ El CV no debe exceder ${MAX_CV_MB}MB`);
        return;
      }
      
      // Validar espacio en localStorage
      if (getLocalStorageSize() > MAX_STORAGE_KB) {
        alert("⚠️ Almacenamiento lleno. Limpia datos antiguos.");
        return;
      }
      
      // Sanitizar nombre de archivo
      const safeName = sanitizeFileName(file.name);
      
      setCvFile(file);
      setCvFileName(safeName);
      localStorage.setItem("cvFileName", safeName);

      // Guardar el CV como base64 en localStorage
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        localStorage.setItem("cvFileData", base64);
      };
      reader.onerror = () => {
        alert("⚠️ Error al leer el archivo");
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadCV = () => {
    const savedCvData = localStorage.getItem("cvFileData");
    
    if (savedCvData) {
      // Descargar CV cargado por el usuario
      const link = document.createElement('a');
      link.href = savedCvData;
      link.download = cvFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Descargar CV por defecto
      const link = document.createElement('a');
      link.href = '/cv.pdf';
      link.download = 'CV_Jose_Ricardo_Casdelo.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Cargar CV del localStorage o usar el default
  useEffect(() => {
    const savedCvData = localStorage.getItem("cvFileData");
    if (savedCvData) {
      // Convertir base64 de vuelta a File
      fetch(savedCvData)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], cvFileName, { type: 'application/pdf' });
          setCvFile(file);
        })
        .catch(err => console.error("Error cargando CV:", err));
    }
  }, []);

  // Manejador seguro para cambios en contactInfo con validación
  const handleContactInfoChange = (field: string, value: string) => {
    let sanitizedValue = value;
    
    // Validar por campo
    switch (field) {
      case "email":
        if (value && !isValidEmail(value)) {
          console.warn("Email inválido:", value);
        }
        break;
      case "phone":
        if (value && !isValidPhone(value)) {
          console.warn("Teléfono inválido:", value);
        }
        break;
      case "linkedin":
        sanitizedValue = sanitizeUrl(value);
        break;
      case "location":
        // Limitar longitud para evitar ataques de DoS
        sanitizedValue = value.substring(0, 200);
        break;
    }
    
    setContactInfo({ ...contactInfo, [field]: sanitizedValue });
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
    const newExperiences = [...appData.experiences];
    if (field === 'tech') {
      newExperiences[index] = { ...newExperiences[index], tech: value.split(',').map(t => t.trim()) };
    } else {
      newExperiences[index] = { ...newExperiences[index], [field]: value };
    }
    setAppData({ ...appData, experiences: newExperiences });
  };
  const addExperience = () => setAppData({ ...appData, experiences: [...appData.experiences, { role: "", company: "", location: "", date: "", description: "", tech: [] }] });
  const removeExperience = (index: number) => {
    const newExperiences = [...appData.experiences];
    newExperiences.splice(index, 1);
    setAppData({ ...appData, experiences: newExperiences });
  };

  const handleStudyChange = (index: number, field: string, value: string) => {
    const newStudies = [...appData.studies];
    if (field === 'tech') {
      newStudies[index] = { ...newStudies[index], tech: value.split(',').map(t => t.trim()) };
    } else {
      newStudies[index] = { ...newStudies[index], [field]: value };
    }
    setAppData({ ...appData, studies: newStudies });
  };
  const addStudy = () => setAppData({ ...appData, studies: [...appData.studies, { degree: "", institution: "", date: "", description: "", tech: [] }] });
  const removeStudy = (index: number) => {
    const newStudies = [...appData.studies];
    newStudies.splice(index, 1);
    setAppData({ ...appData, studies: newStudies });
  };

  const handleSkillChange = (index: number, field: string, value: string) => {
    const newSkills = [...appData.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setAppData({ ...appData, skills: newSkills });
  };
  const addSkill = () => setAppData({ ...appData, skills: [...appData.skills, { title: "", description: "", icon: "Sun" }] });
  const removeSkill = (index: number) => {
    const newSkills = [...appData.skills];
    newSkills.splice(index, 1);
    setAppData({ ...appData, skills: newSkills });
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white selection:bg-brand/30 selection:text-white pb-24 relative overflow-hidden">
      
      {/* Background Glows for Liquid Glass Effect */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand/20 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none z-0"></div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-bg-dark/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between text-sm font-medium text-zinc-400">
          
          {/* Botón de Perfil / Admin */}
          <button 
            onClick={() => isAuthenticated ? setIsAdminOpen(true) : setIsLoginOpen(true)}
            className="w-10 h-10 rounded-full overflow-hidden border border-white/10 hover:border-brand transition-colors bg-white/5 backdrop-blur-sm flex items-center justify-center group shadow-[0_0_15px_rgba(0,0,0,0.2)]"
            title="Editar Portfolio"
          >
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-zinc-400 group-hover:text-brand transition-colors" />
            )}
          </button>

          <div className="flex items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar">
            <a href="#experiencia" className="hover:text-white whitespace-nowrap transition-colors">Experiencia</a>
            <a href="#habilidades" className="hover:text-white whitespace-nowrap transition-colors">Habilidades</a>
            <a href="#educacion" className="hover:text-white whitespace-nowrap transition-colors">Educación</a>
            <a href="#contacto" className="hover:text-white whitespace-nowrap transition-colors">Contacto</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {profilePic && (
            <img src={profilePic} alt="Profile" className="w-32 h-32 rounded-full object-cover mx-auto mb-8 border-4 border-zinc-800 shadow-xl" />
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            {heroInfo.name}
          </h1>
          <h2 className="text-xl md:text-2xl font-medium text-brand mb-6 max-w-2xl mx-auto leading-relaxed">
            {heroInfo.title}
          </h2>
          <p className="text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {heroInfo.description}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button 
              onClick={downloadCV}
              className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:scale-105 shadow-lg shadow-brand/20 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              Descargar CV
            </button>
            <a 
              href={contactInfo.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-brand/50 hover:text-brand text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              <Linkedin className="w-5 h-5" />
              LinkedIn
            </a>
          </div>
        </motion.div>
      </section>

      {/* Work Experience */}
      <section id="experiencia" className="py-16 px-6 max-w-4xl mx-auto scroll-mt-20">
        <SectionHeading title="Experiencia Laboral" />

        <div className="relative border-l border-zinc-800 ml-4 md:ml-8 space-y-12 mt-12">
          {appData.experiences.map((exp, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative pl-8 md:pl-12"
            >
              {/* Timeline Dot */}
              <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-bg-dark"></span>

              <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/[0.06] hover:border-brand/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] group relative overflow-hidden">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-2 relative z-10">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-brand transition-colors">
                      {exp.role}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {exp.company}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {exp.location}
                      </span>
                      <span className="flex items-center gap-1.5 text-brand/90 font-medium">
                        <Calendar className="w-4 h-4" />
                        {exp.date}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed text-sm md:text-base mb-6">
                  {exp.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {exp.tech.map((tech: string, i: number) => (
                    tech ? <Badge key={i} text={tech} /> : null
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Skills & Tools */}
      <section id="habilidades" className="py-16 px-6 max-w-5xl mx-auto scroll-mt-20">
        <SectionHeading title="Habilidades y Herramientas" />

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {appData.skills.map((skill, index) => {
            const Icon = iconMap[skill.icon] || Sun;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:bg-white/[0.06] hover:border-brand/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] group relative overflow-hidden"
              >
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform shadow-inner relative z-10">
                  <Icon className="w-8 h-8 text-brand drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-brand transition-colors relative z-10">{skill.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm relative z-10">
                  {skill.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Studies */}
      <section id="educacion" className="py-16 px-6 max-w-5xl mx-auto scroll-mt-20">
        <SectionHeading title="Educación" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {appData.studies.map((study, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/[0.06] hover:border-brand/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] group relative overflow-hidden"
            >
              {/* Subtle inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              <div className="relative z-10">
                <h3 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-brand transition-colors">
                  {study.degree}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-4">
                  <span>{study.institution}</span>
                  <span className="flex items-center gap-1.5 text-brand/90 font-medium">
                    <Calendar className="w-4 h-4" />
                    {study.date}
                  </span>
                </div>
                <p className="text-zinc-300 leading-relaxed text-sm mb-6">
                  {study.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {study.tech.map((tech: string, i: number) => (
                    tech ? <Badge key={i} text={tech} /> : null
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section id="contacto" className="py-24 px-6 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {footerInfo.title}
          </h2>
          <p className="text-zinc-400 mb-8">
            {footerInfo.description}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <a 
              href={`mailto:${contactInfo.email}`} 
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:scale-105 shadow-lg shadow-brand/20"
            >
              <Mail className="w-5 h-5" />
              {contactInfo.email}
            </a>
            <a 
              href={`tel:+34${contactInfo.phone.replace(/\s/g, '')}`} 
              className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-brand/50 hover:text-brand text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              <Phone className="w-5 h-5" />
              {contactInfo.phone}
            </a>
          </div>

          <div className="border-t border-zinc-800 pt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <MapPin className="w-4 h-4" />
              <span>{contactInfo.location}</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- MODALES --- */}

      {/* Modal de Login */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-bg-dark/90 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <button onClick={() => { setIsLoginOpen(false); setTokenExpiredWarning(false); }} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Lock className="w-6 h-6 text-brand" /> Acceso Admin
            </h2>
            
            {tokenExpiredWarning && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                <p className="text-yellow-400 text-sm font-medium">⏰ Tu sesión expiró. Por favor, inicia sesión de nuevo.</p>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Usuario</label>
                <input 
                  name="username" 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-colors" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Contraseña</label>
                <input 
                  name="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-colors" 
                  required 
                />
              </div>
              
              {loginError && (
                <div className="p-3 bg-red-900/30 border border-red-600/50 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">❌ {loginError}</p>
                </div>
              )}
              
              <button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-2.5 rounded-lg transition-colors mt-4">
                Ingresar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Administración */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-bg-dark/90 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in duration-200 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <button onClick={() => setIsAdminOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Editar Portfolio</h2>
              <button 
                onClick={() => { setIsAuthenticated(false); setIsAdminOpen(false); }} 
                className="text-sm text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Foto de perfil */}
              <div className="bg-bg-dark p-4 rounded-xl border border-zinc-800">
                <label className="block text-sm font-medium text-zinc-400 mb-4">Foto de Perfil</label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-zinc-500" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-[0_0_10px_rgba(0,0,0,0.1)]">
                    <Upload className="w-4 h-4" /> Subir nueva foto
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {/* Gestión de CV */}
              <div className="bg-bg-dark p-4 rounded-xl border border-zinc-800">
                <label className="block text-sm font-medium text-zinc-400 mb-4">Curriculum Vitae</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm text-zinc-300 mb-3">
                      {cvFile ? (
                        <span>📄 {cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB) - <span className="text-brand font-medium">Personalizado</span></span>
                      ) : (
                        <span className="text-zinc-400">📄 CV por defecto - <span className="text-brand font-medium">Disponible</span></span>
                      )}
                    </div>
                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-[0_0_10px_rgba(0,0,0,0.1)] w-fit">
                      <Upload className="w-4 h-4" /> Cargar o Reemplazar CV
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleCVUpload} />
                    </label>
                  </div>
                  <button 
                    onClick={downloadCV}
                    className="bg-brand hover:bg-brand-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.2)] whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" /> Descargar
                  </button>
                </div>
              </div>

              {/* Textos Principales */}
              <div className="bg-bg-dark p-4 rounded-xl border border-zinc-800 space-y-4">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Información Principal</h3>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Nombre</label>
                  <input 
                    value={heroInfo.name} 
                    onChange={e => setHeroInfo({...heroInfo, name: e.target.value})} 
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Título Profesional</label>
                  <input 
                    value={heroInfo.title} 
                    onChange={e => setHeroInfo({...heroInfo, title: e.target.value})} 
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Descripción</label>
                  <textarea 
                    value={heroInfo.description} 
                    onChange={e => setHeroInfo({...heroInfo, description: e.target.value})} 
                    rows={4} 
                    className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand resize-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                  />
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="bg-bg-dark p-4 rounded-xl border border-zinc-800 space-y-4">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Correo Electrónico</label>
                    <input 
                      value={contactInfo.email} 
                      onChange={e => handleContactInfoChange("email", e.target.value)} 
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                    />
                    {contactInfo.email && !isValidEmail(contactInfo.email) && (
                      <p className="text-yellow-400 text-xs mt-1">⚠️ Email inválido</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Teléfono</label>
                    <input 
                      value={contactInfo.phone} 
                      onChange={e => handleContactInfoChange("phone", e.target.value)} 
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                    />
                    {contactInfo.phone && !isValidPhone(contactInfo.phone) && (
                      <p className="text-yellow-400 text-xs mt-1">⚠️ Teléfono inválido</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">LinkedIn URL</label>
                    <input 
                      value={contactInfo.linkedin} 
                      onChange={e => handleContactInfoChange("linkedin", e.target.value)} 
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Ubicación</label>
                    <input 
                      value={contactInfo.location} 
                      onChange={e => handleContactInfoChange("location", e.target.value)} 
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                    />
                  </div>
                </div>
              </div>

              {/* Llamada a la Acción (Footer) */}
              <div className="bg-bg-dark p-4 rounded-xl border border-zinc-800 space-y-4">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Llamada a la Acción (Footer)</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Título</label>
                    <input 
                      value={footerInfo.title} 
                      onChange={e => setFooterInfo({...footerInfo, title: e.target.value})} 
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Descripción</label>
                    <textarea 
                      value={footerInfo.description} 
                      onChange={e => setFooterInfo({...footerInfo, description: e.target.value})} 
                      rows={2}
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand transition-all duration-300 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] resize-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Experiencia Laboral */}
              <div className="bg-bg-dark p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-zinc-400">Experiencia Laboral</h3>
                  <button onClick={addExperience} className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white px-2 py-1 rounded transition-all duration-300">
                    <Plus className="w-3 h-3" /> Añadir
                  </button>
                </div>
                <div className="space-y-4">
                  {appData.experiences.map((exp, index) => (
                    <div key={index} className="relative bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
                      <button onClick={() => removeExperience(index)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Puesto</label>
                          <input value={exp.role} onChange={e => handleExperienceChange(index, 'role', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Empresa</label>
                          <input value={exp.company} onChange={e => handleExperienceChange(index, 'company', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Ubicación</label>
                          <input value={exp.location} onChange={e => handleExperienceChange(index, 'location', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Fecha</label>
                          <input value={exp.date} onChange={e => handleExperienceChange(index, 'date', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-zinc-500 mb-1">Descripción</label>
                          <textarea value={exp.description} onChange={e => handleExperienceChange(index, 'description', e.target.value)} rows={2} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm resize-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-zinc-500 mb-1">Etiquetas (separadas por coma)</label>
                          <input value={exp.tech.join(', ')} onChange={e => handleExperienceChange(index, 'tech', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Educación */}
              <div className="bg-bg-dark p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-zinc-400">Educación</h3>
                  <button onClick={addStudy} className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white px-2 py-1 rounded transition-all duration-300">
                    <Plus className="w-3 h-3" /> Añadir
                  </button>
                </div>
                <div className="space-y-4">
                  {appData.studies.map((study, index) => (
                    <div key={index} className="relative bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
                      <button onClick={() => removeStudy(index)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Título</label>
                          <input value={study.degree} onChange={e => handleStudyChange(index, 'degree', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Institución</label>
                          <input value={study.institution} onChange={e => handleStudyChange(index, 'institution', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-zinc-500 mb-1">Fecha</label>
                          <input value={study.date} onChange={e => handleStudyChange(index, 'date', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-zinc-500 mb-1">Descripción</label>
                          <textarea value={study.description} onChange={e => handleStudyChange(index, 'description', e.target.value)} rows={2} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm resize-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-zinc-500 mb-1">Etiquetas (separadas por coma)</label>
                          <input value={study.tech.join(', ')} onChange={e => handleStudyChange(index, 'tech', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Habilidades */}
              <div className="bg-bg-dark p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-zinc-400">Habilidades</h3>
                  <button onClick={addSkill} className="text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white px-2 py-1 rounded transition-all duration-300">
                    <Plus className="w-3 h-3" /> Añadir
                  </button>
                </div>
                <div className="space-y-4">
                  {appData.skills.map((skill, index) => (
                    <div key={index} className="relative bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
                      <button onClick={() => removeSkill(index)} className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 gap-4 mt-2">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Título</label>
                          <input value={skill.title} onChange={e => handleSkillChange(index, 'title', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Icono (Sun, Zap, Wrench, Truck, Users)</label>
                          <input value={skill.icon} onChange={e => handleSkillChange(index, 'icon', e.target.value)} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Descripción</label>
                          <textarea value={skill.description} onChange={e => handleSkillChange(index, 'description', e.target.value)} rows={2} className="w-full bg-bg-dark border border-zinc-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-brand text-sm resize-none" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setIsAdminOpen(false)} 
                className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-brand/20 relative"
              >
                <Save className="w-5 h-5" /> Guardar y Cerrar
                
                {/* Indicador de guardado automático */}
                {autoSaveIndicator && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-4 flex items-center gap-1 text-xs bg-green-500/20 px-2 py-1 rounded text-green-300"
                  >
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    Guardado
                  </motion.div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
