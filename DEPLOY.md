# 🚀 Deploy CantinApp ADEMJI — Guia Completo

## Stack
- Frontend: Vercel (grátis)
- Backend: Render (grátis)
- Banco: Supabase (grátis)

---

## PASSO 1 — Banco de dados no Supabase

1. Acesse https://supabase.com e crie conta gratuita
2. Clique em "New Project"
3. Nome: `cantinapp-ademji`
4. Defina uma senha forte para o banco
5. Região: South America (São Paulo)
6. Aguarde criar (~2 min)
7. Vá em Settings → Database → Connection String → URI
8. Copie a URL (parece: `postgresql://postgres:SENHA@db.xxx.supabase.co:5432/postgres`)
9. **Guarde essa URL** — você vai usar no Render

---

## PASSO 2 — Subir código no GitHub

1. Acesse https://github.com e crie conta
2. Crie dois repositórios:
   - `cantinapp-frontend` (público)
   - `cantinapp-backend` (público)
3. No PC, instale o Git: https://git-scm.com/download/win
4. No CMD, dentro da pasta `cantinapp-backend`:

```cmd
git init
git add .
git commit -m "CantinApp ADEMJI backend"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/cantinapp-backend.git
git push -u origin main
```

5. Repita para a pasta `cantinapp` (frontend)

---

## PASSO 3 — Backend no Render

1. Acesse https://render.com e crie conta (pode usar o GitHub)
2. Clique em "New +" → "Web Service"
3. Conecte o repositório `cantinapp-backend`
4. Configure:
   - Name: `cantinapp-ademji-api`
   - Environment: `Node`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `node src/server.js`
5. Em "Environment Variables", adicione:
   - `DATABASE_URL` = URL do Supabase copiada no Passo 1
   - `JWT_SECRET` = `cantinapp-ademji-2025-secret`
   - `NODE_ENV` = `production`
6. Clique "Create Web Service"
7. Aguarde o deploy (~5 min)
8. Copie a URL gerada (ex: `https://cantinapp-ademji-api.onrender.com`)

---

## PASSO 4 — Rodar seed no banco

Após o deploy do backend, acesse no navegador:
```
https://cantinapp-ademji-api.onrender.com/health
```

Deve aparecer: `{"status":"ok","app":"CantinApp ADEMJI"}`

Para popular com dados iniciais, no CMD da pasta backend:
```cmd
set DATABASE_URL=SUA_URL_DO_SUPABASE
npx prisma migrate deploy
node prisma/seed.js
```

---

## PASSO 5 — Frontend no Vercel

1. Acesse https://vercel.com e crie conta (pode usar o GitHub)
2. Clique em "New Project"
3. Importe o repositório `cantinapp-frontend`
4. Em "Environment Variables", adicione:
   - `VITE_API_URL` = URL do Render (ex: `https://cantinapp-ademji-api.onrender.com`)
5. Clique "Deploy"
6. Aguarde (~2 min)
7. URL gerada: `https://cantinapp-ademji.vercel.app`

---

## ✅ Resultado Final

- App disponível em: `https://cantinapp-ademji.vercel.app`
- Funciona em qualquer celular, sem PC ligado
- PWA — instala como app na tela inicial
- Custo: R$ 0,00/mês

---

## 📱 Instalar no celular após deploy

1. Abra `https://cantinapp-ademji.vercel.app` no Chrome
2. Menu (3 pontinhos) → "Adicionar à tela inicial"
3. Pronto! App instalado 🎉

