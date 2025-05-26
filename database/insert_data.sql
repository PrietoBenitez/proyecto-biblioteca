-- insert_data.sql

-- Insertar Tipos de Material
INSERT INTO "DBA"."TiposMaterial" ("nombre", "descripcion") VALUES ('Libro', 'Material impreso');
INSERT INTO "DBA"."TiposMaterial" ("nombre", "descripcion") VALUES ('Revista', 'Publicación periódica');
INSERT INTO "DBA"."TiposMaterial" ("nombre", "descripcion") VALUES ('DVD', 'Material audiovisual');
INSERT INTO "DBA"."TiposMaterial" ("nombre", "descripcion") VALUES ('Instrumento Musical', 'Material para préstamo especial');
INSERT INTO "DBA"."TiposMaterial" ("nombre", "descripcion") VALUES ('Juego Educativo', 'Material didáctico');

-- Insertar Estados de Material
INSERT INTO "DBA"."EstadosMaterial" ("nombre") VALUES ('disponible');
INSERT INTO "DBA"."EstadosMaterial" ("nombre") VALUES ('prestado');
INSERT INTO "DBA"."EstadosMaterial" ("nombre") VALUES ('reservado');
INSERT INTO "DBA"."EstadosMaterial" ("nombre") VALUES ('en_restauracion');
INSERT INTO "DBA"."EstadosMaterial" ("nombre") VALUES ('restringido');

-- Insertar Socios de prueba
INSERT INTO "DBA"."Socios" 
("documento_identidad", "nombre_completo", "direccion", "email", "nacionalidad", "nivel_educativo", "profesion", "fecha_nacimiento", "fecha_inscripcion", "institucion_referente", "estado")
VALUES
('1234567', 'Carlos López', 'Calle 123', 'carlos@email.com', 'Paraguayo', 'Universitario', 'Estudiante', '1995-08-20', '2022-01-15', 'Universidad Católica', 'activo'),
('7654321', 'María González', 'Avenida 456', 'maria@email.com', 'Argentina', 'Secundario', 'Docente', '1988-04-10', '2020-03-22', 'Colegio Santa María', 'sancionado');

-- Insertar Empleados de prueba
INSERT INTO "DBA"."Empleados" ("nombre", "usuario", "contrasena", "rol") VALUES
('Admin Principal', 'admin', 'hash_contrasena_admin', 'administrador'),
('Bibliotecario 1', 'bibliotecario', 'hash_contrasena_biblio', 'bibliotecario'),
('Restaurador 1', 'restaurador', 'hash_contrasena_rest', 'restaurador');

-- Insertar Materiales de prueba
INSERT INTO "DBA"."Materiales" 
("nombre", "categoria", "subtipo", "tipo_material", "ubicacion", "valor_estimado", "pais_origen", "descripcion", "estado", "es_restringido", "donado", "nombre_donante", "fecha_donacion", "estado_al_donar")
VALUES
('La Odisea', 'Literatura', 'Libro', 'Libro', 'Sector A', 50000, 'Grecia', 'Edición clásica', 'disponible', 0, 1, 'Universidad Católica', '2023-05-10', 'bueno'),
('Violín Estudio', 'Música', 'Instrumento', 'Instrumento Musical', 'Sala de música', 150000, 'Italia', 'Para uso educativo', 'disponible', 1, 0, NULL, NULL, NULL),
('Historia Universal', 'Historia', 'Libro', 'Libro', 'Sector B', 45000, 'Argentina', 'Enciclopedia histórica', 'disponible', 0, 1, 'Colegio Santa María', '2023-06-15', 'regular');

-- Insertar Reglas de Préstamo
INSERT INTO "DBA"."ReglasPrestamo" ("tipo_material", "edad_minima", "antiguedad_minima", "dias_prestamo", "max_items") VALUES
('Libro', 16, 0, 14, 5),
('Instrumento Musical', 18, 24, 7, 1),
('DVD', 12, 0, 3, 3);

-- Insertar Donantes
INSERT INTO "DBA"."Donantes" ("nombre", "telefono", "direccion", "email") VALUES
('Universidad Católica', '0981123456', 'Asunción', 'donaciones@uc.edu.py'),
('Colegio Santa María', '0981789012', 'Luque', 'donaciones@csm.edu.py');