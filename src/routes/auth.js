// src/routes/auth.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const prisma = new PrismaClient()

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'mrd.rique@gmail.com', pass: '@102030@ADEMJI' }
})

const ADMIN_EMAIL = 'riquemrd@hotmail.com'

async function enviarEmail({ para, assunto, html }) {
  try {
    await transporter.sendMail({
      from: '"CantinApp ADEMJI" <mrd.rique@gmail.com>',
      to: para, subject: assunto, html
    })
    return true
  } catch (e) {
    console.error('Erro ao enviar email:', e.message)
    return false
  }
}

export default async function authRoutes(app) {

  // POST /api/auth/login
  app.post('/login', async (req, reply) => {
    const { email, senha } = req.body
    if (!email || !senha) return reply.code(400).send({ erro: 'Email e senha são obrigatórios' })
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario || !usuario.ativo) return reply.code(401).send({ erro: 'Usuário não encontrado' })
    const ok = await bcrypt.compare(senha, usuario.senha)
    if (!ok) return reply.code(401).send({ erro: 'Senha incorreta' })
    const token = app.jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      { expiresIn: '7d' }
    )
    await prisma.log.create({ data: { usuarioId: usuario.id, acao: 'LOGIN', tabela: 'usuarios', registroId: usuario.id } })
    return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } }
  })

  // GET /api/auth/me
  app.get('/me', { preHandler: [app.autenticar] }, async (req) => {
    return prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { id: true, nome: true, email: true, perfil: true }
    })
  })

  // POST /api/auth/verificar-senha — verifica senha para ações sensíveis
  app.post('/verificar-senha', { preHandler: [app.autenticar] }, async (req, reply) => {
    const { senha } = req.body
    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } })
    const ok = await bcrypt.compare(senha, usuario.senha)
    if (!ok) return reply.code(401).send({ erro: 'Senha incorreta' })
    return { ok: true }
  })

  // PUT /api/auth/senha — trocar senha (precisa da senha atual)
  app.put('/senha', { preHandler: [app.autenticar] }, async (req, reply) => {
    const { senhaAtual, novaSenha } = req.body
    if (!senhaAtual || !novaSenha) return reply.code(400).send({ erro: 'Informe a senha atual e a nova senha' })
    if (novaSenha.length < 6) return reply.code(400).send({ erro: 'A nova senha deve ter pelo menos 6 caracteres' })

    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } })
    const ok = await bcrypt.compare(senhaAtual, usuario.senha)
    if (!ok) return reply.code(401).send({ erro: 'Senha atual incorreta' })

    const hash = await bcrypt.hash(novaSenha, 10)
    await prisma.usuario.update({ where: { id: req.user.id }, data: { senha: hash } })

    // Notificar admin
    const agora = new Date().toLocaleString('pt-BR')
    await enviarEmail({
      para: ADMIN_EMAIL,
      assunto: '[CantinApp ADEMJI] Senha alterada',
      html: `
        <h2>⚠️ Senha alterada no CantinApp</h2>
        <p>O usuário <strong>${usuario.nome}</strong> (${usuario.email}) alterou sua senha.</p>
        <p><strong>Data/hora:</strong> ${agora}</p>
        <p>Se você não reconhece essa ação, entre em contato imediatamente.</p>
        <hr>
        <small>CantinApp ADEMJI</small>
      `
    })

    await prisma.log.create({ data: { usuarioId: req.user.id, acao: 'TROCA_SENHA', tabela: 'usuarios', registroId: req.user.id } })
    return { mensagem: 'Senha alterada com sucesso' }
  })

  // POST /api/auth/esqueci-senha
  app.post('/esqueci-senha', async (req, reply) => {
    const { email } = req.body
    if (!email) return reply.code(400).send({ erro: 'Informe o email' })

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return reply.code(404).send({ erro: 'Email não encontrado' })

    // Gerar token de reset
    const token = crypto.randomBytes(32).toString('hex')
    const expira = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { resetToken: token, resetTokenExpira: expira }
    })

    // Email para o usuário
    await enviarEmail({
      para: email,
      assunto: '[CantinApp ADEMJI] Redefinição de senha',
      html: `
        <h2>🔐 Redefinição de senha — CantinApp ADEMJI</h2>
        <p>Olá, <strong>${usuario.nome}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Seu código de verificação é:</p>
        <h1 style="letter-spacing: 8px; color: #2E7D32; font-size: 36px;">${token.slice(0, 6).toUpperCase()}</h1>
        <p>Este código expira em <strong>1 hora</strong>.</p>
        <p>Se não foi você, ignore este email.</p>
        <hr>
        <small>CantinApp ADEMJI</small>
      `
    })

    // Notificar admin
    await enviarEmail({
      para: ADMIN_EMAIL,
      assunto: '[CantinApp ADEMJI] Solicitação de reset de senha',
      html: `
        <h2>🔑 Reset de senha solicitado</h2>
        <p>O usuário <strong>${usuario.nome}</strong> (${email}) solicitou redefinição de senha.</p>
        <p><strong>Data/hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <hr><small>CantinApp ADEMJI</small>
      `
    })

    return { mensagem: 'Email enviado! Verifique sua caixa de entrada.' }
  })

  // POST /api/auth/resetar-senha
  app.post('/resetar-senha', async (req, reply) => {
    const { email, codigo, novaSenha } = req.body
    if (!email || !codigo || !novaSenha) return reply.code(400).send({ erro: 'Dados incompletos' })
    if (novaSenha.length < 6) return reply.code(400).send({ erro: 'A senha deve ter pelo menos 6 caracteres' })

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario || !usuario.resetToken) return reply.code(400).send({ erro: 'Solicitação inválida' })
    if (new Date() > usuario.resetTokenExpira) return reply.code(400).send({ erro: 'Código expirado. Solicite novo reset.' })
    if (!usuario.resetToken.startsWith(codigo.toLowerCase())) return reply.code(400).send({ erro: 'Código incorreto' })

    const hash = await bcrypt.hash(novaSenha, 10)
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: hash, resetToken: null, resetTokenExpira: null }
    })

    await enviarEmail({
      para: ADMIN_EMAIL,
      assunto: '[CantinApp ADEMJI] Senha redefinida',
      html: `<h2>✅ Senha redefinida</h2><p>O usuário <strong>${usuario.nome}</strong> (${email}) redefiniu sua senha em ${new Date().toLocaleString('pt-BR')}.</p>`
    })

    return { mensagem: 'Senha redefinida com sucesso!' }
  })

  // POST /api/auth/usuarios (apenas ADMIN)
  app.post('/usuarios', { preHandler: [app.autenticar] }, async (req, reply) => {
    if (req.user.perfil !== 'ADMIN') return reply.code(403).send({ erro: 'Apenas administradores podem criar usuários' })
    const { nome, email, senha, perfil } = req.body
    if (!nome || !email || !senha) return reply.code(400).send({ erro: 'Nome, email e senha são obrigatórios' })
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) return reply.code(409).send({ erro: 'Email já cadastrado' })
    const hash = await bcrypt.hash(senha, 10)
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash, perfil: perfil || 'OPERADOR' },
      select: { id: true, nome: true, email: true, perfil: true }
    })

    // Enviar boas-vindas
    await enviarEmail({
      para: email,
      assunto: 'Bem-vindo ao CantinApp ADEMJI!',
      html: `
        <h2>⛪ Bem-vindo ao CantinApp ADEMJI!</h2>
        <p>Olá, <strong>${nome}</strong>!</p>
        <p>Sua conta foi criada com sucesso.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Senha:</strong> ${senha}</p>
        <p>Acesse o app e troque sua senha após o primeiro login.</p>
        <hr><small>CantinApp ADEMJI</small>
      `
    })

    return reply.code(201).send(usuario)
  })

  // GET /api/auth/usuarios
  app.get('/usuarios', { preHandler: [app.autenticar] }, async (req, reply) => {
    if (req.user.perfil !== 'ADMIN') return reply.code(403).send({ erro: 'Acesso negado' })
    return prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, perfil: true, ativo: true },
      orderBy: { nome: 'asc' }
    })
  })
}
