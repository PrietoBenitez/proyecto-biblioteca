# 📚 GestLib - Sistema de Gestión Bibliotecaria

<div align="center">

![GestLib Logo](frontend/public/images/index.png)

**Sistema de gestión bibliotecaria desarrollado para el trabajo final de Programación e Informática**  
*Universidad Católica Nuestra Señora de la Asunción*

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21.2-blue)](https://expressjs.com/)
[![SQL Anywhere](https://img.shields.io/badge/SQL%20Anywhere-11-orange)](https://www.sap.com/products/sql-anywhere.html)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.6-purple)](https://getbootstrap.com/)

</div>

## 🎯 Descripción del Proyecto

GestLib es un sistema completo de gestión bibliotecaria que permite administrar de manera eficiente:

- 👥 **Socios** de la biblioteca
- 📖 **Materiales** (libros, revistas, etc.)
- 🔄 **Préstamos** y devoluciones
- 👨‍💼 **Bibliotecarios** y usuarios del sistema
- 🎁 **Donantes** de materiales
- 🏢 **Instituciones** asociadas
- 📊 **Estadísticas** y reportes

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express.js** - Framework web para Node.js
- **JWT** - Autenticación basada en tokens
- **bcrypt** - Encriptación de contraseñas
- **ODBC** - Conexión a base de datos

### Frontend
- **HTML5** - Estructura de páginas
- **CSS3** - Estilos personalizados
- **JavaScript Vanilla** - Lógica del cliente
- **Bootstrap 5.3.6** - Framework CSS responsivo
- **Font Awesome** - Iconografía
- **SweetAlert2** - Alertas interactivas

### Base de Datos
- **Sybase SQL Anywhere 11** - Sistema de gestión de base de datos
- **Triggers** - Automatización de procesos
- **Procedimientos almacenados** - Lógica de negocio

## 📋 Requisitos Previos

Antes de instalar el proyecto, asegúrate de tener:

- **Node.js** (versión 14.x o superior)
- **npm** (versión 6.x o superior)
- **Sybase SQL Anywhere 11** instalado
- **Driver ODBC** configurado
- **DSN** configurado apuntando a `biblioteca.db`

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/proyecto-biblioteca.git
cd proyecto-biblioteca
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto:
```env
DB_NAME=nombre_del_dsn
DB_USER=dba
DB_PASSWORD=sql
JWT_SECRET=tu_secreto_jwt_aqui
PORT=3000
```

### 4. Configurar la base de datos
- Asegurar que SQL Anywhere esté ejecutándose
- Verificar que el DSN esté configurado correctamente
- Importar el archivo `biblioteca.db` si es necesario

### 5. Ejecutar el proyecto
```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### 6. Acceder al sistema
Abrir navegador en: `http://localhost:3000`

**Credenciales por defecto:**
- Usuario: `dba`
- Contraseña: `sql`

## 📁 Estructura del Proyecto

```
proyecto-biblioteca/
├── 📁 backend/
│   ├── 📁 config/
│   │   └── db.js                 # Configuración de base de datos
│   ├── 📁 controllers/
│   │   ├── auth.controller.js    # Autenticación
│   │   ├── socios.controller.js  # Gestión de socios
│   │   ├── materiales.controller.js
│   │   ├── prestamos.controller.js
│   │   └── ...
│   ├── 📁 middleware/
│   │   └── auth.middleware.js    # Verificación JWT
│   ├── 📁 models/
│   │   ├── socios.model.js       # Modelos de datos
│   │   └── ...
│   └── 📁 routes/
│       ├── auth.route.js         # Rutas de autenticación
│       └── ...
├── 📁 frontend/
│   ├── 📁 public/
│   │   ├── 📁 css/              # Estilos CSS
│   │   ├── 📁 js/               # JavaScript del cliente
│   │   └── 📁 images/           # Recursos gráficos
│   └── 📁 views/
│       ├── index.html           # Dashboard principal
│       ├── login.html           # Página de login
│       └── ...
├── app.js                       # Servidor principal
├── package.json                 # Dependencias del proyecto
└── README.md                    # Documentación
```

## 🔑 Características Principales

### ✅ Autenticación y Seguridad
- Sistema de login con JWT
- Encriptación de contraseñas con bcrypt
- Middleware de autenticación
- Diferentes niveles de privilegios

### 📊 Gestión Completa
- **CRUD completo** para todas las entidades
- **Búsquedas avanzadas** con filtros
- **Validaciones** de formularios
- **Alertas interactivas** con SweetAlert2

### 🎨 Interfaz de Usuario
- **Diseño responsivo** con Bootstrap 5
- **Modo oscuro/claro** disponible
- **Navegación intuitiva** entre módulos
- **Iconografía consistente** con Font Awesome

### 📈 Reportes y Estadísticas
- Gráficos de préstamos por mes
- Estadísticas de materiales más populares
- Reportes de socios activos
- Dashboard con métricas principales

## 🔧 Scripts Disponibles

```bash
# Iniciar servidor en modo producción
npm start

# Iniciar servidor en modo desarrollo (con nodemon)
npm run dev

# Ejecutar tests (pendiente implementación)
npm test
```

## 🤝 Contribución

Este proyecto fue desarrollado como trabajo final universitario. Para contribuir:

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Sistema BiblioTech** - *Desarrollo completo* - Universidad Católica Nuestra Señora de la Asunción

## 🙏 Agradecimientos

- Universidad Católica Nuestra Señora de la Asunción
- Cátedra de Programación e Informática
- Comunidad de desarrolladores Node.js
- Documentación de Express.js y SQL Anywhere

---

<div align="center">
<strong>¡Gracias por usar BiblioTech! 📚✨</strong>
</div>