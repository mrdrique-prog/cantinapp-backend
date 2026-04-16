// src/routes/vendas.js
import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns'
const prisma = new PrismaClient()

export default async function vendasRoutes(app) {
  const auth = { preHandler: [app.autenticar] }

  // POST /api/vendas
  app.post('/', auth, async (req, reply) => {
    const { pessoaId, domingoId, itens } = req.body
    if (!pessoaId || !domingoId || !itens?.length)
      return reply.code(400).send({ erro: 'pessoaId, domingoId e itens são obrigatórios' })

    const itensFiltrados = itens.filter(i => i.quantidade > 0)
    if (!itensFiltrados.length) return reply.code(400).send({ erro: 'Adicione pelo menos 1 item' })

    const agora = new Date()
    const venda = await prisma.venda.create({
      data: {
        pessoaId: parseInt(pessoaId),
        domingoId: parseInt(domingoId),
        usuarioId: req.user.id,
        data: format(agora, 'yyyy-MM-dd'),
        hora: format(agora, 'HH:mm'),
        itens: {
          create: itensFiltrados.map(i => ({
            produtoId: parseInt(i.produtoId),
            quantidade: parseInt(i.quantidade),
            precoUnit: parseFloat(i.preco)
          }))
        }
      },
      include: { itens: { include: { produto: true } }, pessoa: true }
    })
    await prisma.log.create({
      data: { usuarioId: req.user.id, acao: 'VENDA', tabela: 'vendas', registroId: venda.id }
    })
    return reply.code(201).send({
      ...venda,
      total: venda.itens.reduce((s, i) => s + i.quantidade * i.precoUnit, 0)
    })
  })

  // DELETE /api/vendas/:id — cancela venda
  app.delete('/:id', auth, async (req, reply) => {
    if (req.user.perfil === 'CONSULTA') return reply.code(403).send({ erro: 'Sem permissão' })
    const id = parseInt(req.params.id)
    await prisma.venda.update({ where: { id }, data: { cancelada: true } })
    await prisma.log.create({
      data: { usuarioId: req.user.id, acao: 'CANCELAR_VENDA', tabela: 'vendas', registroId: id }
    })
    return { mensagem: 'Venda cancelada' }
  })
}
