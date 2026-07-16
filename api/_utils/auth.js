import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'cleantech-smart-crm-secret-2026';

export function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function signToken(user) {
  const payload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  
  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64');
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(serialized);
  const signature = hmac.digest('hex');
  
  return `${serialized}.${signature}`;
}

export function verifyToken(token) {
  if (!token) throw new Error('Token ausente');
  
  const parts = token.split('.');
  if (parts.length !== 2) throw new Error('Token inválido');
  
  const [serialized, signature] = parts;
  
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(serialized);
  const expectedSignature = hmac.digest('hex');
  
  if (signature !== expectedSignature) {
    throw new Error('Assinatura do token inválida');
  }
  
  const payload = JSON.parse(Buffer.from(serialized, 'base64').toString('utf8'));
  
  if (payload.exp < Date.now()) {
    throw new Error('Token expirado');
  }
  
  return payload;
}

export function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new Error('Cabeçalho Authorization ausente');
  
  const token = authHeader.replace('Bearer ', '').trim();
  return verifyToken(token);
}
