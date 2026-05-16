import { useState } from "react";

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

const API = "http://localhost:3001";

export default function EditarPerfilModal({ user, onClose, onActualizado }) {
  const esAdmin = user.tipo === "admin";

  // Parse fecha_nacimiento "DD/MM/YYYY"
  const parseFecha = (f) => {
    if (!f) return { dia: "", mes: "", anio: "" };
    const [dia, mes, anio] = f.split("/");
    return { dia: dia || "", mes: mes || "", anio: anio || "" };
  };
  const fechaInicial = parseFecha(user.fecha_nacimiento);

  const [form, setForm] = useState({
    nombre: user.nombre || "",
    apellido_paterno: user.apellido_paterno || "",
    apellido_materno: user.apellido_materno || "",
    correo: user.correo || "",
    // FIX #3: campo confirmar correo añadido
    confirmar_correo: user.correo || "",
    numero_cuenta: user.numero_cuenta || "",
    carrera: user.carrera || "",
    sexo: user.sexo || "",
    fecha_nacimiento_dia: fechaInicial.dia,
    fecha_nacimiento_mes: fechaInicial.mes,
    fecha_nacimiento_anio: fechaInicial.anio,
    promedio: user.promedio || "",
    contrasena_actual: "",
    nueva_contrasena: "",
    confirmar_nueva_contrasena: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fuerzaNuevaContrasena = (() => {
    const p = form.nueva_contrasena;
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

  const handleSubmit = async () => {
    setError("");

    if (!form.contrasena_actual) return setError("Ingresa tu contraseña actual para confirmar cambios.");
    if (!form.nombre.trim()) return setError("El nombre es requerido.");

    if (!esAdmin) {
      // FIX #3: mismos validadores que en el registro
      if (!form.apellido_paterno.trim()) return setError("El apellido paterno es requerido.");
      if (!form.apellido_materno.trim()) return setError("El apellido materno es requerido.");

      if (!form.numero_cuenta) return setError("El número de cuenta es requerido.");
      if (!/^\d{8,11}$/.test(form.numero_cuenta)) return setError("El número de cuenta debe tener entre 8 y 11 dígitos.");

      if (!form.sexo) return setError("Selecciona un sexo.");

      // Fecha completa obligatoria
      const dia = parseInt(form.fecha_nacimiento_dia);
      const mes = parseInt(form.fecha_nacimiento_mes);
      const anio = parseInt(form.fecha_nacimiento_anio);
      if (!dia || !mes || !anio) return setError("Ingresa tu fecha de nacimiento completa.");
      const fechaNac = new Date(anio, mes - 1, dia);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fechaNac.getFullYear() - (hoy < new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate()) ? 1 : 0);
      if (isNaN(fechaNac.getTime())) return setError("Fecha de nacimiento inválida.");
      if (edad > 100) return setError("La fecha de nacimiento no puede ser mayor a 100 años atrás.");
      if (edad < 10) return setError("La edad indicada es menor a 10 años.");

      if (!form.promedio) return setError("El promedio es requerido.");
      const prom = parseFloat(form.promedio);
      if (isNaN(prom) || prom < 5 || prom > 10) return setError("El promedio debe estar entre 5 y 10.");

      if (!form.carrera) return setError("Selecciona una carrera.");
    }

    // Validar correo y confirmación
    if (!form.correo) return setError("El correo es requerido.");
    if (form.correo !== form.confirmar_correo) return setError("Los correos no coinciden.");

    if (form.nueva_contrasena) {
      if (form.nueva_contrasena.length < 6) return setError("La nueva contraseña debe tener al menos 6 caracteres.");
      if (form.nueva_contrasena !== form.confirmar_nueva_contrasena) return setError("Las nuevas contraseñas no coinciden.");
    }

    setLoading(true);
    try {
      let fecha_nacimiento = undefined;
      if (!esAdmin && form.fecha_nacimiento_dia && form.fecha_nacimiento_mes && form.fecha_nacimiento_anio) {
        fecha_nacimiento = `${form.fecha_nacimiento_dia.padStart(2, "0")}/${form.fecha_nacimiento_mes.padStart(2, "0")}/${form.fecha_nacimiento_anio}`;
      }

      const body = {
        contrasena_actual: form.contrasena_actual,
        nombre: form.nombre.trim(),
        correo: form.correo,
        ...(form.nueva_contrasena ? { nueva_contrasena: form.nueva_contrasena } : {}),
        ...(!esAdmin ? {
          apellido_paterno: form.apellido_paterno.trim(),
          apellido_materno: form.apellido_materno.trim(),
          numero_cuenta: form.numero_cuenta,
          carrera: form.carrera,
          sexo: form.sexo,
          fecha_nacimiento,
          promedio: form.promedio,
        } : {}),
      };

      const res = await fetch(`${API}/api/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Error al actualizar.");

      setExito(true);
      setTimeout(() => {
        onActualizado(data.usuario);
        onClose();
      }, 1500);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 91 }, (_, i) => anioActual - 10 - i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Editar mis datos</h2>
              <p className="text-zinc-400 text-xs">Modifica tu información de perfil</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {exito && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl px-4 py-3 text-center">
              ✅ Datos actualizados correctamente.
            </div>
          )}

          {!exito && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-400/80">Datos personales</p>

              <FInput label="Nombre(s) *" name="nombre" value={form.nombre} onChange={handle} placeholder="Tu nombre" />

              {!esAdmin && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FInput label="Apellido Paterno *" name="apellido_paterno" value={form.apellido_paterno} onChange={handle} placeholder="Apellido paterno" />
                    <FInput label="Apellido Materno *" name="apellido_materno" value={form.apellido_materno} onChange={handle} placeholder="Apellido materno" />
                  </div>

                  <FInput
                    label="Número de cuenta * (8-11 dígitos)"
                    name="numero_cuenta"
                    value={form.numero_cuenta}
                    onChange={handle}
                    placeholder="Ej. 31925468"
                    maxLength={11}
                  />

                  <div>
                    <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Sexo *</label>
                    <select name="sexo" value={form.sexo} onChange={handle}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 transition-all">
                      <option value="">Selecciona...</option>
                      <option value="Hombre">Hombre</option>
                      <option value="Mujer">Mujer</option>
                      <option value="Prefiero no especificar">Prefiero no especificar</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Fecha de nacimiento *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select name="fecha_nacimiento_dia" value={form.fecha_nacimiento_dia} onChange={handle}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 transition-all">
                        <option value="">Día</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select name="fecha_nacimiento_mes" value={form.fecha_nacimiento_mes} onChange={handle}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 transition-all">
                        <option value="">Mes</option>
                        {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                      <select name="fecha_nacimiento_anio" value={form.fecha_nacimiento_anio} onChange={handle}
                        className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 transition-all">
                        <option value="">Año</option>
                        {anios.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <FInput label="Promedio * (5.0 – 10.0)" name="promedio" value={form.promedio} onChange={handle} placeholder="Ej. 8.5" type="number" step="0.1" min="5" max="10" />

                  <div>
                    <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Carrera *</label>
                    <select name="carrera" value={form.carrera} onChange={handle}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 transition-all">
                      <option value="">Selecciona tu carrera...</option>
                      {CARRERAS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}

              {/* FIX #3: correo + confirmar correo */}
              <p className="text-xs font-bold uppercase tracking-wider text-orange-400/80 pt-2">Acceso</p>
              <FInput label="Correo electrónico *" name="correo" value={form.correo} onChange={handle} placeholder="correo@ejemplo.com" type="email" />
              <FInput label="Confirmar correo electrónico *" name="confirmar_correo" value={form.confirmar_correo} onChange={handle} placeholder="correo@ejemplo.com" type="email" />

              <p className="text-xs font-bold uppercase tracking-wider text-orange-400/80 pt-2">Cambiar contraseña (opcional)</p>
              <FInput label="Nueva contraseña" name="nueva_contrasena" value={form.nueva_contrasena} onChange={handle} placeholder="Dejar vacío para no cambiar" type="password" />

              {form.nueva_contrasena.length > 0 && (
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${fuerzaNuevaContrasena.nivel >= n ? fuerzaNuevaContrasena.color : "bg-zinc-700"}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${fuerzaNuevaContrasena.nivel === 1 ? "text-red-400" : fuerzaNuevaContrasena.nivel === 2 ? "text-amber-400" : "text-emerald-400"}`}>
                    Contraseña {fuerzaNuevaContrasena.texto}
                  </p>
                </div>
              )}

              {form.nueva_contrasena && (
                <FInput label="Confirmar nueva contraseña" name="confirmar_nueva_contrasena" value={form.confirmar_nueva_contrasena} onChange={handle} placeholder="••••••••" type="password" />
              )}

              <div className="border-t border-zinc-800 pt-4">
                <FInput label="Contraseña actual * (requerida para guardar)" name="contrasena_actual" value={form.contrasena_actual} onChange={handle} placeholder="Tu contraseña actual" type="password" />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-zinc-950 font-bold py-2.5 rounded-xl text-sm transition-all"
                >
                  {loading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FInput({ label, name, value, onChange, placeholder, type = "text", ...rest }) {
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