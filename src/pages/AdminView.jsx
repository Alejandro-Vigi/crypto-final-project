import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EditarPerfilModal from "../components/EditarPerfilModal";

const API = "http://localhost:3001";

export default function AdminView({ user: userProp, onLogout, onGoHome }) {
  const [page, setPage] = useState("dashboard");
  const [user, setUser] = useState(userProp);
  const [showEditarPerfil, setShowEditarPerfil] = useState(false);

  const handleActualizarPerfil = (usuarioActualizado) => {
    setUser(usuarioActualizado);
    // Actualizar la sesión guardada
    try {
      const raw = localStorage.getItem("feriass_session");
      if (raw) {
        const session = JSON.parse(raw);
        session.user = usuarioActualizado;
        localStorage.setItem("feriass_session", JSON.stringify(session));
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar
        user={user}
        onLogout={onLogout}
        onGoHome={onGoHome}
        activePage={page}
        setActivePage={setPage}
        onEditarPerfil={() => setShowEditarPerfil(true)}
      />
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {page === "dashboard" && <Dashboard user={user} />}
          {page === "servicios" && <ServiciosSociales user={user} />}
          {page === "verificacion" && <Verificacion user={user} />}
        </div>
      </main>
      <Footer user={user} onGoHome={() => setPage("dashboard")} onVerServicios={() => {}} />

      {showEditarPerfil && (
        <EditarPerfilModal
          user={user}
          onClose={() => setShowEditarPerfil(false)}
          onActualizado={handleActualizarPerfil}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// VERIFICACIÓN — Con filtros por servicio, buscador, modal detalle y nota obligatoria
// ─────────────────────────────────────────────────────────────────
function Verificacion({ user }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificaciones, setVerificaciones] = useState({});
  const [firmaAdmin, setFirmaAdmin] = useState({});
  const [modalDetalle, setModalDetalle] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroServicio, setFiltroServicio] = useState("");

  const fetchInscripciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/empresa/inscripciones`);
      const data = await res.json();
      setInscripciones(Array.isArray(data) ? data : []);
    } catch {
      setInscripciones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInscripciones(); }, [fetchInscripciones]);

  // Lista de servicios únicos para el filtro
  const serviciosUnicos = [...new Set(inscripciones.map((i) => i.servicio).filter(Boolean))];

  // Inscripciones filtradas
  const inscripcionesFiltradas = inscripciones.filter((ins) => {
    const nombreCompleto = [ins.alumno, ins.apellido_paterno, ins.apellido_materno].filter(Boolean).join(" ").toLowerCase();
    const coincideBusqueda = !busqueda || nombreCompleto.includes(busqueda.toLowerCase());
    const coincideServicio = !filtroServicio || ins.servicio === filtroServicio;
    return coincideBusqueda && coincideServicio;
  });

  const handleVerificar = async (ins) => {
    try {
      const res = await fetch(`${API}/api/inscripciones/${ins.id}/verificar`, { method: "POST" });
      const data = await res.json();
      setVerificaciones((prev) => ({ ...prev, [ins.id]: data }));
    } catch {
      setVerificaciones((prev) => ({
        ...prev,
        [ins.id]: { valida: false, motivo: "Error de conexión al verificar." },
      }));
    }
  };

  const handleFirmarAdmin = async (ins) => {
    const estado = firmaAdmin[ins.id];
    if (!estado?.contrasena) return;
    if (!estado?.nota || estado.nota.trim() === "") {
      setFirmaAdmin((prev) => ({ ...prev, [ins.id]: { ...prev[ins.id], error: "Debes agregar una nota antes de firmar." } }));
      return;
    }

    setFirmaAdmin((prev) => ({ ...prev, [ins.id]: { ...prev[ins.id], loading: true, error: "" } }));
    try {
      const res = await fetch(`${API}/api/admin/inscripciones/${ins.id}/firmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: user.id, contrasena: estado.contrasena, nota_admin: estado.nota }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFirmaAdmin((prev) => ({ ...prev, [ins.id]: { ...prev[ins.id], loading: false, error: data.error } }));
      } else {
        setFirmaAdmin((prev) => ({ ...prev, [ins.id]: { open: false, contrasena: "", nota: "", loading: false, error: "" } }));
        await fetchInscripciones();
      }
    } catch {
      setFirmaAdmin((prev) => ({ ...prev, [ins.id]: { ...prev[ins.id], loading: false, error: "Error de conexión." } }));
    }
  };

  if (loading) return <LoadingState label="Cargando inscripciones..." />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white mb-1">Verificación de Contratos</h1>
        <p className="text-zinc-400">Verifica la autenticidad de firmas RSA y firma los contratos como administrador.</p>
      </div>

      {/* Leyenda */}
      <div className="mb-5 flex flex-wrap gap-3">
        {[
          { color: "emerald", label: "Firmado y verificado" },
          { color: "amber", label: "Pendiente de firma del alumno" },
          { color: "orange", label: "Firmado por el alumno — listo para firmar contrato" },
        ].map((b) => (
          <span key={b.label} className={`text-xs px-3 py-1.5 rounded-full font-medium bg-${b.color}-500/10 text-${b.color}-400 border border-${b.color}-500/20`}>
            {b.label}
          </span>
        ))}
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-3">
        {/* Buscador por nombre */}
        <div className="relative flex-1 min-w-50">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre del alumno..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
          />
        </div>

        {/* Filtro por servicio */}
        <select
          value={filtroServicio}
          onChange={(e) => setFiltroServicio(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-orange-500/60 transition-all"
        >
          <option value="">Todos los servicios</option>
          {serviciosUnicos.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {(busqueda || filtroServicio) && (
          <button
            onClick={() => { setBusqueda(""); setFiltroServicio(""); }}
            className="text-xs border border-zinc-700 text-zinc-400 hover:text-white px-3 py-2.5 rounded-xl transition-all"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ tableLayout: "auto" }}>
            <thead>
              <tr className="bg-zinc-800/50 border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Alumno / Carrera</th>
                <th className="p-4">Servicio / Institución</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Firma RSA</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm">
              {inscripcionesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">
                    {busqueda || filtroServicio ? "No se encontraron resultados." : "No hay inscripciones activas todavía."}
                  </td>
                </tr>
              )}
              {inscripcionesFiltradas.map((ins) => {
                const verif = verificaciones[ins.id];
                const fa = firmaAdmin[ins.id];
                const yaFirmadoAdmin = !!ins.firma_admin;

                return (
                  <tr key={ins.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4">
                      <p className="text-white font-bold">
                        {[ins.alumno, ins.apellido_paterno, ins.apellido_materno].filter(Boolean).join(" ")}
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">{ins.carrera || "—"}</p>
                      {ins.numero_cuenta && (
                        <p className="text-zinc-600 text-xs">Cta: {ins.numero_cuenta}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-zinc-300">{ins.servicio}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{ins.empresa}</p>
                    </td>
                    <td className="p-4">
                      {ins.estado === "firmado" ? (
                        <div className="space-y-1">
                          <span className="block text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium w-fit">
                            ✓ Firmado
                          </span>
                          {yaFirmadoAdmin && (
                            <span className="block text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-full font-medium w-fit">
                              ✓ Admin firmó
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
                          ⏳ Pendiente
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {ins.contrato_hash ? (
                        <div>
                          <p className="text-zinc-500 text-xs font-mono">
                            {ins.contrato_hash.substring(0, 16)}...
                          </p>
                          {verif && (
                            <div className={`mt-1.5 text-xs px-2.5 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 ${
                              verif.valida
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${verif.valida ? "bg-emerald-400" : "bg-red-400"}`} />
                              {verif.valida ? "Firma válida" : "Firma inválida"}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs italic">Sin firma aún</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        {/* Botón Ver detalle */}
                        <button
                          onClick={() => setModalDetalle(ins)}
                          className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                          Ver detalle
                        </button>

                        {/* Verificar firma */}
                        {ins.estado === "firmado" && !verif && (
                          <button
                            onClick={() => handleVerificar(ins)}
                            className="text-xs bg-zinc-800 hover:bg-orange-500 border border-zinc-700 hover:border-orange-500 text-zinc-300 hover:text-zinc-950 font-bold px-3 py-1.5 rounded-lg transition-all"
                          >
                            Verificar firma RSA
                          </button>
                        )}

                        {/* Cofirmar como admin */}
                        {ins.estado === "firmado" && !yaFirmadoAdmin && (
                          <div>
                            {!fa?.open ? (
                              <button
                                onClick={() =>
                                  setFirmaAdmin((prev) => ({
                                    ...prev,
                                    [ins.id]: { open: true, contrasena: "", nota: "", loading: false, error: "" },
                                  }))
                                }
                                className="text-xs bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold px-3 py-1.5 rounded-lg transition-all"
                              >
                                Firmar contrato
                              </button>
                            ) : (
                              <div className="flex flex-col gap-1.5 items-end min-w-64">
                                <textarea
                                  placeholder="Nota obligatoria para el alumno..."
                                  value={fa?.nota || ""}
                                  onChange={(e) =>
                                    setFirmaAdmin((prev) => ({
                                      ...prev,
                                      [ins.id]: { ...prev[ins.id], nota: e.target.value },
                                    }))
                                  }
                                  rows={2}
                                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500/60 transition-all resize-none"
                                />
                                <input
                                  type="password"
                                  placeholder="Tu contraseña de admin"
                                  value={fa?.contrasena || ""}
                                  onChange={(e) =>
                                    setFirmaAdmin((prev) => ({
                                      ...prev,
                                      [ins.id]: { ...prev[ins.id], contrasena: e.target.value },
                                    }))
                                  }
                                  onKeyDown={(e) => e.key === "Enter" && handleFirmarAdmin(ins)}
                                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500/60 transition-all"
                                />
                                {fa?.error && (
                                  <p className="text-red-400 text-xs text-right">{fa.error}</p>
                                )}
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() =>
                                      setFirmaAdmin((prev) => ({ ...prev, [ins.id]: { open: false } }))
                                    }
                                    className="text-xs border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-lg transition-all"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleFirmarAdmin(ins)}
                                    disabled={fa?.loading}
                                    className="text-xs bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold px-3 py-1 rounded-lg transition-all disabled:opacity-50"
                                  >
                                    {fa?.loading ? "Firmando..." : "Confirmar"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {yaFirmadoAdmin && (
                          <span className="text-xs text-emerald-400 bg-zinc-800 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Admin firmó
                          </span>
                        )}

                        {ins.estado !== "firmado" && (
                          <span className="text-zinc-600 text-xs italic">Esperando firma del alumno</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle alumno */}
      {modalDetalle && (
        <ModalDetalleAlumno ins={modalDetalle} onClose={() => setModalDetalle(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MODAL DETALLE ALUMNO + CONTRATO
// ─────────────────────────────────────────────────────────────────
function ModalDetalleAlumno({ ins, onClose }) {
  const [tab, setTab] = useState("datos");

  const nombreCompleto = [ins.alumno, ins.apellido_paterno, ins.apellido_materno].filter(Boolean).join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-zinc-800">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-orange-600 via-orange-400 to-orange-600" />
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-lg">
              {ins.alumno?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{nombreCompleto || "Alumno"}</h2>
              <p className="text-zinc-400 text-xs">{ins.carrera || "Sin carrera registrada"}</p>
            </div>
          </div>

          <div className="flex mt-4 bg-zinc-800 rounded-xl p-1 gap-1">
            <TabBtn active={tab === "datos"} onClick={() => setTab("datos")}>Datos del alumno</TabBtn>
            <TabBtn active={tab === "contrato"} onClick={() => setTab("contrato")}>Contrato</TabBtn>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {tab === "datos" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Nombre(s)" value={ins.alumno} />
                <InfoRow label="Apellido Paterno" value={ins.apellido_paterno} />
                <InfoRow label="Apellido Materno" value={ins.apellido_materno} />
                <InfoRow label="Número de cuenta" value={ins.numero_cuenta} />
                <InfoRow label="Correo" value={ins.correo_alumno} />
                <InfoRow label="Carrera" value={ins.carrera} />
                <InfoRow label="Sexo" value={ins.sexo} />
                <InfoRow label="Fecha de nacimiento" value={ins.fecha_nacimiento} />
                <InfoRow label="Promedio" value={ins.promedio} />
              </div>

              <div className="border-t border-zinc-800 pt-4 mt-4">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Servicio inscrito</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Servicio" value={ins.servicio} />
                  <InfoRow label="Institución" value={ins.empresa} />
                  <InfoRow label="Área" value={ins.area} />
                  <InfoRow label="Modalidad" value={ins.modalidad} />
                  <InfoRow label="Fecha de solicitud" value={ins.fecha} />
                  <InfoRow label="Estado" value={ins.estado === "firmado" ? "✓ Firmado" : "⏳ Pendiente"} />
                </div>
              </div>

              {ins.nota_admin && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mt-2">
                  <p className="text-orange-400 text-xs font-bold mb-1">Nota del administrador:</p>
                  <p className="text-zinc-300 text-sm">{ins.nota_admin}</p>
                </div>
              )}
            </div>
          )}

          {tab === "contrato" && (
            <div>
              {ins.contrato_texto ? (
                <div className="bg-zinc-800 rounded-xl p-4 text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                  {ins.contrato_texto}
                </div>
              ) : (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  El alumno aún no ha firmado el contrato.
                </div>
              )}

              {ins.contrato_hash && (
                <div className="mt-4 space-y-3">
                  <div className="bg-zinc-800/60 rounded-xl p-3">
                    <p className="text-zinc-500 text-xs font-bold mb-1">Hash SHA-256 del contrato:</p>
                    <p className="text-orange-400 text-xs font-mono break-all">{ins.contrato_hash}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1.5 ${
                      ins.firma_alumno
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ins.firma_alumno ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      {ins.firma_alumno ? "Alumno firmó" : "Sin firma del alumno"}
                    </span>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1.5 ${
                      ins.firma_admin
                        ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ins.firma_admin ? "bg-orange-400" : "bg-zinc-600"}`} />
                      {ins.firma_admin ? "Admin firmó" : "Sin firma del admin"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className="text-zinc-200 text-sm font-medium">{value || "—"}</p>
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

// ─────────────────────────────────────────────────────────────────
// SERVICIOS SOCIALES — CRUD completo
// ─────────────────────────────────────────────────────────────────
function ServiciosSociales({ user }) {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);

  const fetchServicios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/servicios?admin_id=${user.id}`);
      const data = await res.json();
      setServicios(Array.isArray(data) ? data : []);
    } catch { setServicios([]); } finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { fetchServicios(); }, [fetchServicios]);

  if (editando !== null) {
    return (
      <FormServicio
        user={user}
        servicio={editando === "nuevo" ? null : editando}
        onGuardado={() => { setEditando(null); fetchServicios(); }}
        onCancelar={() => setEditando(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Servicios Sociales</h1>
          <p className="text-zinc-400">Administra los servicios disponibles en el catálogo.</p>
        </div>
        <button
          onClick={() => setEditando("nuevo")}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Servicio
        </button>
      </div>

      {loading ? (
        <LoadingState label="Cargando servicios..." />
      ) : servicios.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 text-sm mb-4">Aún no hay servicios registrados.</p>
          <button onClick={() => setEditando("nuevo")} className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold px-5 py-2.5 rounded-xl text-sm">
            Registrar primer servicio
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/50 border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Programa / Institución</th>
                  <th className="p-4">Área</th>
                  <th className="p-4">Modalidad</th>
                  <th className="p-4 text-center">Lugares</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm">
                {servicios.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4">
                      <p className="text-white font-semibold">{s.nombre}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{s.nombre_institucion}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">{s.area || "—"}</span>
                    </td>
                    <td className="p-4 text-zinc-400">{s.modalidad || "—"}</td>
                    <td className="p-4 text-center">
                      <span className="text-zinc-300">{s.lugares_ocupados ?? 0}/{s.lugares_disponibles ?? 0}</span>
                    </td>
                    <td className="p-4 text-center">
                      {s.activo ? (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">Activo</span>
                      ) : (
                        <span className="text-xs bg-zinc-700/50 text-zinc-500 border border-zinc-700 px-2.5 py-1 rounded-full font-medium">Inactivo</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setEditando(s)}
                        className="text-xs bg-zinc-800 hover:bg-orange-500 border border-zinc-700 hover:border-orange-500 text-zinc-300 hover:text-zinc-950 font-bold px-3 py-1.5 rounded-lg transition-all"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FormServicio({ user, servicio, onGuardado, onCancelar }) {
  const esEdicion = servicio !== null;
  const [formData, setFormData] = useState({
    nombre: servicio?.nombre || "",
    nombre_institucion: servicio?.nombre_institucion || "",
    nombre_responsable: servicio?.nombre_responsable || "",
    correo_contacto: servicio?.correo_contacto || "",
    lugares_disponibles: servicio?.lugares_disponibles || "",
    lista_actividades: servicio?.lista_actividades || "",
    modalidad: servicio?.modalidad || "Presencial",
    ubicacion: servicio?.ubicacion || "",
    turno: servicio?.turno || "Matutino",
    area: servicio?.area || "",
    descripcion: servicio?.descripcion || "",
    activo: servicio?.activo ?? 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (checked ? 1 : 0) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);
    try {
      const url = esEdicion ? `${API}/api/admin/servicios/${servicio.id}` : `${API}/api/admin/servicios`;
      const res = await fetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: user.id, ...formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar.");
      setSuccess(true);
      setTimeout(onGuardado, 1200);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const ic = "w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all";
  const lc = "block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={onCancelar} className="text-zinc-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-black text-white mb-1">{esEdicion ? "Editar Servicio" : "Nuevo Servicio"}</h1>
          <p className="text-zinc-400">{esEdicion ? "Modifica los datos." : "Da de alta un nuevo servicio."}</p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">⚠️ {error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm">🎉 ¡Guardado con éxito!</div>}

      <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={lc}>Nombre del Programa *</label><input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Ej. Soporte Técnico" className={ic} /></div>
          <div><label className={lc}>Institución *</label><input type="text" name="nombre_institucion" required value={formData.nombre_institucion} onChange={handleChange} placeholder="Ej. UNAM FI" className={ic} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={lc}>Responsable *</label><input type="text" name="nombre_responsable" required value={formData.nombre_responsable} onChange={handleChange} placeholder="Ing. Juan Pérez" className={ic} /></div>
          <div><label className={lc}>Correo de Contacto *</label><input type="email" name="correo_contacto" required value={formData.correo_contacto} onChange={handleChange} placeholder="resp@inst.edu.mx" className={ic} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><label className={lc}>Área *</label><input type="text" name="area" required value={formData.area} onChange={handleChange} placeholder="TI, Datos, Diseño..." className={ic} /></div>
          <div><label className={lc}>Lugares Disponibles *</label><input type="number" name="lugares_disponibles" required min="1" value={formData.lugares_disponibles} onChange={handleChange} placeholder="5" className={ic} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div><label className={lc}>Modalidad</label><select name="modalidad" value={formData.modalidad} onChange={handleChange} className={ic}><option>Presencial</option><option>Remoto</option><option>Híbrido</option></select></div>
          <div><label className={lc}>Turno</label><select name="turno" value={formData.turno} onChange={handleChange} className={ic}><option>Matutino</option><option>Vespertino</option><option>Mixto</option></select></div>
        </div>
        <div><label className={lc}>Ubicación</label><input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Edificio Q, CU" className={ic} /></div>
        <div><label className={lc}>Lista de Actividades</label><textarea name="lista_actividades" rows="3" value={formData.lista_actividades} onChange={handleChange} placeholder="Actividades separadas por comas..." className={`${ic} resize-none`} /></div>
        <div><label className={lc}>Descripción General</label><textarea name="descripcion" rows="3" value={formData.descripcion} onChange={handleChange} placeholder="Detalles del servicio..." className={`${ic} resize-none`} /></div>
        {esEdicion && (
          <div className="flex items-center gap-3">
            <input type="checkbox" name="activo" id="activo" checked={formData.activo === 1} onChange={handleChange} className="w-4 h-4 accent-orange-500" />
            <label htmlFor="activo" className="text-zinc-400 text-sm">Servicio activo (visible en catálogo)</label>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancelar} className="border border-zinc-700 text-zinc-400 hover:text-white px-6 py-3 rounded-xl text-sm transition-colors">Cancelar</button>
          <button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold px-6 py-3 rounded-xl text-sm transition-all disabled:opacity-50">
            {loading ? "Guardando..." : esEdicion ? "Guardar cambios" : "Registrar Servicio"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servicios, setServicios] = useState([]);
  const [servicioFiltro, setServicioFiltro] = useState(null);
  const [statsServicio, setStatsServicio] = useState(null);
  const [loadingFiltro, setLoadingFiltro] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/estadisticas`);
      const data = await res.json();
      setStats({
        total_inscritos: data.total_inscritos ?? 0,
        contratos_firmados: data.contratos_firmados ?? 0,
        pendientes: data.pendientes ?? 0,
        total_servicios: data.total_servicios ?? 0,
        empresas_activas: data.empresas ?? 0,
        por_area: data.por_area ?? [],
        recientes: data.recientes ?? [],
      });
    } catch {
      setStats({ total_inscritos: 0, contratos_firmados: 0, pendientes: 0, total_servicios: 0, empresas_activas: 0, por_area: [], recientes: [] });
    } finally { setLoading(false); }
  }, []);

  const fetchServicios = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/servicios?admin_id=${user.id}`);
      const data = await res.json();
      setServicios(Array.isArray(data) ? data : []);
    } catch { setServicios([]); }
  }, [user.id]);

  useEffect(() => { fetchStats(); fetchServicios(); }, [fetchStats, fetchServicios]);

  const handleFiltroServicio = useCallback(async (servicio) => {
    if (!servicio) { setServicioFiltro(null); setStatsServicio(null); return; }
    setServicioFiltro(servicio); setLoadingFiltro(true);
    try {
      const res = await fetch(`${API}/api/estadisticas/servicio/${servicio.id}`);
      setStatsServicio(await res.json());
    } catch { setStatsServicio(null); } finally { setLoadingFiltro(false); }
  }, []);

  if (loading) return <LoadingState label="Cargando dashboard..." />;

  const mostrarGlobal = !servicioFiltro;
  const maxArea = Math.max(...(stats?.por_area?.map((a) => a.total) ?? [1]), 1);
  const datosInscritos = mostrarGlobal ? stats?.total_inscritos : statsServicio?.inscritos;
  const datosFirmados = mostrarGlobal ? stats?.contratos_firmados : statsServicio?.firmados;
  const datosPendientes = mostrarGlobal ? stats?.pendientes : statsServicio?.pendientes;
  const datosRecientes = mostrarGlobal ? stats?.recientes : statsServicio?.recientes;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">Panel de Estadísticas</h1>
          <p className="text-zinc-400">Monitoreo de alumnos inscritos y contratos firmados con RSA.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={servicioFiltro?.id ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              !id ? handleFiltroServicio(null) : handleFiltroServicio(servicios.find((s) => s.id === parseInt(id)));
            }}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm px-4 py-2 rounded-xl focus:outline-none focus:border-orange-500/60 transition-all"
          >
            <option value="">Datos globales</option>
            {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <button
            onClick={() => { fetchStats(); if (servicioFiltro) handleFiltroServicio(servicioFiltro); }}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm px-4 py-2 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {servicioFiltro && (
        <div className="mb-6 flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
          <span className="text-orange-400 text-sm font-medium flex-1">
            Filtrando por: <span className="text-white font-bold">{servicioFiltro.nombre}</span>
          </span>
          <button onClick={() => handleFiltroServicio(null)} className="text-zinc-500 hover:text-white text-xs">✕</button>
        </div>
      )}

      {loadingFiltro ? <LoadingState label="Cargando estadísticas..." /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <MetricCard label="Total Inscritos" value={datosInscritos ?? "–"} badge="Global" badgeColor="orange" />
            <MetricCard label="Contratos Firmados" value={datosFirmados ?? "–"} valueColor="text-orange-500" sub="Con llaves RSA activas" />
            <MetricCard label="Pendientes de Firma" value={datosPendientes ?? "–"} badge="Requieren acción" badgeColor="yellow" />
            {mostrarGlobal
              ? <MetricCard label="Instituciones" value={stats?.empresas_activas ?? "–"} sub={`${stats?.total_servicios ?? "–"} servicios activos`} />
              : <MetricCard label="Lugares" value={`${servicioFiltro?.lugares_ocupados ?? 0}/${servicioFiltro?.lugares_disponibles ?? 0}`} sub="Ocupados / Disponibles" />
            }
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {mostrarGlobal && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-6">Demanda por Área</h3>
                {stats?.por_area?.length > 0 ? (
                  <div className="space-y-4">
                    {stats.por_area.map((item) => {
                      const pct = maxArea > 0 ? Math.round((item.total / maxArea) * 100) : 0;
                      return (
                        <div key={item.area}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-zinc-300 font-medium">{item.area}</span>
                            <span className="text-orange-400 font-bold">{item.total} alumnos</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-zinc-500 text-sm">Sin datos de área disponibles.</p>}
              </div>
            )}

            {!mostrarGlobal && statsServicio && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Detalles del Servicio</h3>
                <div className="space-y-3 text-sm">
                  {[
                    ["Institución", statsServicio.servicio?.nombre_institucion],
                    ["Responsable", statsServicio.servicio?.nombre_responsable],
                    ["Área", statsServicio.servicio?.area || "—"],
                    ["Modalidad", statsServicio.servicio?.modalidad || "—"],
                    ["Turno", statsServicio.servicio?.turno || "—"],
                    ["Ubicación", statsServicio.servicio?.ubicacion || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-zinc-500">{k}</span>
                      <span className="text-zinc-200 text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-6">Inscripciones Recientes</h3>
              {datosRecientes?.length > 0 ? (
                <div className="space-y-3">
                  {datosRecientes.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/60 rounded-xl">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 font-bold text-sm shrink-0">
                        {r.alumno?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{r.alumno}</p>
                        <p className="text-zinc-500 text-xs truncate">{r.servicio ? `${r.servicio} · ` : ""}{r.fecha}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                        r.estado === "firmado" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {r.estado === "firmado" ? "Firmado" : "Pendiente"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-zinc-500 text-sm">Aún no hay inscripciones registradas.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Componente para mostrar una métrica con estilo de tarjeta
function MetricCard({ label, value, badge, badgeColor, sub, valueColor = "text-white" }) {
  const badgeClass = badgeColor === "orange" ? "text-orange-400 bg-orange-500/10" : badgeColor === "yellow" ? "text-yellow-400 bg-yellow-500/10" : "text-zinc-500";
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-black mt-2 ${valueColor}`}>{value ?? "–"}</p>
      {badge && <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${badgeClass}`}>{badge}</span>}
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// Componente para mostrar un estado de carga con un spinner
function LoadingState({ label }) {
  return (
    <div className="flex items-center justify-center py-20 gap-3">
      <div className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      <span className="text-zinc-500 text-sm">{label}</span>
    </div>
  );
}