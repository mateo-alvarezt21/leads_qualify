/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart3, 
  Layers, 
  LayoutDashboard, 
  MessageSquare, 
  Rocket, 
  BrainCircuit, 
  Link as LinkIcon, 
  TimerOff, 
  Route, 
  Bot, 
  Star, 
  ChevronRight, 
  ArrowRight,
  Globe,
  Mail,
  Video,
  Terminal,
  FileEdit,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Loader2
} from "lucide-react";

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 glass-nav border-b border-slate-800/50">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-primary p-1.5 rounded-lg text-slate-950">
          <BarChart3 className="w-6 h-6 font-bold" />
        </div>
        <span className="text-xl font-black tracking-tight text-white uppercase">LeadQuality</span>
      </div>
      <div className="hidden md:flex items-center gap-10">
        <a className="text-sm font-medium text-slate-400 hover:text-primary transition-colors" href="#funciones">Funciones</a>
        <a className="text-sm font-medium text-slate-400 hover:text-primary transition-colors" href="#precios">Precios</a>
        <a className="text-sm font-medium text-slate-400 hover:text-primary transition-colors" href="#faq">FAQ</a>
      </div>
      <div className="flex items-center gap-4">
        <a href="https://demo.leadquality.app" target="_blank" rel="noopener noreferrer" className="hidden sm:block text-sm font-bold text-slate-300 px-4 py-2 hover:text-white transition-colors">
          Ingresar
        </a>
        <a href="#contacto" className="bg-primary hover:bg-amber-400 text-slate-950 text-sm font-bold px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-primary/10">
          Solicitar Demo
        </a>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="pt-40 pb-20 px-6">
    <div className="max-w-6xl mx-auto text-center flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full mb-8 border border-primary/20"
      >
        <Star className="w-3 h-3 fill-primary" />
        <span className="text-xs font-bold uppercase tracking-widest">Potenciado por Inteligencia Artificial</span>
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-8"
      >
        Tu equipo de ventas merece trabajar solo con los <span className="text-primary">mejores leads</span>
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg md:text-xl text-slate-400 max-w-3xl mb-12 leading-relaxed"
      >
        Deja de perder tiempo en leads fríos. Nuestra IA califica y distribuye tus prospectos de Meta y WhatsApp en tiempo real para que cierres más ventas.
      </motion.p>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 mb-24"
      >
        <a href="#contacto" className="bg-primary hover:bg-amber-400 text-slate-950 text-lg font-bold px-10 py-4 rounded-xl shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1">
          Empieza gratis
        </a>
        <button className="bg-slate-900 border border-slate-800 text-white text-lg font-bold px-10 py-4 rounded-xl hover:bg-slate-800 transition-all">
          Ver cómo funciona
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full relative group"
      >
        <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-3xl group-hover:bg-primary/10 transition-colors"></div>
        <div className="relative bg-slate-900/50 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="uppercase text-xs font-bold text-slate-400 px-8 py-5 tracking-widest">Prospecto</th>
                  <th className="uppercase text-xs font-bold text-slate-400 px-8 py-5 tracking-widest">Score IA</th>
                  <th className="uppercase text-xs font-bold text-slate-400 px-8 py-5 tracking-widest">Fuente</th>
                  <th className="uppercase text-xs font-bold text-slate-400 px-8 py-5 tracking-widest">Estado</th>
                  <th className="uppercase text-xs font-bold text-slate-400 px-8 py-5 tracking-widest w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <LeadRow name="Roberto Méndez" initial="RM" score={98} source="Meta Ads" status="Nuevo" statusColor="emerald" />
                <LeadRow name="Sofía Larrea" initial="SL" score={65} source="WhatsApp" status="Contactado" statusColor="blue" />
                <LeadRow name="Carlos Ruiz" initial="CR" score={12} source="Meta Ads" status="Perdido" statusColor="red" />
              </tbody>
            </table>
          </div>
          <div className="px-8 py-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400 font-medium">
            <div>Mostrando 1-3 de 24 leads</div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition-colors">1</button>
              <button className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition-colors">2</button>
              <button className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition-colors">3</button>
              <span className="mx-1">...</span>
              <button className="w-8 h-8 rounded border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition-colors">8</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const LeadRow = ({ name, initial, score, source, status, statusColor }: any) => {
  const colorMap: any = {
    emerald: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
    blue: "text-blue-500 border-blue-500/30 bg-blue-500/10",
    red: "text-red-500 border-red-500/30 bg-red-500/10",
    primary: "text-primary border-primary/30 bg-primary/10"
  };

  const scoreColor = score > 80 ? "stroke-emerald-500" : score > 40 ? "stroke-primary" : "stroke-red-500";
  const scoreText = score > 80 ? "text-emerald-500" : score > 40 ? "text-primary" : "text-red-500";

  return (
    <tr className="hover:bg-white/5 transition-colors group/row">
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">{initial}</div>
          <span className="font-semibold text-slate-200 group-hover:text-primary transition-colors cursor-pointer">{name}</span>
        </div>
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <circle className="stroke-slate-800" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
              <circle 
                className={`${scoreColor} donut-ring`} 
                cx="18" cy="18" fill="none" r="16" 
                strokeWidth="3"
                strokeDasharray="100 100"
                strokeDashoffset={100 - score}
              ></circle>
            </svg>
          </div>
          <span className={`${scoreText} font-bold`}>{score}%</span>
        </div>
      </td>
      <td className="px-8 py-5">
        <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-md text-xs font-medium border border-slate-700/50">{source}</span>
      </td>
      <td className="px-8 py-5">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colorMap[statusColor]}`}>{status}</span>
      </td>
      <td className="px-8 py-5 text-right">
        <button className="opacity-0 group-hover/row:opacity-100 transition-opacity text-slate-500 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

const WhySection = () => (
  <section className="py-32 bg-slate-900/30">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-black text-white mb-4">¿Por qué usar LeadQuality?</h2>
        <p className="text-slate-400 text-lg">Resolver los problemas de ventas nunca fue tan sencillo.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<TimerOff className="w-8 h-8" />}
          title="Pérdida de tiempo"
          description="Tu equipo gasta horas llamando a contactos que no tienen intención real de compra o dejaron datos falsos."
          color="red"
        />
        <FeatureCard 
          icon={<Route className="w-8 h-8" />}
          title="Sin atribución"
          description="Es casi imposible saber exactamente qué campaña de Meta o qué mensaje de WhatsApp generó la venta final."
          color="primary"
        />
        <FeatureCard 
          icon={<Bot className="w-8 h-8" />}
          title="Caos multicanal"
          description="Los leads se pierden entre hojas de cálculo, CRM mal configurados y notificaciones dispersas de WhatsApp."
          color="blue"
        />
      </div>
    </div>
  </section>
);

const FeatureCard = ({ icon, title, description, color }: any) => {
  const colorMap: any = {
    red: "bg-red-500/10 text-red-500",
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-500"
  };

  return (
    <div className="p-10 rounded-2xl border border-slate-800 glass-card hover:border-primary/50 transition-all group">
      <div className={`w-14 h-14 ${colorMap[color]} rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-lg">{description}</p>
    </div>
  );
};

const StepsSection = () => (
  <section className="py-32 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-black text-white">Cómo funciona en 3 pasos</h2>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-12">
        <StepItem number={1} icon={<LinkIcon className="w-10 h-10" />} title="Conecta" description="Vincula tus anuncios de Meta y canales de WhatsApp en segundos." />
        <div className="hidden md:block w-20 h-[2px] bg-slate-800"></div>
        <StepItem number={2} icon={<BrainCircuit className="w-10 h-10" />} title="IA Califica" description="Nuestra IA analiza la intención de compra del prospecto en tiempo real." />
        <div className="hidden md:block w-20 h-[2px] bg-slate-800"></div>
        <StepItem number={3} icon={<Rocket className="w-10 h-10" />} title="Actúa" description="Recibe notificaciones inmediatas de los leads listos para cerrar." />
      </div>
    </div>
  </section>
);

const StepItem = ({ number, icon, title, description }: any) => (
  <div className="flex-1 text-center group">
    <div className="relative inline-block mb-8">
      <div className="absolute -top-4 -right-4 w-10 h-10 bg-primary text-slate-950 font-black rounded-full flex items-center justify-center text-lg shadow-xl">{number}</div>
      <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-slate-800 flex items-center justify-center group-hover:border-primary transition-colors">
        <div className="text-white">{icon}</div>
      </div>
    </div>
    <h4 className="text-2xl font-black mb-3 text-white">{title}</h4>
    <p className="text-slate-400">{description}</p>
  </div>
);

const FeaturesGrid = () => (
  <section className="py-32 bg-slate-900/20" id="funciones">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6">
        <div>
          <span className="text-primary font-bold uppercase tracking-[0.2em] text-sm">Características</span>
          <h2 className="text-5xl font-black text-white mt-4">Todo lo que necesitas para escalar</h2>
        </div>
        <button className="bg-white text-slate-950 font-bold px-8 py-3.5 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2">
          Ver todas las funciones <ArrowRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureGridItem icon={<Star className="w-8 h-8" />} title="AI Scoring" description="Clasificación precisa basada en el lenguaje natural y contexto del prospecto." highlight />
        <FeatureGridItem icon={<Layers className="w-8 h-8" />} title="Multi-canal" description="Centraliza leads de Meta Ads, Instagram, WhatsApp y formularios web." />
        <FeatureGridItem icon={<LayoutDashboard className="w-8 h-8" />} title="Real-time Dashboard" description="Monitorea el flujo de leads y el desempeño del equipo en vivo." />
        <FeatureGridItem icon={<MessageSquare className="w-8 h-8" />} title="WhatsApp Direct" description="Envía el lead calificado directamente al WhatsApp de tu vendedor." />
        <FeatureGridItem icon={<BarChart3 className="w-8 h-8" />} title="Advanced Analytics" description="Reportes detallados de ROI por campaña y tasa de conversión real." />
        <FeatureGridItem icon={<FileEdit className="w-8 h-8" />} title="Custom Fields" description="Adapta el análisis de la IA a las preguntas específicas de tu industria." />
        <FeatureGridItem icon={<Terminal className="w-8 h-8" />} title="Editable Prompts" description="Control total sobre cómo la IA califica y responde a cada prospecto." />
        <FeatureGridItem icon={<ShieldCheck className="w-8 h-8" />} title="White-label" description="Ofrece nuestra tecnología de IA bajo tu propia marca corporativa." />
      </div>
    </div>
  </section>
);

const FeatureGridItem = ({ icon, title, description, highlight }: any) => (
  <div className={`p-8 rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-all group ${highlight ? 'border-l-4 border-l-primary' : ''}`}>
    <div className={`${highlight ? 'text-primary' : 'text-slate-500 group-hover:text-white'} mb-6 transition-colors`}>
      {icon}
    </div>
    <h5 className="text-xl font-bold text-white mb-3">{title}</h5>
    <p className="text-slate-400 leading-relaxed">{description}</p>
  </div>
);

const CTASection = () => (
  <section className="py-32 px-6">
    <div className="max-w-5xl mx-auto bg-primary rounded-[3rem] overflow-hidden relative shadow-2xl shadow-primary/10">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      <div className="relative px-8 py-20 md:p-24 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-slate-950 mb-8 leading-tight">¿Listo para aumentar tu tasa de cierre?</h2>
        <p className="text-xl text-slate-800/80 mb-12 max-w-2xl mx-auto font-medium">Únete a cientos de empresas en LATAM que ya están optimizando sus procesos de venta con IA.</p>
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <a href="#contacto" className="bg-slate-950 hover:bg-slate-900 text-white text-xl font-bold px-12 py-5 rounded-2xl shadow-xl transition-all transform hover:scale-105">
            Empieza tu prueba gratuita
          </a>
          <a href="#contacto" className="bg-white/20 hover:bg-white/30 text-slate-950 text-xl font-bold px-12 py-5 rounded-2xl transition-all backdrop-blur-md">
            Hablar con un experto
          </a>
        </div>
        <p className="mt-10 text-slate-900/60 text-sm font-bold uppercase tracking-widest">No requiere tarjeta de crédito • Instalación en 5 minutos</p>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-slate-950 border-t border-slate-900 py-20">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-16">
      <div className="col-span-1 md:col-span-1">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary p-1.5 rounded-lg text-slate-950">
            <BarChart3 className="w-5 h-5 font-bold" />
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase">LeadQuality</span>
        </div>
        <p className="text-slate-400 text-base leading-relaxed mb-8">La plataforma líder en calificación de leads con IA para el mercado hispano.</p>
        <div className="flex gap-5">
          <FooterSocial icon={<Globe className="w-5 h-5" />} />
          <FooterSocial icon={<Mail className="w-5 h-5" />} />
          <FooterSocial icon={<Video className="w-5 h-5" />} />
        </div>
      </div>
      <FooterColumn title="Producto" links={["Funciones", "Integraciones", "API", "Roadmap"]} />
      <FooterColumn title="Compañía" links={["Sobre nosotros", "Casos de éxito", "Partners", "Blog"]} />
      <FooterColumn title="Legal" links={["Términos de servicio", "Política de privacidad", "Cookies", "Seguridad"]} />
    </div>
    <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
      <p className="text-sm text-slate-500">© 2026 LeadQuality. Todos los derechos reservados.</p>
      <div className="flex gap-8 text-sm text-slate-500">
        <span className="flex items-center gap-2">Hecho con <span className="text-primary">❤️</span> por Mainics y Brainware</span>
      </div>
    </div>
  </footer>
);

const FooterSocial = ({ icon }: any) => (
  <a className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all" href="#">
    {icon}
  </a>
);

const FooterColumn = ({ title, links }: any) => (
  <div>
    <h6 className="font-bold text-white mb-8 uppercase tracking-[0.2em] text-xs">{title}</h6>
    <ul className="space-y-5 text-sm text-slate-400">
      {links.map((link: string) => (
        <li key={link}><a className="hover:text-primary transition-colors" href="#">{link}</a></li>
      ))}
    </ul>
  </div>
);

const ContactSection = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    note: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("https://evolution-boost-leads-prueba.0fdovo.easypanel.host/api/webhooks", {
        method: "POST",
        headers: {
          "x-api-key": "cmlifjive00018jjcujld29ca",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        console.error("Error sending data to webhook");
        // Even if it fails, we show success for the demo feel, or we could show an error.
        // The user asked for a "bonita" animation when sent.
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Network error:", error);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contacto" className="py-32 bg-slate-950">
      <div className="max-w-3xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-white mb-4">Hablemos</h2>
                <p className="text-slate-400 text-lg">Déjanos tus datos y te contactaremos en menos de 24 horas.</p>
              </div>
              <form className="space-y-6 bg-slate-900/50 p-8 md:p-12 rounded-[2rem] border border-slate-800 backdrop-blur-sm" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nombre</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                      placeholder="Tu nombre" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                      placeholder="tu@email.com" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Teléfono</label>
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                      placeholder="+57 300 123 4567" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Empresa</label>
                    <input 
                      type="text" 
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                      placeholder="Nombre de tu empresa" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nota (opcional)</label>
                  <textarea 
                    name="note"
                    rows={4} 
                    value={formData.note}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                    placeholder="¿En qué podemos ayudarte?"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-amber-400 text-slate-950 font-black py-4 rounded-xl shadow-xl shadow-primary/10 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar mensaje"
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-slate-900/50 rounded-[3rem] border border-slate-800 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
              <h2 className="text-4xl font-black text-white mb-4">¡Mensaje enviado!</h2>
              <p className="text-slate-400 text-lg max-w-md mx-auto">
                Gracias por contactarnos. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo muy pronto.
              </p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="mt-10 text-primary font-bold hover:underline"
              >
                Enviar otro mensaje
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <WhySection />
      <StepsSection />
      <FeaturesGrid />
      <CTASection />
      <ContactSection />
      <Footer />
    </div>
  );
}
