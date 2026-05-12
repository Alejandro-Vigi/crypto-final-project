import { useState, useEffect } from "react";

export default function Navbar({ onOpenAuth }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="navbar__inner">
          {/* Logo */}
          <a href="/" className="navbar__logo">
            <span className="navbar__logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M14 7L21 11V17L14 21L7 17V11L14 7Z" fill="currentColor" opacity="0.3"/>
                <circle cx="14" cy="14" r="2.5" fill="currentColor"/>
              </svg>
            </span>
            <span className="navbar__logo-text">
              Feria<span className="accent">SS</span>
            </span>
          </a>

          {/* Desktop links */}
          <ul className="navbar__links">
            <li><a href="#como-funciona">Cómo funciona</a></li>
            <li><a href="#servicios">Servicios</a></li>
            <li><a href="#empresas">Empresas</a></li>
          </ul>

          {/* CTA */}
          <div className="navbar__actions">
            <button className="btn btn--primary" onClick={onOpenAuth}>
              Acceder
            </button>
            <button
              className={`navbar__burger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}>
        <ul>
          <li><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a></li>
          <li><a href="#servicios" onClick={() => setMenuOpen(false)}>Servicios</a></li>
          <li><a href="#empresas" onClick={() => setMenuOpen(false)}>Empresas</a></li>
          <li>
            <button className="btn btn--primary w-full" onClick={() => { onOpenAuth(); setMenuOpen(false); }}>
              Acceder
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}
