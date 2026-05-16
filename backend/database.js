const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const db = new Database('servicio_social.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('alumno', 'empresa', 'admin')),
    numero_cuenta TEXT,
    carrera TEXT,
    nombre_empresa TEXT,
    llave_publica TEXT,
    llave_privada_enc TEXT,
    fecha_registro TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS servicios_sociales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER,
    nombre TEXT NOT NULL,
    nombre_institucion TEXT NOT NULL,
    nombre_responsable TEXT NOT NULL,
    correo_contacto TEXT NOT NULL,
    lugares_disponibles INTEGER NOT NULL,
    lugares_ocupados INTEGER DEFAULT 0,
    lista_actividades TEXT,
    modalidad TEXT,
    ubicacion TEXT,
    turno TEXT,
    descripcion TEXT,
    activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS inscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL REFERENCES usuarios(id),
    servicio_id INTEGER NOT NULL REFERENCES servicios_sociales(id),
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'firmado', 'rechazado', 'cancelado')),
    contrato_hash TEXT,
    firma_alumno TEXT,
    firma_admin TEXT,
    nota_admin TEXT,
    fecha TEXT DEFAULT (datetime('now'))
  );
`);

// Migraciones automáticas seguras
const migraciones = [
  "ALTER TABLE servicios_sociales ADD COLUMN area TEXT DEFAULT ''",
  "ALTER TABLE usuarios ADD COLUMN llave_privada_enc TEXT",
  "ALTER TABLE inscripciones ADD COLUMN firma_admin TEXT",
  "ALTER TABLE inscripciones ADD COLUMN contrato_texto TEXT",
  "ALTER TABLE inscripciones ADD COLUMN nota_admin TEXT",
  // Campos extra del alumno
  "ALTER TABLE usuarios ADD COLUMN apellido_paterno TEXT",
  "ALTER TABLE usuarios ADD COLUMN apellido_materno TEXT",
  "ALTER TABLE usuarios ADD COLUMN sexo TEXT",
  "ALTER TABLE usuarios ADD COLUMN fecha_nacimiento TEXT",
  "ALTER TABLE usuarios ADD COLUMN promedio TEXT",
];
for (const sql of migraciones) {
  try { db.exec(sql); } catch {}
}

// Crear admin único con contraseña hasheada
try {
  const adminExiste = db.prepare("SELECT id FROM usuarios WHERE tipo = 'admin'").get();
  if (!adminExiste) {
    console.log('ℹ️  Creando cuenta de administrador único...');
    const hash = bcrypt.hashSync('PasswdTemp2026', 12);
    db.prepare(`
      INSERT INTO usuarios (nombre, correo, contrasena, tipo)
      VALUES (?, ?, ?, 'admin')
    `).run('Administrador General', 'adminserviciosocial@gmail.com', hash);
    console.log('Admin creado. Contraseña: PasswdTemp2026');
  }
} catch (err) {
  console.error('Error al inicializar admin:', err);
}

module.exports = db;