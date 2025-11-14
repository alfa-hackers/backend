import * as crypto from 'crypto'

export function decodeSession(cookie: string): any {
  try {
    console.log('decodeSession called with cookie:', cookie) // 🔹 лог всех найденных cookie

    const sessionSecret = process.env.SESSION_SECRET
    const cookieParts = cookie.split('.')

    if (cookieParts.length < 2) {
      console.log('decodeSession: cookieParts.length < 2, invalid format')
      return null
    }

    const payload = cookieParts[0]
    const signature = cookieParts[1]

    const expectedSignature = crypto
      .createHmac('sha256', sessionSecret)
      .update(payload)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    if (signature !== expectedSignature) {
      console.log('decodeSession: signature mismatch')
      return null
    }

    const decodedPayload = Buffer.from(payload, 'base64').toString('utf8')
    const sessionData = JSON.parse(decodedPayload)
    console.log('decodeSession: decoded session data:', sessionData) // 🔹 лог декодированных данных

    return sessionData
  } catch (err) {
    console.log('decodeSession: error decoding session', err)
    return null
  }
}
