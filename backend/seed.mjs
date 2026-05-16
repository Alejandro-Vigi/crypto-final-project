/**
 * seed.js — Script de datos de ejemplo para FeriaSSocial
 * ─────────────────────────────────────────────────────────
 * UBICACION: coloca este archivo dentro de la carpeta backend/
 *
 * USO:
 *   1. Arranca el servidor al menos UNA VEZ (npm run dev:all) para que
 *      la base de datos y las migraciones se creen.
 *   2. Detén el servidor (Ctrl + C).
 *   3. Desde la RAIZ del proyecto ejecuta:
 *        node backend/seed.js
 *   4. Vuelve a iniciar: npm run dev:all
 *
 * CONTRASENA de todos los alumnos de ejemplo: Alumno2026!
 */

import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// createRequire permite cargar modulos CommonJS (better-sqlite3, bcrypt) desde ESM
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

// __dirname equivalente en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// La BD esta en la misma carpeta que este script (backend/)
const DB_PATH = path.join(__dirname, 'servicio_social.db');

let db;
try {
  db = new Database(DB_PATH);
} catch (err) {
  console.error('\nERROR: No se pudo abrir la base de datos en:', DB_PATH);
  console.error('  Asegurate de haber ejecutado "npm run dev:all" al menos una vez.');
  console.error('  Detalle:', err.message, '\n');
  process.exit(1);
}

// ── Utilidades de criptografia (misma implementacion que index.js) ────────

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

function generarParLlaves() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

const CONTRASENA_EJEMPLO = 'Alumno2026!';

// ─────────────────────────────────────────────────────────────────────────────
// 15 ALUMNOS DE EJEMPLO
// ─────────────────────────────────────────────────────────────────────────────
const alumnos = [
  { nombre: 'Sofia',     apellido_paterno: 'Ramirez',   apellido_materno: 'Luna',      correo: 'sofia.ramirez@alumno.unam.mx',    numero_cuenta: '318045621', carrera: 'Ingenieria en Computacion',        sexo: 'Femenino',  fecha_nacimiento: '12/03/2002', promedio: '9.2' },
  { nombre: 'Diego',     apellido_paterno: 'Hernandez', apellido_materno: 'Vega',      correo: 'diego.hernandez@alumno.unam.mx',  numero_cuenta: '317089342', carrera: 'Ingenieria Industrial',             sexo: 'Masculino', fecha_nacimiento: '25/07/2001', promedio: '8.7' },
  { nombre: 'Valeria',   apellido_paterno: 'Torres',    apellido_materno: 'Mendoza',   correo: 'valeria.torres@alumno.unam.mx',   numero_cuenta: '319123987', carrera: 'Ingenieria Ambiental',              sexo: 'Femenino',  fecha_nacimiento: '08/11/2002', promedio: '9.5' },
  { nombre: 'Carlos',    apellido_paterno: 'Jimenez',   apellido_materno: 'Soto',      correo: 'carlos.jimenez@alumno.unam.mx',   numero_cuenta: '316054218', carrera: 'Ingenieria Mecanica',               sexo: 'Masculino', fecha_nacimiento: '30/04/2000', promedio: '8.1' },
  { nombre: 'Mariana',   apellido_paterno: 'Lopez',     apellido_materno: 'Fuentes',   correo: 'mariana.lopez@alumno.unam.mx',    numero_cuenta: '318076543', carrera: 'Ingenieria Civil',                  sexo: 'Femenino',  fecha_nacimiento: '14/09/2001', promedio: '9.0' },
  { nombre: 'Andres',    apellido_paterno: 'Gonzalez',  apellido_materno: 'Reyes',     correo: 'andres.gonzalez@alumno.unam.mx',  numero_cuenta: '317034561', carrera: 'Ingenieria Mecatronica',            sexo: 'Masculino', fecha_nacimiento: '02/06/2001', promedio: '8.4' },
  { nombre: 'Fernanda',  apellido_paterno: 'Morales',   apellido_materno: 'Castillo',  correo: 'fernanda.morales@alumno.unam.mx', numero_cuenta: '319087234', carrera: 'Ingenieria en Telecomunicaciones',  sexo: 'Femenino',  fecha_nacimiento: '19/01/2003', promedio: '9.3' },
  { nombre: 'Miguel',    apellido_paterno: 'Vargas',    apellido_materno: 'Ortiz',     correo: 'miguel.vargas@alumno.unam.mx',    numero_cuenta: '316098712', carrera: 'Ingenieria Electrica Electronica',  sexo: 'Masculino', fecha_nacimiento: '07/08/2000', promedio: '7.9' },
  { nombre: 'Camila',    apellido_paterno: 'Nunez',     apellido_materno: 'Ibarra',    correo: 'camila.nunez@alumno.unam.mx',     numero_cuenta: '318054321', carrera: 'Ingenieria Geologica',              sexo: 'Femenino',  fecha_nacimiento: '23/12/2001', promedio: '8.8' },
  { nombre: 'Rodrigo',   apellido_paterno: 'Perez',     apellido_materno: 'Alvarado',  correo: 'rodrigo.perez@alumno.unam.mx',    numero_cuenta: '317012876', carrera: 'Ingenieria Petrolera',              sexo: 'Masculino', fecha_nacimiento: '15/05/2001', promedio: '8.6' },
  { nombre: 'Daniela',   apellido_paterno: 'Sanchez',   apellido_materno: 'Rios',      correo: 'daniela.sanchez@alumno.unam.mx',  numero_cuenta: '319045678', carrera: 'Ingenieria en Sistemas Biomedicos', sexo: 'Femenino',  fecha_nacimiento: '03/03/2002', promedio: '9.1' },
  { nombre: 'Sebastian', apellido_paterno: 'Flores',    apellido_materno: 'Guerrero',  correo: 'sebastian.flores@alumno.unam.mx', numero_cuenta: '316078923', carrera: 'Ingenieria Aeroespacial',           sexo: 'Masculino', fecha_nacimiento: '28/10/2000', promedio: '8.3' },
  { nombre: 'Lucia',     apellido_paterno: 'Aguilar',   apellido_materno: 'Dominguez', correo: 'lucia.aguilar@alumno.unam.mx',    numero_cuenta: '318032145', carrera: 'Ingenieria Geomatica',              sexo: 'Femenino',  fecha_nacimiento: '11/02/2002', promedio: '9.4' },
  { nombre: 'Emilio',    apellido_paterno: 'Medina',    apellido_materno: 'Espinoza',  correo: 'emilio.medina@alumno.unam.mx',    numero_cuenta: '317065432', carrera: 'Ingenieria de Minas y Metalurgia',  sexo: 'Masculino', fecha_nacimiento: '17/07/2001', promedio: '7.8' },
  { nombre: 'Natalia',   apellido_paterno: 'Cruz',      apellido_materno: 'Paredes',   correo: 'natalia.cruz@alumno.unam.mx',     numero_cuenta: '319098543', carrera: 'Ingenieria Geofisica',              sexo: 'Femenino',  fecha_nacimiento: '05/09/2002', promedio: '8.9' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 10 SERVICIOS SOCIALES DE INSTITUCIONES REALES
// ─────────────────────────────────────────────────────────────────────────────
const servicios = [
  {
    nombre: 'Apoyo en Proyectos de Infraestructura Digital',
    nombre_institucion: 'Secretaria de Infraestructura, Comunicaciones y Transportes (SICT)',
    nombre_responsable: 'Ing. Roberto Angeles Monroy',
    correo_contacto: 'servicio.social@sct.gob.mx',
    lugares_disponibles: 8,
    lista_actividades: 'Levantamiento de datos de conectividad, apoyo en SIG, elaboracion de reportes tecnicos, soporte a proyectos de fibra optica',
    modalidad: 'Hibrida', ubicacion: 'Av. Xola y Av. Universidad s/n, Benito Juarez, CDMX', turno: 'Matutino', area: 'Telecomunicaciones',
    descripcion: 'Participacion en proyectos de modernizacion de infraestructura digital del pais, apoyando equipos tecnicos en la implementacion de conectividad en zonas prioritarias.',
  },
  {
    nombre: 'Soporte Tecnico y Desarrollo de Sistemas',
    nombre_institucion: 'Instituto Mexicano del Seguro Social (IMSS)',
    nombre_responsable: 'Lic. Carmen Vazquez Herrera',
    correo_contacto: 'coordinacion.ss@imss.gob.mx',
    lugares_disponibles: 12,
    lista_actividades: 'Soporte a sistemas internos, mantenimiento de bases de datos, atencion a usuarios, analisis de requerimientos, documentacion tecnica',
    modalidad: 'Presencial', ubicacion: 'Reforma 476, Cuauhtemoc, CDMX', turno: 'Matutino', area: 'Sistemas',
    descripcion: 'Colaboracion en la Direccion de Informatica del IMSS para el soporte y mejora de sistemas que atienden a millones de derechohabientes.',
  },
  {
    nombre: 'Monitoreo Ambiental y Calidad del Aire',
    nombre_institucion: 'Secretaria del Medio Ambiente y Recursos Naturales (SEMARNAT)',
    nombre_responsable: 'Dra. Alejandra Ruiz Cienfuegos',
    correo_contacto: 'ss.ambiental@semarnat.gob.mx',
    lugares_disponibles: 6,
    lista_actividades: 'Analisis de muestras de suelo y agua, procesamiento de datos meteorologicos, elaboracion de informes ambientales, apoyo en reforestacion',
    modalidad: 'Presencial', ubicacion: 'Av. Ejercito Nacional 223, Miguel Hidalgo, CDMX', turno: 'Matutino', area: 'Ambiental',
    descripcion: 'Participacion activa en programas de monitoreo ambiental y proteccion de ecosistemas, contribuyendo a politicas de desarrollo sustentable.',
  },
  {
    nombre: 'Digitalizacion y Gestion Documental',
    nombre_institucion: 'Archivo General de la Nacion (AGN)',
    nombre_responsable: 'Mtro. Fernando Salinas Gutierrez',
    correo_contacto: 'servicio.social@agn.gob.mx',
    lugares_disponibles: 10,
    lista_actividades: 'Digitalizacion de documentos historicos, catalogacion en bases de datos, descripcion archivistica, preservacion digital',
    modalidad: 'Presencial', ubicacion: 'Eduardo Molina y Albaniles s/n, Penitenciaria, CDMX', turno: 'Matutino', area: 'Sistemas',
    descripcion: 'Contribucion a la preservacion del patrimonio documental de Mexico mediante la digitalizacion de acervos historicos que datan del siglo XVI.',
  },
  {
    nombre: 'Proyectos de Energias Renovables',
    nombre_institucion: 'Comision Federal de Electricidad (CFE)',
    nombre_responsable: 'Ing. Patricia Dominguez Leal',
    correo_contacto: 'ss.ingenieria@cfe.mx',
    lugares_disponibles: 7,
    lista_actividades: 'Analisis de viabilidad solar y eolico, modelado energetico, elaboracion de planos electricos, simulaciones de redes',
    modalidad: 'Hibrida', ubicacion: 'Rio Rodano 14, Cuauhtemoc, CDMX', turno: 'Matutino', area: 'Electrica',
    descripcion: 'Apoyo en la planeacion e implementacion de proyectos de generacion de energia limpia en distintas regiones del pais.',
  },
  {
    nombre: 'Innovacion Tecnologica para la Educacion',
    nombre_institucion: 'Secretaria de Educacion Publica (SEP)',
    nombre_responsable: 'Lic. Jorge Mendoza Contreras',
    correo_contacto: 'ss.tecnologia@sep.gob.mx',
    lugares_disponibles: 15,
    lista_actividades: 'Desarrollo de contenidos digitales, soporte tecnico a plataformas e-learning, capacitacion a docentes, analisis de datos educativos',
    modalidad: 'Remota', ubicacion: 'Argentina 28, Centro Historico, CDMX', turno: 'Flexible', area: 'Sistemas',
    descripcion: 'Transformacion digital de la educacion basica y media superior con herramientas y contenidos para millones de estudiantes.',
  },
  {
    nombre: 'Geologia Aplicada y Riesgos Naturales',
    nombre_institucion: 'Servicio Geologico Mexicano (SGM)',
    nombre_responsable: 'Dra. Monica Estrada Villafuerte',
    correo_contacto: 'serviciosocial@sgm.gob.mx',
    lugares_disponibles: 5,
    lista_actividades: 'Cartografia geologica, analisis de muestras de roca y mineral, estudios de estabilidad de taludes, procesamiento de datos sismicos',
    modalidad: 'Presencial', ubicacion: 'Blvd. Felipe Angeles km 93.5, Pachuca, Hidalgo', turno: 'Matutino', area: 'Geologia',
    descripcion: 'Estudios geologicos y cartograficos para la identificacion de recursos minerales y evaluacion de riesgos en el territorio nacional.',
  },
  {
    nombre: 'Robotica y Automatizacion Industrial',
    nombre_institucion: 'Centro de Ingenieria y Desarrollo Industrial (CIDESI)',
    nombre_responsable: 'Dr. Arturo Blancas Hernandez',
    correo_contacto: 'ss.robotica@cidesi.mx',
    lugares_disponibles: 6,
    lista_actividades: 'Programacion de robots industriales (ABB, FANUC), diseno de celdas de manufactura, pruebas de sensores, documentacion de procesos',
    modalidad: 'Presencial', ubicacion: 'Av. Playa Pie de la Cuesta 702, Queretaro, Qro.', turno: 'Matutino', area: 'Mecatronica',
    descripcion: 'Proyectos de investigacion y desarrollo en automatizacion industrial en la vanguardia tecnologica del pais.',
  },
  {
    nombre: 'Salud Digital y Dispositivos Biomedicos',
    nombre_institucion: 'Instituto Nacional de Cardiologia Ignacio Chavez',
    nombre_responsable: 'Dr. Rafael Soria Montes',
    correo_contacto: 'ss.biomedica@cardiologia.org.mx',
    lugares_disponibles: 4,
    lista_actividades: 'Mantenimiento de equipos medicos, calibracion de dispositivos, desarrollo de software para monitoreo de pacientes, gestion de inventario',
    modalidad: 'Presencial', ubicacion: 'Juan Badiano 1, Tlalpan, CDMX', turno: 'Matutino', area: 'Biomedica',
    descripcion: 'Funcionamiento optimo de tecnologia medica en uno de los institutos de cardiologia mas reconocidos de America Latina.',
  },
  {
    nombre: 'Construccion y Supervision de Obra Publica',
    nombre_institucion: 'Instituto del Fondo Nacional de la Vivienda para los Trabajadores (INFONAVIT)',
    nombre_responsable: 'Ing. Laura Guzman Resendiz',
    correo_contacto: 'ss.construccion@infonavit.org.mx',
    lugares_disponibles: 9,
    lista_actividades: 'Levantamiento topografico, supervision de obra, elaboracion de estimaciones, control de calidad de materiales, planos con AutoCAD',
    modalidad: 'Presencial', ubicacion: 'Barranca del Muerto 280, Alvaro Obregon, CDMX', turno: 'Matutino', area: 'Civil',
    descripcion: 'Apoyo en proyectos de construccion de vivienda social para mejorar la calidad de vida de familias mexicanas.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INSERCION DE ALUMNOS
// ─────────────────────────────────────────────────────────────────────────────
async function insertarAlumnos() {
  console.log('\n Insertando alumnos...\n');
  const hashContrasena = await bcrypt.hash(CONTRASENA_EJEMPLO, 12);
  let insertados = 0;
  let omitidos = 0;

  const stmtInsert = db.prepare(`
    INSERT INTO usuarios (
      nombre, apellido_paterno, apellido_materno,
      correo, contrasena, tipo,
      numero_cuenta, carrera,
      llave_publica, llave_privada_enc,
      sexo, fecha_nacimiento, promedio
    ) VALUES (?, ?, ?, ?, ?, 'alumno', ?, ?, ?, ?, ?, ?, ?)
  `);
  const stmtExiste = db.prepare('SELECT id FROM usuarios WHERE correo = ?');

  for (const alumno of alumnos) {
    const existe = stmtExiste.get(alumno.correo);
    if (existe) {
      console.log('   [OMITIDO] ' + alumno.nombre + ' ' + alumno.apellido_paterno + ' - ' + alumno.correo);
      omitidos++;
      continue;
    }
    const { publicKey, privateKey } = generarParLlaves();
    const llavePrivadaCifrada = aesEncrypt(privateKey, CONTRASENA_EJEMPLO);
    stmtInsert.run(
      alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno,
      alumno.correo, hashContrasena,
      alumno.numero_cuenta, alumno.carrera,
      publicKey, llavePrivadaCifrada,
      alumno.sexo, alumno.fecha_nacimiento, alumno.promedio
    );
    console.log('   [OK] ' + alumno.nombre + ' ' + alumno.apellido_paterno + ' - ' + alumno.correo);
    insertados++;
  }
  return { insertados, omitidos };
}

// ─────────────────────────────────────────────────────────────────────────────
// INSERCION DE SERVICIOS SOCIALES
// ─────────────────────────────────────────────────────────────────────────────
function insertarServicios() {
  console.log('\n Insertando servicios sociales...\n');
  let insertados = 0;
  const stmtInsert = db.prepare(`
    INSERT INTO servicios_sociales (
      empresa_id, nombre, nombre_institucion, nombre_responsable,
      correo_contacto, lugares_disponibles, lugares_ocupados,
      lista_actividades, modalidad, ubicacion, turno, area, descripcion, activo
    ) VALUES (NULL, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 1)
  `);
  for (const s of servicios) {
    stmtInsert.run(
      s.nombre, s.nombre_institucion, s.nombre_responsable,
      s.correo_contacto, s.lugares_disponibles,
      s.lista_actividades, s.modalidad, s.ubicacion,
      s.turno, s.area, s.descripcion
    );
    console.log('   [OK] ' + s.nombre + ' - ' + s.nombre_institucion);
    insertados++;
  }
  return insertados;
}

// ─────────────────────────────────────────────────────────────────────────────
// EJECUCION PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
(async () => {
  console.log('================================================');
  console.log('   FeriaSSocial - Script de datos de ejemplo    ');
  console.log('================================================');
  try {
    const resultAlumnos = await insertarAlumnos();
    const serviciosInsertados = insertarServicios();
    console.log('\n================================================');
    console.log('   Proceso completado');
    console.log('   Alumnos insertados : ' + resultAlumnos.insertados);
    if (resultAlumnos.omitidos > 0)
      console.log('   Alumnos omitidos   : ' + resultAlumnos.omitidos + ' (correo ya existente)');
    console.log('   Servicios sociales : ' + serviciosInsertados);
    console.log('\n   Contrasena de todos los alumnos: Alumno2026!');
    console.log('================================================\n');
    console.log('   Ahora ejecuta: npm run dev:all\n');
  } catch (err) {
    console.error('\nERROR durante el seed:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
})();