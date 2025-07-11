# 💎 Sistema de Gestão para Loja de Bijuterias

Sistema completo e moderno para gestão de lojas de bijuterias e acessórios, desenvolvido com as tecnologias mais atuais.

## 🚀 Tecnologias

- **Next.js 13+** - Framework React com App Router
- **MongoDB** - Banco de dados NoSQL
- **NextAuth.js** - Autenticação robusta
- **Zustand** - Gerenciamento de estado global
- **TailwindCSS** - Estilização moderna
- **TypeScript** - Tipagem estática
- **PWA** - Aplicação web progressiva

## ✨ Funcionalidades

### 🔐 Autenticação
- Login seguro com email e senha
- Sistema de permissões por função (admin, vendedor, caixa, estoque)
- Sessões persistentes

### 👥 Gestão de Clientes
- Cadastro completo com preferências
- Histórico de compras
- Busca avançada

### 📦 Gestão de Produtos
- Cadastro com controle de estoque
- Cálculo automático de margem de lucro
- Alertas de estoque baixo
- Preço sugerido baseado em margem

### 💳 PDV (Ponto de Venda)
- Interface otimizada para touch
- Carrinho de compras intuitivo
- Múltiplas formas de pagamento
- Aplicação de descontos

### 📊 Relatórios
- Dashboard completo
- Vendas por período
- Performance por funcionário
- Produtos mais vendidos

### 📱 Mobile-First
- Design responsivo
- Instalável como PWA
- Offline-ready
- Aparência nativa no mobile

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone [seu-repositorio]
cd jewelry-store
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**
```bash
cp .env.local.example .env.local
```

4. **Configure o MongoDB**
   - Instale o MongoDB localmente ou use MongoDB Atlas
   - Atualize a `MONGODB_URI` no arquivo `.env.local`

5. **Inicie o servidor**
```bash
npm run dev
```

6. **Crie o usuário admin**
   - Acesse `http://localhost:3000/login`
   - Clique em "Criar Admin"
   - Use as credenciais: `admin@lojabyju.com` / `admin123`

## 🔧 Configuração

### Variáveis de Ambiente (.env.local)

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/jewelry-store

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-minimum-32-characters

# Admin Setup
ADMIN_EMAIL=admin@lojabyju.com
ADMIN_PASSWORD=admin123
```

### Estrutura do Banco de Dados

- **Users** - Funcionários e usuários do sistema
- **Customers** - Clientes da loja
- **Products** - Produtos e estoque
- **Sales** - Vendas realizadas

## 👥 Permissões por Função

| Função | Dashboard | PDV | Clientes | Produtos | Estoque | Funcionários | Relatórios |
|--------|-----------|-----|----------|----------|---------|--------------|------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vendedor | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Caixa | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Estoque | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

## 📱 PWA - Instalação no Mobile

1. Acesse o sistema pelo navegador mobile
2. Toque no menu do navegador
3. Selecione "Adicionar à tela inicial"
4. O app será instalado como aplicativo nativo

## 🎨 Design System

- **Cores primárias**: Indigo (#6366F1)
- **Tipografia**: Inter (Google Fonts)
- **Espaçamento**: Sistema de 8px
- **Componentes**: shadcn/ui
- **Animações**: Framer Motion

## 🔒 Segurança

- Autenticação JWT
- Senhas hasheadas com bcrypt
- Validação de dados no servidor
- Proteção de rotas por middleware
- Sanitização de inputs

## 📈 Performance

- Code splitting automático
- Lazy loading de componentes
- Otimização de imagens
- Cache de dados
- Bundle otimizado

## 🐛 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linting do código
```

### Estrutura de Pastas

```
app/
├── api/            # API Routes
├── login/          # Página de login
├── pdv/            # Ponto de venda
├── products/       # Gestão de produtos
├── customers/      # Gestão de clientes
└── globals.css     # Estilos globais

components/
├── ui/             # Componentes base
├── Layout.tsx      # Layout principal
├── Navbar.tsx      # Barra de navegação
└── Sidebar.tsx     # Menu lateral

lib/
├── models/         # Modelos do MongoDB
├── auth.ts         # Configuração NextAuth
├── mongodb.ts      # Conexão MongoDB
└── utils.ts        # Utilitários

store/
└── useStore.ts     # Store do Zustand
```

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: suporte@lojabyju.com
- Documentação: [Link para docs]
- Issues: [Link para GitHub Issues]

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

Desenvolvido com ❤️ para lojas de bijuterias modernas.