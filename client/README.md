# Delta Board - Frontend

Frontend React do Delta Board, preparado para deploy no AWS S3 + CloudFront.

## 🚀 Deploy no AWS S3

### Pré-requisitos

- Node.js 18+ e pnpm instalados
- Conta AWS configurada
- Bucket S3 criado
- CloudFront distribution configurada (opcional, mas recomendado)

### Configuração

1. **Instalar dependências:**
```bash
pnpm install
```

2. **Configurar variáveis de ambiente:**
Crie um arquivo `.env` na raiz do projeto:

```env
# URL do backend (EC2)
VITE_API_URL=https://seu-backend-ec2.com/api/trpc

# Configurações da aplicação
VITE_APP_TITLE=Delta Board
VITE_APP_LOGO=/logo-delta.png

# OAuth (opcional)
VITE_OAUTH_PORTAL_URL=https://oauth-portal.com
VITE_APP_ID=seu-app-id

# Google Maps (opcional)
VITE_FRONTEND_FORGE_API_KEY=sua-chave
VITE_FRONTEND_FORGE_API_URL=https://forge-api.com
```

3. **Build do projeto:**
```bash
pnpm build
```

Isso gerará os arquivos estáticos na pasta `dist/`.

### Deploy no S3

1. **Fazer upload dos arquivos:**
```bash
aws s3 sync dist/ s3://seu-bucket-name/ --delete
```

2. **Configurar CloudFront (recomendado):**
   - Criar uma distribution apontando para o bucket S3
   - Configurar HTTPS
   - Configurar cache policies apropriadas
   - Configurar error pages (404 → index.html para SPA)

3. **Configurar CORS no S3 (se necessário):**
   - Permitir origem do CloudFront/domínio
   - Permitir métodos: GET, HEAD
   - Permitir headers: *

### Variáveis de Ambiente no Build

As variáveis de ambiente começando com `VITE_` são injetadas no build em tempo de compilação. Certifique-se de configurá-las antes de fazer o build.

### Desenvolvimento Local

```bash
pnpm dev
```

O frontend rodará em `http://localhost:5173` e se conectará ao backend configurado em `VITE_API_URL`.

## 📝 Notas Importantes

- O frontend precisa estar configurado para fazer requisições CORS para o backend
- Certifique-se de que o backend está configurado para aceitar requisições do domínio do frontend
- Para produção, use HTTPS em ambos frontend e backend
- Configure cookies com `SameSite=None; Secure` se frontend e backend estiverem em domínios diferentes




