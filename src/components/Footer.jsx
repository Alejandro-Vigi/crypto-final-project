export default function Footer({ onVerServicios, onGoHome }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Marca centrada */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 mb-3 mx-auto hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
              </svg>
            </div>
            <span className="font-bold text-white text-xl tracking-tight">
              Feria<span className="text-orange-500">SS</span>
            </span>
          </button>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Plataforma institucional de inscripción a servicio social.
          </p>
        </div>

        {/* Grid de 3 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-t border-zinc-900 text-center">

          {/* Column 1: Plataforma */}
          <div className="flex flex-col items-center">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#como-funciona" className="text-zinc-500 hover:text-white transition-colors">
                  Cómo funciona
                </a>
              </li>
              <li>
                <button
                  onClick={onVerServicios}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  Servicios disponibles
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Seguridad */}
          <div className="flex flex-col items-center">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Seguridad</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#criptografia" className="text-zinc-500 hover:text-white transition-colors">
                  Firma RSA
                </a>
              </li>
              <li>
                <a href="#criptografia" className="text-zinc-500 hover:text-white transition-colors">
                  Verificación de contratos
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contacto & Repositorio */}
          <div className="flex flex-col items-center">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Contacto</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="mailto:adminserviciosocial@gmail.com"
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  adminserviciosocial@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Alejandro-Vigi/crypto-final-project"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  Repositorio GitHub
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-zinc-900 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <span className="text-zinc-600 text-xs font-medium">
            © {year} FeriaSSocial · Todos los derechos reservados
          </span>
          <span className="inline-flex items-center gap-1.5 bg-orange-500/5 border border-orange-500/10 text-orange-400/80 text-xs px-3 py-1.5 rounded-xl font-medium">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-orange-500/60">
              <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.2" />
            </svg>
            Contratos firmados digitalmente con RSA
          </span>
        </div>
      </div>
    </footer>
  );
}