const prestamosModel = require('../models/prestamos.model');

// Obtener todos los préstamos
exports.getAllPrestamos = async (req, res) => {
    console.log('📚 GET ALL PRESTAMOS - Obteniendo todos los préstamos');
    try {
        const prestamos = await prestamosModel.getAllPrestamos();
        console.log('✅ GET ALL PRESTAMOS - Préstamos obtenidos:', prestamos.length);
        res.json(prestamos);
    } catch (error) {
        console.error('❌ GET ALL PRESTAMOS - Error:', error.message);
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message && odbcError.message.includes('RAISERROR executed:')) {
                const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                if (raiseErrorMessage) {
                    errorMessage = raiseErrorMessage
                        .trim()
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/^\[.*?\]\s*/, '')
                        .replace(/^Error:\s*/i, '')
                        .trim();
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

// Obtener préstamo por ID
exports.getPrestamoById = async (req, res) => {
    const { id } = req.params;
    console.log('📚 GET PRESTAMO BY ID - ID:', id);
    
    try {
        const prestamo = await prestamosModel.getPrestamoById(id);
        if (!prestamo) {
            console.log('❌ GET PRESTAMO BY ID - Préstamo no encontrado. ID:', id);
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        console.log('✅ GET PRESTAMO BY ID - Préstamo encontrado:', prestamo.PRESTAMO_ID);
        res.json(prestamo);
    } catch (error) {
        console.error('❌ GET PRESTAMO BY ID - Error:', error.message);
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message && odbcError.message.includes('RAISERROR executed:')) {
                const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                if (raiseErrorMessage) {
                    errorMessage = raiseErrorMessage
                        .trim()
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/^\[.*?\]\s*/, '')
                        .replace(/^Error:\s*/i, '')
                        .trim();
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

// Crear préstamo
exports.createPrestamo = async (req, res) => {
    const prestamo = req.body;
    console.log('📚 CREATE PRESTAMO - Datos recibidos:', JSON.stringify(prestamo, null, 2));
    console.log('📚 CREATE PRESTAMO - Usuario autenticado:', req.user);
    
    try {
        const result = await prestamosModel.createPrestamo(prestamo, req.user);
        if (result.error) {
            console.log('❌ CREATE PRESTAMO - Error de validación:', result.error);
            return res.status(400).json({ error: result.error });
        }
        console.log('✅ CREATE PRESTAMO - Préstamo creado exitosamente. ID:', result.insertId);
        res.status(201).json({ 
            message: 'Préstamo creado correctamente',
            prestamoId: result.insertId
        });
    } catch (error) {
        console.error('❌ CREATE PRESTAMO - Error:', error.message);
        console.error('❌ CREATE PRESTAMO - Stack trace:', error.stack);
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message && odbcError.message.includes('RAISERROR executed:')) {
                const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                if (raiseErrorMessage) {
                    errorMessage = raiseErrorMessage
                        .trim()
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/^\[.*?\]\s*/, '')
                        .replace(/^Error:\s*/i, '')
                        .trim();
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

// Actualizar préstamo
exports.updatePrestamo = async (req, res) => {
    const { id } = req.params;
    const prestamo = req.body;
    console.log('📚 UPDATE PRESTAMO - ID:', id);
    console.log('📚 UPDATE PRESTAMO - Datos recibidos:', JSON.stringify(prestamo, null, 2));
    console.log('📚 UPDATE PRESTAMO - Usuario autenticado:', req.user);
    
    try {
        const result = await prestamosModel.updatePrestamo(id, prestamo);
        if (!result || result.affectedRows === 0) {
            console.log('❌ UPDATE PRESTAMO - Préstamo no encontrado. ID:', id);
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        console.log('✅ UPDATE PRESTAMO - Préstamo actualizado exitosamente. ID:', id);
        res.json({ message: 'Préstamo actualizado correctamente' });
    } catch (error) {
        console.error('❌ UPDATE PRESTAMO - Error:', error.message);
        console.error('❌ UPDATE PRESTAMO - Stack trace:', error.stack);
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message && odbcError.message.includes('RAISERROR executed:')) {
                const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                if (raiseErrorMessage) {
                    errorMessage = raiseErrorMessage
                        .trim()
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .replace(/^\[.*?\]\s*/, '')
                        .replace(/^Error:\s*/i, '')
                        .trim();
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};

// Eliminar préstamo
exports.deletePrestamo = async (req, res) => {
    const { id } = req.params;
    console.log('📚 DELETE PRESTAMO - ID:', id);
    console.log('📚 DELETE PRESTAMO - Usuario autenticado:', req.user);
    
    try {
        const result = await prestamosModel.deletePrestamo(id);
        if (!result || result.affectedRows === 0) {
            console.log('❌ DELETE PRESTAMO - Préstamo no encontrado. ID:', id);
            return res.status(404).json({ message: 'Préstamo no encontrado' });
        }
        console.log('✅ DELETE PRESTAMO - Préstamo eliminado exitosamente. ID:', id);
        res.json({ message: 'Préstamo eliminado correctamente' });
    } catch (error) {
        console.error('❌ DELETE PRESTAMO - Error:', error.message);
        console.error('❌ DELETE PRESTAMO - Stack trace:', error.stack);
        
        // Extraer mensaje amigable del error ODBC/SQL
        let errorMessage = error.message;
        if (error.odbcErrors && error.odbcErrors.length > 0) {
            const odbcError = error.odbcErrors[0];
            if (odbcError.message) {
                // Casos específicos de errores de integridad referencial
                if (odbcError.message.includes('is referenced by foreign key')) {
                    errorMessage = 'No se puede eliminar el préstamo porque está siendo referenciado en otros registros del sistema.';
                } else {
                    errorMessage = odbcError.message;
                    
                    // Si hay RAISERROR, extraer el mensaje limpio
                    if (odbcError.message.includes('RAISERROR executed:')) {
                        const raiseErrorMessage = odbcError.message.split('RAISERROR executed: ')[1];
                        if (raiseErrorMessage) {
                            errorMessage = raiseErrorMessage
                                .trim()
                                .replace(/\n/g, ' ')
                                .replace(/\s+/g, ' ')
                                .replace(/^\[.*?\]\s*/, '')
                                .replace(/^Error:\s*/i, '')
                                .trim();
                        }
                    }
                }
            }
        }
        
        res.status(500).json({ error: errorMessage });
    }
};
