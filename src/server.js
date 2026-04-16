// src/server.js
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { config } from 'dotenv'

config()

import authRoutes      from './routes/auth.js'
import pessoasRoutes   from './routes/pessoas.js'
import produtosRoutes  from './routes/produtos.js'
import domingosRoutes  from './routes/domingos.js'
import vendasRoutes    from './routes/vendas.js'
import pagamentosRoutes from './routes/pagamentos.js'
import cobrancasRoutes from './routes/cobrancas.js'
import relatoriosRoutes from './routes/relatorios.js'

const app = Fastify({ logger: false })

await app.register(cors, {
  origin: true, // Aceita qualquer origem (necessário para Vercel + Render)
  credentials: true
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'cantinapp-ademji-secret-2025'
})

app.decorate('autenticar', async (req, reply) => {
  try {
    await req.jwtVerify()
  } catch {
    reply.code(401).send({ erro: 'Token inválido. Faça login novamente.' })
  }
})

app.get('/health', async () => ({
  status: 'ok', app: 'CantinApp ADEMJI', versao: '2.0.0',
  time: new Date().toISOString()
}))

app.register(authRoutes,      { prefix: '/api/auth' })
app.register(pessoasRoutes,   { prefix: '/api/pessoas' })
app.register(produtosRoutes,  { prefix: '/api/produtos' })
app.register(domingosRoutes,  { prefix: '/api/domingos' })
app.register(vendasRoutes,    { prefix: '/api/vendas' })
app.register(pagamentosRoutes,{ prefix: '/api/pagamentos' })
app.register(cobrancasRoutes, { prefix: '/api/cobranças' })
app.register(relatoriosRoutes,{ prefix: '/api/relatorios' })

const PORT = parseInt(process.env.PORT) || 3001
const HOST = '0.0.0.0'

try {
  await app.listen({ port: PORT, host: HOST })
  console.log(`\n⛪ CantinApp ADEMJI API rodando na porta ${PORT}`)
} catch (err) {
  console.error(err)
  process.exit(1)
}
