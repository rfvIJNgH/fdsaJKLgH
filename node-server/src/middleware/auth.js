import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).send('Authorization header required');
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).send('Invalid authorization format');
  try {
    const secret = process.env.JWT_SECRET || 'my-secret-key';
    const payload = jwt.verify(token, secret);
    req.user = {
      id: payload.userId || payload.userID || payload.UserID || payload.UserId || payload.UserID,
      username: payload.username,
      email: payload.email
    };
    next();
  } catch (e) {
    return res.status(401).send('Invalid or expired token');
  }
}

export function signJwt(user) {
  const secret = process.env.JWT_SECRET || 'my-secret-key';
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email
    },
    secret,
    { expiresIn: '24h', issuer: 'arouzy-api' }
  );
}


