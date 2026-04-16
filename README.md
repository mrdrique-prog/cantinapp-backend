# ⛪ CantinApp — Backend (Fase 2)

API REST completa com Node.js, Fastify e PostgreSQL.

---

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL instalado e rodando

---

## 🚀 Instalação passo a passo

### 1. Instalar o PostgreSQL (se ainda não tiver)

Baixe em: https://www.postgresql.org/download/windows/

Durante a instalação:
- Defina uma senha para o usuário `postgres` (anote essa senha!)
- Porta padrão: 5432

### 2. Criar o banco de dados

Abra o **pgAdmin** (instala junto com PostgreSQL) ou o **SQL Shell (psql)** e execute:

```sql
CREATE DATABASE cantinapp;
```

Ou pelo terminal:
```cmd
psql -U postgres -c "CREATE DATABASE cantinapp;"
```

### 3. Configurar o arquivo .env

Copie o arquivo `.env.example` para `.env`:

```cmd
copy .env.example .env
```

Edite o `.env` e preencha com os seus dados:

```
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/cantinapp"
JWT_SECRET="cantinapp-super-secret-2025"
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

Troque `SUA_SENHA` pela senha do PostgreSQL que você definiu na instalação.

### 4. Instalar dependências

```cmd
npm install
```

### 5. Criar as tabelas no banco

```cmd
npm run db:generate
npm run db:migrate
```

Quando perguntar o nome da migration, digite: `inicio`

### 6. Popular com dados de demonstração

```cmd
npm run db:seed
```

### 7. Iniciar o servidor

```cmd
npm run dev
```

O backend vai rodar em: **http://localhost:3001**

---

## ✅ Verificar se está funcionando

Abra no navegador:
```
http://localhost:3001/health
```

Deve aparecer:
```json
{"status":"ok","app":"CantinApp API","versao":"2.0.0"}
```

---

## 🔐 Credenciais padrão

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@cantina.com | admin123 | Admin |
| operador@cantina.com | op123 | Operador |

---

## 📡 Endpoints da API

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Dados do usuário logado |
| POST | /api/auth/usuarios | Criar usuário (admin) |
| PUT | /api/auth/senha | Alterar senha |

### Pessoas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/pessoas | Listar pessoas |
| GET | /api/pessoas/:id | Detalhes |
| GET | /api/pessoas/:id/extrato | Extrato completo |
| POST | /api/pessoas | Criar |
| PUT | /api/pessoas/:id | Editar |

### Domingos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/domingos | Listar |
| GET | /api/domingos/:id | Detalhes + itens |
| POST | /api/domingos | Criar domingo |
| PUT | /api/domingos/:id/itens | Salvar produtos+preços |
| GET | /api/domingos/:id/copiar | Itens do domingo anterior |

### Vendas
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/vendas | Registrar venda |
| DELETE | /api/vendas/:id | Cancelar venda |

### Pagamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/pagamentos | Registrar pagamento |
| GET | /api/pagamentos/pessoa/:id | Pagamentos de uma pessoa |

### Relatórios
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/relatorios/dashboard | Métricas gerais |
| GET | /api/relatorios/mensal?mes=2025-03 | Relatório mensal |
| GET | /api/relatorios/devedores | Lista de devedores |

---

## 🔄 Rodar Frontend + Backend juntos

**Terminal 1 — Backend:**
```cmd
cd cantinapp-backend
npm run dev
```

**Terminal 2 — Frontend:**
```cmd
cd cantinapp
npm run dev
```

O frontend detecta automaticamente se o backend está online.
- **Backend online** → usa API + login obrigatório
- **Backend offline** → usa dados locais (IndexedDB), sem login

---

## 🗃️ Visualizar o banco de dados

```cmd
npm run db:studio
```

Abre o **Prisma Studio** em http://localhost:5555 — interface visual para ver e editar os dados.
