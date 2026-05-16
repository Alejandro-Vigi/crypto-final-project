import { useState } from "react";

export default function Navbar({ user, onAcceder, onLogout, onGoHome, activePage, setActivePage, onEditarPerfil }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogoClick = () => {
    if (user) {
      setActivePage(user.tipo === "alumno" ? "catalogo" : "dashboard");
    } else {
      onGoHome();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Feria<span className="text-orange-500">SS</span>
          </span>
        </button>

        {/* Desktop nav links */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            {user.tipo === "alumno" && (
              <>
                <NavBtn active={activePage === "catalogo"} onClick={() => setActivePage("catalogo")}>Catálogo</NavBtn>
                <NavBtn active={activePage === "firma"} onClick={() => setActivePage("firma")}>Mi Firma</NavBtn>
              </>
            )}
            {user.tipo === "admin" && (
              <>
                <NavBtn active={activePage === "dashboard"} onClick={() => setActivePage("dashboard")}>Dashboard</NavBtn>
                <NavBtn active={activePage === "servicios"} onClick={() => setActivePage("servicios")}>Servicios Sociales</NavBtn>
                <NavBtn active={activePage === "verificacion"} onClick={() => setActivePage("verificacion")}>Verificación</NavBtn>
              </>
            )}
            {user.tipo === "empresa" && (
              <>
                <NavBtn active={activePage === "dashboard"} onClick={() => setActivePage("dashboard")}>Dashboard</NavBtn>
                <NavBtn active={activePage === "verificacion"} onClick={() => setActivePage("verificacion")}>Verificación</NavBtn>
              </>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!user ? (
            <button
              onClick={onAcceder}
              className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-semibold px-5 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105"
            >
              Acceder
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl px-3 py-2 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-zinc-950">
                  {user.nombre?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-white text-sm">{user.nombre}</span>
                  <span className="text-zinc-500 text-xs capitalize">{user.tipo}</span>
                </div>
                <svg
                  className={`w-4 h-4 text-zinc-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-white text-sm font-medium">{user.nombre}</p>
                    <p className="text-zinc-400 text-xs capitalize">{user.tipo}</p>
                  </div>
                  {onEditarPerfil && (
                    <button
                      onClick={() => { setProfileOpen(false); onEditarPerfil(); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar mis datos
                    </button>
                  )}
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button
              className="md:hidden text-zinc-400 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && user && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-800 px-4 pb-4 pt-2 space-y-1">
          {user.tipo === "alumno" && (
            <>
              <MobileNavBtn onClick={() => { setActivePage("catalogo"); setMenuOpen(false); }}>Catálogo</MobileNavBtn>
              <MobileNavBtn onClick={() => { setActivePage("firma"); setMenuOpen(false); }}>Mi Firma RSA</MobileNavBtn>
            </>
          )}
          {user.tipo === "admin" && (
            <>
              <MobileNavBtn onClick={() => { setActivePage("dashboard"); setMenuOpen(false); }}>Dashboard</MobileNavBtn>
              <MobileNavBtn onClick={() => { setActivePage("servicios"); setMenuOpen(false); }}>Servicios Sociales</MobileNavBtn>
              <MobileNavBtn onClick={() => { setActivePage("verificacion"); setMenuOpen(false); }}>Verificación</MobileNavBtn>
            </>
          )}
          {user.tipo === "empresa" && (
            <>
              <MobileNavBtn onClick={() => { setActivePage("dashboard"); setMenuOpen(false); }}>Dashboard</MobileNavBtn>
              <MobileNavBtn onClick={() => { setActivePage("verificacion"); setMenuOpen(false); }}>Verificación</MobileNavBtn>
            </>
          )}
          {onEditarPerfil && (
            <MobileNavBtn onClick={() => { setMenuOpen(false); onEditarPerfil(); }}>Editar mis datos</MobileNavBtn>
          )}
        </div>
      )}
    </nav>
  );
}

function NavBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-orange-500/20 text-orange-400"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-zinc-300 hover:text-white py-2.5 px-3 rounded-lg hover:bg-zinc-800 text-sm transition-colors"
    >
      {children}
    </button>
  );
}