/**
 * =========================================
 * MIDDLEWARE DE LOGGING - GESTLIB
 * =========================================
 * 
 * Middleware para capturar automáticamente
 * todas las requests HTTP con detalles útiles.
 * 
 * Autor: Sistema GestLib
 * =========================================
 */

const logger = require('../utils/logger');

// ==========================================
// 1. MIDDLEWARE DE REQUEST LOGGING
// ==========================================
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    
    // Log de inicio de request
    logger.api(method, originalUrl, 'Request iniciada', {
        ip: ip,
        userAgent: req.get('User-Agent'),
        body: req.method !== 'GET' ? req.body : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined
    });

    // Interceptar la respuesta
    const originalSend = res.send;
    res.send = function(body) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Determinar nivel de log según status code
        if (statusCode >= 500) {
            logger.api(method, originalUrl, `Error del servidor - ${statusCode}`, {
                duration: `${duration}ms`,
                statusCode,
                responseBody: typeof body === 'string' ? JSON.parse(body || '{}') : body
            });
        } else if (statusCode >= 400) {
            logger.warn('API', `${method} ${originalUrl}`, `Error del cliente - ${statusCode}`, {
                duration: `${duration}ms`,
                statusCode
            });
        } else {
            logger.api(method, originalUrl, `Completada exitosamente - ${statusCode}`, {
                duration: `${duration}ms`,
                statusCode
            });
        }
        
        originalSend.call(this, body);
    };

    next();
};

// ==========================================
// 2. MIDDLEWARE DE ERROR LOGGING
// ==========================================
const errorLogger = (err, req, res, next) => {
    logger.error('MIDDLEWARE', 'ERROR_HANDLER', 'Error no manejado capturado', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    // Si es un error ODBC, extraer información útil
    if (err.odbcErrors) {
        logger.error('DATABASE', 'ODBC_ERROR', 'Error específico de base de datos', {
            odbcErrors: err.odbcErrors
        });
    }
    
    next(err);
};

module.exports = {
    requestLogger,
    errorLogger
};
