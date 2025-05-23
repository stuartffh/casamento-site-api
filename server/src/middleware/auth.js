const jwt = require('jsonwebtoken');

// Corrigir aqui: essa deve ser a chave secreta usada para assinar/verificar os tokens
const secretKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey, (err, user) => {
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
