var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  clients: () => clients,
  machines: () => machines,
  materialApprovals: () => materialApprovals,
  materialQuotations: () => materialQuotations,
  materials: () => materials,
  passwordResetTokens: () => passwordResetTokens,
  phaseActivities: () => phaseActivities,
  phaseSchedule: () => phaseSchedule,
  phaseSubtasks: () => phaseSubtasks,
  projectMaterials: () => projectMaterials,
  projectTeamMembers: () => projectTeamMembers,
  projects: () => projects,
  quoteItems: () => quoteItems,
  quotes: () => quotes,
  settings: () => settings,
  taskComments: () => taskComments,
  teamMembers: () => teamMembers,
  users: () => users
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users, clients, machines, settings, quotes, quoteItems, materials, projects, projectTeamMembers, phaseSchedule, teamMembers, phaseActivities, phaseSubtasks, taskComments, projectMaterials, materialApprovals, materialQuotations, passwordResetTokens;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).unique(),
      // Opcional - apenas para OAuth
      name: text("name"),
      email: varchar("email", { length: 320 }).notNull().unique(),
      password: varchar("password", { length: 255 }),
      // Hash bcrypt - apenas para auth local
      authType: mysqlEnum("authType", ["local", "oauth"]).default("local").notNull(),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      level: mysqlEnum("level", ["Dev", "L\xEDder", "Gerente", "Financeiro", "Diretor", "Comprador"]),
      sector: mysqlEnum("sector", ["Software", "Hardware", "Mec\xE2nica", "Automa\xE7\xE3o", "Administrativo"]),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
      temporaryResetCode: varchar("temporaryResetCode", { length: 10 }),
      // Código temporário para recuperação
      resetCodeExpiresAt: timestamp("resetCodeExpiresAt")
      // Expiração do código
    });
    clients = mysqlTable("clients", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      // Proprietário do cadastro
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }),
      phone: varchar("phone", { length: 20 }),
      document: varchar("document", { length: 20 }),
      // CPF/CNPJ
      address: text("address"),
      city: varchar("city", { length: 100 }),
      state: varchar("state", { length: 2 }),
      zipCode: varchar("zipCode", { length: 10 }),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    machines = mysqlTable("machines", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      type: mysqlEnum("type", ["centro_usinagem", "torno_convencional", "torno_cnc", "fresadora", "outros"]).notNull(),
      purchaseValue: int("purchaseValue").notNull(),
      // Valor em centavos
      residualValue: int("residualValue").default(0).notNull(),
      // Valor residual em centavos
      usefulLifeHours: int("usefulLifeHours").notNull(),
      // Vida útil em horas
      occupiedArea: int("occupiedArea").notNull(),
      // Área ocupada em cm²
      powerKw: int("powerKw").notNull(),
      // Potência em watts (W)
      maintenanceCostPerYear: int("maintenanceCostPerYear").default(0).notNull(),
      // Custo anual de manutenção em centavos
      consumablesCostPerYear: int("consumablesCostPerYear").notNull(),
      // Custo anual de consumíveis em centavos
      manualHourlyCost: int("manualHourlyCost"),
      // Custo hora-máquina manual em centavos (opcional, sobrescreve cálculo automático)
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    settings = mysqlTable("settings", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull().unique(),
      rentPerSquareMeter: int("rentPerSquareMeter").default(0).notNull(),
      // Aluguel por m² em centavos
      electricityCostPerKwh: int("electricityCostPerKwh").default(0).notNull(),
      // Custo do kWh em centavos
      operatorHourlyCost: int("operatorHourlyCost").default(0).notNull(),
      // Custo hora do operador em centavos
      defaultProfitMargin: int("defaultProfitMargin").default(20).notNull(),
      // Margem de lucro padrão em porcentagem
      defaultTaxRate: int("defaultTaxRate").default(0).notNull(),
      // Taxa de impostos em porcentagem
      workingHoursPerYear: int("workingHoursPerYear").default(2080).notNull(),
      // Horas de trabalho por ano (padrão: 40h/semana * 52 semanas)
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    quotes = mysqlTable("quotes", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      clientName: varchar("clientName", { length: 255 }).notNull(),
      // Totais do orçamento (soma de todos os itens)
      subtotal: int("subtotal").notNull(),
      // Em centavos
      taxAmount: int("taxAmount").notNull(),
      // Em centavos
      profitAmount: int("profitAmount").notNull(),
      // Em centavos
      finalPrice: int("finalPrice").notNull(),
      // Em centavos
      // Configurações usadas no cálculo
      profitMargin: int("profitMargin").notNull(),
      // Porcentagem
      taxRate: int("taxRate").notNull(),
      // Porcentagem
      notes: text("notes"),
      status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    quoteItems = mysqlTable("quoteItems", {
      id: int("id").autoincrement().primaryKey(),
      quoteId: int("quoteId").notNull(),
      machineId: int("machineId").notNull(),
      partDescription: text("partDescription").notNull(),
      quantity: int("quantity").default(1).notNull(),
      // Material
      materialId: int("materialId"),
      partWidthMm: int("partWidthMm"),
      partLengthMm: int("partLengthMm"),
      rawMaterialCost: int("rawMaterialCost").default(0).notNull(),
      // Em centavos
      // Custos adicionais
      toolingCost: int("toolingCost").default(0).notNull(),
      // Em centavos
      thirdPartyServicesCost: int("thirdPartyServicesCost").default(0).notNull(),
      // Em centavos
      // Tempos
      machineTimeHours: int("machineTimeHours").notNull(),
      // Tempo de máquina em minutos
      setupTimeHours: int("setupTimeHours").default(0).notNull(),
      // Tempo de setup em minutos
      // Custos calculados para este item
      machineHourlyCost: int("machineHourlyCost").notNull(),
      // Em centavos
      totalMachineCost: int("totalMachineCost").notNull(),
      // Em centavos
      totalLaborCost: int("totalLaborCost").notNull(),
      // Em centavos
      itemSubtotal: int("itemSubtotal").notNull(),
      // Em centavos (custo total deste item)
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    materials = mysqlTable("materials", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      widthMm: int("widthMm").notNull(),
      // Largura em milímetros
      lengthMm: int("lengthMm").notNull(),
      // Comprimento em milímetros
      purchasePrice: int("purchasePrice").notNull(),
      // Preço de compra em centavos
      costPerMm2: int("costPerMm2").notNull(),
      // Custo por mm² em milésimos de centavo (calculado automaticamente)
      supplier: varchar("supplier", { length: 255 }),
      // Fornecedor
      stockQuantity: int("stockQuantity").default(0).notNull(),
      // Quantidade em estoque
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    projects = mysqlTable("projects", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      clientId: int("clientId"),
      // Referência ao cliente (opcional)
      leaderId: int("leaderId"),
      // Líder do projeto (colaborador)
      duration: int("duration"),
      // Duração em dias
      status: mysqlEnum("status", ["planejamento", "em_andamento", "concluido", "cancelado"]).default("planejamento").notNull(),
      phase: mysqlEnum("phase", ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]).default("planejamento").notNull(),
      startDate: timestamp("startDate"),
      endDate: timestamp("endDate"),
      budget: int("budget"),
      // Orçamento previsto em centavos
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    projectTeamMembers = mysqlTable("projectTeamMembers", {
      id: int("id").autoincrement().primaryKey(),
      projectId: int("projectId").notNull(),
      teamMemberId: int("teamMemberId").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    phaseSchedule = mysqlTable("phaseSchedule", {
      id: int("id").autoincrement().primaryKey(),
      projectId: int("projectId").notNull(),
      phase: mysqlEnum("phase", ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]).notNull(),
      startDate: timestamp("startDate"),
      endDate: timestamp("endDate"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    teamMembers = mysqlTable("teamMembers", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      // Proprietário do registro
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }),
      phone: varchar("phone", { length: 20 }),
      role: varchar("role", { length: 100 }),
      // Cargo/função (ex: Operador CNC, Engenheiro, etc)
      hierarchyLevel: mysqlEnum("hierarchyLevel", [
        "colaborador",
        // Sem permissão de aprovação
        "lider",
        // Pode aprovar pending → leader
        "gerente",
        // Pode aprovar leader → manager
        "comprador",
        // Pode fazer cotação manager → quotation
        "diretor",
        // Pode aprovar quotation → director
        "financeiro"
        // Pode aprovar director → financial
      ]),
      hourlyRate: int("hourlyRate"),
      // Custo hora do colaborador em centavos
      specialization: varchar("specialization", { length: 255 }),
      // Especialização (ex: Torno CNC, Fresadora, etc)
      status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo").notNull(),
      hireDate: timestamp("hireDate"),
      // Data de contratação
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    phaseActivities = mysqlTable("phaseActivities", {
      id: int("id").autoincrement().primaryKey(),
      projectId: int("projectId").notNull(),
      phase: mysqlEnum("phase", ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]).notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      startDate: timestamp("startDate"),
      endDate: timestamp("endDate"),
      completed: int("completed").default(0).notNull(),
      // 0 = não concluída, 1 = concluída
      progress: int("progress").default(0).notNull(),
      // Percentual de progresso (0-100) calculado pelas subtarefas
      order: int("order").default(0).notNull(),
      // Ordem de exibição dentro da fase
      assignedTo: int("assignedTo"),
      // ID do usuário responsável pela atividade
      completedAt: timestamp("completedAt"),
      // Data e hora de conclusão
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    phaseSubtasks = mysqlTable("phase_subtasks", {
      id: int("id").autoincrement().primaryKey(),
      activityId: int("activityId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      startDate: timestamp("startDate"),
      endDate: timestamp("endDate"),
      completed: int("completed").default(0).notNull(),
      order: int("display_order").default(0).notNull(),
      // Ordem de exibição dentro da atividade (mapeado para display_order no banco)
      assignedTo: int("assignedTo"),
      // ID do usuário responsável pela subtarefa
      completedAt: timestamp("completedAt"),
      // Data e hora de conclusão
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    taskComments = mysqlTable("task_comments", {
      id: int("id").autoincrement().primaryKey(),
      taskType: mysqlEnum("taskType", ["activity", "subtask"]).notNull(),
      taskId: int("taskId").notNull(),
      // ID da atividade ou subtarefa
      comment: text("comment").notNull(),
      createdBy: int("createdBy").notNull(),
      // ID do team member que criou o comentário
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    projectMaterials = mysqlTable("project_materials", {
      id: int("id").autoincrement().primaryKey(),
      projectId: int("projectId").notNull(),
      itemName: varchar("itemName", { length: 255 }).notNull(),
      quantity: int("quantity").notNull(),
      unit: varchar("unit", { length: 50 }).notNull(),
      // unidade (kg, m, un, etc)
      unitPrice: int("unitPrice").notNull(),
      // Preço unitário em centavos
      supplier: varchar("supplier", { length: 255 }),
      notes: text("notes"),
      imageUrl: varchar("imageUrl", { length: 500 }),
      requestingSector: mysqlEnum("requestingSector", [
        "Software",
        "Hardware",
        "Mec\xE2nica",
        "Automa\xE7\xE3o",
        "Administrativo"
      ]).notNull(),
      // Campos de aprovação
      approvalStatus: mysqlEnum("approvalStatus", [
        "pending",
        // Pendente - aguardando líder
        "leader",
        // Aprovado pelo líder - aguardando gerente
        "manager",
        // Aprovado pelo gerente - aguardando cotação
        "quotation",
        // Cotação feita - aguardando diretor
        "director",
        // Aprovado pelo diretor - aguardando financeiro
        "financial",
        // Aprovado pelo financeiro - pode comprar
        "purchased",
        // Comprado - aguardando entrega
        "received",
        // Recebido - processo concluído
        "rejected"
        // Rejeitado em alguma etapa
      ]).default("pending").notNull(),
      quotationValue: int("quotationValue"),
      // Valor da cotação em centavos
      quotationNotes: text("quotationNotes"),
      // Observações da cotação
      // Campos de compra e recebimento
      purchaseDate: timestamp("purchaseDate"),
      // Data em que a compra foi realizada
      expectedDeliveryDate: timestamp("expectedDeliveryDate"),
      // Data prevista de entrega
      receivedDate: timestamp("receivedDate"),
      // Data em que a mercadoria foi recebida
      receivedBy: varchar("receivedBy", { length: 255 }),
      // Nome de quem recebeu a mercadoria
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    materialApprovals = mysqlTable("material_approvals", {
      id: int("id").autoincrement().primaryKey(),
      materialId: int("materialId").notNull(),
      approverUserId: int("approverUserId").notNull(),
      approverName: varchar("approverName", { length: 255 }).notNull(),
      approverRole: varchar("approverRole", { length: 50 }).notNull(),
      // leader, manager, buyer, director, financial
      action: mysqlEnum("action", ["approved", "rejected", "purchased", "received"]).notNull(),
      fromStatus: varchar("fromStatus", { length: 50 }).notNull(),
      toStatus: varchar("toStatus", { length: 50 }).notNull(),
      comments: text("comments"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    materialQuotations = mysqlTable("material_quotations", {
      id: int("id").autoincrement().primaryKey(),
      materialId: int("materialId").notNull(),
      supplier: varchar("supplier", { length: 255 }).notNull(),
      quotedPrice: int("quotedPrice").notNull(),
      // Preço em centavos
      deliveryTime: varchar("deliveryTime", { length: 100 }),
      // Prazo de entrega
      paymentTerms: varchar("paymentTerms", { length: 255 }),
      // Condições de pagamento
      notes: text("notes"),
      isRecommended: int("isRecommended").default(0).notNull(),
      // 1 = recomendada, 0 = não
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    passwordResetTokens = mysqlTable("password_reset_tokens", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      token: varchar("token", { length: 64 }).notNull().unique(),
      expiresAt: timestamp("expiresAt").notNull(),
      used: int("used").default(0).notNull(),
      // 0 = não usado, 1 = usado
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// _core/index.ts
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// db.ts
init_schema();
import { eq, and, isNotNull, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// _core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// db.ts
init_schema();
import * as bcrypt from "bcryptjs";
import crypto from "crypto";

// email.ts
import sgMail from "@sendgrid/mail";
var SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
var FROM_EMAIL = process.env.FROM_EMAIL || "noreply@deltasolutions.com.br";
var FROM_NAME = process.env.FROM_NAME || "Delta Solutions";
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("[Email] SendGrid configurado com sucesso");
} else {
  console.warn("[Email] SENDGRID_API_KEY n\xE3o configurada - emails n\xE3o ser\xE3o enviados");
}
function getPasswordResetEmailTemplate(resetLink, userName) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera\xE7\xE3o de Senha</title>
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
      <h1>\u{1F510} Recupera\xE7\xE3o de Senha</h1>
    </div>
    <div class="content">
      <p class="greeting">Ol\xE1${userName ? `, ${userName}` : ""}!</p>
      
      <p class="message">
        Recebemos uma solicita\xE7\xE3o para redefinir a senha da sua conta no 
        <strong>Sistema de Or\xE7amento de Usinagem</strong>.
      </p>
      
      <p class="message">
        Para criar uma nova senha, clique no bot\xE3o abaixo:
      </p>
      
      <div class="button-container">
        <a href="${resetLink}" class="button">Redefinir Senha</a>
      </div>
      
      <div class="alternative-link">
        <p><strong>Ou copie e cole este link no seu navegador:</strong></p>
        <a href="${resetLink}">${resetLink}</a>
      </div>
      
      <div class="warning">
        <strong>\u26A0\uFE0F Importante:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Este link expira em <strong>1 hora</strong></li>
          <li>Se voc\xEA n\xE3o solicitou esta recupera\xE7\xE3o, ignore este email</li>
          <li>Nunca compartilhe este link com outras pessoas</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Delta Solutions - Sistema de Or\xE7amento de Usinagem</p>
      <p style="margin-top: 10px; font-size: 12px;">
        Este \xE9 um email autom\xE1tico, por favor n\xE3o responda.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
async function sendPasswordResetEmail(to, resetToken, userName) {
  if (!SENDGRID_API_KEY) {
    console.warn("[Email] Tentativa de envio sem SENDGRID_API_KEY configurada");
    return {
      success: false,
      message: "Servi\xE7o de email n\xE3o configurado. Configure SENDGRID_API_KEY nas vari\xE1veis de ambiente."
    };
  }
  const baseUrl = process.env.VITE_APP_URL || "http://localhost:3001";
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject: "Recupera\xE7\xE3o de Senha - Sistema de Or\xE7amento de Usinagem",
    html: getPasswordResetEmailTemplate(resetLink, userName),
    text: `
Ol\xE1${userName ? `, ${userName}` : ""}!

Recebemos uma solicita\xE7\xE3o para redefinir a senha da sua conta no Sistema de Or\xE7amento de Usinagem.

Para criar uma nova senha, acesse o link abaixo:
${resetLink}

IMPORTANTE:
- Este link expira em 1 hora
- Se voc\xEA n\xE3o solicitou esta recupera\xE7\xE3o, ignore este email
- Nunca compartilhe este link com outras pessoas

\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Delta Solutions - Sistema de Or\xE7amento de Usinagem
    `.trim()
  };
  try {
    await sgMail.send(msg);
    console.log(`[Email] Email de recupera\xE7\xE3o enviado para ${to}`);
    return {
      success: true,
      message: "Email enviado com sucesso"
    };
  } catch (error) {
    console.error("[Email] Erro ao enviar email:", error);
    let errorMessage = "Erro ao enviar email";
    if (error.response?.body?.errors) {
      errorMessage = error.response.body.errors.map((e) => e.message).join(", ");
    } else if (error.message) {
      errorMessage = error.message;
    }
    return {
      success: false,
      message: errorMessage
    };
  }
}

// db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  if (!user.email) {
    throw new Error("User email is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId,
      email: user.email,
      // Email obrigatório
      authType: user.authType || "oauth"
    };
    const updateSet = {};
    if (user.name !== void 0) {
      values.name = user.name;
      updateSet.name = user.name;
    }
    if (user.loginMethod !== void 0) {
      values.loginMethod = user.loginMethod;
      updateSet.loginMethod = user.loginMethod;
    }
    if (user.email !== void 0) {
      updateSet.email = user.email;
    }
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getMachinesByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(machines).where(eq(machines.userId, userId)).orderBy(desc(machines.createdAt));
}
async function getMachineById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(machines).where(eq(machines.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createMachine(machine) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(machines).values(machine);
}
async function updateMachine(id, machine) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(machines).set(machine).where(eq(machines.id, id));
}
async function deleteMachine(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(machines).where(eq(machines.id, id));
}
async function getSettingsByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function upsertSettings(settingsData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(settings).values(settingsData).onDuplicateKeyUpdate({
    set: {
      rentPerSquareMeter: settingsData.rentPerSquareMeter,
      electricityCostPerKwh: settingsData.electricityCostPerKwh,
      operatorHourlyCost: settingsData.operatorHourlyCost,
      defaultProfitMargin: settingsData.defaultProfitMargin,
      defaultTaxRate: settingsData.defaultTaxRate,
      workingHoursPerYear: settingsData.workingHoursPerYear,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function createQuote(quote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    const result = await db.insert(quotes).values(quote);
    const insertId = result[0]?.insertId;
    console.error("[CRITICAL DEBUG] Insert result:", JSON.stringify(result));
    console.error("[CRITICAL DEBUG] insertId extracted:", insertId, "type:", typeof insertId);
    if (!insertId || typeof insertId !== "number") {
      console.error("[CRITICAL ERROR] Failed to extract insertId from result:", result);
      throw new Error(`Failed to get inserted quote ID. insertId: ${insertId}`);
    }
    return insertId;
  } catch (error) {
    console.error("[CRITICAL ERROR] createQuote failed:", error);
    throw error;
  }
}
async function getQuotesByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(quotes).where(eq(quotes.userId, userId)).orderBy(desc(quotes.createdAt));
}
async function getQuoteById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateQuote(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(quotes).set(data).where(eq(quotes.id, id));
}
async function deleteQuote(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
  return await db.delete(quotes).where(eq(quotes.id, id));
}
async function approveQuote(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(quotes).set({ status: "aprovado" }).where(eq(quotes.id, id));
}
async function getTotalQuotesValue(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allQuotes = await db.select().from(quotes).where(eq(quotes.userId, userId));
  const total = allQuotes.reduce((sum, quote) => sum + quote.finalPrice, 0);
  return total;
}
async function getTotalApprovedQuotesValue(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const approvedQuotes = await db.select().from(quotes).where(and(eq(quotes.userId, userId), eq(quotes.status, "aprovado")));
  const total = approvedQuotes.reduce((sum, quote) => sum + quote.finalPrice, 0);
  return total;
}
async function getMonthlyApprovedQuotesValue(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const approvedQuotes = await db.select().from(quotes).where(and(eq(quotes.userId, userId), eq(quotes.status, "aprovado"))).orderBy(quotes.createdAt);
  const monthlyData = {};
  approvedQuotes.forEach((quote) => {
    const date = new Date(quote.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey] += quote.finalPrice;
  });
  const result = Object.entries(monthlyData).map(([month, value]) => ({ month, value })).sort((a, b) => a.month.localeCompare(b.month));
  return result;
}
async function getQuotesByStatus(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allQuotes = await db.select().from(quotes).where(eq(quotes.userId, userId));
  const pendentes = allQuotes.filter((q) => q.status === "pendente").length;
  const aprovados = allQuotes.filter((q) => q.status === "aprovado").length;
  const rejeitados = allQuotes.filter((q) => q.status === "rejeitado").length;
  return { pendentes, aprovados, rejeitados };
}
async function createQuoteItem(item) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  console.error("[CRITICAL DEBUG] createQuoteItem - Received item:", JSON.stringify(item, null, 2));
  console.error("[CRITICAL DEBUG] createQuoteItem - quoteId:", item.quoteId, "type:", typeof item.quoteId);
  if (!item.quoteId || typeof item.quoteId !== "number") {
    throw new Error(`Invalid quoteId in createQuoteItem: ${item.quoteId} (type: ${typeof item.quoteId})`);
  }
  const result = await db.insert(quoteItems).values(item);
  console.error("[CRITICAL DEBUG] createQuoteItem - Insert successful");
  return result;
}
async function getQuoteItemsByQuoteId(quoteId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
}
async function updateQuoteItem(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(quoteItems).set(data).where(eq(quoteItems.id, id));
}
async function deleteQuoteItem(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(quoteItems).where(eq(quoteItems.id, id));
}
async function getMaterialsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(materials).where(eq(materials.userId, userId)).orderBy(desc(materials.createdAt));
}
async function getMaterialById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createMaterial(material) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(materials).values(material);
}
async function updateMaterial(id, material) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(materials).set(material).where(eq(materials.id, id));
}
async function deleteMaterial(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(materials).where(eq(materials.id, id));
}
async function createClient(client) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(client).$returningId();
  return result[0].id;
}
async function getClientsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
}
async function getClientById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateClient(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}
async function deleteClient(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}
async function getClientByName(userId, name) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(clients).where(
    and(eq(clients.userId, userId), eq(clients.name, name))
  ).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createProject(project) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(project).$returningId();
  const projectId = result[0].id;
  await createDefaultPhaseActivities(projectId, project.startDate, project.endDate);
  return projectId;
}
async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}
async function getProjectById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateProject(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(eq(projects.id, id));
}
async function updateProjectPhase(id, phase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set({ phase }).where(eq(projects.id, id));
}
async function deleteProject(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectTeamMembers).where(eq(projectTeamMembers.projectId, id));
  await db.delete(projects).where(eq(projects.id, id));
}
async function getProjectTeamMembers(projectId) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: teamMembers.id,
    name: teamMembers.name,
    email: teamMembers.email,
    phone: teamMembers.phone,
    role: teamMembers.role,
    hourlyRate: teamMembers.hourlyRate,
    specialization: teamMembers.specialization,
    status: teamMembers.status
  }).from(projectTeamMembers).innerJoin(teamMembers, eq(projectTeamMembers.teamMemberId, teamMembers.id)).where(eq(projectTeamMembers.projectId, projectId));
  return result;
}
async function setProjectTeamMembers(projectId, teamMemberIds) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectTeamMembers).where(eq(projectTeamMembers.projectId, projectId));
  if (teamMemberIds.length > 0) {
    await db.insert(projectTeamMembers).values(
      teamMemberIds.map((teamMemberId) => ({ projectId, teamMemberId }))
    );
  }
}
async function createTeamMember(member) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teamMembers).values(member).$returningId();
  return result[0].id;
}
async function getAllTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(teamMembers).orderBy(desc(teamMembers.createdAt));
}
async function getTeamMemberById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserHierarchyLevel(userEmail) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(teamMembers).where(eq(teamMembers.email, userEmail)).limit(1);
  if (result.length === 0) return null;
  return result[0].hierarchyLevel || null;
}
async function updateTeamMember(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}
async function deleteTeamMember(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}
async function getActiveTeamMembers(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(teamMembers).where(
    eq(teamMembers.status, "ativo")
  ).orderBy(teamMembers.name);
}
async function getPhaseScheduleByProjectId(projectId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(phaseSchedule).where(eq(phaseSchedule.projectId, projectId));
}
async function setProjectPhaseSchedule(projectId, schedules) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(phaseSchedule).where(eq(phaseSchedule.projectId, projectId));
  if (schedules.length > 0) {
    await db.insert(phaseSchedule).values(
      schedules.map((s) => ({
        projectId,
        phase: s.phase,
        startDate: s.startDate,
        endDate: s.endDate
      }))
    );
  }
}
async function createDefaultPhaseActivities(projectId, startDate, endDate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!startDate || !endDate) return;
  const phases = [
    { name: "Planejamento", phase: "planejamento" },
    { name: "Desenvolvimento", phase: "desenvolvimento" },
    { name: "Testes", phase: "testes" },
    { name: "Entrega", phase: "entrega" },
    { name: "Finalizado", phase: "finalizado" }
  ];
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
  const daysPerPhase = Math.ceil(totalDays / phases.length);
  for (let i = 0; i < phases.length; i++) {
    const phaseStartDate = new Date(startDate);
    phaseStartDate.setDate(phaseStartDate.getDate() + i * daysPerPhase);
    const phaseEndDate = new Date(startDate);
    phaseEndDate.setDate(phaseEndDate.getDate() + (i + 1) * daysPerPhase - 1);
    if (i === phases.length - 1) {
      phaseEndDate.setTime(endDate.getTime());
    }
    await db.insert(phaseActivities).values({
      projectId,
      phase: phases[i].phase,
      name: phases[i].name,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      completed: 0,
      progress: 0,
      order: i
    });
  }
}
async function createPhaseActivity(activity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(phaseActivities).values(activity).$returningId();
  return result[0].id;
}
async function getPhaseActivitiesByProjectAndPhase(projectId, phase) {
  const db = await getDb();
  if (!db) return [];
  const activities = await db.select().from(phaseActivities).where(
    and(eq(phaseActivities.projectId, projectId), eq(phaseActivities.phase, phase))
  ).orderBy(phaseActivities.order);
  const activitiesWithAssignee = await Promise.all(activities.map(async (activity) => {
    if (activity.assignedTo) {
      const assignee = await db.select({
        id: teamMembers.id,
        name: teamMembers.name,
        email: teamMembers.email
      }).from(teamMembers).where(eq(teamMembers.id, activity.assignedTo)).limit(1);
      return {
        ...activity,
        assignee: assignee.length > 0 ? assignee[0] : null
      };
    }
    return {
      ...activity,
      assignee: null
    };
  }));
  return activitiesWithAssignee;
}
async function updatePhaseActivity(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(phaseActivities).set(data).where(eq(phaseActivities.id, id));
}
async function updatePhaseActivityDates(id, startDate, endDate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(phaseActivities).set({ startDate, endDate }).where(eq(phaseActivities.id, id));
}
async function togglePhaseActivityCompleted(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(phaseActivities).where(eq(phaseActivities.id, id)).limit(1);
  if (result.length === 0) throw new Error("Activity not found");
  const currentCompleted = result[0].completed;
  const newCompleted = currentCompleted === 1 ? 0 : 1;
  await db.update(phaseActivities).set({ completed: newCompleted }).where(eq(phaseActivities.id, id));
}
async function deletePhaseActivity(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(phaseActivities).where(eq(phaseActivities.id, id));
}
async function reorderPhaseActivities(updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const update of updates) {
    await db.update(phaseActivities).set({ order: update.order }).where(eq(phaseActivities.id, update.id));
  }
}
async function createPhaseSubtask(subtask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(phaseSubtasks).values(subtask).$returningId();
  const newSubtaskId = result[0].id;
  await recalculateActivityDatesFromSubtasks(subtask.activityId);
  return newSubtaskId;
}
async function getPhaseSubtasksByActivity(activityId) {
  const db = await getDb();
  if (!db) return [];
  const subtasks = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activityId));
  const subtasksWithAssignee = await Promise.all(subtasks.map(async (subtask) => {
    if (subtask.assignedTo) {
      const assignee = await db.select({
        id: teamMembers.id,
        name: teamMembers.name,
        email: teamMembers.email
      }).from(teamMembers).where(eq(teamMembers.id, subtask.assignedTo)).limit(1);
      return {
        ...subtask,
        assignee: assignee.length > 0 ? assignee[0] : null
      };
    }
    return {
      ...subtask,
      assignee: null
    };
  }));
  return subtasksWithAssignee;
}
async function updatePhaseSubtask(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(phaseSubtasks).set(data).where(eq(phaseSubtasks.id, id));
}
async function updatePhaseSubtaskAssignee(id, assignedTo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  console.log("[UPDATE SUBTASK ASSIGNEE] ID:", id, "AssignedTo:", assignedTo);
  await db.update(phaseSubtasks).set({ assignedTo }).where(eq(phaseSubtasks.id, id));
  console.log("[UPDATE SUBTASK ASSIGNEE] Atualizado com sucesso");
}
async function updatePhaseSubtaskDates(id, startDate, endDate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.id, id)).limit(1);
  if (result.length === 0) throw new Error("Subtask not found");
  const activityId = result[0].activityId;
  await db.update(phaseSubtasks).set({ startDate, endDate }).where(eq(phaseSubtasks.id, id));
  await recalculateActivityDatesFromSubtasks(activityId);
}
async function recalculateActivityDatesFromSubtasks(activityId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const subtasks = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activityId));
  if (subtasks.length === 0) {
    console.log("[RECALCULATE DATES] Nenhuma subtarefa encontrada para atividade", activityId);
    return;
  }
  const subtasksWithDates = subtasks.filter((st) => st.startDate && st.endDate);
  if (subtasksWithDates.length === 0) {
    console.log("[RECALCULATE DATES] Nenhuma subtarefa com datas definidas para atividade", activityId);
    return;
  }
  const minStartDate = new Date(Math.min(...subtasksWithDates.map((st) => st.startDate.getTime())));
  const maxEndDate = new Date(Math.max(...subtasksWithDates.map((st) => st.endDate.getTime())));
  console.log("[RECALCULATE DATES] Atividade", activityId, "- Nova data inicial:", minStartDate, "- Nova data final:", maxEndDate);
  await db.update(phaseActivities).set({
    startDate: minStartDate,
    endDate: maxEndDate
  }).where(eq(phaseActivities.id, activityId));
  console.log("[RECALCULATE DATES] Datas da atividade atualizadas com sucesso");
}
async function togglePhaseSubtaskCompleted(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.id, id)).limit(1);
  if (result.length === 0) throw new Error("Subtask not found");
  const subtask = result[0];
  const currentCompleted = subtask.completed;
  const newCompleted = currentCompleted === 1 ? 0 : 1;
  await db.update(phaseSubtasks).set({ completed: newCompleted }).where(eq(phaseSubtasks.id, id));
  const activityId = subtask.activityId;
  const allSubtasks = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activityId));
  if (allSubtasks.length > 0) {
    const completedCount = allSubtasks.filter((st) => st.id === id ? newCompleted === 1 : st.completed === 1).length;
    const totalCount = allSubtasks.length;
    const progressPercentage = Math.round(completedCount / totalCount * 100);
    const allCompleted = progressPercentage === 100 ? 1 : 0;
    await db.update(phaseActivities).set({
      completed: allCompleted,
      progress: progressPercentage
    }).where(eq(phaseActivities.id, activityId));
    const activity = await db.select().from(phaseActivities).where(eq(phaseActivities.id, activityId)).limit(1);
    if (activity.length > 0) {
      await checkAndAdvancePhase(activity[0].projectId, activity[0].phase);
    }
  }
}
async function deletePhaseSubtask(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.id, id)).limit(1);
  if (result.length === 0) throw new Error("Subtask not found");
  const activityId = result[0].activityId;
  await db.delete(phaseSubtasks).where(eq(phaseSubtasks.id, id));
  const remainingSubtasks = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activityId));
  if (remainingSubtasks.length > 0) {
    const completedCount = remainingSubtasks.filter((st) => st.completed === 1).length;
    const totalCount = remainingSubtasks.length;
    const progressPercentage = Math.round(completedCount / totalCount * 100);
    const allCompleted = progressPercentage === 100 ? 1 : 0;
    await db.update(phaseActivities).set({
      completed: allCompleted,
      progress: progressPercentage
    }).where(eq(phaseActivities.id, activityId));
  } else {
    await db.update(phaseActivities).set({
      completed: 0,
      progress: 0
    }).where(eq(phaseActivities.id, activityId));
  }
  await recalculateActivityDatesFromSubtasks(activityId);
}
async function checkAndAdvancePhase(projectId, currentPhase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const activities = await db.select().from(phaseActivities).where(
    and(
      eq(phaseActivities.projectId, projectId),
      eq(phaseActivities.phase, currentPhase)
    )
  );
  if (activities.length === 0) return false;
  const allCompleted = activities.every((activity) => activity.progress === 100);
  if (!allCompleted) return false;
  const phaseOrder = ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex >= phaseOrder.length - 1) return false;
  const nextPhase = phaseOrder[currentIndex + 1];
  await db.update(projects).set({ phase: nextPhase }).where(eq(projects.id, projectId));
  return true;
}
async function getProjectScheduleForExport(projectId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const projectData = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (projectData.length === 0) {
    throw new Error("Project not found");
  }
  const project = projectData[0];
  const phases = ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"];
  const scheduleData = await Promise.all(
    phases.map(async (phase) => {
      const activities = await db.select().from(phaseActivities).where(
        and(
          eq(phaseActivities.projectId, projectId),
          eq(phaseActivities.phase, phase)
        )
      ).orderBy(asc(phaseActivities.order));
      const activitiesWithSubtasks = await Promise.all(
        activities.map(async (activity) => {
          const subtasks = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activity.id)).orderBy(asc(phaseSubtasks.id));
          return {
            ...activity,
            subtasks
          };
        })
      );
      return {
        phase,
        activities: activitiesWithSubtasks
      };
    })
  );
  return {
    project,
    schedule: scheduleData
  };
}
async function getAllTasksByTeamMember() {
  const db = await getDb();
  if (!db) return [];
  const members = await db.select().from(teamMembers);
  const membersWithTasks = await Promise.all(members.map(async (member) => {
    const activities = await db.select({
      id: phaseActivities.id,
      name: phaseActivities.name,
      startDate: phaseActivities.startDate,
      endDate: phaseActivities.endDate,
      completed: phaseActivities.completed,
      projectId: phaseActivities.projectId,
      phase: phaseActivities.phase,
      order: phaseActivities.order
    }).from(phaseActivities).where(eq(phaseActivities.assignedTo, member.id)).orderBy(phaseActivities.order);
    const subtasks = await db.select({
      id: phaseSubtasks.id,
      name: phaseSubtasks.name,
      startDate: phaseSubtasks.startDate,
      endDate: phaseSubtasks.endDate,
      completed: phaseSubtasks.completed,
      activityId: phaseSubtasks.activityId,
      order: phaseSubtasks.order
    }).from(phaseSubtasks).where(eq(phaseSubtasks.assignedTo, member.id)).orderBy(phaseSubtasks.order);
    const activitiesWithProject = await Promise.all(activities.map(async (activity) => {
      const project = await db.select({
        id: projects.id,
        name: projects.name
      }).from(projects).where(eq(projects.id, activity.projectId)).limit(1);
      return {
        ...activity,
        project: project.length > 0 ? project[0] : null,
        type: "activity"
      };
    }));
    const subtasksWithActivity = await Promise.all(subtasks.map(async (subtask) => {
      const activity = await db.select({
        id: phaseActivities.id,
        name: phaseActivities.name,
        projectId: phaseActivities.projectId,
        phase: phaseActivities.phase
      }).from(phaseActivities).where(eq(phaseActivities.id, subtask.activityId)).limit(1);
      if (activity.length > 0) {
        const project = await db.select({
          id: projects.id,
          name: projects.name
        }).from(projects).where(eq(projects.id, activity[0].projectId)).limit(1);
        return {
          ...subtask,
          activity: activity[0],
          project: project.length > 0 ? project[0] : null,
          type: "subtask"
        };
      }
      return {
        ...subtask,
        activity: null,
        project: null,
        type: "subtask"
      };
    }));
    return {
      member,
      activities: activitiesWithProject,
      subtasks: subtasksWithActivity,
      totalTasks: activitiesWithProject.length + subtasksWithActivity.length
    };
  }));
  return membersWithTasks;
}
async function createTaskComment(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(taskComments).values(data);
}
async function getTaskComments(taskType, taskId) {
  const db = await getDb();
  if (!db) return [];
  const comments = await db.select().from(taskComments).where(and(eq(taskComments.taskType, taskType), eq(taskComments.taskId, taskId))).orderBy(taskComments.createdAt);
  const commentsWithCreator = await Promise.all(comments.map(async (comment) => {
    const creator = await db.select({
      id: teamMembers.id,
      name: teamMembers.name
    }).from(teamMembers).where(eq(teamMembers.id, comment.createdBy)).limit(1);
    return {
      ...comment,
      creator: creator.length > 0 ? creator[0] : null
    };
  }));
  return commentsWithCreator;
}
async function completeMultipleTasks(tasks) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = /* @__PURE__ */ new Date();
  for (const task of tasks) {
    if (task.type === "activity") {
      await db.update(phaseActivities).set({ completed: 1, completedAt: now }).where(eq(phaseActivities.id, task.id));
    } else {
      await db.update(phaseSubtasks).set({ completed: 1, completedAt: now }).where(eq(phaseSubtasks.id, task.id));
    }
  }
}
async function reorderMemberTasks(memberId, taskOrders) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot reorder tasks: database not available");
    return;
  }
  try {
    for (const task of taskOrders) {
      if (task.type === "activity") {
        await db.update(phaseActivities).set({ order: task.order }).where(eq(phaseActivities.id, task.id));
      } else {
        await db.update(phaseSubtasks).set({ order: task.order }).where(eq(phaseSubtasks.id, task.id));
      }
    }
  } catch (error) {
    console.error("[Database] Failed to reorder tasks:", error);
    throw error;
  }
}
async function getBurndownChartData(projectId) {
  const db = await getDb();
  if (!db) return null;
  const projectData = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (projectData.length === 0) return null;
  const project = projectData[0];
  if (!project.startDate || !project.endDate) {
    return null;
  }
  const activities = await db.select().from(phaseActivities).where(eq(phaseActivities.projectId, projectId));
  const subtasks = await db.select({
    id: phaseSubtasks.id,
    activityId: phaseSubtasks.activityId,
    name: phaseSubtasks.name,
    completed: phaseSubtasks.completed,
    completedAt: phaseSubtasks.completedAt,
    createdAt: phaseSubtasks.createdAt
  }).from(phaseSubtasks).innerJoin(phaseActivities, eq(phaseSubtasks.activityId, phaseActivities.id)).where(eq(phaseActivities.projectId, projectId));
  const totalTasks = activities.length + subtasks.length;
  const completionHistory = {};
  for (const activity of activities) {
    if (activity.completed === 1 && activity.completedAt) {
      const dateKey = activity.completedAt.toISOString().split("T")[0];
      completionHistory[dateKey] = (completionHistory[dateKey] || 0) + 1;
    }
  }
  for (const subtask of subtasks) {
    if (subtask.completed === 1 && subtask.completedAt) {
      const dateKey = subtask.completedAt.toISOString().split("T")[0];
      completionHistory[dateKey] = (completionHistory[dateKey] || 0) + 1;
    }
  }
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  const totalDays = dates.length;
  const taskDecreasePerDay = totalTasks / totalDays;
  let remainingTasksReal = totalTasks;
  const chartData = dates.map((date, index) => {
    const idealRemaining = Math.max(0, totalTasks - taskDecreasePerDay * (index + 1));
    if (completionHistory[date]) {
      remainingTasksReal -= completionHistory[date];
    }
    return {
      date,
      ideal: Math.round(idealRemaining),
      real: Math.max(0, remainingTasksReal)
    };
  });
  return {
    projectName: project.name,
    startDate: project.startDate,
    endDate: project.endDate,
    totalTasks,
    chartData
  };
}
async function getMaterialsByProject(projectId) {
  const db = await getDb();
  if (!db) return [];
  const { projectMaterials: projectMaterials2, materialQuotations: materialQuotations2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const materials2 = await db.select({
    id: projectMaterials2.id,
    projectId: projectMaterials2.projectId,
    itemName: projectMaterials2.itemName,
    quantity: projectMaterials2.quantity,
    unit: projectMaterials2.unit,
    unitPrice: projectMaterials2.unitPrice,
    supplier: projectMaterials2.supplier,
    notes: projectMaterials2.notes,
    imageUrl: projectMaterials2.imageUrl,
    approvalStatus: projectMaterials2.approvalStatus,
    createdAt: projectMaterials2.createdAt,
    updatedAt: projectMaterials2.updatedAt,
    recommendedSupplier: materialQuotations2.supplier,
    recommendedPrice: materialQuotations2.quotedPrice,
    purchaseDate: projectMaterials2.purchaseDate,
    expectedDeliveryDate: projectMaterials2.expectedDeliveryDate,
    receivedDate: projectMaterials2.receivedDate,
    receivedBy: projectMaterials2.receivedBy,
    requestingSector: projectMaterials2.requestingSector
  }).from(projectMaterials2).leftJoin(
    materialQuotations2,
    and(
      eq(materialQuotations2.materialId, projectMaterials2.id),
      eq(materialQuotations2.isRecommended, 1)
    )
  ).where(eq(projectMaterials2.projectId, projectId));
  return materials2;
}
async function addProjectMaterial(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectMaterials: projectMaterials2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.insert(projectMaterials2).values(data);
  return result;
}
async function updateProjectMaterial(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectMaterials: projectMaterials2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.update(projectMaterials2).set(data).where(eq(projectMaterials2.id, id));
}
async function deleteProjectMaterial(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectMaterials: projectMaterials2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.delete(projectMaterials2).where(eq(projectMaterials2.id, id));
}
async function approveMaterial(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectMaterials: projectMaterials2, materialApprovals: materialApprovals2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const material = await db.select().from(projectMaterials2).where(eq(projectMaterials2.id, data.materialId)).limit(1);
  if (material.length === 0) throw new Error("Material not found");
  const currentStatus = material[0].approvalStatus;
  const requiredLevel = {
    "pending": "lider",
    // Apenas líder pode aprovar
    "leader": "gerente",
    // Apenas gerente pode aprovar
    "manager": "comprador",
    // Apenas comprador pode fazer cotação
    "quotation": "diretor",
    // Apenas diretor pode aprovar
    "director": "financeiro"
    // Apenas financeiro pode aprovar
  };
  const required = requiredLevel[currentStatus];
  if (!required) throw new Error("Invalid approval flow");
  if (data.approverRole !== required) {
    throw new Error(`Apenas usu\xE1rios com n\xEDvel "${required}" podem aprovar nesta etapa. Status atual: ${currentStatus}`);
  }
  const statusFlow = {
    "pending": "leader",
    // Líder aprova
    "leader": "manager",
    // Gerente aprova
    "manager": "quotation",
    // Vai para cotação
    "quotation": "director",
    // Diretor aprova
    "director": "financial"
    // Financeiro aprova
  };
  const nextStatus = statusFlow[currentStatus];
  if (!nextStatus) throw new Error("Invalid approval flow");
  await db.update(projectMaterials2).set({ approvalStatus: nextStatus }).where(eq(projectMaterials2.id, data.materialId));
  await db.insert(materialApprovals2).values({
    materialId: data.materialId,
    approverUserId: data.approverUserId,
    approverName: data.approverName,
    approverRole: data.approverRole,
    action: "approved",
    fromStatus: currentStatus,
    toStatus: nextStatus,
    comments: data.comments || null
  });
  return { success: true, newStatus: nextStatus };
}
async function rejectMaterial(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectMaterials: projectMaterials2, materialApprovals: materialApprovals2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const material = await db.select().from(projectMaterials2).where(eq(projectMaterials2.id, data.materialId)).limit(1);
  if (material.length === 0) throw new Error("Material not found");
  const currentStatus = material[0].approvalStatus;
  const requiredLevel = {
    "pending": "lider",
    // Apenas líder pode rejeitar
    "leader": "gerente",
    // Apenas gerente pode rejeitar
    "manager": "comprador",
    // Apenas comprador pode rejeitar
    "quotation": "diretor",
    // Apenas diretor pode rejeitar
    "director": "financeiro"
    // Apenas financeiro pode rejeitar
  };
  const required = requiredLevel[currentStatus];
  if (!required) throw new Error("Invalid approval flow");
  if (data.approverRole !== required) {
    throw new Error(`Apenas usu\xE1rios com n\xEDvel "${required}" podem rejeitar nesta etapa. Status atual: ${currentStatus}`);
  }
  await db.update(projectMaterials2).set({ approvalStatus: "rejected" }).where(eq(projectMaterials2.id, data.materialId));
  await db.insert(materialApprovals2).values({
    materialId: data.materialId,
    approverUserId: data.approverUserId,
    approverName: data.approverName,
    approverRole: data.approverRole,
    action: "rejected",
    fromStatus: currentStatus,
    toStatus: "rejected",
    comments: data.comments
  });
  return { success: true };
}
async function getApprovalHistory(materialId) {
  const db = await getDb();
  if (!db) return [];
  const { materialApprovals: materialApprovals2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return db.select().from(materialApprovals2).where(eq(materialApprovals2.materialId, materialId)).orderBy(materialApprovals2.createdAt);
}
async function createMaterialQuotation(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { materialQuotations: materialQuotations2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.insert(materialQuotations2).values(data);
  return result;
}
async function getMaterialQuotations(materialId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { materialQuotations: materialQuotations2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(materialQuotations2).where(eq(materialQuotations2.materialId, materialId));
}
async function updateMaterialQuotation(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { materialQuotations: materialQuotations2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.update(materialQuotations2).set(data).where(eq(materialQuotations2.id, id));
}
async function deleteMaterialQuotation(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { materialQuotations: materialQuotations2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.delete(materialQuotations2).where(eq(materialQuotations2.id, id));
}
async function setRecommendedQuotation(materialId, quotationId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { materialQuotations: materialQuotations2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.update(materialQuotations2).set({ isRecommended: 0 }).where(eq(materialQuotations2.materialId, materialId));
  await db.update(materialQuotations2).set({ isRecommended: 1 }).where(eq(materialQuotations2.id, quotationId));
}
async function confirmPurchase(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectMaterials: projectMaterials2, materialApprovals: materialApprovals2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const material = await db.select().from(projectMaterials2).where(eq(projectMaterials2.id, data.materialId)).limit(1);
  if (material.length === 0) throw new Error("Material not found");
  const currentStatus = material[0].approvalStatus;
  if (currentStatus !== "financial") {
    throw new Error("Material must be approved by financial before purchase");
  }
  await db.update(projectMaterials2).set({
    approvalStatus: "purchased",
    purchaseDate: /* @__PURE__ */ new Date(),
    expectedDeliveryDate: data.expectedDeliveryDate
  }).where(eq(projectMaterials2.id, data.materialId));
  await db.insert(materialApprovals2).values({
    materialId: data.materialId,
    approverUserId: data.buyerUserId,
    approverName: data.buyerName,
    approverRole: "Comprador",
    action: "purchased",
    fromStatus: currentStatus,
    toStatus: "purchased",
    comments: `Compra realizada. Entrega prevista para ${data.expectedDeliveryDate.toLocaleDateString("pt-BR")}`
  });
  return { success: true };
}
async function confirmReceiving(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { projectMaterials: projectMaterials2, materialApprovals: materialApprovals2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const material = await db.select().from(projectMaterials2).where(eq(projectMaterials2.id, data.materialId)).limit(1);
  if (material.length === 0) throw new Error("Material not found");
  const currentStatus = material[0].approvalStatus;
  if (currentStatus !== "purchased") {
    throw new Error("Material must be purchased before receiving");
  }
  await db.update(projectMaterials2).set({
    approvalStatus: "received",
    receivedDate: /* @__PURE__ */ new Date(),
    receivedBy: data.receivedBy
  }).where(eq(projectMaterials2.id, data.materialId));
  await db.insert(materialApprovals2).values({
    materialId: data.materialId,
    approverUserId: data.receiverUserId,
    approverName: data.receiverName,
    approverRole: "Recebedor",
    action: "received",
    fromStatus: currentStatus,
    toStatus: "received",
    comments: `Mercadoria recebida por ${data.receivedBy}`
  });
  return { success: true };
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function registerUser(data) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const existing = await getUserByEmail(data.email);
  if (existing) {
    throw new Error("Email j\xE1 cadastrado");
  }
  const passwordHash = await bcrypt.hash(data.password, 10);
  const allUsers = await db.select().from(users);
  const isFirstUser = allUsers.length === 0;
  const [insertedUser] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: passwordHash,
    authType: "local",
    role: data.role || (isFirstUser ? "admin" : "user"),
    level: data.level,
    sector: data.sector,
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  const newUser = await getUserByEmail(data.email);
  if (!newUser) {
    throw new Error("Erro ao recuperar usu\xE1rio rec\xE9m-criado");
  }
  console.log("[REGISTER USER] Adicionando usu\xE1rio \xE0 equipe:", {
    userId: newUser.id,
    name: data.name,
    email: data.email
  });
  try {
    await db.insert(teamMembers).values({
      userId: newUser.id,
      name: data.name,
      email: data.email,
      role: data.level || data.sector || "Colaborador",
      // Usar level ou sector como cargo
      status: "ativo",
      hireDate: /* @__PURE__ */ new Date()
    });
    console.log("[REGISTER USER] Usu\xE1rio adicionado \xE0 equipe com sucesso");
  } catch (error) {
    console.error("[REGISTER USER] Erro ao adicionar usu\xE1rio \xE0 equipe:", error);
  }
  return insertedUser;
}
async function loginUser(email, password) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("Credenciais inv\xE1lidas");
  }
  if (user.authType !== "local" || !user.password) {
    throw new Error("Este usu\xE1rio usa autentica\xE7\xE3o OAuth");
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Credenciais inv\xE1lidas");
  }
  const db = await getDb();
  if (db) {
    await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq(users.id, user.id));
  }
  return user;
}
async function getAllUsers() {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  const result = await database.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    level: users.level,
    sector: users.sector,
    authType: users.authType,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn
  }).from(users).orderBy(users.createdAt);
  return result;
}
async function updateUser(userId, data) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  await database.update(users).set({
    ...data,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
  return { success: true };
}
async function resetUserPassword(userId, newPassword) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await database.update(users).set({
    password: hashedPassword,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
  return { success: true };
}
async function deleteUser(userId) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  await database.delete(users).where(eq(users.id, userId));
  return { success: true };
}
async function createPasswordResetToken(email) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  const userResult = await database.select().from(users).where(eq(users.email, email)).limit(1);
  if (userResult.length === 0) {
    throw new Error("Usu\xE1rio n\xE3o encontrado");
  }
  const user = userResult[0];
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = /* @__PURE__ */ new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  await database.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
    used: 0
  });
  const emailResult = await sendPasswordResetEmail(user.email, token, user.name || void 0);
  if (!emailResult.success) {
    console.error("[Password Reset] Erro ao enviar email:", emailResult.message);
  }
  return {
    token: emailResult.success ? void 0 : token,
    // Retorna token apenas se email falhou
    email: user.email,
    name: user.name,
    emailSent: emailResult.success,
    emailError: emailResult.success ? void 0 : emailResult.message
  };
}
async function validatePasswordResetToken(token) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  const tokenResult = await database.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
  if (tokenResult.length === 0) {
    throw new Error("Token inv\xE1lido");
  }
  const resetToken = tokenResult[0];
  if (resetToken.used === 1) {
    throw new Error("Token j\xE1 foi utilizado");
  }
  if (/* @__PURE__ */ new Date() > resetToken.expiresAt) {
    throw new Error("Token expirado");
  }
  return { userId: resetToken.userId, tokenId: resetToken.id };
}
async function resetPasswordWithToken(token, newPassword) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  const { userId, tokenId } = await validatePasswordResetToken(token);
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await database.update(users).set({
    password: hashedPassword,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
  await database.update(passwordResetTokens).set({ used: 1 }).where(eq(passwordResetTokens.id, tokenId));
  return { success: true };
}
async function generateTemporaryResetCode(email) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  const userResult = await database.select().from(users).where(eq(users.email, email)).limit(1);
  if (userResult.length === 0) {
    throw new Error("Usu\xE1rio n\xE3o encontrado");
  }
  const user = userResult[0];
  const code = Math.floor(1e5 + Math.random() * 9e5).toString();
  const expiresAt = /* @__PURE__ */ new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  await database.update(users).set({
    temporaryResetCode: code,
    resetCodeExpiresAt: expiresAt,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, user.id));
  return {
    code,
    expiresAt,
    userName: user.name,
    userEmail: user.email
  };
}
async function validateTemporaryResetCode(email, code) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  const userResult = await database.select().from(users).where(eq(users.email, email)).limit(1);
  if (userResult.length === 0) {
    throw new Error("Usu\xE1rio n\xE3o encontrado");
  }
  const user = userResult[0];
  if (!user.temporaryResetCode) {
    throw new Error("Nenhum c\xF3digo de recupera\xE7\xE3o foi gerado para este usu\xE1rio");
  }
  if (user.temporaryResetCode !== code) {
    throw new Error("C\xF3digo inv\xE1lido");
  }
  if (!user.resetCodeExpiresAt || /* @__PURE__ */ new Date() > user.resetCodeExpiresAt) {
    throw new Error("C\xF3digo expirado");
  }
  return { userId: user.id };
}
async function resetPasswordWithCode(email, code, newPassword) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  const { userId } = await validateTemporaryResetCode(email, code);
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await database.update(users).set({
    password: hashedPassword,
    temporaryResetCode: null,
    resetCodeExpiresAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
  return { success: true };
}
async function listActiveResetCodes() {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }
  const result = await database.select({
    id: users.id,
    name: users.name,
    email: users.email,
    code: users.temporaryResetCode,
    expiresAt: users.resetCodeExpiresAt
  }).from(users).where(and(
    isNotNull(users.temporaryResetCode),
    isNotNull(users.resetCodeExpiresAt)
  ));
  return result;
}
async function getProjectScheduleWithActivities(projectId) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");
  const projectResult = await dbInstance.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (projectResult.length === 0) {
    throw new Error("Projeto n\xE3o encontrado");
  }
  const project = projectResult[0];
  const activitiesResult = await dbInstance.select({
    id: phaseActivities.id,
    name: phaseActivities.name,
    phase: phaseActivities.phase,
    startDate: phaseActivities.startDate,
    endDate: phaseActivities.endDate,
    completed: phaseActivities.completed,
    assignedTo: phaseActivities.assignedTo,
    order: phaseActivities.order
  }).from(phaseActivities).where(eq(phaseActivities.projectId, projectId)).orderBy(phaseActivities.order);
  const activities = await Promise.all(
    activitiesResult.map(async (activity) => {
      const subtasksResult = await dbInstance.select({
        id: phaseSubtasks.id,
        name: phaseSubtasks.name,
        startDate: phaseSubtasks.startDate,
        endDate: phaseSubtasks.endDate,
        completed: phaseSubtasks.completed,
        assignedTo: phaseSubtasks.assignedTo,
        order: phaseSubtasks.order
      }).from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activity.id)).orderBy(phaseSubtasks.order);
      return {
        ...activity,
        subtasks: subtasksResult
      };
    })
  );
  return {
    project,
    activities
  };
}

// _core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const isSecure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // sameSite "none" requer HTTPS. Em desenvolvimento local (HTTP), usar "lax"
    sameSite: isSecure ? "none" : "lax",
    secure: isSecure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// _core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// _core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// _core/systemRouter.ts
import { z } from "zod";

// _core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// _core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// _core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d"
    // Token expira em 7 dias
  });
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// pdfGenerator.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
async function generateQuotePDF(data) {
  const { quote, items } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;
  const primaryColor = [37, 99, 235];
  const textColor = [51, 51, 51];
  const lightGray = [245, 245, 245];
  if (data.companyLogo) {
    try {
      doc.addImage(data.companyLogo, "PNG", 15, yPosition, 50, 15);
    } catch (error) {
      console.error("Erro ao adicionar logo:", error);
    }
  }
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  doc.text("Avenida Governador Danilo de Matos Areosa, 1199", 15, yPosition + 18);
  doc.text("Distrito Industrial 1 - Manaus/AM - CEP 69030-050", 15, yPosition + 22);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Or\xE7amento #${quote.id}`, pageWidth - 15, yPosition + 10, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date(quote.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  doc.text(dateStr, pageWidth - 15, yPosition + 18, { align: "right" });
  yPosition += 35;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;
  doc.setFillColor(...lightGray);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("INFORMA\xC7\xD5ES DO CLIENTE", 20, yPosition + 5.5);
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text("Cliente:", 20, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(quote.clientName, 45, yPosition);
  yPosition += 7;
  if (data.client) {
    if (data.client.document) {
      doc.setFont("helvetica", "bold");
      doc.text("CNPJ/CPF:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(data.client.document, 45, yPosition);
      yPosition += 7;
    }
    if (data.client.email) {
      doc.setFont("helvetica", "bold");
      doc.text("Email:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(data.client.email, 45, yPosition);
      yPosition += 7;
    }
    if (data.client.phone) {
      doc.setFont("helvetica", "bold");
      doc.text("Telefone:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(data.client.phone, 45, yPosition);
      yPosition += 7;
    }
    if (data.client.address) {
      doc.setFont("helvetica", "bold");
      doc.text("Endere\xE7o:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      const addressLines = doc.splitTextToSize(data.client.address, pageWidth - 60);
      doc.text(addressLines, 45, yPosition);
      yPosition += 7 * addressLines.length;
    }
    if (data.client.city || data.client.state || data.client.zipCode) {
      const location = [
        data.client.city,
        data.client.state,
        data.client.zipCode ? `CEP: ${data.client.zipCode}` : null
      ].filter(Boolean).join(" - ");
      if (location) {
        doc.setFont("helvetica", "bold");
        doc.text("Localiza\xE7\xE3o:", 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(location, 45, yPosition);
        yPosition += 7;
      }
    }
  }
  yPosition += 8;
  doc.setFillColor(...lightGray);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("PE\xC7AS DO OR\xC7AMENTO", 20, yPosition + 5.5);
  yPosition += 15;
  const tableData = items.map((item, index) => {
    const totalTime = ((item.machineTimeHours + item.setupTimeHours) / 60).toFixed(2);
    const unitPrice = item.itemSubtotal / item.quantity;
    return [
      `${index + 1}`,
      item.partDescription,
      item.quantity.toString(),
      item.machineName,
      item.materialName || "-",
      `${totalTime}h`,
      `R$ ${(unitPrice / 100).toFixed(2)}`,
      `R$ ${(item.itemSubtotal / 100).toFixed(2)}`
    ];
  });
  autoTable(doc, {
    startY: yPosition,
    head: [["#", "Descri\xE7\xE3o", "Qtd", "M\xE1quina", "Material", "Tempo", "Valor Unit.", "Subtotal"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold"
    },
    bodyStyles: {
      fontSize: 8,
      textColor
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 45 },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 22, halign: "right" },
      7: { cellWidth: 23, halign: "right" }
    },
    margin: { left: 15, right: 15 }
  });
  yPosition = doc.lastAutoTable.finalY + 15;
  if (quote.notes) {
    doc.setFillColor(...lightGray);
    doc.rect(15, yPosition, pageWidth - 30, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("OBSERVA\xC7\xD5ES", 20, yPosition + 5.5);
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    const notesLines = doc.splitTextToSize(quote.notes, pageWidth - 40);
    doc.text(notesLines, 20, yPosition);
    yPosition += notesLines.length * 5 + 10;
  } else {
    yPosition += 5;
  }
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);
  doc.text("M\xE3o de Obra:", 20, yPosition);
  doc.text(`R$ ${(quote.profitAmount / 100).toFixed(2)}`, pageWidth - 20, yPosition, { align: "right" });
  yPosition += 7;
  doc.text("Impostos:", 20, yPosition);
  doc.text(`R$ ${(quote.taxAmount / 100).toFixed(2)}`, pageWidth - 20, yPosition, { align: "right" });
  yPosition += 10;
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPosition, pageWidth - 30, 12, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("VALOR FINAL:", 20, yPosition + 8);
  doc.text(`R$ ${(quote.finalPrice / 100).toFixed(2)}`, pageWidth - 20, yPosition + 8, { align: "right" });
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "normal");
    doc.text(
      `P\xE1gina ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  return Buffer.from(doc.output("arraybuffer"));
}

// routers.ts
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    register: publicProcedure.input(z2.object({
      name: z2.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      email: z2.string().email("Email inv\xE1lido"),
      password: z2.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres"),
      sector: z2.enum(["Software", "Hardware", "Mec\xE2nica", "Automa\xE7\xE3o", "Administrativo"]).optional()
    })).mutation(async ({ input }) => {
      try {
        await registerUser(input);
        return { success: true, message: "Usu\xE1rio registrado com sucesso!" };
      } catch (error) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: error.message || "Erro ao registrar usu\xE1rio"
        });
      }
    }),
    login: publicProcedure.input(z2.object({
      email: z2.string().email("Email inv\xE1lido"),
      password: z2.string().min(1, "Senha \xE9 obrigat\xF3ria")
    })).mutation(async ({ input, ctx }) => {
      console.log("[LOGIN DEBUG] Tentativa de login:", input.email);
      try {
        const user = await loginUser(input.email, input.password);
        console.log("[LOGIN DEBUG] Usu\xE1rio autenticado:", user.email);
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        console.log("[LOGIN DEBUG] Op\xE7\xF5es de cookie:", cookieOptions);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1e3
          // 7 dias
        });
        console.log("[LOGIN DEBUG] Cookie salvo com nome:", COOKIE_NAME);
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            sector: user.sector
          }
        };
      } catch (error) {
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: error.message || "Credenciais inv\xE1lidas"
        });
      }
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    }),
    requestPasswordReset: publicProcedure.input(z2.object({
      email: z2.string().email("Email inv\xE1lido")
    })).mutation(async ({ input }) => {
      try {
        const result = await createPasswordResetToken(input.email);
        if (result.emailSent) {
          return {
            success: true,
            message: "Email de recupera\xE7\xE3o enviado! Verifique sua caixa de entrada.",
            emailSent: true
          };
        } else {
          return {
            success: true,
            message: `Erro ao enviar email: ${result.emailError}. Token gerado para teste.`,
            emailSent: false,
            token: result.token
            // Apenas para fallback quando email falha
          };
        }
      } catch (error) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: error.message || "Erro ao solicitar recupera\xE7\xE3o de senha"
        });
      }
    }),
    validateResetToken: publicProcedure.input(z2.object({
      token: z2.string().min(1, "Token \xE9 obrigat\xF3rio")
    })).query(async ({ input }) => {
      try {
        await validatePasswordResetToken(input.token);
        return { valid: true };
      } catch (error) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: error.message || "Token inv\xE1lido"
        });
      }
    }),
    resetPassword: publicProcedure.input(z2.object({
      token: z2.string().min(1, "Token \xE9 obrigat\xF3rio"),
      newPassword: z2.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres")
    })).mutation(async ({ input }) => {
      try {
        await resetPasswordWithToken(input.token, input.newPassword);
        return {
          success: true,
          message: "Senha redefinida com sucesso!"
        };
      } catch (error) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: error.message || "Erro ao redefinir senha"
        });
      }
    }),
    // Código Temporário (Admin)
    generateResetCode: protectedProcedure.input(z2.object({
      email: z2.string().email("Email inv\xE1lido")
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Apenas administradores podem gerar c\xF3digos de recupera\xE7\xE3o"
        });
      }
      try {
        const result = await generateTemporaryResetCode(input.email);
        return {
          success: true,
          message: "C\xF3digo gerado com sucesso!",
          code: result.code,
          expiresAt: result.expiresAt,
          userName: result.userName
        };
      } catch (error) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: error.message || "Erro ao gerar c\xF3digo"
        });
      }
    }),
    resetPasswordWithCode: publicProcedure.input(z2.object({
      email: z2.string().email("Email inv\xE1lido"),
      code: z2.string().length(6, "C\xF3digo deve ter 6 d\xEDgitos"),
      newPassword: z2.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres")
    })).mutation(async ({ input }) => {
      try {
        await resetPasswordWithCode(input.email, input.code, input.newPassword);
        return {
          success: true,
          message: "Senha redefinida com sucesso!"
        };
      } catch (error) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: error.message || "Erro ao redefinir senha"
        });
      }
    }),
    listActiveResetCodes: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Apenas administradores podem visualizar c\xF3digos ativos"
        });
      }
      return await listActiveResetCodes();
    })
  }),
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar esta funcionalidade"
        });
      }
      return await getAllUsers();
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1, "Nome \xE9 obrigat\xF3rio"),
      email: z2.string().email("Email inv\xE1lido"),
      password: z2.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres"),
      role: z2.enum(["user", "admin"]).default("user"),
      level: z2.enum(["Dev", "L\xEDder", "Gerente", "Financeiro", "Diretor", "Comprador"]).optional(),
      sector: z2.enum(["Software", "Hardware", "Mec\xE2nica", "Automa\xE7\xE3o", "Administrativo"]).optional()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar usu\xE1rios"
        });
      }
      const result = await registerUser(input);
      return result;
    }),
    update: protectedProcedure.input(z2.object({
      userId: z2.number().int(),
      name: z2.string().optional(),
      role: z2.enum(["user", "admin"]).optional(),
      level: z2.enum(["Dev", "L\xEDder", "Gerente", "Financeiro", "Diretor", "Comprador"]).optional(),
      sector: z2.enum(["Software", "Hardware", "Mec\xE2nica", "Automa\xE7\xE3o", "Administrativo"]).optional()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Apenas administradores podem editar usu\xE1rios"
        });
      }
      const { userId, ...data } = input;
      return await updateUser(userId, data);
    }),
    resetPassword: protectedProcedure.input(z2.object({
      userId: z2.number().int(),
      newPassword: z2.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres")
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Apenas administradores podem resetar senhas"
        });
      }
      return await resetUserPassword(input.userId, input.newPassword);
    }),
    delete: protectedProcedure.input(z2.object({
      userId: z2.number().int()
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Apenas administradores podem excluir usu\xE1rios"
        });
      }
      if (ctx.user.id === input.userId) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "Voc\xEA n\xE3o pode excluir sua pr\xF3pria conta"
        });
      }
      return await deleteUser(input.userId);
    })
  }),
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getAllProjects();
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      description: z2.string().optional(),
      clientId: z2.number().int().nullable().optional(),
      leaderId: z2.number().int().nullable().optional(),
      duration: z2.number().int().min(1).optional(),
      status: z2.enum(["planejamento", "em_andamento", "concluido", "cancelado"]).default("planejamento"),
      startDate: z2.union([z2.string(), z2.date()]).optional(),
      endDate: z2.union([z2.string(), z2.date()]).optional(),
      budget: z2.number().int().min(0).optional(),
      notes: z2.string().optional(),
      teamMemberIds: z2.array(z2.number().int()).optional()
    })).mutation(async ({ ctx, input }) => {
      const { teamMemberIds, ...projectData } = input;
      const projectId = await createProject({
        ...projectData,
        userId: ctx.user.id,
        startDate: input.startDate ? input.startDate instanceof Date ? input.startDate : new Date(input.startDate) : null,
        endDate: input.endDate ? input.endDate instanceof Date ? input.endDate : new Date(input.endDate) : null
      });
      if (teamMemberIds && teamMemberIds.length > 0) {
        await setProjectTeamMembers(projectId, teamMemberIds);
      }
      return { success: true, projectId };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      name: z2.string().min(1).optional(),
      description: z2.string().optional(),
      clientId: z2.number().int().nullable().optional(),
      leaderId: z2.number().int().nullable().optional(),
      duration: z2.number().int().min(1).optional(),
      status: z2.enum(["planejamento", "em_andamento", "concluido", "cancelado"]).optional(),
      startDate: z2.union([z2.string(), z2.date()]).optional(),
      endDate: z2.union([z2.string(), z2.date()]).optional(),
      budget: z2.number().int().min(0).optional(),
      notes: z2.string().optional(),
      teamMemberIds: z2.array(z2.number().int()).optional()
    })).mutation(async ({ input }) => {
      const { id, teamMemberIds, ...data } = input;
      await updateProject(id, {
        ...data,
        startDate: data.startDate ? data.startDate instanceof Date ? data.startDate : new Date(data.startDate) : void 0,
        endDate: data.endDate ? data.endDate instanceof Date ? data.endDate : new Date(data.endDate) : void 0
      });
      if (teamMemberIds !== void 0) {
        await setProjectTeamMembers(id, teamMemberIds);
      }
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deleteProject(input.id);
      return { success: true };
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number().int() })).query(async ({ input }) => {
      const project = await getProjectById(input.id);
      if (!project) return null;
      const teamMembers2 = await getProjectTeamMembers(input.id);
      return { ...project, teamMembers: teamMembers2 };
    }),
    updatePhase: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      phase: z2.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"])
    })).mutation(async ({ input }) => {
      await updateProjectPhase(input.id, input.phase);
      return { success: true };
    }),
    getPhaseSchedule: protectedProcedure.input(z2.object({ projectId: z2.number().int() })).query(async ({ input }) => {
      return await getPhaseScheduleByProjectId(input.projectId);
    }),
    setPhaseSchedule: protectedProcedure.input(z2.object({
      projectId: z2.number().int(),
      schedules: z2.array(z2.object({
        phase: z2.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]),
        startDate: z2.union([z2.string(), z2.date()]).optional(),
        endDate: z2.union([z2.string(), z2.date()]).optional()
      }))
    })).mutation(async ({ input }) => {
      const schedules = input.schedules.map((s) => ({
        phase: s.phase,
        startDate: s.startDate ? s.startDate instanceof Date ? s.startDate : new Date(s.startDate) : void 0,
        endDate: s.endDate ? s.endDate instanceof Date ? s.endDate : new Date(s.endDate) : void 0
      }));
      await setProjectPhaseSchedule(input.projectId, schedules);
      return { success: true };
    }),
    // Phase Activities
    getPhaseActivities: protectedProcedure.input(z2.object({
      projectId: z2.number().int(),
      phase: z2.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"])
    })).query(async ({ input }) => {
      return await getPhaseActivitiesByProjectAndPhase(input.projectId, input.phase);
    }),
    createPhaseActivity: protectedProcedure.input(z2.object({
      projectId: z2.number().int(),
      phase: z2.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]),
      name: z2.string().min(1),
      startDate: z2.union([z2.string(), z2.date()]).optional(),
      endDate: z2.union([z2.string(), z2.date()]).optional(),
      assignedTo: z2.number().int().optional()
    })).mutation(async ({ input }) => {
      const parseLocalDate = (dateStr) => {
        if (dateStr instanceof Date) return dateStr;
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      const activityId = await createPhaseActivity({
        projectId: input.projectId,
        phase: input.phase,
        name: input.name,
        startDate: input.startDate ? parseLocalDate(input.startDate) : null,
        endDate: input.endDate ? parseLocalDate(input.endDate) : null,
        completed: 0,
        assignedTo: input.assignedTo || null
      });
      return { success: true, activityId };
    }),
    updatePhaseActivity: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      name: z2.string().min(1).optional(),
      startDate: z2.union([z2.string(), z2.date()]).optional(),
      endDate: z2.union([z2.string(), z2.date()]).optional(),
      assignedTo: z2.number().int().optional().nullable()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const parseLocalDate = (dateStr) => {
        if (dateStr instanceof Date) return dateStr;
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      await updatePhaseActivity(id, {
        ...data,
        startDate: data.startDate ? parseLocalDate(data.startDate) : void 0,
        endDate: data.endDate ? parseLocalDate(data.endDate) : void 0,
        assignedTo: data.assignedTo !== void 0 ? data.assignedTo : void 0
      });
      return { success: true };
    }),
    updatePhaseDates: protectedProcedure.input(z2.object({
      phaseId: z2.number().int(),
      startDate: z2.string(),
      endDate: z2.string()
    })).mutation(async ({ input }) => {
      const { phaseId, startDate, endDate } = input;
      const parseLocalDate = (dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      const start = parseLocalDate(startDate);
      const end = parseLocalDate(endDate);
      if (start >= end) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "Data de in\xEDcio deve ser anterior \xE0 data de fim"
        });
      }
      await updatePhaseActivity(phaseId, {
        startDate: start,
        endDate: end
      });
      return { success: true };
    }),
    togglePhaseActivityCompleted: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await togglePhaseActivityCompleted(input.id);
      return { success: true };
    }),
    deletePhaseActivity: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deletePhaseActivity(input.id);
      return { success: true };
    }),
    reorderPhaseActivities: protectedProcedure.input(z2.object({
      updates: z2.array(z2.object({
        id: z2.number().int(),
        order: z2.number().int()
      }))
    })).mutation(async ({ input }) => {
      await reorderPhaseActivities(input.updates);
      return { success: true };
    }),
    // Phase Subtasks
    getPhaseSubtasks: protectedProcedure.input(z2.object({
      activityId: z2.number().int()
    })).query(async ({ input }) => {
      return await getPhaseSubtasksByActivity(input.activityId);
    }),
    createPhaseSubtask: protectedProcedure.input(z2.object({
      activityId: z2.number().int(),
      name: z2.string().min(1),
      startDate: z2.union([z2.string(), z2.date()]).optional(),
      endDate: z2.union([z2.string(), z2.date()]).optional(),
      assignedTo: z2.number().int().optional()
    })).mutation(async ({ input }) => {
      const parseLocalDate = (dateStr) => {
        if (dateStr instanceof Date) return dateStr;
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      const subtaskData = {
        activityId: input.activityId,
        name: input.name,
        startDate: input.startDate ? parseLocalDate(input.startDate) : void 0,
        endDate: input.endDate ? parseLocalDate(input.endDate) : void 0,
        completed: 0,
        assignedTo: input.assignedTo || null
      };
      const subtaskId = await createPhaseSubtask(subtaskData);
      return { success: true, subtaskId };
    }),
    updatePhaseSubtask: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      name: z2.string().min(1),
      startDate: z2.union([z2.string(), z2.date()]).optional(),
      endDate: z2.union([z2.string(), z2.date()]).optional(),
      assignedTo: z2.number().int().optional().nullable()
    })).mutation(async ({ input }) => {
      const { id, startDate, endDate, ...data } = input;
      const parseLocalDate = (dateStr) => {
        if (dateStr instanceof Date) return dateStr;
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      await updatePhaseSubtask(id, {
        ...data,
        startDate: startDate ? parseLocalDate(startDate) : void 0,
        endDate: endDate ? parseLocalDate(endDate) : void 0,
        assignedTo: data.assignedTo !== void 0 ? data.assignedTo : void 0
      });
      return { success: true };
    }),
    updatePhaseSubtaskAssignee: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      assignedTo: z2.number().int().nullable()
    })).mutation(async ({ input }) => {
      console.log("[TRPC updatePhaseSubtaskAssignee] Input:", input);
      await updatePhaseSubtaskAssignee(input.id, input.assignedTo);
      return { success: true };
    }),
    updatePhaseSubtaskDates: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      startDate: z2.union([z2.string(), z2.date(), z2.null()]).nullable().optional(),
      endDate: z2.union([z2.string(), z2.date(), z2.null()]).nullable().optional()
    })).mutation(async ({ input }) => {
      const parseLocalDate = (dateStr) => {
        if (!dateStr) return null;
        if (dateStr instanceof Date) return dateStr;
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      console.log("[TRPC updatePhaseSubtaskDates] Input:", input);
      const startDate = parseLocalDate(input.startDate);
      const endDate = parseLocalDate(input.endDate);
      await updatePhaseSubtaskDates(input.id, startDate, endDate);
      return { success: true };
    }),
    togglePhaseSubtaskCompleted: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await togglePhaseSubtaskCompleted(input.id);
      return { success: true };
    }),
    deletePhaseSubtask: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deletePhaseSubtask(input.id);
      return { success: true };
    }),
    // Team Tasks
    getTeamTasks: protectedProcedure.query(async () => {
      return await getAllTasksByTeamMember();
    }),
    completeTasksWithComments: protectedProcedure.input(z2.object({
      tasks: z2.array(z2.object({
        type: z2.enum(["activity", "subtask"]),
        id: z2.number().int(),
        comment: z2.string().optional()
      })),
      memberId: z2.number().int()
      // ID do team member que está executando
    })).mutation(async ({ input }) => {
      await completeMultipleTasks(input.tasks.map((t2) => ({ type: t2.type, id: t2.id })));
      for (const task of input.tasks) {
        if (task.comment && task.comment.trim()) {
          await createTaskComment({
            taskType: task.type,
            taskId: task.id,
            comment: task.comment,
            createdBy: input.memberId
          });
        }
      }
      return { success: true };
    }),
    getTaskComments: protectedProcedure.input(z2.object({
      taskType: z2.enum(["activity", "subtask"]),
      taskId: z2.number().int()
    })).query(async ({ input }) => {
      return await getTaskComments(input.taskType, input.taskId);
    }),
    reorderMemberTasks: protectedProcedure.input(z2.object({
      memberId: z2.number().int(),
      taskOrders: z2.array(z2.object({
        type: z2.enum(["activity", "subtask"]),
        id: z2.number().int(),
        order: z2.number().int()
      }))
    })).mutation(async ({ input }) => {
      await reorderMemberTasks(input.memberId, input.taskOrders);
      return { success: true };
    }),
    exportScheduleExcel: protectedProcedure.input(z2.object({ projectId: z2.number().int() })).mutation(async ({ input }) => {
      const ExcelJS = (await import("exceljs")).default;
      const scheduleData = await getProjectScheduleForExport(input.projectId);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cronograma");
      worksheet.columns = [
        { key: "tipo", width: 15 },
        { key: "nome", width: 40 },
        { key: "dataInicio", width: 15 },
        { key: "dataFim", width: 15 },
        { key: "duracao", width: 12 },
        { key: "progresso", width: 12 },
        { key: "status", width: 15 }
      ];
      worksheet.mergeCells("A1:G1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = `CRONOGRAMA DO PROJETO: ${scheduleData.project.name.toUpperCase()}`;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
      titleCell.font = { ...titleCell.font, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).height = 25;
      worksheet.addRow([]);
      worksheet.addRow(["Descri\xE7\xE3o:", scheduleData.project.description || "N/A"]);
      worksheet.addRow(["Fase Atual:", scheduleData.project.phase]);
      worksheet.addRow(["In\xEDcio:", scheduleData.project.startDate ? new Date(scheduleData.project.startDate).toLocaleDateString("pt-BR") : "N/A"]);
      worksheet.addRow(["Fim:", scheduleData.project.endDate ? new Date(scheduleData.project.endDate).toLocaleDateString("pt-BR") : "N/A"]);
      worksheet.addRow([]);
      const headerRow = worksheet.addRow(["Tipo", "Nome", "Data In\xEDcio", "Data Fim", "Dura\xE7\xE3o", "Progresso", "Status"]);
      headerRow.font = { bold: true };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      headerRow.height = 20;
      const phaseNames = {
        planejamento: "Planejamento",
        desenvolvimento: "Desenvolvimento",
        testes: "Testes",
        entrega: "Entrega",
        finalizado: "Finalizado"
      };
      scheduleData.schedule.forEach((phaseData) => {
        if (phaseData.activities.length === 0) return;
        const phaseRow = worksheet.addRow([
          "FASE",
          phaseNames[phaseData.phase] || phaseData.phase,
          "",
          "",
          "",
          "",
          ""
        ]);
        phaseRow.font = { bold: true, size: 12 };
        phaseRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E6E6" } };
        phaseData.activities.forEach((activity) => {
          const activityRow = worksheet.addRow([
            "Atividade",
            activity.name,
            activity.startDate ? new Date(activity.startDate).toLocaleDateString("pt-BR") : "-",
            activity.endDate ? new Date(activity.endDate).toLocaleDateString("pt-BR") : "-",
            activity.startDate && activity.endDate ? `${Math.ceil((new Date(activity.endDate).getTime() - new Date(activity.startDate).getTime()) / (1e3 * 60 * 60 * 24))} dias` : "-",
            `${activity.progress}%`,
            activity.completed === 1 ? "Conclu\xEDda" : "Pendente"
          ]);
          activityRow.font = { bold: true };
          activity.subtasks.forEach((subtask) => {
            const subtaskRow = worksheet.addRow([
              "Subtarefa",
              `  \u2192 ${subtask.name}`,
              subtask.startDate ? new Date(subtask.startDate).toLocaleDateString("pt-BR") : "-",
              subtask.endDate ? new Date(subtask.endDate).toLocaleDateString("pt-BR") : "-",
              subtask.startDate && subtask.endDate ? `${Math.ceil((new Date(subtask.endDate).getTime() - new Date(subtask.startDate).getTime()) / (1e3 * 60 * 60 * 24))} dias` : "-",
              subtask.completed === 1 ? "100%" : "50%",
              subtask.completed === 1 ? "Conclu\xEDda" : "Pendente"
            ]);
            subtaskRow.font = { italic: true };
          });
        });
      });
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber >= 8) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" }
            };
          });
        }
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return {
        data: base64,
        filename: `cronograma_${scheduleData.project.name.replace(/\s+/g, "_")}.xlsx`
      };
    }),
    getBurndownData: protectedProcedure.input(z2.object({ projectId: z2.number().int() })).query(async ({ input }) => {
      return await getBurndownChartData(input.projectId);
    }),
    getSchedule: protectedProcedure.input(z2.object({ projectId: z2.number().int() })).query(async ({ input }) => {
      return await getProjectScheduleWithActivities(input.projectId);
    }),
    getTeamMembers: protectedProcedure.input(z2.object({ projectId: z2.number().int() })).query(async ({ input }) => {
      const members = await getProjectTeamMembers(input.projectId);
      return members.map((m) => ({
        userId: m.id,
        userName: m.name,
        userEmail: m.email
      }));
    })
  }),
  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getAllTeamMembers();
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      email: z2.string().email().optional().or(z2.literal("")),
      phone: z2.string().optional(),
      role: z2.string().optional(),
      hierarchyLevel: z2.enum(["colaborador", "lider", "gerente", "comprador", "diretor", "financeiro"]).optional(),
      hourlyRate: z2.number().int().min(0).optional(),
      specialization: z2.string().optional(),
      status: z2.enum(["ativo", "inativo"]).default("ativo"),
      hireDate: z2.string().optional(),
      // ISO date string
      notes: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const memberId = await createTeamMember({
        ...input,
        userId: ctx.user.id,
        email: input.email || null,
        hireDate: input.hireDate ? new Date(input.hireDate) : null
      });
      return { success: true, memberId };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      name: z2.string().min(1).optional(),
      email: z2.string().email().optional().or(z2.literal("")),
      phone: z2.string().optional(),
      role: z2.string().optional(),
      hierarchyLevel: z2.enum(["colaborador", "lider", "gerente", "comprador", "diretor", "financeiro"]).optional(),
      hourlyRate: z2.number().int().min(0).optional(),
      specialization: z2.string().optional(),
      status: z2.enum(["ativo", "inativo"]).optional(),
      hireDate: z2.string().optional(),
      notes: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateTeamMember(id, {
        ...data,
        email: data.email || null,
        hireDate: data.hireDate ? new Date(data.hireDate) : void 0
      });
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deleteTeamMember(input.id);
      return { success: true };
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number().int() })).query(async ({ input }) => {
      return await getTeamMemberById(input.id);
    }),
    getActive: protectedProcedure.query(async ({ ctx }) => {
      return await getActiveTeamMembers(ctx.user.id);
    }),
    getMyHierarchyLevel: protectedProcedure.query(async ({ ctx }) => {
      return await getUserHierarchyLevel(ctx.user.email || "");
    })
  }),
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getClientsByUserId(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      email: z2.string().email().optional().or(z2.literal("")),
      phone: z2.string().optional(),
      document: z2.string().optional(),
      address: z2.string().optional(),
      city: z2.string().optional(),
      state: z2.string().max(2).optional(),
      zipCode: z2.string().optional(),
      notes: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const clientId = await createClient({
        ...input,
        email: input.email || null,
        userId: ctx.user.id
      });
      return { success: true, clientId };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      name: z2.string().min(1).optional(),
      email: z2.string().email().optional().or(z2.literal("")),
      phone: z2.string().optional(),
      document: z2.string().optional(),
      address: z2.string().optional(),
      city: z2.string().optional(),
      state: z2.string().max(2).optional(),
      zipCode: z2.string().optional(),
      notes: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateClient(id, {
        ...data,
        email: data.email || null
      });
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deleteClient(input.id);
      return { success: true };
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number().int() })).query(async ({ input }) => {
      return await getClientById(input.id);
    })
  }),
  machines: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getMachinesByUserId(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      type: z2.enum(["centro_usinagem", "torno_convencional", "torno_cnc", "fresadora", "outros"]),
      purchaseValue: z2.number().int().min(0),
      residualValue: z2.number().int().min(0).default(0),
      usefulLifeHours: z2.number().int().min(1),
      occupiedArea: z2.number().int().min(1),
      powerKw: z2.number().int().min(0),
      maintenanceCostPerYear: z2.number().int().min(0).default(0),
      consumablesCostPerYear: z2.number().int().min(0).default(0)
    })).mutation(async ({ ctx, input }) => {
      await createMachine({
        ...input,
        userId: ctx.user.id
      });
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      name: z2.string().min(1).optional(),
      type: z2.enum(["centro_usinagem", "torno_convencional", "torno_cnc", "fresadora", "outros"]).optional(),
      purchaseValue: z2.number().int().min(0).optional(),
      residualValue: z2.number().int().min(0).optional(),
      usefulLifeHours: z2.number().int().min(1).optional(),
      occupiedArea: z2.number().int().min(1).optional(),
      powerKw: z2.number().int().min(0).optional(),
      maintenanceCostPerYear: z2.number().int().min(0).optional(),
      consumablesCostPerYear: z2.number().int().min(0).optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateMachine(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deleteMachine(input.id);
      return { success: true };
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number().int() })).query(async ({ input }) => {
      return await getMachineById(input.id);
    })
  }),
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getSettingsByUserId(ctx.user.id);
    }),
    upsert: protectedProcedure.input(z2.object({
      rentPerSquareMeter: z2.number().int().min(0),
      electricityCostPerKwh: z2.number().int().min(0),
      operatorHourlyCost: z2.number().int().min(0),
      defaultProfitMargin: z2.number().int().min(0).max(100),
      defaultTaxRate: z2.number().int().min(0).max(100),
      workingHoursPerYear: z2.number().int().min(1)
    })).mutation(async ({ ctx, input }) => {
      await upsertSettings({
        ...input,
        userId: ctx.user.id
      });
      return { success: true };
    })
  }),
  quotes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getQuotesByUserId(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      clientName: z2.string().min(1),
      profitMargin: z2.number().int(),
      taxRate: z2.number().int(),
      subtotal: z2.number().int(),
      taxAmount: z2.number().int(),
      profitAmount: z2.number().int(),
      finalPrice: z2.number().int(),
      notes: z2.string().optional(),
      items: z2.array(z2.object({
        machineId: z2.number().int(),
        partDescription: z2.string().min(1),
        quantity: z2.number().int().min(1),
        materialId: z2.number().int().nullable().optional(),
        partWidthMm: z2.number().int().nullable().optional(),
        partLengthMm: z2.number().int().nullable().optional(),
        rawMaterialCost: z2.number().int().min(0),
        toolingCost: z2.number().int().min(0),
        thirdPartyServicesCost: z2.number().int().min(0),
        machineTimeHours: z2.number().min(0),
        setupTimeHours: z2.number().min(0),
        machineHourlyCost: z2.number().int(),
        totalMachineCost: z2.number().int(),
        totalLaborCost: z2.number().int(),
        itemSubtotal: z2.number().int()
      })).min(1)
    })).mutation(async ({ ctx, input }) => {
      try {
        const quoteId = await createQuote({
          userId: ctx.user.id,
          clientName: input.clientName,
          subtotal: input.subtotal,
          taxAmount: input.taxAmount,
          profitAmount: input.profitAmount,
          finalPrice: input.finalPrice,
          profitMargin: input.profitMargin,
          taxRate: input.taxRate,
          notes: input.notes
        });
        console.log("[INFO] Created quote with ID:", quoteId);
        console.log("[INFO] Number of items to create:", input.items.length);
        for (let i = 0; i < input.items.length; i++) {
          const item = input.items[i];
          console.log(`[INFO] Creating item ${i + 1}/${input.items.length}:`, item.partDescription);
          try {
            const itemData = {
              quoteId,
              machineId: item.machineId,
              partDescription: item.partDescription,
              quantity: item.quantity,
              materialId: item.materialId,
              partWidthMm: item.partWidthMm,
              partLengthMm: item.partLengthMm,
              rawMaterialCost: item.rawMaterialCost,
              toolingCost: item.toolingCost,
              thirdPartyServicesCost: item.thirdPartyServicesCost,
              machineTimeHours: item.machineTimeHours,
              setupTimeHours: item.setupTimeHours,
              machineHourlyCost: item.machineHourlyCost,
              totalMachineCost: item.totalMachineCost,
              totalLaborCost: item.totalLaborCost,
              itemSubtotal: item.itemSubtotal
            };
            console.log(`[DEBUG] Item data before createQuoteItem:`, JSON.stringify(itemData, null, 2));
            console.log(`[DEBUG] quoteId value:`, quoteId, "type:", typeof quoteId);
            await createQuoteItem(itemData);
            console.log(`[INFO] Item ${i + 1} created successfully`);
          } catch (itemError) {
            console.error(`[ERROR] Failed to create item ${i + 1}:`, itemError);
            throw itemError;
          }
        }
        console.log("[INFO] All items created successfully");
        return { success: true, quoteId };
      } catch (error) {
        throw error;
      }
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number().int() })).query(async ({ ctx, input }) => {
      const quote = await getQuoteById(input.id);
      if (!quote) return null;
      const items = await getQuoteItemsByQuoteId(input.id);
      const client = await getClientByName(ctx.user.id, quote.clientName);
      return { ...quote, items, client };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deleteQuote(input.id);
      return { success: true };
    }),
    approve: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await approveQuote(input.id);
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      clientName: z2.string().min(1),
      profitMargin: z2.number().int(),
      taxRate: z2.number().int(),
      subtotal: z2.number().int(),
      taxAmount: z2.number().int(),
      profitAmount: z2.number().int(),
      finalPrice: z2.number().int(),
      notes: z2.string().optional(),
      items: z2.array(z2.object({
        id: z2.number().int().optional(),
        // Se tem ID, é update; senão, é insert
        machineId: z2.number().int(),
        partDescription: z2.string().min(1),
        quantity: z2.number().int().min(1),
        materialId: z2.number().int().nullable().optional(),
        partWidthMm: z2.number().int().nullable().optional(),
        partLengthMm: z2.number().int().nullable().optional(),
        rawMaterialCost: z2.number().int().min(0),
        toolingCost: z2.number().int().min(0),
        thirdPartyServicesCost: z2.number().int().min(0),
        machineTimeHours: z2.number().min(0),
        setupTimeHours: z2.number().min(0),
        machineHourlyCost: z2.number().int(),
        totalMachineCost: z2.number().int(),
        totalLaborCost: z2.number().int(),
        itemSubtotal: z2.number().int()
      })),
      deletedItemIds: z2.array(z2.number().int()).optional()
    })).mutation(async ({ ctx, input }) => {
      const { id, items, deletedItemIds, ...quoteData } = input;
      await updateQuote(id, quoteData);
      if (deletedItemIds && deletedItemIds.length > 0) {
        for (const itemId of deletedItemIds) {
          await deleteQuoteItem(itemId);
        }
      }
      for (const item of items) {
        if (item.id) {
          const { id: itemId, ...itemData } = item;
          await updateQuoteItem(itemId, itemData);
        } else {
          await createQuoteItem({ ...item, quoteId: id });
        }
      }
      return { success: true };
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const totalGenerated = await getTotalQuotesValue(ctx.user.id);
      const totalApproved = await getTotalApprovedQuotesValue(ctx.user.id);
      return {
        totalGenerated,
        totalApproved
      };
    }),
    monthlyStats: protectedProcedure.query(async ({ ctx }) => {
      return await getMonthlyApprovedQuotesValue(ctx.user.id);
    }),
    statusCount: protectedProcedure.query(async ({ ctx }) => {
      return await getQuotesByStatus(ctx.user.id);
    }),
    exportPdf: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      const quote = await getQuoteById(input.id);
      if (!quote) {
        throw new Error("Or\xE7amento n\xE3o encontrado");
      }
      const items = await getQuoteItemsByQuoteId(input.id);
      const allClients = await getClientsByUserId(quote.userId);
      const client = allClients.find((c) => c.name === quote.clientName);
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const machine = await getMachineById(item.machineId);
          const material = item.materialId ? await getMaterialById(item.materialId) : null;
          return {
            ...item,
            machineName: machine?.name || "M\xE1quina n\xE3o encontrada",
            materialName: material?.name || null
          };
        })
      );
      let companyLogo;
      try {
        const logoPath = path.join(process.cwd(), "client/public/logo-delta.png");
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          companyLogo = `data:image/png;base64,${logoBuffer.toString("base64")}`;
        }
      } catch (error) {
        console.error("Erro ao carregar logo:", error);
      }
      const pdfBuffer = await generateQuotePDF({
        quote,
        items: itemsWithDetails,
        companyLogo,
        client: client || null
      });
      return {
        pdf: pdfBuffer.toString("base64"),
        filename: `orcamento-${quote.id}-${quote.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`
      };
    })
  }),
  materials: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getMaterialsByUserId(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(1),
      description: z2.string().optional(),
      widthMm: z2.number().int().min(1),
      lengthMm: z2.number().int().min(1),
      purchasePrice: z2.number().int().min(0),
      supplier: z2.string().optional(),
      stockQuantity: z2.number().int().min(0).default(0)
    })).mutation(async ({ ctx, input }) => {
      const areaMm2 = input.widthMm * input.lengthMm;
      const costPerMm2 = Math.round(input.purchasePrice * 1e3 / areaMm2);
      await createMaterial({
        ...input,
        userId: ctx.user.id,
        costPerMm2
      });
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      name: z2.string().min(1).optional(),
      description: z2.string().optional(),
      widthMm: z2.number().int().min(1).optional(),
      lengthMm: z2.number().int().min(1).optional(),
      purchasePrice: z2.number().int().min(0).optional(),
      supplier: z2.string().optional(),
      stockQuantity: z2.number().int().min(0).optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      if (data.widthMm || data.lengthMm || data.purchasePrice) {
        const material = await getMaterialById(id);
        if (material) {
          const widthMm = data.widthMm || material.widthMm;
          const lengthMm = data.lengthMm || material.lengthMm;
          const purchasePrice = data.purchasePrice || material.purchasePrice;
          const areaMm2 = widthMm * lengthMm;
          const costPerMm2 = Math.round(purchasePrice * 1e3 / areaMm2);
          data.costPerMm2 = costPerMm2;
        }
      }
      await updateMaterial(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deleteMaterial(input.id);
      return { success: true };
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number().int() })).query(async ({ input }) => {
      return await getMaterialById(input.id);
    })
  }),
  projectMaterials: router({
    getByProject: protectedProcedure.input(z2.object({ projectId: z2.number().int() })).query(async ({ input }) => {
      return await getMaterialsByProject(input.projectId);
    }),
    add: protectedProcedure.input(z2.object({
      projectId: z2.number().int(),
      itemName: z2.string().min(1),
      quantity: z2.number().int().positive(),
      unit: z2.string().min(1),
      unitPrice: z2.number().int().nonnegative(),
      supplier: z2.string().optional(),
      notes: z2.string().optional(),
      imageUrl: z2.string().optional(),
      requestingSector: z2.enum(["Software", "Hardware", "Mec\xE2nica", "Automa\xE7\xE3o", "Administrativo"])
    })).mutation(async ({ input }) => {
      await addProjectMaterial(input);
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      itemName: z2.string().min(1).optional(),
      quantity: z2.number().int().positive().optional(),
      unit: z2.string().min(1).optional(),
      unitPrice: z2.number().int().nonnegative().optional(),
      supplier: z2.string().optional(),
      notes: z2.string().optional(),
      imageUrl: z2.string().optional(),
      requestingSector: z2.enum(["Software", "Hardware", "Mec\xE2nica", "Automa\xE7\xE3o", "Administrativo"]).optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateProjectMaterial(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      await deleteProjectMaterial(input.id);
      return { success: true };
    }),
    approve: protectedProcedure.input(z2.object({
      materialId: z2.number().int(),
      comments: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const userLevel = await getUserHierarchyLevel(ctx.user.email || "");
      if (!userLevel) {
        throw new Error("Usu\xE1rio n\xE3o cadastrado como colaborador ou sem n\xEDvel hier\xE1rquico definido");
      }
      return await approveMaterial({
        materialId: input.materialId,
        approverUserId: ctx.user.id,
        approverName: ctx.user.name || ctx.user.email || "Unknown",
        approverRole: userLevel,
        comments: input.comments
      });
    }),
    reject: protectedProcedure.input(z2.object({
      materialId: z2.number().int(),
      comments: z2.string().min(1)
    })).mutation(async ({ input, ctx }) => {
      const userLevel = await getUserHierarchyLevel(ctx.user.email || "");
      if (!userLevel) {
        throw new Error("Usu\xE1rio n\xE3o cadastrado como colaborador ou sem n\xEDvel hier\xE1rquico definido");
      }
      return await rejectMaterial({
        materialId: input.materialId,
        approverUserId: ctx.user.id,
        approverName: ctx.user.name || ctx.user.email || "Unknown",
        approverRole: userLevel,
        comments: input.comments
      });
    }),
    getApprovalHistory: protectedProcedure.input(z2.object({ materialId: z2.number().int() })).query(async ({ input }) => {
      return await getApprovalHistory(input.materialId);
    }),
    // Cotações de fornecedores
    addSupplierQuotation: protectedProcedure.input(z2.object({
      materialId: z2.number().int(),
      supplier: z2.string().min(1),
      quotedPrice: z2.number().int().positive(),
      deliveryTime: z2.string().optional(),
      paymentTerms: z2.string().optional(),
      notes: z2.string().optional()
    })).mutation(async ({ input }) => {
      return await createMaterialQuotation(input);
    }),
    getQuotations: protectedProcedure.input(z2.object({ materialId: z2.number().int() })).query(async ({ input }) => {
      return await getMaterialQuotations(input.materialId);
    }),
    updateQuotation: protectedProcedure.input(z2.object({
      id: z2.number().int(),
      supplier: z2.string().min(1).optional(),
      quotedPrice: z2.number().int().positive().optional(),
      deliveryTime: z2.string().optional(),
      paymentTerms: z2.string().optional(),
      notes: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateMaterialQuotation(id, data);
    }),
    deleteQuotation: protectedProcedure.input(z2.object({ id: z2.number().int() })).mutation(async ({ input }) => {
      return await deleteMaterialQuotation(input.id);
    }),
    setRecommendedQuotation: protectedProcedure.input(z2.object({
      materialId: z2.number().int(),
      quotationId: z2.number().int()
    })).mutation(async ({ input }) => {
      return await setRecommendedQuotation(input.materialId, input.quotationId);
    }),
    confirmPurchase: protectedProcedure.input(z2.object({
      materialId: z2.number().int(),
      expectedDeliveryDate: z2.date()
    })).mutation(async ({ input, ctx }) => {
      return await confirmPurchase({
        materialId: input.materialId,
        expectedDeliveryDate: input.expectedDeliveryDate,
        buyerUserId: ctx.user.id,
        buyerName: ctx.user.name || ctx.user.email || "Unknown"
      });
    }),
    confirmReceiving: protectedProcedure.input(z2.object({
      materialId: z2.number().int(),
      receivedBy: z2.string().min(1)
    })).mutation(async ({ input, ctx }) => {
      return await confirmReceiving({
        materialId: input.materialId,
        receivedBy: input.receivedBy,
        receiverUserId: ctx.user.id,
        receiverName: ctx.user.name || ctx.user.email || "Unknown"
      });
    })
  }),
  activities: router({
    updateDates: protectedProcedure.input(z2.object({
      activityId: z2.number().int(),
      startDate: z2.union([z2.string(), z2.date()]),
      // Aceita string ou Date (superjson)
      endDate: z2.union([z2.string(), z2.date()])
    })).mutation(async ({ input }) => {
      const parseLocalDate = (dateStr) => {
        if (dateStr instanceof Date) return dateStr;
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      await updatePhaseActivityDates(
        input.activityId,
        parseLocalDate(input.startDate),
        parseLocalDate(input.endDate)
      );
      return { success: true };
    }),
    updateSubtaskDates: protectedProcedure.input(z2.object({
      subtaskId: z2.number().int(),
      startDate: z2.union([z2.string(), z2.date()]),
      // Aceita string ou Date (superjson)
      endDate: z2.union([z2.string(), z2.date()])
    })).mutation(async ({ input }) => {
      const parseLocalDate = (dateStr) => {
        if (dateStr instanceof Date) return dateStr;
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      await updatePhaseSubtaskDates(
        input.subtaskId,
        parseLocalDate(input.startDate),
        parseLocalDate(input.endDate)
      );
      return { success: true };
    }),
    updateName: protectedProcedure.input(z2.object({
      activityId: z2.number().int(),
      name: z2.string().min(1)
    })).mutation(async ({ input }) => {
      await updatePhaseActivity(input.activityId, { name: input.name });
      return { success: true };
    }),
    updateAssignee: protectedProcedure.input(z2.object({
      activityId: z2.number().int(),
      assignedTo: z2.number().int().nullable()
    })).mutation(async ({ input }) => {
      await updatePhaseActivity(input.activityId, { assignedTo: input.assignedTo });
      return { success: true };
    }),
    create: protectedProcedure.input(z2.object({
      projectId: z2.number().int(),
      phase: z2.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]),
      name: z2.string().min(1),
      startDate: z2.union([z2.string(), z2.date()]).optional(),
      endDate: z2.union([z2.string(), z2.date()]).optional()
    })).mutation(async ({ input }) => {
      const activityId = await createPhaseActivity({
        projectId: input.projectId,
        phase: input.phase,
        name: input.name,
        startDate: input.startDate ? input.startDate instanceof Date ? input.startDate : new Date(input.startDate) : null,
        endDate: input.endDate ? input.endDate instanceof Date ? input.endDate : new Date(input.endDate) : null,
        completed: 0,
        progress: 0,
        order: 999
        // Adicionar no final
      });
      return { success: true, activityId };
    })
  })
});

// _core/context.ts
async function createContext(opts) {
  let user = null;
  console.log("[AUTH DEBUG] Cookies recebidos:", opts.req.cookies);
  const token = opts.req.cookies?.[COOKIE_NAME];
  console.log("[AUTH DEBUG] Token JWT:", token ? "Presente" : "Ausente");
  if (token) {
    try {
      const payload = verifyToken(token);
      if (payload) {
        user = await getUserByEmail(payload.email);
      }
    } catch (error) {
      user = null;
    }
  }
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// _core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express();
  const server = createServer(app);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const allowedOrigins = frontendUrl.split(",").map((url) => url.trim());
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    } else if (allowedOrigins.length === 1) {
      res.header("Access-Control-Allow-Origin", allowedOrigins[0]);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Expose-Headers", "Set-Cookie");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  const preferredPort = parseInt(process.env.PORT || "3001");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/ (accessible via http://18.216.112.160:${port})`);
  });
}
startServer().catch(console.error);
