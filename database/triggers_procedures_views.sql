-- triggers_procedures_views.sql

-- Trigger ValidarPrestamo
CREATE TRIGGER ValidarPrestamo BEFORE INSERT ON "DBA"."Prestamos"
REFERENCING NEW AS new_row
FOR EACH ROW
BEGIN
    DECLARE @material_estado VARCHAR(20);
    DECLARE @material_restringido BIT;
    DECLARE @socio_edad INTEGER;
    DECLARE @socio_antiguedad INTEGER;
    DECLARE @socio_sancionado INTEGER;
    DECLARE @dias_prestamo INTEGER;
    DECLARE @tipo_material VARCHAR(50);

    -- Verificar estado del material
    SELECT estado, es_restringido INTO @material_estado, @material_restringido
    FROM Materiales WHERE id = new_row.material_id;

    IF @material_estado <> 'disponible' THEN
        RAISERROR 50000 'El material no está disponible para préstamo';
        RETURN;
    END IF;

    -- Verificar sanciones activas del socio
    SELECT COUNT(*) INTO @socio_sancionado
    FROM Sanciones
    WHERE socio_id = new_row.socio_id AND estado = 'activa'
      AND (fecha_fin IS NULL OR fecha_fin >= CURRENT DATE);

    IF @socio_sancionado > 0 THEN
        RAISERROR 50001 'El socio tiene sanciones activas y no puede realizar préstamos';
        RETURN;
    END IF;

    -- Calcular edad y antigüedad del socio
    SELECT DATEDIFF(YEAR, fecha_nacimiento, CURRENT DATE),
           DATEDIFF(MONTH, fecha_inscripcion, CURRENT DATE)
    INTO @socio_edad, @socio_antiguedad
    FROM Socios
    WHERE id = new_row.socio_id;

    -- Obtener tipo de material
    SELECT tipo_material INTO @tipo_material FROM Materiales WHERE id = new_row.material_id;

    -- Aplicar reglas de préstamo
    SELECT dias_prestamo INTO @dias_prestamo
    FROM ReglasPrestamo
    WHERE tipo_material = @tipo_material
      AND (edad_minima IS NULL OR @socio_edad >= edad_minima)
      AND (antiguedad_minima IS NULL OR @socio_antiguedad >= antiguedad_minima);

    IF @dias_prestamo IS NULL THEN
        RAISERROR 50002 'El socio no cumple con los requisitos para este tipo de material';
        RETURN;
    END IF;

    -- Préstamo interno → devolución el mismo día
    IF new_row.tipo = 'interno' THEN
        SET new_row.fecha_hora_devolucion_limite = DATEADD(DAY, 1, CAST(CURRENT DATE AS TIMESTAMP));
    ELSE
        SET new_row.fecha_hora_devolucion_limite = DATEADD(DAY, @dias_prestamo, new_row.fecha_hora_retiro);
    END IF;

    -- Actualizar estado del material
    UPDATE Materiales SET estado = 'prestado' WHERE id = new_row.material_id;
END;

-- Trigger ProcesarDevoluciones
CREATE TRIGGER ProcesarDevoluciones AFTER INSERT ON "DBA"."Devoluciones"
REFERENCING NEW AS new_row
FOR EACH ROW
BEGIN
    DECLARE @prestamo_limite TIMESTAMP;
    DECLARE @material_id INTEGER;
    DECLARE @socio_id INTEGER;
    DECLARE @material_restringido BIT;
    DECLARE @dias_retraso INTEGER;
    DECLARE @dias_sancion INTEGER;

    -- Obtener datos del préstamo
    SELECT p.fecha_hora_devolucion_limite, p.material_id, p.socio_id, m.es_restringido
    INTO @prestamo_limite, @material_id, @socio_id, @material_restringido
    FROM Prestamos p
    JOIN Materiales m ON p.material_id = m.id
    WHERE p.id = new_row.prestamo_id;

    -- Marcar préstamo como devuelto
    UPDATE Prestamos SET estado = 'devuelto' WHERE id = new_row.prestamo_id;

    -- Cambiar estado del material según condición física final
    IF new_row.condicion_fisica_final IN ('bueno', 'regular') THEN
        UPDATE Materiales SET estado = 'disponible' WHERE id = @material_id;
    ELSE
        UPDATE Materiales SET estado = 'en_restauracion' WHERE id = @material_id;
    END IF;

    -- Validar retraso en devolución
    IF new_row.fecha_hora_devolucion > @prestamo_limite THEN
        SET @dias_retraso = DATEDIFF(DAY, @prestamo_limite, new_row.fecha_hora_devolucion);

        IF @material_restringido = 1 THEN
            INSERT INTO Sanciones(socio_id, fecha_inicio, motivo, estado)
            VALUES(@socio_id, CURRENT DATE, 'Devolución tardía de material restringido', 'activa');
        ELSE
            INSERT INTO Sanciones(socio_id, fecha_inicio, fecha_fin, motivo, estado)
            VALUES(@socio_id, CURRENT DATE, DATEADD(DAY, 7, CURRENT DATE),
                   'Devolución tardía (' || CAST(@dias_retraso AS VARCHAR) || ' días)', 'activa');
        END IF;

        UPDATE Devoluciones SET sancion_generada = 1, dias_sancion = 7 WHERE id = new_row.id;
    END IF;

    -- Validar daño al devolver
    IF new_row.condicion_fisica_final IN ('malo', 'deteriorado') THEN
        SET @dias_sancion = CASE new_row.condicion_fisica_final
                            WHEN 'malo' THEN 5
                            WHEN 'deteriorado' THEN 15
                            END;

        INSERT INTO Sanciones(socio_id, fecha_inicio, fecha_fin, motivo, estado)
        VALUES(@socio_id, CURRENT DATE, DATEADD(DAY, @dias_sancion, CURRENT DATE),
               'Daño al material (' || new_row.condicion_fisica_final || ')', 'activa');

        UPDATE Devoluciones SET sancion_generada = 1, dias_sancion = @dias_sancion WHERE id = new_row.id;
    END IF;
END;

-- Trigger ActualizarEstadoMaterial
CREATE TRIGGER ActualizarEstadoMaterial AFTER UPDATE ON "DBA"."Materiales"
REFERENCING OLD AS old_row NEW AS new_row
FOR EACH ROW
BEGIN
    IF new_row.estado != old_row.estado THEN
        INSERT INTO HistoricoEstadosMaterial
        (material_id, estado_anterior, estado_nuevo, fecha)
        VALUES
        (new_row.id, old_row.estado, new_row.estado, CURRENT TIMESTAMP);
    END IF;
END;

-- Vistas
CREATE VIEW DBA.PrestamosActivos AS
SELECT 
    p.id AS prestamo_id, 
    m.nombre AS material, 
    s.nombre_completo AS socio, 
    e.nombre AS empleado, 
    p.fecha_hora_retiro, 
    p.fecha_hora_devolucion_limite, 
    p.tipo,
    DATEDIFF(day, CURRENT DATE, p.fecha_hora_devolucion_limite) AS dias_restantes
FROM DBA.Prestamos p
JOIN DBA.Materiales m ON p.material_id = m.id
JOIN DBA.Socios s ON p.socio_id = s.id
JOIN DBA.Empleados e ON p.empleado_id = e.id
WHERE p.estado = 'activo';

CREATE VIEW DBA.SociosSancionados AS
SELECT 
    s.id, 
    s.nombre_completo, 
    s.documento_identidad, 
    sa.fecha_inicio, 
    sa.fecha_fin, 
    sa.motivo,
    DATEDIFF(day, CURRENT DATE, sa.fecha_fin) AS dias_restantes_sancion
FROM DBA.Socios s
JOIN DBA.Sanciones sa ON s.id = sa.socio_id
WHERE sa.estado = 'activa'
  AND (sa.fecha_fin IS NULL OR sa.fecha_fin >= CURRENT DATE);