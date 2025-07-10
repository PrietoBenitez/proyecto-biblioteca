// backend/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No autorizado: token faltante' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido o expirado' });
    }
}

module.exports = authMiddleware;
