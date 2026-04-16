// src/routes/relatorios.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function relatoriosRoutes(app) {
  const auth = { preHandler: [app.autenticar] }

  // GET /api/relatorios/mensal?mes=2025-03
  app.get('/mensal', auth, async (req) => {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7)

    const vendas = await prisma.venda.findMany({
      where: { data: { startsWith: mes }, cancelada: false },
      include: { itens: true }
    })
    const totalVendido = vendas.reduce((s, v) =>
      s + v.itens.reduce((si, i) => si + i.quantidade * i.precoUnit, 0), 0)

    const pagamentos = await prisma.pagamento.findMany({ where: { data: { startsWith: mes } } })
    const totalRecebido = pagamentos.reduce((s, p) => s + p.valor, 0)

    return {
      mes,
      totalVendido: +totalVendido.toFixed(2),
      totalRecebido: +totalRecebido.toFixed(2),
      emAberto: +(totalVendido - totalRecebido).toFixed(2),
      qtdVendas: vendas.length,
      qtdPagamentos: pagamentos.length
    }
  })

  // GET /api/relatorios/devedores
  app.get('/devedores', auth, async () => {
    const pessoas = await prisma.pessoa.findMany({ where: { ativo: true } })

    const devedores = await Promise.all(pessoas.map(async p => {
      const itens = await prisma.vendaItem.findMany({
        where: { venda: { pessoaId: p.id, cancelada: false } }
      })
      const totalCompras = itens.reduce((s, i) => s + i.quantidade * i.precoUnit, 0)
      const pagamentos = await prisma.pagamento.findMany({ where: { pessoaId: p.id } })
      const totalPago = pagamentos.reduce((s, pg) => s + pg.valor, 0)
      const saldo = +(totalCompras - totalPago).toFixed(2)
      return { ...p, saldo }
    }))

    return devedores.filter(p => p.saldo > 0).sort((a, b) => b.saldo - a.saldo)
  })

  // GET /api/relatorios/dashboard
  app.get('/dashboard', auth, async () => {
    const mesAtual = new Date().toISOString().slice(0, 7)

    const [totalPessoas, totalProdutos, totalDomingos] = await Promise.all([
      prisma.pessoa.count({ where: { ativo: true } }),
      prisma.produto.count({ where: { ativo: true } }),
      prisma.domingo.count()
    ])

    const vendasMes = await prisma.venda.findMany({
      where: { data: { startsWith: mesAtual }, cancelada: false },
      include: { itens: true }
    })
    const totalVendidoMes = vendasMes.reduce((s, v) =>
      s + v.itens.reduce((si, i) => si + i.quantidade * i.precoUnit, 0), 0)

    const pgtosMes = await prisma.pagamento.findMany({ where: { data: { startsWith: mesAtual } } })
    const totalRecebidoMes = pgtosMes.reduce((s, p) => s + p.valor, 0)

    const pessoas = await prisma.pessoa.findMany({ where: { ativo: true } })
    let totalEmAberto = 0
    for (const p of pessoas) {
      const itens = await prisma.vendaItem.findMany({ where: { venda: { pessoaId: p.id, cancelada: false } } })
      const compras = itens.reduce((s, i) => s + i.quantidade * i.precoUnit, 0)
      const pagtos = await prisma.pagamento.findMany({ where: { pessoaId: p.id } })
      const pago = pagtos.reduce((s, pg) => s + pg.valor, 0)
      totalEmAberto += compras - pago
    }

    return {
      totalPessoas, totalProdutos, totalDomingos,
      totalVendidoMes: +totalVendidoMes.toFixed(2),
      totalRecebidoMes: +totalRecebidoMes.toFixed(2),
      totalEmAberto: +totalEmAberto.toFixed(2)
    }
  })
}
