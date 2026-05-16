import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EditarPerfilModal from "../components/EditarPerfilModal";

const API = "http://localhost:3001";

// ─── Generador de PDF comprobante con jsPDF ───────────────────────
async function generarComprobantePDF(user, inscripcion) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;

  // Paleta de colores zinc/naranja
  const C = {
    negro:    [9,   9,  11],
    gris1:    [24,  24, 27],
    gris2:    [39,  39, 42],
    gris3:    [63,  63, 70],
    gris5:    [113,113,122],
    blanco:   [255,255,255],
    naranja:  [249,115, 22],
    esmerald: [52, 211,153],
    zinc300:  [212,212,216],
    zinc400:  [161,161,170],
  };

  const rr = (x, y, w, h, r, style) => doc.roundedRect(x, y, w, h, r, r, style);

  // ── Fondo ──
  doc.setFillColor(...C.negro);
  doc.rect(0, 0, W, 297, "F");

  // ── Barra naranja top ──
  doc.setFillColor(...C.naranja);
  doc.rect(0, 0, W, 2.5, "F");

  // ── Header ──
  // Icono logo
  doc.setFillColor(...C.naranja);
  rr(14, 9, 13, 13, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.negro);
  doc.text("SS", 20.5, 17.5, { align: "center" });

  // Nombre marca
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.blanco);
  const xFeria = 31;
  doc.text("Feria", xFeria, 17.5);
  doc.setTextColor(...C.naranja);
  doc.text("SS", xFeria + doc.getTextWidth("Feria"), 17.5);
  doc.setTextColor(...C.blanco);
  doc.text("ocial", xFeria + doc.getTextWidth("Feria") + doc.getTextWidth("SS"), 17.5);

  // Subtexto derecha
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gris5);
  doc.text("Plataforma institucional · Firma RSA · AES-256", W - 14, 13, { align: "right" });
  doc.text(`Emitido: ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`, W - 14, 18.5, { align: "right" });

  // Línea divisora
  doc.setDrawColor(...C.gris3);
  doc.setLineWidth(0.25);
  doc.line(14, 26, W - 14, 26);

  // ── Título central ──
  let y = 34;
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.blanco);
  doc.text("COMPROBANTE DE SERVICIO SOCIAL", W / 2, y, { align: "center" });
  y += 6;

  // Badge verificado
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.esmerald);
  doc.text("✓  Contrato verificado y firmado digitalmente por ambas partes", W / 2, y, { align: "center" });
  y += 12;

  // ── Helper: encabezado de sección ──
  const sectionHeader = (titulo, yPos) => {
    doc.setFillColor(...C.gris1);
    doc.rect(14, yPos, W - 28, 9, "F");
    doc.setFillColor(...C.naranja);
    doc.rect(14, yPos, 3, 9, "F");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.naranja);
    doc.text(titulo, 21, yPos + 6.2);
    return yPos + 13;
  };

  // ── Helper: grid de datos 2 columnas ──
  const renderGrid = (filas, yPos) => {
    const colW = (W - 28 - 3) / 2;
    const rowH = 13;
    for (let i = 0; i < filas.length; i += 2) {
      const f1 = filas[i];
      const f2 = filas[i + 1];
      const x1 = 14, x2 = 14 + colW + 3;

      doc.setFillColor(...C.gris2);
      rr(x1, yPos, colW, rowH, 1.5, "F");
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...C.zinc400);
      doc.text(f1[0], x1 + 4, yPos + 5);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.blanco);
      const v1 = String(f1[1] ?? "—");
      doc.text(v1.length > 38 ? v1.slice(0, 35) + "…" : v1, x1 + 4, yPos + 10.5);

      if (f2) {
        doc.setFillColor(...C.gris2);
        rr(x2, yPos, colW, rowH, 1.5, "F");
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...C.zinc400);
        doc.text(f2[0], x2 + 4, yPos + 5);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...C.blanco);
        const v2 = String(f2[1] ?? "—");
        doc.text(v2.length > 38 ? v2.slice(0, 35) + "…" : v2, x2 + 4, yPos + 10.5);
      }
      yPos += rowH + 2;
    }
    return yPos;
  };

  // ── SECCIÓN 1: Datos del alumno ──
  y = sectionHeader("DATOS DEL ALUMNO", y);
  y = renderGrid([
    ["Nombre(s)",           user.nombre],
    ["Apellido Paterno",    user.apellido_paterno],
    ["Apellido Materno",    user.apellido_materno],
    ["Número de cuenta",    user.numero_cuenta],
    ["Carrera",             user.carrera],
    ["Correo electrónico",  user.correo],
    ["Sexo",                user.sexo],
    ["Fecha de nacimiento", user.fecha_nacimiento],
    ["Promedio",            user.promedio ? String(user.promedio) : undefined],
    ["ID de usuario",       String(user.id)],
  ], y);
  y += 5;

  // ── SECCIÓN 2: Datos del servicio ──
  y = sectionHeader("SERVICIO SOCIAL ASIGNADO", y);
  const fechaInsc = inscripcion.fecha
    ? new Date(inscripcion.fecha).toLocaleDateString("es-MX") : undefined;
  y = renderGrid([
    ["Nombre del programa", inscripcion.servicio_nombre],
    ["Institución",         inscripcion.nombre_institucion],
    ["Modalidad",           inscripcion.modalidad || "Presencial"],
    ["Área",                inscripcion.area],
    ["Ubicación",           inscripcion.ubicacion],
    ["Turno",               inscripcion.turno],
    ["Fecha de inscripción",fechaInsc],
    ["Estado del contrato", "✓ Firmado y verificado"],
  ], y);
  y += 5;

  // ── SECCIÓN 3: Verificación criptográfica ──
  y = sectionHeader("VERIFICACIÓN CRIPTOGRÁFICA", y);

  // Hash del contrato
  doc.setFillColor(...C.gris2);
  rr(14, y, W - 28, 18, 2, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.zinc400);
  doc.text("Hash SHA-256 del contrato:", 19, y + 6);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.naranja);
  const hash = inscripcion.contrato_hash || "—";
  // Dividir hash en 2 líneas si es necesario
  const mitad = Math.ceil(hash.length / 2);
  if (hash.length > 60) {
    doc.setFontSize(6);
    doc.text(hash.slice(0, mitad), 19, y + 11.5);
    doc.text(hash.slice(mitad), 19, y + 15);
  } else {
    doc.text(hash, 19, y + 12);
  }
  y += 22;

  // Badges de firmas
  const bW = (W - 28 - 3) / 2;
  // Firma alumno
  doc.setFillColor(20, 50, 38);
  rr(14, y, bW, 14, 2, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.esmerald);
  doc.text("✓  Firma del alumno", 14 + bW / 2, y + 6, { align: "center" });
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.zinc400);
  doc.text("RSA-SHA256 verificada", 14 + bW / 2, y + 11, { align: "center" });

  // Firma admin
  doc.setFillColor(60, 30, 8);
  rr(14 + bW + 3, y, bW, 14, 2, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.naranja);
  doc.text("✓  Firma del administrador", 14 + bW + 3 + bW / 2, y + 6, { align: "center" });
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.zinc400);
  doc.text("Contrato validado oficialmente", 14 + bW + 3 + bW / 2, y + 11, { align: "center" });
  y += 18;

  // ── Nota del admin (si existe) ──
  if (inscripcion.nota_admin) {
    y += 3;
    const notaLineas = doc.splitTextToSize(inscripcion.nota_admin, W - 44);
    const notaH = 14 + notaLineas.length * 4.5;
    doc.setFillColor(60, 30, 8);
    rr(14, y, W - 28, notaH, 2, "F");
    doc.setDrawColor(...C.naranja);
    doc.setLineWidth(0.4);
    rr(14, y, W - 28, notaH, 2, "S");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.naranja);
    doc.text("Nota del administrador:", 19, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.zinc300);
    doc.text(notaLineas, 19, y + 13);
    y += notaH + 4;
  }

  // ── Pie de página ──
  const pieY = Math.max(y + 6, 268);
  doc.setDrawColor(...C.gris3);
  doc.setLineWidth(0.25);
  doc.line(14, pieY, W - 14, pieY);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.gris5);
  doc.text(
    "Este documento es generado automáticamente por FeriaSSocial. La autenticidad del contrato puede",
    W / 2, pieY + 5, { align: "center" }
  );
  doc.text(
    "verificarse mediante la llave pública del alumno registrada en el servidor.",
    W / 2, pieY + 9, { align: "center" }
  );
  doc.text(
    "adminserviciosocial@gmail.com  ·  github.com/Alejandro-Vigi/crypto-final-project",
    W / 2, pieY + 13, { align: "center" }
  );

  // Barra naranja bottom
  doc.setFillColor(...C.naranja);
  doc.rect(0, 294.5, W, 2.5, "F");

  doc.save(`comprobante_servicio_social_${user.numero_cuenta || user.id}.pdf`);
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export default function AlumnoView({ user: userProp, onLogout, onGoHome }) {
  const [user, setUser] = useState(userProp);
  const [page, setPage] = useState("catalogo");
  const [areaFilter, setAreaFilter] = useState("Todos");
  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [inscripciones, setInscripciones] = useState([]);
  const [showConfirm, setShowConfirm] = useState(null);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [showEditarPerfil, setShowEditarPerfil] = useState(false);

  const handleActualizarPerfil = (usuarioActualizado) => {
    setUser(usuarioActualizado);
    try {
      const raw = localStorage.getItem("feriass_session");
      if (raw) {
        const session = JSON.parse(raw);
        session.user = usuarioActualizado;
        localStorage.setItem("feriass_session", JSON.stringify(session));
      }
    } catch {}
  };

  const fetchCatalogo = useCallback(async () => {
    setLoadingServicios(true);
    try {
      const res = await fetch(`${API}/api/catalogo`);
      const data = await res.json();
      setServicios(Array.isArray(data) ? data : []);
    } catch {
      setServicios([]);
    } finally {
      setLoadingServicios(false);
    }
  }, []);

  const fetchInscripciones = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/inscripciones/alumno/${user.id}`);
      const data = await res.json();
      setInscripciones(Array.isArray(data) ? data : []);
    } catch {
      setInscripciones([]);
    }
  }, [user.id]);

  useEffect(() => {
    fetchCatalogo();
    fetchInscripciones();
  }, [fetchCatalogo, fetchInscripciones]);

  const areasDisponibles = ["Todos", ...new Set(servicios.map((s) => s.area).filter(Boolean))];
  const serviciosFiltrados =
    areaFilter === "Todos" ? servicios : servicios.filter((s) => s.area === areaFilter);

  const inscripcionActiva = inscripciones.find(
    (i) => i.estado === "pendiente" || i.estado === "firmado"
  );

  const confirmarSolicitud = async () => {
    if (!showConfirm) return;
    setInscribiendo(true);
    try {
      const res = await fetch(`${API}/api/inscripciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumno_id: user.id, servicio_id: showConfirm.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al inscribirse.");
      } else {
        await fetchInscripciones();
        await fetchCatalogo();
      }
    } catch {
      alert("No se pudo conectar al servidor.");
    } finally {
      setInscribiendo(false);
      setShowConfirm(null);
    }
  };

  const cancelarSolicitud = async (inscripcionId) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta solicitud?")) return;
    try {
      const res = await fetch(`${API}/api/inscripciones/${inscripcionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumno_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al cancelar.");
      } else {
        await fetchInscripciones();
        await fetchCatalogo();
      }
    } catch {
      alert("No se pudo conectar al servidor.");
    }
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
        {page === "catalogo" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-white mb-1">Catálogo de Servicios Sociales</h1>
              <p className="text-zinc-400">Explora las plazas disponibles y solicita la que más te interese.</p>
            </div>

            {inscripciones.length > 0 && (
              <div className="mb-8 space-y-3">
                {inscripciones.map((insc) => (
                  <div key={insc.id} className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                      {insc.estado === "firmado" ? (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{insc.servicio_nombre}</p>
                      <p className="text-zinc-400 text-xs">
                        {insc.nombre_institucion} ·{" "}
                        <span className={insc.estado === "firmado" ? "text-emerald-400" : "text-amber-400"}>
                          {insc.estado === "firmado" ? "✓ Firmado" : "⏳ Pendiente de firma"}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {insc.estado === "pendiente" && (
                        <>
                          <button onClick={() => setPage("firma")} className="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs px-3 py-2 rounded-lg transition-all">Firmar →</button>
                          <button onClick={() => cancelarSolicitud(insc.id)} className="border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-xs px-3 py-2 rounded-lg transition-all">Cancelar</button>
                        </>
                      )}
                      {insc.estado === "firmado" && (
                        <button onClick={() => setPage("firma")} className="border border-zinc-700 text-zinc-400 hover:text-white text-xs px-3 py-2 rounded-lg transition-all">Ver contrato</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-8">
              {areasDisponibles.map((a) => (
                <button key={a} onClick={() => setAreaFilter(a)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${areaFilter === a ? "bg-orange-500 text-zinc-950" : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"}`}>
                  {a}
                </button>
              ))}
            </div>

            {loadingServicios ? (
              <div className="flex items-center justify-center py-20 gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <span className="text-zinc-500 text-sm">Cargando catálogo...</span>
              </div>
            ) : serviciosFiltrados.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
                <p className="text-zinc-500 text-sm">No hay servicios disponibles en esta área.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {serviciosFiltrados.map((s) => {
                  const vacantes = (s.lugares_disponibles ?? 0) - (s.lugares_ocupados ?? 0);
                  const yaInscritoAqui = inscripciones.some((i) => i.servicio_id === s.id && i.estado !== "cancelado");
                  const tieneOtra = inscripcionActiva && !yaInscritoAqui;
                  return (
                    <div key={s.id} className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 rounded-2xl p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 group">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="min-w-0">
                          <span className="text-xs text-orange-400 font-medium bg-orange-500/10 px-2 py-0.5 rounded-md">{s.area || "General"}</span>
                          <h3 className="text-white font-bold mt-2">{s.nombre}</h3>
                          <p className="text-zinc-500 text-sm truncate">{s.nombre_institucion}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`text-sm font-bold ${vacantes > 0 ? "text-emerald-400" : "text-red-400"}`}>{vacantes}</span>
                          <p className="text-zinc-600 text-xs">vacante{vacantes !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed flex-1 mb-4">{s.descripcion}</p>
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {s.modalidad && <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-700">{s.modalidad}</span>}
                        {s.turno && <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-700">{s.turno}</span>}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                        <span className="text-zinc-500 text-xs">{s.ubicacion || ""}</span>
                        {yaInscritoAqui ? (
                          <span className="text-xs text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg font-medium">✓ Inscrito</span>
                        ) : (
                          <button onClick={() => setShowConfirm(s)} disabled={tieneOtra || vacantes <= 0}
                            className="bg-orange-500/10 hover:bg-orange-500 border border-orange-500/40 hover:border-orange-500 text-orange-400 hover:text-zinc-950 font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed">
                            {vacantes <= 0 ? "Sin lugares" : "Solicitar"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {page === "firma" && (
          <FirmaArea user={user} inscripciones={inscripciones} onFirmado={fetchInscripciones} />
        )}
      </main>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">Confirmar solicitud</h3>
            <p className="text-zinc-400 text-sm mb-4">¿Deseas solicitar este servicio social?</p>
            <div className="bg-zinc-800 rounded-xl p-3 mb-5">
              <p className="text-white font-semibold">{showConfirm.nombre}</p>
              <p className="text-zinc-400 text-sm">{showConfirm.nombre_institucion}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} disabled={inscribiendo}
                className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarSolicitud} disabled={inscribiendo}
                className="flex-1 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50">
                {inscribiendo ? "Inscribiendo..." : "Confirmar →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditarPerfil && (
        <EditarPerfilModal user={user} onClose={() => setShowEditarPerfil(false)} onActualizado={handleActualizarPerfil} />
      )}

      <Footer user={user} onGoHome={() => setPage("catalogo")} onVerServicios={() => setPage("catalogo")} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ÁREA DE FIRMA RSA
// ─────────────────────────────────────────────────────────────────
function FirmaArea({ user, inscripciones, onFirmado }) {
  const [contraseniaFirma, setContraseniaFirma] = useState("");
  const [firmando, setFirmando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inscripcion = inscripciones[0] || null;

  if (!inscripcion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Aún no tienes un contrato</h2>
        <p className="text-zinc-500 text-sm">Primero solicita un servicio social desde el catálogo.</p>
      </div>
    );
  }

  const yaFirmado = inscripcion.estado === "firmado";
  const puedeDescargar = yaFirmado && !!inscripcion.firma_admin;

  const handleFirmar = async () => {
    if (!contraseniaFirma) return setError("Ingresa tu contraseña para firmar.");
    setFirmando(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`${API}/api/inscripciones/${inscripcion.id}/firmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumno_id: user.id, contrasena: contraseniaFirma }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al firmar el contrato.");
      } else {
        setSuccess("✅ Contrato firmado con éxito. Tu firma RSA fue generada y registrada.");
        setContraseniaFirma("");
        await onFirmado();
      }
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setFirmando(false);
    }
  };

  const handleDescargarPDF = async () => {
    setDescargando(true);
    try {
      await generarComprobantePDF(user, inscripcion);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al generar el comprobante. Intenta de nuevo.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-black text-white mb-1">Mi Firma Digital RSA</h1>
      <p className="text-zinc-400 mb-8">Firma criptográfica real para tu contrato de servicio social.</p>

      {/* Info del contrato */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-white font-bold">Contrato de Servicio Social</h2>
          {yaFirmado && (
            <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">✓ Firmado</span>
          )}
        </div>
        <div className="bg-zinc-800 rounded-xl p-4 text-sm text-zinc-300 space-y-1.5 leading-relaxed font-mono">
          <p className="text-white font-bold">CONTRATO DE SERVICIO SOCIAL</p>
          <p className="text-zinc-500">─────────────────────────────────</p>
          <p><span className="text-zinc-500">Alumno:</span> {user.nombre}</p>
          <p><span className="text-zinc-500">Número de cuenta:</span> {user.numero_cuenta || "N/A"}</p>
          <p><span className="text-zinc-500">Carrera:</span> {user.carrera || "N/A"}</p>
          <p><span className="text-zinc-500">Institución:</span> {inscripcion.nombre_institucion}</p>
          <p><span className="text-zinc-500">Servicio:</span> {inscripcion.servicio_nombre}</p>
          <p><span className="text-zinc-500">Modalidad:</span> {inscripcion.modalidad || "Presencial"}</p>
          <p><span className="text-zinc-500">Fecha:</span> {new Date().toLocaleDateString("es-MX")}</p>
          {yaFirmado && inscripcion.contrato_hash && (
            <>
              <p className="text-zinc-500">─────────────────────────────────</p>
              <p className="text-xs"><span className="text-zinc-500">Hash SHA-256:</span></p>
              <p className="text-orange-400 text-xs break-all">{inscripcion.contrato_hash}</p>
            </>
          )}
        </div>
      </div>

      {/* Pasos */}
      <div className="space-y-4">
        {/* Paso 1 */}
        <div className="bg-zinc-900 border border-orange-500/40 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-zinc-950 flex items-center justify-center text-sm font-bold shrink-0">✓</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Par de llaves RSA generado</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Al registrarte, se generaron tus llaves RSA 2048-bit. La llave pública está registrada en el servidor. Tu llave privada está cifrada con AES-256-GCM.</p>
            </div>
            <span className="text-orange-400 text-xs bg-orange-500/10 px-2 py-1 rounded-lg shrink-0">✓ Listo</span>
          </div>
        </div>

        {/* Paso 2 */}
        <div className={`bg-zinc-900 border rounded-2xl p-5 transition-all ${yaFirmado ? "border-orange-500/40" : "border-zinc-700"}`}>
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${yaFirmado ? "bg-orange-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"}`}>
              {yaFirmado ? "✓" : "2"}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">Firmar el contrato con llave privada</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Tu llave privada se desbloquea temporalmente con tu contraseña para generar la firma RSA. Nunca se almacena en texto plano.</p>
              {!yaFirmado && (
                <div className="mt-3 flex gap-2">
                  <input type="password" placeholder="Tu contraseña para desbloquear la llave privada"
                    value={contraseniaFirma} onChange={(e) => setContraseniaFirma(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFirmar()}
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all" />
                  <button onClick={handleFirmar} disabled={firmando || !contraseniaFirma}
                    className="shrink-0 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50">
                    {firmando ? "Firmando..." : "Firmar"}
                  </button>
                </div>
              )}
              {yaFirmado && <span className="inline-block mt-2 text-orange-400 text-xs bg-orange-500/10 px-2 py-1 rounded-lg">✓ Contrato firmado con RSA-SHA256</span>}
            </div>
          </div>
        </div>

        {/* Paso 3: Verificación admin + descarga PDF */}
        <div className={`bg-zinc-900 border rounded-2xl p-5 transition-all ${!yaFirmado ? "border-zinc-800 opacity-50" : "border-zinc-700"}`}>
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-500 flex items-center justify-center text-sm font-bold shrink-0">3</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">En espera de validación del administrador</h3>
              <p className="text-zinc-500 text-xs mt-0.5">El administrador puede verificar y firmar tu contrato con su propia llave RSA.</p>

              {yaFirmado && inscripcion.firma_admin && (
                <span className="inline-block mt-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  ✓ Validado y firmado por el Administrador
                </span>
              )}
              {yaFirmado && !inscripcion.firma_admin && (
                <span className="inline-block mt-2 text-amber-400 text-xs bg-amber-500/10 px-2 py-1 rounded-lg">
                  ⏳ Esperando firma del administrador
                </span>
              )}

              {/* Nota del admin */}
              {yaFirmado && inscripcion.nota_admin && (
                <div className="mt-3 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
                  <p className="text-orange-400 text-xs font-bold mb-1">📝 Nota del administrador:</p>
                  <p className="text-zinc-300 text-sm leading-relaxed">{inscripcion.nota_admin}</p>
                </div>
              )}

              {/* Botón descargar PDF — solo cuando ambas firmas están completas */}
              {puedeDescargar && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-zinc-500 text-xs mb-3">Tu contrato está completamente validado. Descarga tu comprobante oficial en PDF.</p>
                  <button
                    onClick={handleDescargarPDF}
                    disabled={descargando}
                    className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {descargando ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                        Generando comprobante...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Descargar comprobante PDF
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">⚠️ {error}</div>
      )}
      {success && (
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm">{success}</div>
      )}
    </div>
  );
}