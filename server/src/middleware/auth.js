const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido ou expirado' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Token de autenticação não fornecido' });
  }
};

// Middleware para rotas parcialmente protegidas (GET público, resto protegido)
const protectNonGetRoutes = (req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  
  return authenticateJWT(req, res, next);
};

module.exports = {
  authenticateJWT,
  protectNonGetRoutes
};
