# 📖 GUÍA DE DESARROLLO - GestLib

## 🎯 Arquitectura del Sistema

GestLib sigue una arquitectura **MVC (Modelo-Vista-Controlador)** con las siguientes capas:

### 📁 Backend (Node.js + Express)
```
backend/
├── config/     # Configuración de BD y variables
├── models/     # Modelos de datos (acceso a BD)
├── controllers/ # Lógica de negocio
├── routes/     # Definición de rutas API
└── middleware/ # Middlewares de autenticación
```

### 🎨 Frontend (HTML + JS + Bootstrap)
```
frontend/
├── views/      # Páginas HTML del sistema
├── public/
│   ├── css/    # Estilos personalizados
│   ├── js/     # Lógica del cliente
│   └── images/ # Recursos gráficos
```

## 🔄 Flujo de Datos

1. **Usuario** → Interactúa con la interfaz HTML
2. **JavaScript** → Envía peticiones AJAX a la API
3. **Routes** → Reciben peticiones y las enrutan
4. **Controllers** → Procesan la lógica de negocio
5. **Models** → Acceden a la base de datos
6. **Database** → SQL Anywhere devuelve datos
7. **Response** → JSON enviado de vuelta al cliente

## 🔐 Sistema de Autenticación

### JWT (JSON Web Tokens)
- **Login**: Usuario envía credenciales → Server genera JWT
- **Requests**: Cliente incluye JWT en headers
- **Middleware**: Verifica JWT antes de procesar requests
- **Privilegios**: Diferentes niveles (N/Y/S) en bibliotecarios

### Niveles de Acceso
- **N (No)**: Sin privilegios especiales
- **Y (Yes)**: Privilegios de administrador  
- **S (Super)**: Privilegios máximos del sistema

## 📊 Base de Datos - SQL Anywhere

### Tablas Principales
```sql
-- Bibliotecarios (usuarios del sistema)
BIBLIOTECARIOS
├── BIBLIOTECARIO_ID (PK)
├── USUARIO (unique)
├── CONTRASENA (bcrypt hash)
├── PRIVILEGIOS (N/Y/S)
├── NOMBRE, APELLIDO, CEDULA

-- Socios (miembros de la biblioteca)
SOCIOS
├── SOCIO_ID (PK)
├── NOMBRE, APELLIDO, CEDULA
├── TELEFONO, EMAIL, DIRECCION
├── FECHA_INSCRIPCION

-- Materiales (libros, revistas, etc.)
MATERIALES  
├── MATERIAL_ID (PK)
├── TITULO, AUTOR, ISBN
├── CATEGORIA, ESTADO
├── FECHA_INGRESO

-- Préstamos (transacciones)
PRESTAMOS
├── PRESTAMO_ID (PK)
├── SOCIO_ID (FK)
├── MATERIAL_ID (FK)
├── FECHA_PRESTAMO, FECHA_DEVOLUCION
├── ESTADO
```

## 🛠️ Herramientas y Librerías

### Backend Dependencies
- **express**: Framework web para Node.js
- **odbc**: Driver para conectar con SQL Anywhere
- **bcrypt**: Encriptación de contraseñas
- **jsonwebtoken**: Generación y verificación de JWT
- **cors**: Permitir requests cross-origin
- **morgan**: Logging de requests HTTP
- **dotenv**: Manejo de variables de entorno

### Frontend Dependencies
- **Bootstrap 5.3.6**: Framework CSS responsivo
- **Font Awesome 6.5.0**: Iconografía
- **SweetAlert2**: Alertas personalizadas
- **Chart.js**: Gráficos y estadísticas

## 🔧 Configuración de Desarrollo

### 1. Configurar ODBC en Windows
```
1. Abrir "Administrador de orígenes de datos ODBC"
2. Ir a la pestaña "DSN del sistema"
3. Hacer clic en "Agregar"
4. Seleccionar "SQL Anywhere 11"
5. Configurar:
   - Nombre: biblioteca_dsn
   - Servidor: localhost
   - Base de datos: biblioteca.db
```

### 2. Variables de Entorno
```env
DB_NAME=biblioteca_dsn    # Nombre del DSN
DB_USER=dba              # Usuario de BD
DB_PASSWORD=sql          # Contraseña de BD
JWT_SECRET=clave_segura  # Clave para JWT
PORT=3000               # Puerto del servidor
```

### 3. Estructura de Requests API

#### Autenticación
```javascript
POST /api/auth/login
{
  "usuario": "dba",
  "password": "sql"
}
```

#### CRUD Operations
```javascript
// Listar todos
GET /api/socios

// Obtener por ID
GET /api/socios/:id

// Crear nuevo
POST /api/socios
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "cedula": "12345678"
}

// Actualizar
PUT /api/socios/:id
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez"
}

// Eliminar
DELETE /api/socios/:id
```

## 🎨 Guías de Estilo

### CSS
- Usar **Bootstrap** como base
- Variables CSS para colores del tema
- Clases personalizadas con prefijo `bt-` (BiblioTech)
- Modo oscuro con `[data-bs-theme="dark"]`

### JavaScript
- **ES6+** syntax (arrow functions, const/let)
- **Async/await** para requests
- **Modular**: Una función por responsabilidad
- **Error handling** con try/catch

### HTML
- **Semantic HTML5** tags
- **Accessibility**: labels, aria-* attributes
- **Bootstrap classes** para responsive design
- **Font Awesome** para iconos

## 🚀 Deploy y Producción

### Consideraciones
1. **Variables de entorno** en servidor de producción
2. **HTTPS** obligatorio para JWT
3. **Backup** automático de base de datos
4. **Logs** de aplicación y errores
5. **Monitoring** de performance

### PM2 (Recomendado)
```bash
npm install -g pm2
pm2 start app.js --name bibliotech
pm2 save
pm2 startup
```

## 🐛 Debugging

### Common Issues
1. **"Cannot connect to database"**
   - Verificar que SQL Anywhere esté corriendo
   - Revisar configuración del DSN
   - Validar credenciales en .env

2. **"JWT token invalid"**
   - Verificar JWT_SECRET en .env
   - Confirmar que el token no haya expirado
   - Revisar headers de Authorization

3. **"CORS errors"**
   - Confirmar que cors() esté configurado
   - Verificar origins permitidos
   - Revisar headers de requests

### Debug Mode
```bash
DEBUG=* npm start  # Logs detallados
NODE_ENV=development npm start  # Modo desarrollo
```

## 📚 Recursos Adicionales

- [Express.js Documentation](https://expressjs.com/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [SQL Anywhere Developer Guide](https://help.sap.com/doc/sqlanywhere/)
- [JWT.io - JSON Web Tokens](https://jwt.io/)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)

---
*Desarrollado con ❤️ para la Universidad Católica Nuestra Señora de la Asunción*
