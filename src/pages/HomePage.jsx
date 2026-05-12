import { useRef, useEffect } from "react";

const steps = [
  {
    num: "01",
    title: "Regístrate como alumno",
    desc: "Crea tu cuenta con tu matrícula y correo institucional. Tus datos quedan resguardados de forma segura.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="9" r="5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 24c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "02",
    title: "Explora la feria",
    desc: "Visita el catálogo de empresas participantes y los servicios sociales que ofrecen.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
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
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M5 14h18M15 6l8 8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: "04",
    title: "Firma tu contrato",
    desc: "Genera tu par de llaves RSA y firma digitalmente el contrato. La empresa valida tu firma con tu clave pública.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M8 20L4 24l4-1 12-12-3-3L8 20z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M18 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const stats = [
  { value: "RSA-2048", label: "Algoritmo de firma" },
  { value: "100%", label: "Contratos verificables" },
  { value: "SHA-256", label: "Hash del contrato" },
  { value: "PKCS#1", label: "Estándar de clave" },
];

export default function HomePage({ onOpenAuth }) {
  const heroRef = useRef(null);

  useEffect(() => {
    // Staggered reveal on mount
    const items = heroRef.current?.querySelectorAll(".reveal");
    items?.forEach((el, i) => {
      el.style.animationDelay = `${i * 0.15}s`;
      el.classList.add("reveal--active");
    });
  }, []);

  return (
    <main className="home">
      {/* === HERO === */}
      <section className="hero" ref={heroRef}>
        <div className="hero__bg-grid" aria-hidden="true" />
        <div className="hero__glow" aria-hidden="true" />

        <div className="hero__content">
          <span className="hero__eyebrow reveal">
            <span className="dot" /> Plataforma institucional de Servicio Social
          </span>
          <h1 className="hero__title reveal">
            Inscribe tu<br />
            <span className="accent">Servicio Social</span><br />
            con firma digital
          </h1>
          <p className="hero__sub reveal">
            Visita la feria, elige tu empresa y firma tu contrato de manera segura
            usando criptografía de clave pública. Todo en un solo lugar.
          </p>
          <div className="hero__actions reveal">
            <button className="btn btn--primary btn--lg" onClick={onOpenAuth}>
              Comenzar ahora
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <a href="#como-funciona" className="btn btn--ghost btn--lg">
              Ver cómo funciona
            </a>
          </div>
        </div>

        {/* === FIN HERO === */}
      </section>

      {/* === STATS BAR === */}
      <section className="stats-bar">
        {stats.map((s) => (
          <div key={s.label} className="stats-bar__item">
            <span className="stats-bar__val">{s.value}</span>
            <span className="stats-bar__label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* === CÓMO FUNCIONA === */}
      <section className="section" id="como-funciona">
        <div className="section__header">
          <span className="section__tag">Proceso</span>
          <h2>¿Cómo funciona?</h2>
          <p>Cuatro pasos para inscribirte a tu servicio social de forma segura y verificable.</p>
        </div>

        <div className="steps">
          {steps.map((s, i) => (
            <div className="step" key={i}>
              <div className="step__num">{s.num}</div>
              <div className="step__icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < steps.length - 1 && <div className="step__arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* === SEGURIDAD === */}
      <section className="section section--dark" id="servicios">
        <div className="section__header">
          <span className="section__tag">Criptografía</span>
          <h2>Tu contrato, blindado</h2>
          <p>Usamos RSA para garantizar que solo tú puedes firmar tu contrato y que cualquiera puede verificarlo.</p>
        </div>

        <div className="crypto-grid">
          <div className="crypto-card">
            <div className="crypto-card__icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="8" y="14" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 14V10a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="16" cy="20" r="2" fill="currentColor"/>
              </svg>
            </div>
            <h3>Clave privada</h3>
            <p>Solo tú tienes tu clave privada. Se genera en tu dispositivo y nunca se sube a nuestros servidores.</p>
          </div>
          <div className="crypto-card">
            <div className="crypto-card__icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16 10v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Clave pública</h3>
            <p>Tu clave pública queda registrada en la plataforma y permite que la empresa verifique tu firma en cualquier momento.</p>
          </div>
          <div className="crypto-card">
            <div className="crypto-card__icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 16l6 6 14-14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Verificación</h3>
            <p>La empresa y los administradores pueden verificar la autenticidad del contrato con un clic, sin depender de papel.</p>
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="cta-section">
        <div className="cta-section__glow" aria-hidden="true" />
        <h2>¿Listo para inscribirte?</h2>
        <p>Regístrate, elige tu servicio social y firma tu contrato en minutos.</p>
        <button className="btn btn--primary btn--lg" onClick={onOpenAuth}>
          Crear mi cuenta
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>
    </main>
  );
}