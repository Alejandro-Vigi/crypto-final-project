import { useState, useEffect } from "react";

const CARRERAS = [
  "Ingeniería Aeroespacial",
  "Ingeniería Ambiental",
  "Ingeniería Civil",
  "Ingeniería de Minas y Metalurgia",
  "Ingeniería Eléctrica Electrónica",
  "Ingeniería Geofísica",
  "Ingeniería Geológica",
  "Ingeniería Geomática",
  "Ingeniería Industrial",
  "Ingeniería Mecánica",
  "Ingeniería Mecatrónica",
  "Ingeniería Petrolera",
  "Ingeniería en Computación",
  "Ingeniería en Sistemas Biomédicos",
  "Ingeniería en Telecomunicaciones",
];

const emptyRegister = {
  nombres: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  sexo: "",
  edad: "",
  fechaNacimiento: "",
  carrera: "",
  numeroCuenta: "",
  email: "",
  password: "",
  confirm: "",
  promedio: "",
};

export default function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState(emptyRegister);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      setLoginForm({ email: "", password: "" });
      setRegForm(emptyRegister);
    }
  }, [isOpen, tab]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Bloquea scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    alert("Iniciando sesión… (pendiente Supabase)");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (regForm.password !== regForm.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    alert("Registro exitoso… (pendiente Supabase)");
    if (regForm.promedio < 0 || regForm.promedio > 10) {
      setError("El promedio debe estar entre 0 y 10.");
      return;
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${tab === "register" ? "modal--wide" : ""}`}>
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Tabs */}
        <div className="modal__tabs">
          <button className={`modal__tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>
            Iniciar sesión
          </button>
          <button className={`modal__tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>
            Registrarse
          </button>
        </div>

        {/* SCROLL AREA */}
        <div className="modal__scroll">
          {tab === "login" ? (
            <form className="modal__form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Correo</label>
                <input
                  type="email" placeholder="alumno@universidad.edu.mx"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password" placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? <span className="spinner" /> : "Entrar"}
              </button>
              <p className="modal__note">
                ¿Eres empresa? <a href="mailto:admin@feriass.mx">Solicita tu cuenta aquí</a>
              </p>
            </form>
          ) : (
            <form className="modal__form" onSubmit={handleRegister}>
              {/* Nombre(s) */}
              <div className="form-group">
                <label>Nombre(s)</label>
                <input
                  type="text" placeholder="Marco Alejandro"
                  value={regForm.nombres}
                  onChange={(e) => setRegForm({ ...regForm, nombres: e.target.value })}
                  required
                />
              </div>

              {/* Apellidos */}
              <div className="form-row">
                <div className="form-group">
                  <label>Apellido paterno</label>
                  <input
                    type="text" placeholder="Vigi"
                    value={regForm.apellidoPaterno}
                    onChange={(e) => setRegForm({ ...regForm, apellidoPaterno: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Apellido materno</label>
                  <input
                    type="text" placeholder="Garduño"
                    value={regForm.apellidoMaterno}
                    onChange={(e) => setRegForm({ ...regForm, apellidoMaterno: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Sexo / Edad */}
              <div className="form-row">
                <div className="form-group">
                  <label>Sexo</label>
                  <select
                    value={regForm.sexo}
                    onChange={(e) => setRegForm({ ...regForm, sexo: e.target.value })}
                    required
                  >
                    <option value="" disabled>Seleccionar…</option>
                    <option value="H">Hombre</option>
                    <option value="M">Mujer</option>
                    <option value="O">Prefiero no decir</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Edad</label>
                  <input
                    type="number" placeholder="20" min="15" max="99"
                    value={regForm.edad}
                    onChange={(e) => setRegForm({ ...regForm, edad: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Fecha de nacimiento */}
              <div className="form-group">
                <label>Fecha de nacimiento</label>
                <input
                  type="date"
                  value={regForm.fechaNacimiento}
                  onChange={(e) => setRegForm({ ...regForm, fechaNacimiento: e.target.value })}
                  required
                />
              </div>

              {/* Promedio / Carrera */}
              <div className="form-row">
                {/* Promedio */}
                <div className="form-group">
                  <label>Promedio</label>
                  <input
                    type="number"
                    placeholder="9.5"
                    min="0"
                    max="10"
                    step="0.1"
                    value={regForm.promedio}
                    onChange={(e) =>
                      setRegForm({ ...regForm, promedio: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Carrera */}
                <div className="form-group">
                  <label>Carrera</label>
                  <select
                    value={regForm.carrera}
                    onChange={(e) =>
                      setRegForm({ ...regForm, carrera: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      Selecciona tu carrera…
                    </option>
                    {CARRERAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Número de cuenta */}
              <div className="form-group">
                <label>Número de cuenta</label>
                <input
                  type="text"
                  placeholder="xxxxxxxxx"
                  value={regForm.numeroCuenta}
                  onChange={(e) =>
                    setRegForm({ ...regForm, numeroCuenta: e.target.value })
                  }
                  required
                />
              </div>

              {/* Correo */}
              <div className="form-group">
                <label>Correo</label>
                <input
                  type="email"
                  placeholder="correo@uni.edu.mx"
                  value={regForm.email}
                  onChange={(e) =>
                    setRegForm({ ...regForm, email: e.target.value })
                  }
                  required
                />
              </div>

              {/* Contraseñas */}
              <div className="form-row">
                <div className="form-group">
                  <label>Contraseña</label>
                  <input
                    type="password" placeholder="••••••••"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar contraseña</label>
                  <input
                    type="password" placeholder="••••••••"
                    value={regForm.confirm}
                    onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })}
                    required
                  />
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? <span className="spinner" /> : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}