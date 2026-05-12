export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* Marca centrada arriba */}
        <div className="footer__brand">
          <span className="footer__logo">
            Feria<span className="accent">SS</span>
          </span>
          <p>Plataforma de inscripción a servicio social mediante criptografía de clave pública.</p>
        </div>

        {/* 3 columnas abajo */}
        <div className="footer__cols">
          <div className="footer__col">
            <h4>Plataforma</h4>
            <ul>
              <li><a href="#como-funciona">Cómo funciona</a></li>
              <li><a href="#servicios">Servicios disponibles</a></li>
              <li><a href="#empresas">Empresas participantes</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Seguridad</h4>
            <ul>
              <li><a href="#">Firma RSA</a></li>
              <li><a href="#">Verificación de contratos</a></li>
              <li><a href="#">Política de privacidad</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Soporte</h4>
            <ul>
              <li><a href="#">Contacto</a></li>
              <li><a href="#">Registrar empresa</a></li>
              <li><a href="#">Preguntas frecuentes</a></li>
            </ul>
          </div>
        </div>

      </div>

      <div className="footer__bottom">
        <span>© {year} FeriaSSocial — Todos los derechos reservados</span>
        <span className="footer__badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.3"/>
          </svg>
          Contratos firmados digitalmente con RSA
        </span>
      </div>
    </footer>
  );
}