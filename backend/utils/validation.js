/**
 * =========================================
 * HELPERS DE VALIDACIÓN - GESTLIB
 * =========================================
 * 
 * Funciones reutilizables para validar datos
 * en todos los controladores del sistema.
 * 
 * Autor: Sistema GestLib
 * =========================================
 */

const logger = require('./logger');

// ==========================================
// 1. VALIDACIONES GENERALES
// ==========================================

/**
 * Valida si los campos requeridos están presentes
 * @param {Object} data - Datos a validar
 * @param {Array} requiredFields - Campos requeridos
 * @param {string} entity - Nombre de la entidad para logs
 * @returns {Object} { isValid: boolean, missingFields: array, message: string }
 */
function validateRequiredFields(data, requiredFields, entity = 'Registro') {
    const missingFields = [];
    
    requiredFields.forEach(field => {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missingFields.push(field);
        }
    });
    
    const isValid = missingFields.length === 0;
    
    if (!isValid) {
        logger.warn('VALIDATION', 'REQUIRED_FIELDS', `Campos faltantes en ${entity}`, {
            missingFields,
            receivedData: Object.keys(data)
        });
    }
    
    return {
        isValid,
        missingFields,
        message: isValid ? null : `Faltan campos obligatorios: ${missingFields.join(', ')}`
    };
}

/**
 * Valida formato de cédula paraguaya
 * @param {string} cedula - Cédula a validar
 * @returns {Object} { isValid: boolean, message: string }
 */
function validateCedula(cedula) {
    if (!cedula) {
        return { isValid: false, message: 'Cédula es requerida' };
    }
    
    // Limpiar cédula (remover puntos y guiones)
    const cleanCedula = cedula.toString().replace(/[.-]/g, '');
    
    // Verificar que tenga entre 6 y 8 dígitos
    if (!/^\d{6,8}$/.test(cleanCedula)) {
        logger.warn('VALIDATION', 'CEDULA_FORMAT', 'Formato de cédula inválido', { cedula });
        return { isValid: false, message: 'La cédula debe tener entre 6 y 8 dígitos' };
    }
    
    return { isValid: true, message: null };
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {Object} { isValid: boolean, message: string }
 */
function validateEmail(email) {
    if (!email) {
        return { isValid: true, message: null }; // Email es opcional
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
        logger.warn('VALIDATION', 'EMAIL_FORMAT', 'Formato de email inválido', { email });
    }
    
    return {
        isValid,
        message: isValid ? null : 'Formato de email inválido'
    };
}

/**
 * Valida fecha
 * @param {string} date - Fecha a validar
 * @param {string} fieldName - Nombre del campo para mensajes
 * @returns {Object} { isValid: boolean, message: string }
 */
function validateDate(date, fieldName = 'fecha') {
    if (!date) {
        return { isValid: false, message: `${fieldName} es requerida` };
    }
    
    const dateObj = new Date(date);
    const isValid = !isNaN(dateObj.getTime());
    
    if (!isValid) {
        logger.warn('VALIDATION', 'DATE_FORMAT', `Formato de ${fieldName} inválido`, { date, fieldName });
    }
    
    return {
        isValid,
        message: isValid ? null : `Formato de ${fieldName} inválido`
    };
}

// ==========================================
// 2. VALIDACIONES ESPECÍFICAS POR ENTIDAD
// ==========================================

/**
 * Valida datos de socio
 * @param {Object} socio - Datos del socio
 * @returns {Object} { isValid: boolean, errors: array }
 */
function validateSocio(socio) {
    const errors = [];
    
    // Campos requeridos
    const requiredValidation = validateRequiredFields(
        socio, 
        ['NOMBRE', 'APELLIDO', 'CEDULA', 'FECHA_NACIMIENTO'],
        'Socio'
    );
    
    if (!requiredValidation.isValid) {
        errors.push(requiredValidation.message);
    }
    
    // Validar cédula
    if (socio.CEDULA) {
        const cedulaValidation = validateCedula(socio.CEDULA);
        if (!cedulaValidation.isValid) {
            errors.push(cedulaValidation.message);
        }
    }
    
    // Validar email si está presente
    if (socio.CORREO) {
        const emailValidation = validateEmail(socio.CORREO);
        if (!emailValidation.isValid) {
            errors.push(emailValidation.message);
        }
    }
    
    // Validar fecha de nacimiento
    if (socio.FECHA_NACIMIENTO) {
        const dateValidation = validateDate(socio.FECHA_NACIMIENTO, 'fecha de nacimiento');
        if (!dateValidation.isValid) {
            errors.push(dateValidation.message);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida datos de bibliotecario
 * @param {Object} bibliotecario - Datos del bibliotecario
 * @returns {Object} { isValid: boolean, errors: array }
 */
function validateBibliotecario(bibliotecario) {
    const errors = [];
    
    // Campos requeridos
    const requiredValidation = validateRequiredFields(
        bibliotecario,
        ['USUARIO', 'NOMBRE', 'APELLIDO', 'CEDULA', 'CONTRASENA'],
        'Bibliotecario'
    );
    
    if (!requiredValidation.isValid) {
        errors.push(requiredValidation.message);
    }
    
    // Validar cédula
    if (bibliotecario.CEDULA) {
        const cedulaValidation = validateCedula(bibliotecario.CEDULA);
        if (!cedulaValidation.isValid) {
            errors.push(cedulaValidation.message);
        }
    }
    
    // Validar usuario (solo letras, números y guiones bajos)
    if (bibliotecario.USUARIO) {
        const userRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!userRegex.test(bibliotecario.USUARIO)) {
            errors.push('El usuario debe tener entre 3-20 caracteres (solo letras, números y guiones bajos)');
        }
    }
    
    // Validar contraseña
    if (bibliotecario.CONTRASENA && bibliotecario.CONTRASENA.length < 4) {
        errors.push('La contraseña debe tener al menos 4 caracteres');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida datos de material
 * @param {Object} material - Datos del material
 * @returns {Object} { isValid: boolean, errors: array }
 */
function validateMaterial(material) {
    const errors = [];
    
    // Campos requeridos
    const requiredValidation = validateRequiredFields(
        material,
        ['NOMBRE', 'SUBTIPO_ID', 'TIPO_MATERIAL'],
        'Material'
    );
    
    if (!requiredValidation.isValid) {
        errors.push(requiredValidation.message);
    }
    
    // Validar año si está presente
    if (material.ANIO && (material.ANIO < 1000 || material.ANIO > new Date().getFullYear())) {
        errors.push('El año debe estar entre 1000 y el año actual');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida datos de préstamo
 * @param {Object} prestamo - Datos del préstamo
 * @returns {Object} { isValid: boolean, errors: array }
 */
function validatePrestamo(prestamo) {
    const errors = [];
    
    // Campos requeridos
    const requiredValidation = validateRequiredFields(
        prestamo,
        ['SOCIO_ID', 'MATERIAL_ID', 'FECHA_PRESTAMO'],
        'Préstamo'
    );
    
    if (!requiredValidation.isValid) {
        errors.push(requiredValidation.message);
    }
    
    // Validar fecha de préstamo
    if (prestamo.FECHA_PRESTAMO) {
        const dateValidation = validateDate(prestamo.FECHA_PRESTAMO, 'fecha de préstamo');
        if (!dateValidation.isValid) {
            errors.push(dateValidation.message);
        }
    }
    
    // Validar fecha de devolución prevista si está presente
    if (prestamo.FECHA_DEVOLUCION_PREVISTA) {
        const dateValidation = validateDate(prestamo.FECHA_DEVOLUCION_PREVISTA, 'fecha de devolución prevista');
        if (!dateValidation.isValid) {
            errors.push(dateValidation.message);
        }
    }
    
    // Validar que los IDs sean números positivos
    if (prestamo.SOCIO_ID && (isNaN(prestamo.SOCIO_ID) || prestamo.SOCIO_ID <= 0)) {
        errors.push('ID de socio debe ser un número positivo');
    }
    
    if (prestamo.MATERIAL_ID && (isNaN(prestamo.MATERIAL_ID) || prestamo.MATERIAL_ID <= 0)) {
        errors.push('ID de material debe ser un número positivo');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida datos de donante
 * @param {Object} donante - Datos del donante
 * @returns {Object} { isValid: boolean, errors: array }
 */
function validateDonante(donante) {
    const errors = [];
    
    // Campos requeridos
    const requiredValidation = validateRequiredFields(
        donante,
        ['NOMBRE', 'APELLIDO', 'CEDULA'],
        'Donante'
    );
    
    if (!requiredValidation.isValid) {
        errors.push(requiredValidation.message);
    }
    
    // Validar cédula
    if (donante.CEDULA) {
        const cedulaValidation = validateCedula(donante.CEDULA);
        if (!cedulaValidation.isValid) {
            errors.push(cedulaValidation.message);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Valida datos de institución
 * @param {Object} institucion - Datos de la institución
 * @returns {Object} { isValid: boolean, errors: array }
 */
function validateInstitucion(institucion) {
    const errors = [];
    
    // Campos requeridos
    const requiredValidation = validateRequiredFields(
        institucion,
        ['INSTITUCION'],
        'Institución'
    );
    
    if (!requiredValidation.isValid) {
        errors.push(requiredValidation.message);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// ==========================================
// 3. HELPER DE RESPUESTA DE ERRORES
// ==========================================

/**
 * Crea una respuesta estándar de error de validación
 * @param {Object} res - Response object
 * @param {Array} errors - Lista de errores
 * @param {string} entity - Nombre de la entidad
 */
function sendValidationError(res, errors, entity = 'Registro') {
    logger.warn('VALIDATION', 'FAILED', `Validación fallida para ${entity}`, { errors });
    
    return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors,
        entity
    });
}

// ==========================================
// 4. EXPORTAR FUNCIONES
// ==========================================
module.exports = {
    validateRequiredFields,
    validateCedula,
    validateEmail,
    validateDate,
    validateSocio,
    validateBibliotecario,
    validateMaterial,
    validatePrestamo,
    validateDonante,
    validateInstitucion,
    sendValidationError
};
