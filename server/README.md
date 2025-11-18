# Delta Board - Backend

Backend Node.js do Delta Board, preparado para deploy no AWS EC2.

## 🚀 Deploy no AWS EC2

### Pré-requisitos

- Instância EC2 com Ubuntu 20.04+ / Amazon Linux 2
- Node.js 18+ instalado
- MySQL 8.0+ ou MariaDB 10.6+ instalado e configurado
- PM2 instalado (gerenciador de processos)
- pnpm instalado

### Configuração do Servidor

1. **Instalar dependências do sistema:**
```bash
sudo apt-get update
sudo apt-get install -y nodejs npm mysql-server
sudo npm install -g pm2 pnpm
```

2. **Configurar MySQL:**
```bash
sudo mysql -u root -p

# Criar banco de dados
CREATE DATABASE delta_board CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'delta_user'@'localhost' IDENTIFIED BY 'SUA_SENHA_SEGURA';
GRANT ALL PRIVILEGES ON delta_board.* TO 'delta_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

3. **Configurar variáveis de ambiente:**
Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL=mysql://delta_user:SUA_SENHA@localhost:3306/delta_board

# JWT Secret (gerar com: openssl rand -base64 32)
JWT_SECRET=sua_chave_secreta_jwt_minimo_32_caracteres

# URL do Frontend (S3/CloudFront)
FRONTEND_URL=https://seu-frontend-s3.com

# Porta do servidor
PORT=3000

# OAuth (opcional)
OAUTH_SERVER_URL=https://oauth-server.com
OWNER_OPEN_ID=seu-open-id

# AWS S3 (para upload de arquivos)
AWS_ACCESS_KEY_ID=sua-chave
AWS_SECRET_ACCESS_KEY=sua-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu-bucket

# SendGrid (opcional, para emails)
SENDGRID_API_KEY=sua-chave-sendgrid
FROM_EMAIL=noreply@seu-dominio.com
FROM_NAME=Delta Board

# OpenAI (opcional)
OPENAI_API_KEY=sua-chave-openai

# Forge API (opcional)
BUILT_IN_FORGE_API_URL=https://forge-api.com
BUILT_IN_FORGE_API_KEY=sua-chave-forge
```

4. **Instalar dependências:**
```bash
pnpm install
```

5. **Executar migrações do banco:**
```bash
pnpm db:push
```

6. **Build do projeto:**
```bash
pnpm build
```

### Deploy com PM2

1. **Criar arquivo de configuração PM2 (`ecosystem.config.js`):**
```javascript
module.exports = {
  apps: [{
    name: 'delta-board-server',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

2. **Iniciar aplicação:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Configuração de Firewall

```bash
# Permitir porta do servidor
sudo ufw allow 3000/tcp

# Se usar Nginx como reverse proxy
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Configuração de Nginx (Opcional, mas recomendado)

Crie `/etc/nginx/sites-available/delta-board`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative o site:
```bash
sudo ln -s /etc/nginx/sites-available/delta-board /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL/HTTPS com Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

### Monitoramento

```bash
# Ver logs
pm2 logs delta-board-server

# Ver status
pm2 status

# Reiniciar
pm2 restart delta-board-server

# Parar
pm2 stop delta-board-server
```

## 📝 Notas Importantes

- Configure CORS para aceitar requisições do frontend
- Use HTTPS em produção
- Configure backups regulares do banco de dados
- Monitore recursos do servidor (CPU, memória, disco)
- Configure logs rotativos para evitar acúmulo de arquivos

## 🔒 Segurança

- Use senhas fortes para banco de dados e JWT
- Configure firewall (UFW) adequadamente
- Use HTTPS com certificados válidos
- Mantenha Node.js e dependências atualizadas
- Configure rate limiting se necessário




