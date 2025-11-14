export const cookieConfig = {
  sameSite: (process.env.SESSION_COOKIE_SAME_SITE || 'lax') as 'strict' | 'lax' | 'none',
  httpOnly: process.env.SESSION_COOKIE_HTTP_ONLY !== 'false',
  secure: process.env.SESSION_COOKIE_SECURE === 'true',
  maxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '86400000'),
  domain: process.env.SESSION_COOKIE_DOMAIN || '.whirav.ru',
  path: '/',
}
