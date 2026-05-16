# 🎓 Sistema de Servicio Social — FeriaSSocial
 
Plataforma web para la gestión de servicio social universitario con firma digital de contratos mediante criptografía RSA + AES-256-GCM.
 
---
 
## 📋 Tabla de contenidos
 
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación paso a paso](#instalación-paso-a-paso)
- [Ejecución del proyecto](#ejecución-del-proyecto)
- [Datos iniciales (opcional)](#datos-iniciales-opcional)
- [Credenciales de acceso](#credenciales-de-acceso)
- [Funcionalidades principales](#funcionalidades-principales)
- [Arquitectura de seguridad](#arquitectura-de-seguridad)
- [Endpoints del API](#endpoints-del-api)
---
 
## 🛠 Tecnologías utilizadas
 
| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express |
| Base de datos | SQLite (`better-sqlite3`) |
| Criptografía | RSA-2048, AES-256-GCM, PBKDF2, bcrypt |
 
---
 
## 📁 Estructura del proyecto
 
```
feriassocial/
├── backend/
│   ├── index.js          # Servidor Express + todos los endpoints API
│   └── database.js       # Inicialización de SQLite y migraciones
├── src/
│   ├── pages/
│   │   ├── Home.jsx      # Landing page pública
│   │   ├── AlumnoView.jsx
│   │   └── AdminView.jsx
│   ├── components/
│   │   ├── AuthModal.jsx
│   │   └── EditarPerfilModal.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── seed.js               # Script de datos de ejemplo (opcional)
├── package.json
└── README.md
```
 
---
 
## ✅ Requisitos previos
 
Antes de comenzar, asegúrate de tener instalado lo siguiente:
 
- **Node.js** v18 o superior → [descargar en nodejs.org](https://nodejs.org/)
- **npm** v9 o superior (viene incluido con Node.js)
- **Git** (opcional, para clonar el repositorio)
Para verificar que Node.js y npm están correctamente instalados, abre una terminal y ejecuta:
 
```bash
node --version
npm --version
```
 
---
 
## Instalación paso a paso
 
### 1. Descarga el repositorio
 
**Opción A — Clonar con Git:**
```bash
git clone https://github.com/tu-usuario/feriassocial.git
cd feriassocial
```
 
**Opción B — Descargar ZIP:**
1. En GitHub, haz clic en el botón verde **`Code`** → **`Download ZIP`**
2. Extrae el archivo ZIP en la carpeta que prefieras
3. Abre una terminal y navega hasta esa carpeta:
```bash
cd ruta/a/la/carpeta/feriassocial
```
 
---
 
### 2. Instala las dependencias del proyecto
 
Desde la raíz del proyecto, ejecuta:
 
```bash
npm install
```
 
Este comando instala todas las dependencias tanto del frontend (React, Vite, Tailwind) como del backend (Express, better-sqlite3, bcrypt, etc.) definidas en el `package.json`.
 
> ⚠️ Si aparece algún error relacionado con `better-sqlite3`, puede deberse a la compilación de módulos nativos. En ese caso ejecuta:
> ```bash
> npm rebuild better-sqlite3
> ```
 
---
 
### 3. Verifica la estructura de archivos
 
Asegúrate de que la carpeta `backend/` esté en la raíz del proyecto y contenga los archivos `index.js` y `database.js`.
 
---
 
## ▶️ Ejecución del proyecto
 
Para iniciar el backend y el frontend al mismo tiempo, ejecuta desde la raíz del proyecto:
 
```bash
npm run dev:all
```
 
Esto levantará:
- **Backend** en `http://localhost:3001`
- **Frontend** en `http://localhost:5173`
Abre tu navegador y ve a: **http://localhost:5173**
 
> ℹ️ La primera vez que se ejecute el backend, se creará automáticamente el archivo de base de datos `servicio_social.db` y la cuenta de administrador por defecto.
 
---
 
## 🗄️ Datos iniciales (opcional)
 
Puedes elegir entre dos formas de comenzar a usar el sistema:
 
---
 
### Opción A — Empezar desde cero (sin datos)
 
No se requiere ningún paso adicional. El sistema se inicializa con:
- La base de datos vacía
- Únicamente la cuenta de administrador creada automáticamente
Puedes registrar alumnos desde la interfaz web y crear servicios sociales desde el panel de administración.
 
---
 
### Opción B — Cargar datos de ejemplo (recomendado para pruebas)
 
El proyecto incluye el script `seed.js` que carga **15 alumnos** y **10 servicios sociales** de instituciones reales para que puedas explorar la plataforma de inmediato.
 
**Importante:** Ejecuta el seed *después* de haber levantado el servidor al menos una vez (para que la base de datos se cree), y con el backend **detenido**:
 
```bash
# 1. Detén el servidor si está corriendo (Ctrl + C)
 
# 2. Ejecuta el script de datos de ejemplo
node seed.js
 
# 3. Vuelve a iniciar el proyecto normalmente
npm run dev:all
```
 
Al finalizar, el script te confirmará en consola cuántos alumnos y servicios se insertaron correctamente.
 
> ⚠️ Si ejecutas el seed más de una vez, los alumnos se omitirán automáticamente si su correo ya existe. Los servicios sociales sí se insertarán de nuevo, por lo que podrías terminar con duplicados.
 
---
 
## 🔐 Credenciales de acceso
 
### Administrador (creado automáticamente)
 
| Campo | Valor |
|-------|-------|
| Correo | `adminserviciosocial@gmail.com` |
| Contraseña | `PasswdTemp2026` |
 
> 🔒 **Recomendación:** Cambia la contraseña del administrador desde el panel de perfil una vez que ingreses por primera vez.
 
### Alumnos de ejemplo (si ejecutaste el seed)
 
Todos los alumnos de ejemplo tienen la contraseña:
 
```
Alumno2026!
```
 
Puedes iniciar sesión con cualquier correo de la lista en `seed.js`, por ejemplo:
- `sofia.ramirez@alumno.unam.mx`
- `diego.hernandez@alumno.unam.mx`
- `valeria.torres@alumno.unam.mx`
---
 
## 🧩 Funcionalidades principales
 
### Para alumnos
- Registro con datos académicos completos (carrera, número de cuenta, promedio)
- Generación automática de par de llaves RSA-2048 al crear la cuenta
- Exploración del catálogo de servicios sociales disponibles
- Solicitud de inscripción a un servicio
- Firma digital del contrato con llave privada RSA (protegida por AES-256-GCM)
- Seguimiento del estado de la inscripción
### Para el administrador
- Panel con estadísticas en tiempo real (vacantes, inscritos, contratos firmados)
- Gestión completa de servicios sociales (crear, editar, activar/desactivar)
- Revisión de todas las inscripciones con datos detallados del alumno
- Firma de validación del contrato con nota obligatoria
- Verificación criptográfica de la autenticidad de la firma RSA del alumno
---
 
## 🔒 Arquitectura de seguridad
 
El sistema implementa una cadena de seguridad completa:
 
```
Registro de alumno
    └─► Genera par de llaves RSA-2048
           ├─► Llave pública → guardada en BD (servidor)
           └─► Llave privada → cifrada con AES-256-GCM + PBKDF2
                               usando la contraseña del alumno
                               (nunca se almacena en texto plano)
 
Firma de contrato
    └─► Alumno ingresa su contraseña
           └─► Descifra su llave privada en memoria
                  └─► Firma el texto del contrato con SHA-256 + RSA
                         └─► Firma + hash SHA-256 guardados en BD
 
Verificación
    └─► Admin usa la llave pública del alumno (guardada en BD)
           └─► Verifica la firma RSA → ✓ Auténtica o ✗ Inválida
```
 
---
 
## 🌐 Endpoints del API
 
El backend corre en `http://localhost:3001`.
 
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Registro de alumno (genera llaves RSA) |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `PUT` | `/api/usuarios/:id` | Actualizar perfil |
| `POST` | `/api/usuarios/:id/llave-privada` | Obtener llave privada descifrada |
| `GET` | `/api/catalogo` | Catálogo público de servicios disponibles |
| `GET` | `/api/estadisticas` | Estadísticas generales del sistema |
| `POST` | `/api/inscripciones` | Alumno solicita un servicio |
| `GET` | `/api/inscripciones/alumno/:id` | Inscripciones del alumno |
| `POST` | `/api/inscripciones/:id/firmar` | Alumno firma su contrato |
| `POST` | `/api/inscripciones/:id/verificar` | Verificar firma RSA de un contrato |
| `DELETE` | `/api/inscripciones/:id` | Cancelar solicitud |
| `GET` | `/api/empresa/inscripciones` | Todas las inscripciones (admin) |
| `POST` | `/api/admin/servicios` | Crear servicio social (admin) |
| `PUT` | `/api/admin/servicios/:id` | Editar servicio social (admin) |
| `GET` | `/api/admin/servicios` | Listar todos los servicios (admin) |
| `POST` | `/api/admin/inscripciones/:id/firmar` | Admin valida y firma un contrato |
 
---
 
## 🐛 Solución de problemas frecuentes
 
**El frontend no se conecta al backend**
Verifica que el backend esté corriendo en el puerto 3001. Revisa la consola donde ejecutaste `npm run dev:all`.
 
**Error al compilar `better-sqlite3`**
```bash
npm rebuild better-sqlite3
```
 
**La base de datos aparece con datos anteriores al ejecutar el seed de nuevo**
Los servicios sociales se duplican si se ejecuta el seed varias veces. Si quieres empezar de cero, elimina el archivo `servicio_social.db` de la carpeta `backend/` y vuelve a ejecutar el servidor.
 
**La sesión expira muy rápido**
Por seguridad, la sesión dura 1 hora. Vuelve a iniciar sesión cuando esto ocurra.
 
---
 
*Desarrollado  — Sistema de Gestión de Servicio Social con Criptografía RSA*

## 👥 Integrantes del Equipo
* **Ávila Reyes Íker**
* **Badillo Martínez Luis Eduardo**
* **Becerril Vélez Liliana Marlene**
* **López Campillo Francisco Daniel**
* **Vigi Garduño Marco Alejandro**
