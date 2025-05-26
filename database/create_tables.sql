-- create_tables.sql

-- Tabla Socios
CREATE TABLE "DBA"."Socios" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "documento_identidad" VARCHAR(20) NOT NULL,
    "nombre_completo" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(200),
    "email" VARCHAR(100),
    "nacionalidad" VARCHAR(50),
    "nivel_educativo" VARCHAR(50),
    "profesion" VARCHAR(50),
    "fecha_nacimiento" DATE NOT NULL,
    "fecha_inscripcion" DATE NOT NULL,
    "institucion_referente" VARCHAR(100),
    "estado" VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'sancionado')),
    PRIMARY KEY ("id")
);

ALTER TABLE "DBA"."Socios"
    ADD UNIQUE ("documento_identidad");

-- Tabla Empleados
CREATE TABLE "DBA"."Empleados" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "nombre" VARCHAR(100) NOT NULL,
    "usuario" VARCHAR(50) NOT NULL,
    "contrasena" VARCHAR(100) NOT NULL,
    "rol" VARCHAR(30) NOT NULL CHECK (rol IN ('bibliotecario', 'administrador', 'restaurador')),
    PRIMARY KEY ("id")
);

ALTER TABLE "DBA"."Empleados"
    ADD UNIQUE ("usuario");

-- Tabla Materiales
CREATE TABLE "DBA"."Materiales" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "nombre" VARCHAR(100) NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "subtipo" VARCHAR(50) NOT NULL,
    "tipo_material" VARCHAR(50) NOT NULL,
    "formato" VARCHAR(50),
    "ubicacion" VARCHAR(100),
    "valor_estimado" DECIMAL(12,2),
    "pais_origen" VARCHAR(50),
    "descripcion" TEXT,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'disponible',
    "es_restringido" BIT NOT NULL DEFAULT 0,
    "donado" BIT NOT NULL DEFAULT 0,
    "nombre_donante" VARCHAR(100),
    "fecha_donacion" DATE,
    "estado_al_donar" VARCHAR(50),
    PRIMARY KEY ("id")
);

-- Tabla ReglasPrestamo
CREATE TABLE "DBA"."ReglasPrestamo" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "tipo_material" VARCHAR(50) NOT NULL,
    "edad_minima" INTEGER,
    "antiguedad_minima" INTEGER,
    "dias_prestamo" INTEGER NOT NULL,
    "max_items" INTEGER,
    PRIMARY KEY ("id")
);

-- Tabla Prestamos
CREATE TABLE "DBA"."Prestamos" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "material_id" INTEGER NOT NULL,
    "socio_id" INTEGER NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "fecha_hora_retiro" TIMESTAMP NOT NULL DEFAULT current timestamp,
    "fecha_hora_devolucion_limite" TIMESTAMP NOT NULL,
    "tipo" VARCHAR(10) NOT NULL CHECK (tipo IN ('interno', 'externo')),
    "comentario" TEXT,
    "condicion_fisica_inicial" VARCHAR(20) NOT NULL CHECK (condicion_fisica_inicial IN ('bueno', 'regular', 'malo')),
    "estado" VARCHAR(10) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'devuelto')),
    PRIMARY KEY ("id")
);

-- Tabla Devoluciones
CREATE TABLE "DBA"."Devoluciones" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "prestamo_id" INTEGER NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "fecha_hora_devolucion" TIMESTAMP NOT NULL DEFAULT current timestamp,
    "condicion_fisica_final" VARCHAR(20) NOT NULL CHECK (condicion_fisica_final IN ('bueno', 'regular', 'malo', 'deteriorado', 'perdido')),
    "comentario" TEXT,
    "sancion_generada" BIT NOT NULL DEFAULT 0,
    "dias_sancion" INTEGER,
    PRIMARY KEY ("id")
);

-- Tabla Sanciones
CREATE TABLE "DBA"."Sanciones" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "socio_id" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "motivo" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(10) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva')),
    PRIMARY KEY ("id")
);

-- Tabla HistoricoEstadosMaterial
CREATE TABLE "DBA"."HistoricoEstadosMaterial" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "material_id" INTEGER NOT NULL,
    "estado_anterior" VARCHAR(50),
    "estado_nuevo" VARCHAR(50),
    "fecha" TIMESTAMP DEFAULT current timestamp,
    "usuario" VARCHAR(50),
    PRIMARY KEY ("id")
);

-- Tabla TiposMaterial
CREATE TABLE "DBA"."TiposMaterial" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    PRIMARY KEY ("id")
);

-- Tabla EstadosMaterial
CREATE TABLE "DBA"."EstadosMaterial" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "nombre" VARCHAR(50) NOT NULL,
    PRIMARY KEY ("id")
);

-- Tabla Donantes
CREATE TABLE "DBA"."Donantes" (
    "id" INTEGER NOT NULL DEFAULT autoincrement,
    "nombre" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "direccion" VARCHAR(200),
    "email" VARCHAR(100),
    PRIMARY KEY ("id")
);