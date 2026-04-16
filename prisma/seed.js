// prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Populando banco de dados...')

  // Usuário admin
  const senhaHash = await bcrypt.hash('admin123', 10)
  await prisma.usuario.upsert({
    where: { email: 'admin@cantina.com' },
    update: {},
    create: { nome: 'Administrador', email: 'admin@cantina.com', senha: senhaHash, perfil: 'ADMIN' }
  })

  await prisma.usuario.upsert({
    where: { email: 'operador@cantina.com' },
    update: {},
    create: { nome: 'Operador', email: 'operador@cantina.com', senha: await bcrypt.hash('op123', 10), perfil: 'OPERADOR' }
  })

  // Pessoas
  const pessoas = await Promise.all([
    prisma.pessoa.create({ data: { nome: 'Maria Rita',      telefone: '11999991234' } }),
    prisma.pessoa.create({ data: { nome: 'João Paulo',      telefone: '11988882345' } }),
    prisma.pessoa.create({ data: { nome: 'Ana Silva',       telefone: '11977773456' } }),
    prisma.pessoa.create({ data: { nome: 'Carlos Ferreira', telefone: '11966664567' } }),
    prisma.pessoa.create({ data: { nome: 'Fernanda Costa',  telefone: '11955555678' } }),
  ])

  // Produtos
  const produtos = await Promise.all([
    prisma.produto.create({ data: { nome: 'Coxinha',         categoria: 'Salgados' } }),
    prisma.produto.create({ data: { nome: 'Café',            categoria: 'Bebidas'  } }),
    prisma.produto.create({ data: { nome: 'Suco de Laranja', categoria: 'Bebidas'  } }),
    prisma.produto.create({ data: { nome: 'Bolo de Cenoura', categoria: 'Doces'    } }),
    prisma.produto.create({ data: { nome: 'Água',            categoria: 'Bebidas'  } }),
    prisma.produto.create({ data: { nome: 'Pão de Queijo',   categoria: 'Salgados' } }),
  ])

  // Domingos
  const dom1 = await prisma.domingo.create({ data: { data: '2025-03-23', descricao: 'Culto 23/03' } })
  const dom2 = await prisma.domingo.create({ data: { data: '2025-03-30', descricao: 'Culto 30/03' } })
  const dom3 = await prisma.domingo.create({ data: { data: '2025-04-06', descricao: 'Culto 06/04' } })

  // Cantina itens
  const precos3 = [5.00, 3.00, 8.00, 6.00, 2.00, 4.50]
  const precos2 = [4.50, 3.00, 7.50, 6.00, 2.00, 4.00]
  for (let i = 0; i < produtos.length; i++) {
    await prisma.cantinaItem.create({ data: { domingoId: dom3.id, produtoId: produtos[i].id, preco: precos3[i] } })
    await prisma.cantinaItem.create({ data: { domingoId: dom2.id, produtoId: produtos[i].id, preco: precos2[i] } })
  }

  // Vendas demo
  const v1 = await prisma.venda.create({
    data: { pessoaId: pessoas[0].id, domingoId: dom3.id, data: '2025-04-06', hora: '10:30' }
  })
  await prisma.vendaItem.createMany({ data: [
    { vendaId: v1.id, produtoId: produtos[0].id, quantidade: 1, precoUnit: 5.00 },
    { vendaId: v1.id, produtoId: produtos[1].id, quantidade: 2, precoUnit: 3.00 },
  ]})

  const v2 = await prisma.venda.create({
    data: { pessoaId: pessoas[0].id, domingoId: dom2.id, data: '2025-03-30', hora: '11:00' }
  })
  await prisma.vendaItem.createMany({ data: [
    { vendaId: v2.id, produtoId: produtos[2].id, quantidade: 1, precoUnit: 7.50 },
    { vendaId: v2.id, produtoId: produtos[3].id, quantidade: 1, precoUnit: 6.00 },
  ]})

  const v3 = await prisma.venda.create({
    data: { pessoaId: pessoas[1].id, domingoId: dom2.id, data: '2025-03-30', hora: '10:45' }
  })
  await prisma.vendaItem.createMany({ data: [
    { vendaId: v3.id, produtoId: produtos[0].id, quantidade: 2, precoUnit: 4.50 },
    { vendaId: v3.id, produtoId: produtos[1].id, quantidade: 1, precoUnit: 3.00 },
  ]})

  const v4 = await prisma.venda.create({
    data: { pessoaId: pessoas[2].id, domingoId: dom3.id, data: '2025-04-06', hora: '09:50' }
  })
  await prisma.vendaItem.createMany({ data: [
    { vendaId: v4.id, produtoId: produtos[5].id, quantidade: 2, precoUnit: 4.50 },
    { vendaId: v4.id, produtoId: produtos[1].id, quantidade: 1, precoUnit: 3.00 },
  ]})

  // Pagamentos
  await prisma.pagamento.create({ data: { pessoaId: pessoas[0].id, valor: 30.00, forma: 'PIX',      data: '2025-03-25' } })
  await prisma.pagamento.create({ data: { pessoaId: pessoas[1].id, valor: 10.00, forma: 'Dinheiro', data: '2025-03-28' } })

  console.log('✅ Seed concluído!')
  console.log('📧 Login: admin@cantina.com / Senha: admin123')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
