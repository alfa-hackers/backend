export const getServerConfig = () => {
  const nodeEnv = process.env.NODE_ENV
  const host = process.env.HOST
  const port = parseInt(process.env.BACKEND_PORT)

  const baseUrl =
    nodeEnv === 'production'
      ? `https://${host}:${port}`
      : `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`

  return { nodeEnv, host, port, baseUrl }
}
