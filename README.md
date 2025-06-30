# Proyecto Final – Biblioteca Pública Cultural Interactiva

Este es el sistema desarrollado para el trabajo final de las materias **Programación  e Informática ** – Universidad Católica Nuestra Señora de la Asunción.

## Tecnologías utilizadas
- Base de datos: Sybase SQL Anywhere 11
- Backend: Node.js + Express
- Frontend: HTML + JavaScript puro
- Conexión: `sybase` / `odbc`
- Automatismos: Triggers, procedimientos almacenados

## Requisitos previos
- Tener instalado Node.js
- Driver JDBC de Sybase (`jconn3.jar`)
- ODBC configurado con DSN a `biblioteca.db`

## Instalación
1. Clonar repositorio
2. Instalar dependencias:
   ```bash
   npm install