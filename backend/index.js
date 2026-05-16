const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ─── UTILIDADES DE CRIPTOGRAFÍA ──────────────────────────────────────────────

function derivarClave(contrasena, salt = null) {
  const s = salt ?? crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(contrasena, s, 310_000, 32, 'sha256');
  return { key, salt: s };
}

function aesEncrypt(plaintext, contrasena) {
  const { key, salt } = derivarClave(contrasena);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, enc]).toString('base64');
}

function aesDecrypt(b64, contrasena) {
  const buf = Buffer.from(b64, 'base64');
  const salt = buf.subarray(0, 32);
  const iv = buf.subarray(32, 44);
  const tag = buf.subarray(44, 60);
  const enc = buf.subarray(60);
  const { key } = derivarClave(contrasena, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function generarParLlaves() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

function firmarTexto(texto, llavePrivadaPem) {
  const sign = crypto.createSign('SHA256');
  sign.update(texto);
  sign.end();
  return sign.sign(llavePrivadaPem, 'base64');
}

function verificarFirma(texto, firmaB64, llavePublicaPem) {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(texto);
    verify.end();
    return verify.verify(llavePublicaPem, firmaB64, 'base64');
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// AUTH — REGISTRO
// ─────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const {
    nombre, apellido_paterno, apellido_materno,
    correo, contrasena, tipo,
    numero_cuenta, carrera, nombre_empresa,
    sexo, fecha_nacimiento, promedio
  } = req.body;

  if (tipo === 'admin') {
    return res.status(403).json({ error: 'No está permitido registrar administradores por esta vía.' });
  }
  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos.' });
  }
  if (contrasena.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const existe = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo);
    if (existe) return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });

    const hashContrasena = await bcrypt.hash(contrasena, 12);
    const { publicKey, privateKey } = generarParLlaves();
    const llavePrivadaCifrada = aesEncrypt(privateKey, contrasena);

    const stmt = db.prepare(`
      INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, correo, contrasena, tipo,
        numero_cuenta, carrera, nombre_empresa, llave_publica, llave_privada_enc,
        sexo, fecha_nacimiento, promedio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      nombre, apellido_paterno || null, apellido_materno || null,
      correo, hashContrasena, tipo || 'alumno',
      numero_cuenta || null, carrera || null, nombre_empresa || null,
      publicKey, llavePrivadaCifrada,
      sexo || null, fecha_nacimiento || null, promedio || null
    );

    res.status(201).json({
      usuario: {
        id: info.lastInsertRowid, nombre, apellido_paterno, apellido_materno,
        correo, tipo: tipo || 'alumno',
        numero_cuenta: numero_cuenta || null,
        carrera: carrera || null,
        nombre_empresa: nombre_empresa || null,
        sexo: sexo || null,
        fecha_nacimiento: fecha_nacimiento || null,
        promedio: promedio || null,
        tiene_llaves: true,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno al registrar.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// AUTH — LOGIN
// ─────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const usuario = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo);
    if (!usuario) return res.status(400).json({ error: 'Correo o contraseña incorrectos.' });

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) return res.status(400).json({ error: 'Correo o contraseña incorrectos.' });

    res.json({
      usuario: {
        id: usuario.id, nombre: usuario.nombre,
        apellido_paterno: usuario.apellido_paterno,
        apellido_materno: usuario.apellido_materno,
        correo: usuario.correo,
        tipo: usuario.tipo, numero_cuenta: usuario.numero_cuenta,
        carrera: usuario.carrera, nombre_empresa: usuario.nombre_empresa,
        sexo: usuario.sexo,
        fecha_nacimiento: usuario.fecha_nacimiento,
        promedio: usuario.promedio,
        tiene_llaves: !!usuario.llave_publica,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// USUARIO — ACTUALIZAR PERFIL (alumno o admin)
// ─────────────────────────────────────────────────────────────────
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const {
    contrasena_actual,
    nueva_contrasena,
    nombre, apellido_paterno, apellido_materno,
    correo, numero_cuenta, carrera,
    sexo, fecha_nacimiento, promedio
  } = req.body;

  try {
    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const match = await bcrypt.compare(contrasena_actual, usuario.contrasena);
    if (!match) return res.status(403).json({ error: 'Contraseña actual incorrecta.' });

    // Verificar si nuevo correo ya existe (de otro usuario)
    if (correo && correo !== usuario.correo) {
      const existeCorreo = db.prepare('SELECT id FROM usuarios WHERE correo = ? AND id != ?').get(correo, id);
      if (existeCorreo) return res.status(400).json({ error: 'Ese correo ya está en uso.' });
    }

    let hashNuevaContrasena = usuario.contrasena;
    let nuevaLlavePrivadaCifrada = usuario.llave_privada_enc;

    if (nueva_contrasena) {
      if (nueva_contrasena.length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      hashNuevaContrasena = await bcrypt.hash(nueva_contrasena, 12);

      // Re-cifrar llave privada con la nueva contraseña si existe
      if (usuario.llave_privada_enc) {
        try {
          const llavePrivadaPlana = aesDecrypt(usuario.llave_privada_enc, contrasena_actual);
          nuevaLlavePrivadaCifrada = aesEncrypt(llavePrivadaPlana, nueva_contrasena);
        } catch {}
      }
    }

    if (usuario.tipo === 'admin') {
      db.prepare(`
        UPDATE usuarios SET nombre = ?, correo = ?, contrasena = ?, llave_privada_enc = ? WHERE id = ?
      `).run(
        nombre || usuario.nombre,
        correo || usuario.correo,
        hashNuevaContrasena,
        nuevaLlavePrivadaCifrada,
        id
      );
    } else {
      db.prepare(`
        UPDATE usuarios SET
          nombre = ?, apellido_paterno = ?, apellido_materno = ?,
          correo = ?, numero_cuenta = ?, carrera = ?,
          sexo = ?, fecha_nacimiento = ?, promedio = ?,
          contrasena = ?, llave_privada_enc = ?
        WHERE id = ?
      `).run(
        nombre || usuario.nombre,
        apellido_paterno !== undefined ? apellido_paterno : usuario.apellido_paterno,
        apellido_materno !== undefined ? apellido_materno : usuario.apellido_materno,
        correo || usuario.correo,
        numero_cuenta !== undefined ? numero_cuenta : usuario.numero_cuenta,
        carrera !== undefined ? carrera : usuario.carrera,
        sexo !== undefined ? sexo : usuario.sexo,
        fecha_nacimiento !== undefined ? fecha_nacimiento : usuario.fecha_nacimiento,
        promedio !== undefined ? promedio : usuario.promedio,
        hashNuevaContrasena,
        nuevaLlavePrivadaCifrada,
        id
      );
    }

    const actualizado = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    res.json({
      ok: true,
      usuario: {
        id: actualizado.id, nombre: actualizado.nombre,
        apellido_paterno: actualizado.apellido_paterno,
        apellido_materno: actualizado.apellido_materno,
        correo: actualizado.correo, tipo: actualizado.tipo,
        numero_cuenta: actualizado.numero_cuenta,
        carrera: actualizado.carrera,
        sexo: actualizado.sexo,
        fecha_nacimiento: actualizado.fecha_nacimiento,
        promedio: actualizado.promedio,
        tiene_llaves: !!actualizado.llave_publica,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno al actualizar.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ALUMNO — OBTENER LLAVE PRIVADA DESCIFRADA
// ─────────────────────────────────────────────────────────────────
app.post('/api/usuarios/:id/llave-privada', async (req, res) => {
  const { id } = req.params;
  const { contrasena } = req.body;

  try {
    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) return res.status(403).json({ error: 'Contraseña incorrecta.' });

    if (!usuario.llave_privada_enc) {
      return res.status(404).json({ error: 'No tienes llaves RSA generadas.' });
    }

    const llavePrivada = aesDecrypt(usuario.llave_privada_enc, contrasena);
    res.json({ llavePrivada });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al recuperar la llave privada.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ALUMNO — FIRMAR CONTRATO
// ─────────────────────────────────────────────────────────────────
app.post('/api/inscripciones/:id/firmar', async (req, res) => {
  const { id } = req.params;
  const { alumno_id, contrasena } = req.body;

  try {
    const inscripcion = db.prepare('SELECT * FROM inscripciones WHERE id = ? AND alumno_id = ?').get(id, alumno_id);
    if (!inscripcion) return res.status(404).json({ error: 'Inscripción no encontrada.' });
    if (inscripcion.estado === 'firmado') return res.status(400).json({ error: 'El contrato ya fue firmado.' });

    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(alumno_id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) return res.status(403).json({ error: 'Contraseña incorrecta.' });

    if (!usuario.llave_privada_enc) {
      return res.status(400).json({ error: 'No tienes llaves RSA generadas.' });
    }

    const servicio = db.prepare('SELECT * FROM servicios_sociales WHERE id = ?').get(inscripcion.servicio_id);

    const contratoTexto = [
      'CONTRATO DE SERVICIO SOCIAL',
      '─────────────────────────────────',
      `Alumno: ${usuario.nombre}`,
      `Número de cuenta: ${usuario.numero_cuenta || 'N/A'}`,
      `Carrera: ${usuario.carrera || 'N/A'}`,
      `Institución: ${servicio.nombre_institucion}`,
      `Servicio: ${servicio.nombre}`,
      `Modalidad: ${servicio.modalidad || 'Presencial'}`,
      `Fecha de solicitud: ${inscripcion.fecha}`,
      `ID Inscripción: ${inscripcion.id}`,
      '─────────────────────────────────',
      'El alumno se compromete a cumplir con las actividades y horarios establecidos.',
    ].join('\n');

    const contratoHash = crypto.createHash('sha256').update(contratoTexto).digest('hex');
    const llavePrivada = aesDecrypt(usuario.llave_privada_enc, contrasena);
    const firma = firmarTexto(contratoTexto, llavePrivada);

    db.prepare(`
      UPDATE inscripciones SET
        estado = 'firmado',
        firma_alumno = ?,
        contrato_hash = ?,
        contrato_texto = ?
      WHERE id = ?
    `).run(firma, contratoHash, contratoTexto, id);

    res.json({
      ok: true,
      msg: 'Contrato firmado correctamente.',
      contratoHash,
      firma: firma.substring(0, 40) + '...',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al firmar el contrato.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN — FIRMAR (validar) CONTRATO CON NOTA OBLIGATORIA
// ─────────────────────────────────────────────────────────────────
app.post('/api/admin/inscripciones/:id/firmar', async (req, res) => {
  const { id } = req.params;
  const { admin_id, contrasena, nota_admin } = req.body;

  if (!nota_admin || nota_admin.trim() === '') {
    return res.status(400).json({ error: 'Debes agregar una nota antes de firmar el contrato.' });
  }

  try {
    const admin = db.prepare("SELECT * FROM usuarios WHERE id = ? AND tipo = 'admin'").get(admin_id);
    if (!admin) return res.status(403).json({ error: 'Acceso denegado.' });

    const match = await bcrypt.compare(contrasena, admin.contrasena);
    if (!match) return res.status(403).json({ error: 'Contraseña incorrecta.' });

    const inscripcion = db.prepare('SELECT * FROM inscripciones WHERE id = ?').get(id);
    if (!inscripcion) return res.status(404).json({ error: 'Inscripción no encontrada.' });
    if (inscripcion.estado !== 'firmado') {
      return res.status(400).json({ error: 'El contrato debe estar firmado por el alumno primero.' });
    }
    if (inscripcion.firma_admin) {
      return res.status(400).json({ error: 'El admin ya firmó este contrato.' });
    }

    let llavePrivadaAdmin;
    if (!admin.llave_privada_enc) {
      const { publicKey, privateKey } = generarParLlaves();
      const llavePrivadaCifrada = aesEncrypt(privateKey, contrasena);
      db.prepare('UPDATE usuarios SET llave_publica = ?, llave_privada_enc = ? WHERE id = ?')
        .run(publicKey, llavePrivadaCifrada, admin_id);
      llavePrivadaAdmin = privateKey;
    } else {
      llavePrivadaAdmin = aesDecrypt(admin.llave_privada_enc, contrasena);
    }

    const textoAdmin = `VALIDADO_POR_ADMIN:${inscripcion.contrato_hash}:${admin.nombre}:${new Date().toISOString()}`;
    const firmaAdmin = firmarTexto(textoAdmin, llavePrivadaAdmin);

    db.prepare('UPDATE inscripciones SET firma_admin = ?, nota_admin = ? WHERE id = ?')
      .run(firmaAdmin, nota_admin.trim(), id);

    res.json({ ok: true, msg: 'Contrato validado y firmado por el administrador.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al firmar como administrador.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// VERIFICACIÓN REAL DE FIRMA RSA
// ─────────────────────────────────────────────────────────────────
app.post('/api/inscripciones/:id/verificar', (req, res) => {
  const { id } = req.params;

  try {
    const inscripcion = db.prepare('SELECT * FROM inscripciones WHERE id = ?').get(id);
    if (!inscripcion) return res.status(404).json({ error: 'Inscripción no encontrada.' });

    if (!inscripcion.firma_alumno || !inscripcion.contrato_texto) {
      return res.json({ valida: false, motivo: 'No hay firma registrada para este contrato.' });
    }

    const alumno = db.prepare('SELECT llave_publica FROM usuarios WHERE id = ?').get(inscripcion.alumno_id);
    if (!alumno?.llave_publica) {
      return res.json({ valida: false, motivo: 'No se encontró la llave pública del alumno.' });
    }

    const valida = verificarFirma(inscripcion.contrato_texto, inscripcion.firma_alumno, alumno.llave_publica);

    res.json({
      valida,
      motivo: valida ? 'La firma RSA es auténtica.' : 'La firma no coincide con la llave pública del alumno.',
      contratoHash: inscripcion.contrato_hash,
      tieneFiremaAdmin: !!inscripcion.firma_admin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar la firma.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// VERIFICACIÓN — LISTAR INSCRIPCIONES (Admin) — con datos completos del alumno
// ─────────────────────────────────────────────────────────────────
app.get('/api/empresa/inscripciones', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT i.id, u.nombre AS alumno, u.apellido_paterno, u.apellido_materno,
             u.numero_cuenta, u.carrera, u.correo AS correo_alumno,
             u.sexo, u.fecha_nacimiento, u.promedio,
             s.nombre AS servicio, s.nombre_institucion AS empresa,
             s.id AS servicio_id, s.area, s.modalidad,
             i.estado, i.firma_alumno, i.firma_admin, i.nota_admin,
             i.contrato_hash, i.contrato_texto, i.fecha
      FROM inscripciones i
      JOIN usuarios u ON i.alumno_id = u.id
      JOIN servicios_sociales s ON i.servicio_id = s.id
      WHERE i.estado != 'cancelado'
      ORDER BY i.fecha DESC
    `).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener inscripciones' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ALUMNO — CANCELAR INSCRIPCIÓN
// ─────────────────────────────────────────────────────────────────
app.delete('/api/inscripciones/:id', async (req, res) => {
  const { id } = req.params;
  const { alumno_id } = req.body;

  try {
    const inscripcion = db.prepare('SELECT * FROM inscripciones WHERE id = ? AND alumno_id = ?').get(id, alumno_id);
    if (!inscripcion) return res.status(404).json({ error: 'Inscripción no encontrada.' });

    if (inscripcion.estado === 'firmado') {
      return res.status(400).json({ error: 'No puedes cancelar un contrato ya firmado.' });
    }

    db.prepare("UPDATE inscripciones SET estado = 'cancelado' WHERE id = ?").run(id);
    db.prepare('UPDATE servicios_sociales SET lugares_ocupados = MAX(0, lugares_ocupados - 1) WHERE id = ?')
      .run(inscripcion.servicio_id);

    res.json({ ok: true, msg: 'Solicitud cancelada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cancelar la solicitud.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// INSCRIPCIONES DEL ALUMNO
// ─────────────────────────────────────────────────────────────────
app.get('/api/inscripciones/alumno/:alumno_id', (req, res) => {
  const { alumno_id } = req.params;
  try {
    const rows = db.prepare(`
      SELECT i.id, i.estado, i.contrato_hash, i.firma_alumno, i.firma_admin, i.nota_admin, i.fecha,
             s.nombre AS servicio_nombre, s.nombre_institucion, s.modalidad, s.turno, s.area,
             s.id AS servicio_id
      FROM inscripciones i
      JOIN servicios_sociales s ON i.servicio_id = s.id
      WHERE i.alumno_id = ? AND i.estado != 'cancelado'
      ORDER BY i.fecha DESC
    `).all(alumno_id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener inscripciones.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// INSCRIPCIONES — ALUMNO SOLICITA UN SERVICIO
// ─────────────────────────────────────────────────────────────────
app.post('/api/inscripciones', (req, res) => {
  const { alumno_id, servicio_id } = req.body;
  try {
    const activa = db.prepare(`
      SELECT id FROM inscripciones 
      WHERE alumno_id = ? AND servicio_id = ? AND estado != 'cancelado'
    `).get(alumno_id, servicio_id);
    if (activa) return res.status(400).json({ error: 'Ya tienes una solicitud activa en este servicio.' });

    const servicio = db.prepare('SELECT * FROM servicios_sociales WHERE id = ?').get(servicio_id);
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado.' });
    if (servicio.lugares_ocupados >= servicio.lugares_disponibles) {
      return res.status(400).json({ error: 'No hay lugares disponibles en este servicio.' });
    }

    const info = db.prepare(`
      INSERT INTO inscripciones (alumno_id, servicio_id) VALUES (?, ?)
    `).run(alumno_id, servicio_id);
    db.prepare('UPDATE servicios_sociales SET lugares_ocupados = lugares_ocupados + 1 WHERE id = ?').run(servicio_id);
    res.status(201).json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al inscribirse.' });
  }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN — Servicios, estadísticas, catálogo
// ─────────────────────────────────────────────────────────────────
app.post('/api/admin/servicios', (req, res) => {
  const { admin_id, nombre, nombre_institucion, nombre_responsable, correo_contacto,
    lugares_disponibles, lista_actividades, modalidad, ubicacion, turno, area, descripcion } = req.body;
  try {
    const v = db.prepare("SELECT tipo FROM usuarios WHERE id = ?").get(admin_id);
    if (!v || v.tipo !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    if (!nombre || !nombre_institucion || !nombre_responsable || !correo_contacto || lugares_disponibles === undefined) {
      return res.status(400).json({ error: 'Por favor, llena los campos obligatorios.' });
    }
    const info = db.prepare(`
      INSERT INTO servicios_sociales (empresa_id, nombre, nombre_institucion, nombre_responsable,
        correo_contacto, lugares_disponibles, lugares_ocupados, lista_actividades, modalidad,
        ubicacion, turno, area, descripcion, activo)
      VALUES (NULL, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 1)
    `).run(nombre, nombre_institucion, nombre_responsable, correo_contacto,
      parseInt(lugares_disponibles) || 0, lista_actividades || '', modalidad || 'Presencial',
      ubicacion || '', turno || '', area || '', descripcion || '');
    res.status(201).json({ ok: true, msg: 'Servicio registrado.', id: info.lastInsertRowid });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno.' }); }
});

app.put('/api/admin/servicios/:id', (req, res) => {
  const { id } = req.params;
  const { admin_id, nombre, nombre_institucion, nombre_responsable, correo_contacto,
    lugares_disponibles, lista_actividades, modalidad, ubicacion, turno, area, descripcion, activo } = req.body;
  try {
    const v = db.prepare("SELECT tipo FROM usuarios WHERE id = ?").get(admin_id);
    if (!v || v.tipo !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    db.prepare(`UPDATE servicios_sociales SET nombre=?,nombre_institucion=?,nombre_responsable=?,
      correo_contacto=?,lugares_disponibles=?,lista_actividades=?,modalidad=?,ubicacion=?,
      turno=?,area=?,descripcion=?,activo=? WHERE id=?`)
      .run(nombre, nombre_institucion, nombre_responsable, correo_contacto,
        parseInt(lugares_disponibles) || 0, lista_actividades || '', modalidad || 'Presencial',
        ubicacion || '', turno || '', area || '', descripcion || '', activo ?? 1, id);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno.' }); }
});

app.get('/api/admin/servicios', (req, res) => {
  const { admin_id } = req.query;
  try {
    const v = db.prepare("SELECT tipo FROM usuarios WHERE id = ?").get(admin_id);
    if (!v || v.tipo !== 'admin') return res.status(403).json({ error: 'Acceso denegado.' });
    const rows = db.prepare(`
      SELECT s.*, (SELECT COUNT(*) FROM inscripciones i WHERE i.servicio_id = s.id AND i.estado != 'cancelado') AS inscritos
      FROM servicios_sociales s ORDER BY s.id DESC
    `).all();
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error.' }); }
});

app.get('/api/catalogo', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, nombre, nombre_institucion, nombre_responsable, correo_contacto,
             lugares_disponibles, lugares_ocupados, lista_actividades,
             modalidad, ubicacion, turno, area, descripcion
      FROM servicios_sociales
      WHERE activo = 1 AND lugares_disponibles > lugares_ocupados
      ORDER BY id DESC
    `).all();
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error.' }); }
});

app.get('/api/estadisticas', (req, res) => {
  try {
    const totalInstituciones = db.prepare("SELECT COUNT(DISTINCT nombre_institucion) AS total FROM servicios_sociales WHERE activo = 1").get().total || 0;
    const totalVacantes = db.prepare("SELECT SUM(lugares_disponibles - lugares_ocupados) AS total FROM servicios_sociales WHERE activo = 1").get().total || 0;
    const totalInscritos = db.prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE estado != 'cancelado'").get().total || 0;
    const contratosFirmados = db.prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE estado = 'firmado'").get().total || 0;
    const pendientes = db.prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE estado = 'pendiente'").get().total || 0;
    const totalServicios = db.prepare("SELECT COUNT(*) AS total FROM servicios_sociales WHERE activo = 1").get().total || 0;
    const porArea = db.prepare(`
      SELECT s.area AS area, COUNT(i.id) AS total FROM inscripciones i
      JOIN servicios_sociales s ON i.servicio_id = s.id
      WHERE s.area IS NOT NULL AND s.area != '' AND i.estado != 'cancelado'
      GROUP BY s.area ORDER BY total DESC LIMIT 6
    `).all();
    const recientes = db.prepare(`
      SELECT u.nombre AS alumno, s.nombre AS servicio, i.fecha, i.estado FROM inscripciones i
      JOIN usuarios u ON i.alumno_id = u.id
      JOIN servicios_sociales s ON i.servicio_id = s.id
      WHERE i.estado != 'cancelado'
      ORDER BY i.fecha DESC LIMIT 5
    `).all();
    res.json({ empresas: totalInstituciones, vacantes: totalVacantes, total_inscritos: totalInscritos,
      contratos_firmados: contratosFirmados, pendientes, total_servicios: totalServicios, por_area: porArea, recientes });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error.' }); }
});

app.get('/api/estadisticas/servicio/:id', (req, res) => {
  const { id } = req.params;
  try {
    const servicio = db.prepare('SELECT * FROM servicios_sociales WHERE id = ?').get(id);
    if (!servicio) return res.status(404).json({ error: 'Servicio no encontrado.' });
    const inscritos = db.prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE servicio_id = ? AND estado != 'cancelado'").get(id).total || 0;
    const firmados = db.prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE servicio_id = ? AND estado = 'firmado'").get(id).total || 0;
    const pendientes = db.prepare("SELECT COUNT(*) AS total FROM inscripciones WHERE servicio_id = ? AND estado = 'pendiente'").get(id).total || 0;
    const recientes = db.prepare(`
      SELECT u.nombre AS alumno, i.fecha, i.estado FROM inscripciones i
      JOIN usuarios u ON i.alumno_id = u.id
      WHERE i.servicio_id = ? AND i.estado != 'cancelado' ORDER BY i.fecha DESC LIMIT 5
    `).all(id);
    res.json({ servicio, inscritos, firmados, pendientes, recientes });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error.' }); }
});

app.get('/', (req, res) => res.json({ ok: true, msg: 'Backend FeriaSSocial — RSA + AES + bcrypt activos' }));

app.listen(3001, () => console.log('Backend en http://localhost:3001'));