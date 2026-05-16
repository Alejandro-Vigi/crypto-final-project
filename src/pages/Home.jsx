import { useRef, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const steps = [
  {
    num: "01",
    title: "Regístrate como alumno",
    desc: "Crea tu cuenta con tu número de cuenta y correo. Tus datos quedan resguardados de forma segura.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-orange-400">
        <circle cx="14" cy="9" r="5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "02",
    title: "Explora la feria",
    desc: "Visita el catálogo de instituciones participantes y los servicios sociales que ofrecen.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-orange-400">
        <rect x="3" y="6" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 11h22" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    num: "03",
    title: "Solicita tu inscripción",
    desc: "Elige el servicio social que te interesa y envía tu solicitud directamente desde la plataforma.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-orange-400">
        <path d="M5 14h18M15 6l8 8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: "04",
    title: "Firma tu contrato",
    desc: "Genera tu par de llaves RSA y firma digitalmente el contrato.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-orange-400">
        <path d="M8 20L4 24l4-1 12-12-3-3L8 20z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M18 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Home({ onAcceder, onVerServicios, user }) {
  // Stats ahora viene de instituciones únicas (el backend ya lo calcula bien)
  const [stats, setStats] = useState({ empresas: 0, vacantes: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/estadisticas")
      .then((res) => res.json())
      .then((data) => setStats({ empresas: data.empresas, vacantes: data.vacantes }))
      .catch(() => {});

    const heroElements = heroRef.current?.querySelectorAll(".animate-hero-item");
    heroElements?.forEach((el, i) => {
      setTimeout(() => {
        el.classList.remove("opacity-0", "translate-y-4");
        el.classList.add("opacity-100", "translate-y-0");
      }, i * 150);
    });

    const scrollElements = document.querySelectorAll(".animate-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-8");
            entry.target.classList.add("opacity-100", "translate-y-0");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    scrollElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const accionLabel = user ? `Ir a mi panel →` : "Comenzar ahora →";

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col text-zinc-300 overflow-x-hidden">
      <Navbar user={user} onAcceder={onAcceder} onGoHome={() => {}} activePage="" setActivePage={() => {}} />

      {/* === HERO === */}
      <section className="flex-1 relative overflow-hidden pt-16" ref={heroRef}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-125 bg-orange-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-100 h-100 bg-orange-600/5 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-hero-item opacity-0 translate-y-4 transition-all duration-700 ease-out inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              Plataforma institucional de Servicio Social
            </div>

            <h1 className="animate-hero-item opacity-0 translate-y-4 transition-all duration-700 ease-out text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              Tu Servicio Social,{" "}
              <span className="text-orange-500 block sm:inline">firmado y seguro.</span>
            </h1>

            <p className="animate-hero-item opacity-0 translate-y-4 transition-all duration-700 ease-out text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Visita la feria, elige tu institución y firma tu contrato de manera segura. Todo en un solo lugar.
            </p>

            <div className="animate-hero-item opacity-0 translate-y-4 transition-all duration-700 ease-out flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onAcceder}
                className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold px-8 py-4 rounded-xl text-base transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/20"
              >
                {accionLabel}
              </button>
              <a
                href="#como-funciona"
                className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium px-8 py-4 rounded-xl text-base transition-all duration-200"
              >
                ¿Cómo funciona?
              </a>
            </div>
          </div>

          {/* Estadísticas — ahora refleja instituciones únicas desde el backend */}
          <div className="animate-hero-item opacity-0 translate-y-4 transition-all duration-700 ease-out mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { n: `${stats.empresas}+`, label: "Instituciones participantes" },
              { n: `${stats.vacantes}+`, label: "Lugares disponibles" },
              { n: "RSA", label: "Firma criptográfica" },
              { n: "100%", label: "Digital y seguro" },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-orange-400 font-black text-2xl tracking-tight">{s.n}</p>
                <p className="text-zinc-500 text-xs mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CÓMO FUNCIONA === */}
      <section id="como-funciona" className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000 ease-out bg-zinc-900/40 border-y border-zinc-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block font-mono text-xs uppercase tracking-widest text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full mb-3">
              Proceso
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">¿Cómo funciona?</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
              Cuatro pasos para inscribirte a tu servicio social de forma segura y verificable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group flex flex-col items-center text-center">
                <span className="font-mono text-xs font-black text-zinc-700 mb-3 block">{s.num}</span>
                <div className="w-14 h-14 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-all duration-300 shrink-0 mx-auto">
                  {s.icon}
                </div>
                <h3 className="text-white font-bold text-base mb-2 group-hover:text-orange-400 transition-colors">{s.title}</h3>
                <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CRIPTOGRAFÍA === */}
      <section id="criptografia" className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000 ease-out py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block font-mono text-xs uppercase tracking-widest text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full mb-3">
              Criptografía
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Tu contrato, blindado</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
              Usamos RSA para garantizar que solo tú puedes firmar tu contrato de forma segura.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center flex flex-col items-center hover:border-orange-500/20 transition-all">
              <div className="w-14 h-14 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center text-orange-400 mb-4 mx-auto">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="8" y="14" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 14V10a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="16" cy="20" r="2" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="text-white font-bold text-base mb-2">Llave privada</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Solo tú tienes tu llave privada. Se genera en tu dispositivo y nunca se sube a nuestros servidores.</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center flex flex-col items-center hover:border-orange-500/20 transition-all">
              <div className="w-14 h-14 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center text-orange-400 mb-4 mx-auto">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M16 10v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-white font-bold text-base mb-2">Llave pública</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">Tu llave pública queda registrada en la plataforma y permite que la institución y los administradores verifiquen tu firma en cualquier momento.</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 text-center flex flex-col items-center hover:border-orange-500/20 transition-all">
              <div className="w-14 h-14 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center text-orange-400 mb-4 mx-auto">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M6 16l6 6 14-14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-white font-bold text-base mb-2">Verificación</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">La institución y los administradores pueden verificar la autenticidad del contrato con un clic, sin depender de papel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* === CTA FINAL === */}
      <section className="animate-on-scroll opacity-0 translate-y-8 transition-all duration-1000 ease-out py-20 border-t border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-orange-500/30 to-transparent" />
        </div>
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-black text-white mb-4">¿Listo para inscribirte?</h2>
          <p className="text-zinc-400 mb-8 text-sm sm:text-base">Regístrate, elige tu servicio social y firma tu contrato en minutos.</p>
          <button
            onClick={onAcceder}
            className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold px-10 py-4 rounded-xl text-base transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/20"
          >
            {user ? "Ir a mi panel →" : "Crear mi cuenta →"}
          </button>
        </div>
      </section>

      <Footer onVerServicios={onVerServicios} onGoHome={() => {}} />
    </div>
  );
}