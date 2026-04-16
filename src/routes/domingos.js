// src/routes/domingos.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function domingosRoutes(app) {
  const auth = { preHandler: [app.autenticar] }

  // GET /api/domingos
  app.get('/', auth, async () =>
    prisma.domingo.findMany({
      orderBy: { data: 'desc' },
      include: { _count: { select: { cantinaItens: true, vendas: true } } }
    })
  )

  // GET /api/domingos/:id
  app.get('/:id', auth, async (req, reply) => {
    const id = parseInt(req.params.id)
    const domingo = await prisma.domingo.findUnique({
      where: { id },
      include: { cantinaItens: { include: { produto: true } } }
    })
    if (!domingo) return reply.code(404).send({ erro: 'Domingo não encontrado' })
    return domingo
  })

  // GET /api/domingos/:id/vendas
  app.get('/:id/vendas', auth, async (req) => {
    const domingoId = parseInt(req.params.id)
    const vendas = await prisma.venda.findMany({
      where: { domingoId, cancelada: false },
      include: { pessoa: true, itens: { include: { produto: true } } }
    })
    return vendas.map(v => ({
      ...v,
      total: v.itens.reduce((s, i) => s + i.quantidade * i.precoUnit, 0)
    }))
  })

  // POST /api/domingos
  app.post('/', auth, async (req, reply) => {
    const { data, descricao } = req.body
    if (!data) return reply.code(400).send({ erro: 'Data é obrigatória' })
    const domingo = await prisma.domingo.create({ data: { data, descricao } })
    return reply.code(201).send(domingo)
  })

  // PUT /api/domingos/:id/itens — salva a lista de produtos+preços do domingo
  app.put('/:id/itens', auth, async (req) => {
    const domingoId = parseInt(req.params.id)
    const { itens } = req.body // [{ produtoId, preco }]

    await prisma.cantinaItem.deleteMany({ where: { domingoId } })
    if (itens?.length) {
      await prisma.cantinaItem.createMany({
        data: itens.map(i => ({ domingoId, produtoId: i.produtoId, preco: parseFloat(i.preco) }))
      })
    }
    await prisma.log.create({
      data: { usuarioId: req.user.id, acao: 'SALVAR_CANTINA', tabela: 'cantinaItens', registroId: domingoId }
    })
    return prisma.domingo.findUnique({
      where: { id: domingoId },
      include: { cantinaItens: { include: { produto: true } } }
    })
  })

  // GET /api/domingos/:id/copiar — retorna itens do domingo anterior para copiar
  app.get('/:id/copiar', auth, async (req) => {
    const domingoId = parseInt(req.params.id)
    const domingo = await prisma.domingo.findUnique({ where: { id: domingoId } })
    const anterior = await prisma.domingo.findFirst({
      where: { data: { lt: domingo.data } },
      orderBy: { data: 'desc' },
      include: { cantinaItens: { include: { produto: true } } }
    })
    return anterior?.cantinaItens || []
  })
}
