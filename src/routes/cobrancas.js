// src/routes/cobranças.js
import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'
const prisma = new PrismaClient()

export default async function cobrancasRoutes(app) {
  const auth = { preHandler: [app.autenticar] }

  app.get('/', auth, async (req) => {
    const { mesRef } = req.query
    return prisma.cobranca.findMany({
      where: mesRef ? { mesRef } : {},
      include: { pessoa: true },
      orderBy: { dataEnvio: 'desc' }
    })
  })

  app.post('/', auth, async (req, reply) => {
    const { pessoaId, mesRef, valor } = req.body
    const cobranca = await prisma.cobranca.create({
      data: {
        pessoaId: parseInt(pessoaId),
        mesRef,
        valor: parseFloat(valor),
        dataEnvio: format(new Date(), 'yyyy-MM-dd'),
        status: 'enviada'
      }
    })
    return reply.code(201).send(cobranca)
  })
}
