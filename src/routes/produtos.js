// src/routes/produtos.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function produtosRoutes(app) {
  const auth = { preHandler: [app.autenticar] }

  app.get('/', auth, async () =>
    prisma.produto.findMany({ where: { ativo: true }, orderBy: [{ categoria: 'asc' }, { nome: 'asc' }] })
  )

  app.get('/:id/ultimo-preco', auth, async (req) => {
    const produtoId = parseInt(req.params.id)
    const item = await prisma.cantinaItem.findFirst({
      where: { produtoId },
      include: { domingo: true },
      orderBy: { domingo: { data: 'desc' } }
    })
    return { preco: item?.preco || null, domingoData: item?.domingo?.data || null }
  })

  app.post('/', auth, async (req, reply) => {
    const { nome, categoria } = req.body
    if (!nome) return reply.code(400).send({ erro: 'Nome é obrigatório' })
    const produto = await prisma.produto.create({ data: { nome, categoria: categoria || 'Geral' } })
    return reply.code(201).send(produto)
  })

  app.put('/:id', auth, async (req) => {
    const id = parseInt(req.params.id)
    const { nome, categoria, ativo } = req.body
    return prisma.produto.update({ where: { id }, data: { nome, categoria, ativo } })
  })
}
