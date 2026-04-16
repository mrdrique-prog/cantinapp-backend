// src/routes/pagamentos.js
import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'
const prisma = new PrismaClient()

export default async function pagamentosRoutes(app) {
  const auth = { preHandler: [app.autenticar] }

  app.post('/', auth, async (req, reply) => {
    const { pessoaId, valor, forma, observacao } = req.body
    if (!pessoaId || !valor) return reply.code(400).send({ erro: 'pessoaId e valor são obrigatórios' })
    const pagamento = await prisma.pagamento.create({
      data: {
        pessoaId: parseInt(pessoaId),
        valor: parseFloat(valor),
        forma: forma || 'PIX',
        observacao,
        data: format(new Date(), 'yyyy-MM-dd')
      }
    })
    await prisma.log.create({
      data: { usuarioId: req.user.id, acao: 'PAGAMENTO', tabela: 'pagamentos', registroId: pagamento.id }
    })
    return reply.code(201).send(pagamento)
  })

  app.get('/pessoa/:pessoaId', auth, async (req) => {
    const pessoaId = parseInt(req.params.pessoaId)
    return prisma.pagamento.findMany({ where: { pessoaId }, orderBy: { data: 'desc' } })
  })
}
