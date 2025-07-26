/**
 * =========================================
 * SISTEMA DE LOGGING CENTRALIZADO - GESTLIB
 * =========================================
 * 
 * Logger unificado para toda la aplicación
 * con diferentes niveles y formato consistente.
 * 
 * Niveles: ERROR, WARN, INFO, DEBUG
 * Autor: Sistema GestLib
 * =========================================
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 1. CONFIGURACIÓN DEL LOGGER
// ==========================================

class GestLibLogger {
    constructor() {
        this.logsDir = path.join(__dirname, '../../logs');
        this.ensureLogsDirectory();
    }

    // ==========================================
    // 2. CREAR DIRECTORIO DE LOGS
    // ==========================================
    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    // ==========================================
    // 3. FORMATEAR TIMESTAMP
    // ==========================================
    getTimestamp() {
        return new Date().toLocaleString('es-PY', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // ==========================================
    // 4. FORMATEAR MENSAJES DE LOG
    // ==========================================
    formatMessage(level, module, operation, message, data = null) {
        const timestamp = this.getTimestamp();
        const emoji = this.getEmoji(level);
        let formattedMessage = `[${timestamp}] ${emoji} ${level.toUpperCase()} | ${module} | ${operation} | ${message}`;
        
        if (data) {
            formattedMessage += `\n📄 Datos: ${JSON.stringify(data, null, 2)}`;
        }
        
        return formattedMessage;
    }

    // ==========================================
    // 5. EMOJIS POR NIVEL
    // ==========================================
    getEmoji(level) {
        const emojis = {
            'error': '❌',
            'warn': '⚠️',
            'info': '✅',
            'debug': '🔍',
            'auth': '🔐',
            'db': '🗄️',
            'api': '🌐'
        };
        return emojis[level.toLowerCase()] || '📝';
    }

    // ==========================================
    // 6. ESCRIBIR A ARCHIVO Y CONSOLA
    // ==========================================
    writeLog(level, module, operation, message, data = null) {
        const formattedMessage = this.formatMessage(level, module, operation, message, data);
        
        // Mostrar en consola
        console.log(formattedMessage);
        
        // Escribir a archivo
        const logFile = path.join(this.logsDir, `gestlib-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, formattedMessage + '\n');
    }

    // ==========================================
    // 7. MÉTODOS PÚBLICOS DE LOGGING
    // ==========================================

    /**
     * Log de error crítico
     */
    error(module, operation, message, data = null) {
        this.writeLog('error', module, operation, message, data);
    }

    /**
     * Log de advertencia
     */
    warn(module, operation, message, data = null) {
        this.writeLog('warn', module, operation, message, data);
    }

    /**
     * Log de información exitosa
     */
    info(module, operation, message, data = null) {
        this.writeLog('info', module, operation, message, data);
    }

    /**
     * Log de debugging
     */
    debug(module, operation, message, data = null) {
        this.writeLog('debug', module, operation, message, data);
    }

    /**
     * Log específico de autenticación
     */
    auth(operation, message, data = null) {
        this.writeLog('auth', 'AUTH', operation, message, data);
    }

    /**
     * Log específico de base de datos
     */
    db(operation, message, data = null) {
        this.writeLog('db', 'DATABASE', operation, message, data);
    }

    /**
     * Log específico de API
     */
    api(method, endpoint, message, data = null) {
        this.writeLog('api', 'API', `${method} ${endpoint}`, message, data);
    }

    // ==========================================
    // 8. LOGS ESPECIALIZADOS PARA CRUD
    // ==========================================

    /**
     * Log de operación CRUD
     */
    crud(entity, operation, id, message, data = null) {
        const module = entity.toUpperCase();
        const op = `${operation.toUpperCase()}${id ? ` ID:${id}` : ''}`;
        this.writeLog('info', module, op, message, data);
    }

    /**
     * Log de error en operación CRUD
     */
    crudError(entity, operation, id, error, data = null) {
        const module = entity.toUpperCase();
        const op = `${operation.toUpperCase()}${id ? ` ID:${id}` : ''}`;
        this.writeLog('error', module, op, error.message, { 
            error: error.message, 
            stack: error.stack,
            odbcErrors: error.odbcErrors,
            ...data 
        });
    }
}

// ==========================================
// 9. EXPORTAR INSTANCIA SINGLETON
// ==========================================
const logger = new GestLibLogger();

module.exports = logger;
