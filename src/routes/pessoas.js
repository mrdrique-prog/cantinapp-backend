// src/routes/pessoas.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getSaldo(pessoaId) {
  const itens = await prisma.vendaItem.findMany({
    where: { venda: { pessoaId, cancelada: false } }
  })
  const totalCompras = itens.reduce((s, i) => s + i.quantidade * i.precoUnit, 0)
  const pagamentos = await prisma.pagamento.findMany({ where: { pessoaId } })
  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0)
  return +(totalCompras - totalPago).toFixed(2)
}

export default async function pessoasRoutes(app) {
  const auth = { preHandler: [app.autenticar] }

  // GET /api/pessoas
  app.get('/', auth, async (req) => {
    const { busca, apenasDevedores } = req.query
    const pessoas = await prisma.pessoa.findMany({
      where: {
        ativo: true,
        ...(busca && { nome: { contains: busca, mode: 'insensitive' } })
      },
      orderBy: { nome: 'asc' }
    })
    const comSaldo = await Promise.all(pessoas.map(async p => ({ ...p, saldo: await getSaldo(p.id) })))
    if (apenasDevedores === 'true') return comSaldo.filter(p => p.saldo > 0)
    return comSaldo
  })

  // GET /api/pessoas/:id
  app.get('/:id', auth, async (req, reply) => {
    const id = parseInt(req.params.id)
    const pessoa = await prisma.pessoa.findUnique({ where: { id } })
    if (!pessoa) return reply.code(404).send({ erro: 'Pessoa não encontrada' })
    return { ...pessoa, saldo: await getSaldo(id) }
  })

  // GET /api/pessoas/:id/extrato
  app.get('/:id/extrato', auth, async (req) => {
    const pessoaId = parseInt(req.params.id)
    const vendas = await prisma.venda.findMany({
      where: { pessoaId, cancelada: false },
      include: { domingo: true, itens: { include: { produto: true } } },
      orderBy: { data: 'desc' }
    })
    const pagamentos = await prisma.pagamento.findMany({
      where: { pessoaId }, orderBy: { data: 'desc' }
    })
    const extrato = [
      ...vendas.map(v => ({
        tipo: 'compra', data: v.data, hora: v.hora,
        desc: v.itens.map(i => `${i.quantidade}x ${i.produto.nome}`).join(', '),
        valor: -(v.itens.reduce((s, i) => s + i.quantidade * i.precoUnit, 0)),
        domingoDesc: v.domingo?.descricao || '',
        vendaId: v.id
      })),
      ...pagamentos.map(p => ({
        tipo: 'pagamento', data: p.data, hora: '00:00',
        desc: `Pagamento ${p.forma}`, valor: p.valor,
        domingoDesc: '', pagamentoId: p.id
      }))
    ].sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora))
    return extrato
  })

  // POST /api/pessoas
  app.post('/', auth, async (req, reply) => {
    const { nome, telefone, observacoes } = req.body
    if (!nome) return reply.code(400).send({ erro: 'Nome é obrigatório' })
    const pessoa = await prisma.pessoa.create({ data: { nome, telefone, observacoes } })
    await prisma.log.create({ data: { usuarioId: req.user.id, acao: 'CRIAR', tabela: 'pessoas', registroId: pessoa.id } })
    return reply.code(201).send({ ...pessoa, saldo: 0 })
  })

  // PUT /api/pessoas/:id
  app.put('/:id', auth, async (req, reply) => {
    const id = parseInt(req.params.id)
    const { nome, telefone, observacoes, ativo } = req.body
    const pessoa = await prisma.pessoa.update({ where: { id }, data: { nome, telefone, observacoes, ativo } })
    await prisma.log.create({ data: { usuarioId: req.user.id, acao: 'EDITAR', tabela: 'pessoas', registroId: id } })
    return { ...pessoa, saldo: await getSaldo(id) }
  })

  // DELETE /api/pessoas/:id (soft delete)
  app.delete('/:id', auth, async (req, reply) => {
    if (req.user.perfil === 'CONSULTA') return reply.code(403).send({ erro: 'Sem permissão' })
    const id = parseInt(req.params.id)
    await prisma.pessoa.update({ where: { id }, data: { ativo: false } })
    return { mensagem: 'Pessoa desativada' }
  })
}
