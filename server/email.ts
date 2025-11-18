import sgMail from '@sendgrid/mail';

// Configurar SendGrid com API key do ambiente
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@deltasolutions.com.br';
const FROM_NAME = process.env.FROM_NAME || 'Delta Solutions';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[Email] SendGrid configurado com sucesso');
} else {
  console.warn('[Email] SENDGRID_API_KEY não configurada - emails não serão enviados');
}

/**
 * Template HTML para email de recuperação de senha
 */
function getPasswordResetEmailTemplate(resetLink: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #555;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background-color: #667eea;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #5568d3;
    }
    .alternative-link {
      margin-top: 30px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 6px;
      font-size: 14px;
      color: #666;
      word-break: break-all;
    }
    .alternative-link p {
      margin: 0 0 10px 0;
    }
    .alternative-link a {
      color: #667eea;
      text-decoration: none;
    }
    .footer {
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #999;
      border-top: 1px solid #eee;
    }
    .warning {
      margin-top: 30px;
      padding: 15px;
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      font-size: 14px;
      color: #856404;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperação de Senha</h1>
    </div>
    <div class="content">
      <p class="greeting">Olá${userName ? `, ${userName}` : ''}!</p>
      
      <p class="message">
        Recebemos uma solicitação para redefinir a senha da sua conta no 
        <strong>Sistema de Orçamento de Usinagem</strong>.
      </p>
      
      <p class="message">
        Para criar uma nova senha, clique no botão abaixo:
      </p>
      
      <div class="button-container">
        <a href="${resetLink}" class="button">Redefinir Senha</a>
      </div>
      
      <div class="alternative-link">
        <p><strong>Ou copie e cole este link no seu navegador:</strong></p>
        <a href="${resetLink}">${resetLink}</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ Importante:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Este link expira em <strong>1 hora</strong></li>
          <li>Se você não solicitou esta recuperação, ignore este email</li>
          <li>Nunca compartilhe este link com outras pessoas</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Delta Solutions - Sistema de Orçamento de Usinagem</p>
      <p style="margin-top: 10px; font-size: 12px;">
        Este é um email automático, por favor não responda.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envia email de recuperação de senha
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  userName?: string
): Promise<{ success: boolean; message: string }> {
  
  if (!SENDGRID_API_KEY) {
    console.warn('[Email] Tentativa de envio sem SENDGRID_API_KEY configurada');
    return {
      success: false,
      message: 'Serviço de email não configurado. Configure SENDGRID_API_KEY nas variáveis de ambiente.',
    };
  }

  // Construir link de redefinição
  const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: 'Recuperação de Senha - Sistema de Orçamento de Usinagem',
    html: getPasswordResetEmailTemplate(resetLink, userName),
    text: `
Olá${userName ? `, ${userName}` : ''}!

Recebemos uma solicitação para redefinir a senha da sua conta no Sistema de Orçamento de Usinagem.

Para criar uma nova senha, acesse o link abaixo:
${resetLink}

IMPORTANTE:
- Este link expira em 1 hora
- Se você não solicitou esta recuperação, ignore este email
- Nunca compartilhe este link com outras pessoas

© ${new Date().getFullYear()} Delta Solutions - Sistema de Orçamento de Usinagem
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] Email de recuperação enviado para ${to}`);
    return {
      success: true,
      message: 'Email enviado com sucesso',
    };
  } catch (error: any) {
    console.error('[Email] Erro ao enviar email:', error);
    
    // Extrair mensagem de erro mais específica
    let errorMessage = 'Erro ao enviar email';
    if (error.response?.body?.errors) {
      errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
    };
  }
}
