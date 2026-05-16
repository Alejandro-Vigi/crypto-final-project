import { useState, useEffect, useCallback } from "react";

const CARRERAS = [
  "Ingeniería Aeroespacial",
  "Ingeniería Civil",
  "Ingeniería Geomática",
  "Ingeniería Ambiental",
  "Ingeniería Eléctrica Electrónica",
  "Ingeniería en Computación",
  "Ingeniería en Telecomunicaciones",
  "Ingeniería Geológica",
  "Ingeniería Geofísica",
  "Ingeniería Petrolera",
  "Ingeniería de Minas y Metalurgía",
  "Ingeniería en Sistemas Biomédicos",
  "Ingeniería Mecánica",
  "Ingeniería Mecatrónica",
  "Ingeniería Industrial",
];

export default function AuthModal({ onClose, onLogin, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    numero_cuenta: "",
    sexo: "",
    fecha_nacimiento_dia: "",
    fecha_nacimiento_mes: "",
    fecha_nacimiento_anio: "",
    promedio: "",
    carrera: "",
    correo: "",
    confirmar_correo: "",
    contrasena: "",
    confirmar_contrasena: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Indicador de fuerza de contraseña
  const fuerzaContrasena = (() => {
    const p = form.contrasena;
    if (!p || p.length < 6) return { nivel: 0, texto: "", color: "" };
    let pts = 0;
    if (p.length >= 8) pts++;
    if (p.length >= 12) pts++;
    if (/[A-Z]/.test(p)) pts++;
    if (/[0-9]/.test(p)) pts++;
    if (/[^A-Za-z0-9]/.test(p)) pts++;
    if (pts <= 1) return { nivel: 1, texto: "Débil", color: "bg-red-500" };
    if (pts <= 3) return { nivel: 2, texto: "Media", color: "bg-amber-500" };
    return { nivel: 3, texto: "Fuerte", color: "bg-emerald-500" };
  })();

  const handleSubmit = useCallback(async () => {
    setError("");

    if (mode === "register") {
      if (!form.nombre.trim()) return setError("El nombre es requerido.");
      if (!form.apellido_paterno.trim()) return setError("El apellido paterno es requerido.");
      if (!form.apellido_materno.trim()) return setError("El apellido materno es requerido.");

      // Número de cuenta
      if (!form.numero_cuenta) return setError("El número de cuenta es requerido.");
      if (!/^\d{8,11}$/.test(form.numero_cuenta)) return setError("El número de cuenta debe tener entre 8 y 11 dígitos.");

      if (!form.sexo) return setError("Selecciona un sexo.");

      // Fecha de nacimiento
      const dia = parseInt(form.fecha_nacimiento_dia);
      const mes = parseInt(form.fecha_nacimiento_mes);
      const anio = parseInt(form.fecha_nacimiento_anio);
      if (!dia || !mes || !anio) return setError("Ingresa tu fecha de nacimiento completa.");
      const fechaNac = new Date(anio, mes - 1, dia);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fechaNac.getFullYear() - (hoy < new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate()) ? 1 : 0);
      if (edad > 100) return setError("La fecha de nacimiento no puede ser mayor a 100 años atrás.");
      if (edad < 10) return setError("La fecha de nacimiento indica menos de 10 años de edad.");
      if (isNaN(fechaNac.getTime())) return setError("Fecha de nacimiento inválida.");

      // Promedio
      const prom = parseFloat(form.promedio);
      if (!form.promedio) return setError("El promedio es requerido.");
      if (isNaN(prom) || prom < 5 || prom > 10) return setError("El promedio debe estar entre 5 y 10.");

      if (!form.carrera) return setError("Selecciona una carrera.");
      if (!form.correo) return setError("El correo es requerido.");
      if (form.correo !== form.confirmar_correo) return setError("Los correos no coinciden.");
      if (!form.contrasena) return setError("La contraseña es requerida.");
      if (form.contrasena.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
      if (form.contrasena !== form.confirmar_contrasena) return setError("Las contraseñas no coinciden.");
    } else {
      if (!form.correo || !form.contrasena) return setError("Correo y contraseña son requeridos.");
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      let body;
      if (mode === "login") {
        body = { correo: form.correo, contrasena: form.contrasena };
      } else {
        const dia = form.fecha_nacimiento_dia.padStart(2, "0");
        const mes = form.fecha_nacimiento_mes.padStart(2, "0");
        const anio = form.fecha_nacimiento_anio;
        body = {
          nombre: form.nombre.trim(),
          apellido_paterno: form.apellido_paterno.trim(),
          apellido_materno: form.apellido_materno.trim(),
          numero_cuenta: form.numero_cuenta,
          sexo: form.sexo,
          fecha_nacimiento: `${dia}/${mes}/${anio}`,
          promedio: form.promedio,
          carrera: form.carrera,
          correo: form.correo,
          contrasena: form.contrasena,
          tipo: "alumno",
        };
      }

      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Error al procesar la solicitud.");

      if (mode === "register") {
        setRegistroExitoso(true);
        setTimeout(() => {
          onLogin(data.usuario);
        }, 2000);
      } else {
        onLogin(data.usuario);
      }
    } catch {
      setError("No se pudo conectar al servidor. Verifica que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  }, [form, mode, onLogin]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      // FIX #1: Enter dispara el submit en cualquier modo
      if (e.key === "Enter" && !loading) handleSubmit();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleSubmit, loading]);

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 91 }, (_, i) => anioActual - 10 - i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-zinc-800">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-orange-600 via-orange-400 to-orange-600" />
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
              <p className="text-zinc-400 text-xs">Sistema de Servicio Social · RSA cifrado</p>
            </div>
          </div>

          <div className="flex mt-4 bg-zinc-800 rounded-xl p-1 gap-1">
            <TabBtn active={mode === "login"} onClick={() => { setMode("login"); setError(""); setRegistroExitoso(false); }}>
              Iniciar sesión
            </TabBtn>
            <TabBtn active={mode === "register"} onClick={() => { setMode("register"); setError(""); setRegistroExitoso(false); }}>
              Registrarse
            </TabBtn>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {registroExitoso && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-4 text-center">
              <p className="font-bold mb-1">🎉 ¡Cuenta creada con éxito!</p>
              <p className="text-xs text-emerald-300">
                Se generaron tus llaves RSA 2048-bit. Tu llave privada está cifrada con AES-256-GCM.
              </p>
              <div className="mt-2 flex justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              </div>
            </div>
          )}

          {!registroExitoso && (
            <>
              {mode === "register" && (
                <>
                  {/* ── Datos personales ── */}
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-400/80">Datos personales</p>

                  <Input label="Nombre(s) *" name="nombre" value={form.nombre} onChange={handle} placeholder="Ej. Juan Carlos" />

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Apellido Paterno *" name="apellido_paterno" value={form.apellido_paterno} onChange={handle} placeholder="Ej. García" />
                    <Input label="Apellido Materno *" name="apellido_materno" value={form.apellido_materno} onChange={handle} placeholder="Ej. López" />
                  </div>

                  <Input
                    label="Número de cuenta * (8-11 dígitos)"
                    name="numero_cuenta"
                    value={form.numero_cuenta}
                    onChange={handle}
                    placeholder="Ej. 31925468"
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                  />

                  {/* Sexo */}
                  <div>
                    <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Sexo *</label>
                    <select
                      name="sexo"
                      value={form.sexo}
                      onChange={handle}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
                    >
                      <option value="">Selecciona...</option>
                      <option value="Hombre">Hombre</option>
                      <option value="Mujer">Mujer</option>
                      <option value="Prefiero no especificar">Prefiero no especificar</option>
                    </select>
                  </div>

                  {/* Fecha de nacimiento */}
                  <div>
                    <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Fecha de nacimiento *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        name="fecha_nacimiento_dia"
                        value={form.fecha_nacimiento_dia}
                        onChange={handle}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 transition-all"
                      >
                        <option value="">Día</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        name="fecha_nacimiento_mes"
                        value={form.fecha_nacimiento_mes}
                        onChange={handle}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 transition-all"
                      >
                        <option value="">Mes</option>
                        {meses.map((m, i) => (
                          <option key={i} value={i + 1}>{m}</option>
                        ))}
                      </select>
                      <select
                        name="fecha_nacimiento_anio"
                        value={form.fecha_nacimiento_anio}
                        onChange={handle}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 transition-all"
                      >
                        <option value="">Año</option>
                        {anios.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Promedio */}
                  <Input
                    label="Promedio * (5.0 – 10.0)"
                    name="promedio"
                    value={form.promedio}
                    onChange={handle}
                    placeholder="Ej. 8.5"
                    type="number"
                    step="0.1"
                    min="5"
                    max="10"
                  />

                  {/* Carrera */}
                  <div>
                    <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Carrera *</label>
                    <select
                      name="carrera"
                      value={form.carrera}
                      onChange={handle}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
                    >
                      <option value="">Selecciona tu carrera...</option>
                      {CARRERAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── Acceso ── */}
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-400/80 pt-2">Acceso a la cuenta</p>

                  <Input label="Correo electrónico *" name="correo" value={form.correo} onChange={handle} placeholder="correo@ejemplo.com" type="email" />
                  <Input label="Confirmar correo electrónico *" name="confirmar_correo" value={form.confirmar_correo} onChange={handle} placeholder="correo@ejemplo.com" type="email" />
                  <Input label="Contraseña *" name="contrasena" value={form.contrasena} onChange={handle} placeholder="••••••••" type="password" />

                  {/* Indicador de fuerza */}
                  {form.contrasena.length > 0 && (
                    <div>
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              fuerzaContrasena.nivel >= n ? fuerzaContrasena.color : "bg-zinc-700"
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${
                        fuerzaContrasena.nivel === 1 ? "text-red-400" :
                        fuerzaContrasena.nivel === 2 ? "text-amber-400" : "text-emerald-400"
                      }`}>
                        Contraseña {fuerzaContrasena.texto}
                      </p>
                    </div>
                  )}

                  <Input label="Confirmar contraseña *" name="confirmar_contrasena" value={form.confirmar_contrasena} onChange={handle} placeholder="••••••••" type="password" />

                  <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 text-xs text-zinc-500 space-y-1">
                    <p className="font-medium text-zinc-400">🔐 Al registrarte se generará automáticamente:</p>
                    <p>· Par de llaves RSA 2048-bit para firmar contratos</p>
                    <p>· Tu llave privada cifrada con AES-256-GCM + PBKDF2</p>
                    <p>· Tu llave pública registrada en el servidor</p>
                  </div>
                </>
              )}

              {mode === "login" && (
                <>
                  {/* FIX #1: onKeyDown en cada input del login para disparar submit con Enter */}
                  <Input
                    label="Correo electrónico"
                    name="correo"
                    value={form.correo}
                    onChange={handle}
                    placeholder="correo@ejemplo.com"
                    type="email"
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
                  />
                  <Input
                    label="Contraseña"
                    name="contrasena"
                    value={form.contrasena}
                    onChange={handle}
                    placeholder="••••••••"
                    type="password"
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
                  />
                </>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-zinc-950 font-bold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                {loading
                  ? mode === "register" ? "Generando llaves RSA..." : "Verificando..."
                  : mode === "login" ? "Entrar →" : "Crear cuenta y generar llaves →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <div>
      <label className="text-zinc-400 text-xs font-medium mb-1.5 block">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
        {...rest}
      />
    </div>
  );
}

function TabBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${active ? "bg-zinc-900 text-orange-400 shadow" : "text-zinc-500 hover:text-zinc-300"}`}
    >
      {children}
    </button>
  );
}