import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Opcional - apenas para OAuth
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }), // Hash bcrypt - apenas para auth local
  authType: mysqlEnum("authType", ["local", "oauth"]).default("local").notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  level: mysqlEnum("level", ["Dev", "Líder", "Gerente", "Financeiro", "Diretor", "Comprador"]),
  sector: mysqlEnum("sector", ["Software", "Hardware", "Mecânica", "Automação", "Administrativo"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  temporaryResetCode: varchar("temporaryResetCode", { length: 10 }), // Código temporário para recuperação
  resetCodeExpiresAt: timestamp("resetCodeExpiresAt"), // Expiração do código
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clientes - cadastro de clientes para orçamentos
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Proprietário do cadastro
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  document: varchar("document", { length: 20 }), // CPF/CNPJ
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Máquinas de usinagem (centros de usinagem, tornos, fresadoras, etc.)
 */
export const machines = mysqlTable("machines", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["centro_usinagem", "torno_convencional", "torno_cnc", "fresadora", "outros"]).notNull(),
  purchaseValue: int("purchaseValue").notNull(), // Valor em centavos
  residualValue: int("residualValue").default(0).notNull(), // Valor residual em centavos
  usefulLifeHours: int("usefulLifeHours").notNull(), // Vida útil em horas
  occupiedArea: int("occupiedArea").notNull(), // Área ocupada em cm²
  powerKw: int("powerKw").notNull(), // Potência em watts (W)
  maintenanceCostPerYear: int("maintenanceCostPerYear").default(0).notNull(), // Custo anual de manutenção em centavos
  consumablesCostPerYear: int("consumablesCostPerYear").notNull(), // Custo anual de consumíveis em centavos
  manualHourlyCost: int("manualHourlyCost"), // Custo hora-máquina manual em centavos (opcional, sobrescreve cálculo automático)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Machine = typeof machines.$inferSelect;
export type InsertMachine = typeof machines.$inferInsert;

/**
 * Configurações gerais do sistema (custos fixos, margens, etc.)
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  rentPerSquareMeter: int("rentPerSquareMeter").default(0).notNull(), // Aluguel por m² em centavos
  electricityCostPerKwh: int("electricityCostPerKwh").default(0).notNull(), // Custo do kWh em centavos
  operatorHourlyCost: int("operatorHourlyCost").default(0).notNull(), // Custo hora do operador em centavos
  defaultProfitMargin: int("defaultProfitMargin").default(20).notNull(), // Margem de lucro padrão em porcentagem
  defaultTaxRate: int("defaultTaxRate").default(0).notNull(), // Taxa de impostos em porcentagem
  workingHoursPerYear: int("workingHoursPerYear").default(2080).notNull(), // Horas de trabalho por ano (padrão: 40h/semana * 52 semanas)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

/**
 * Orçamentos gerados
 */
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  
  // Totais do orçamento (soma de todos os itens)
  subtotal: int("subtotal").notNull(), // Em centavos
  taxAmount: int("taxAmount").notNull(), // Em centavos
  profitAmount: int("profitAmount").notNull(), // Em centavos
  finalPrice: int("finalPrice").notNull(), // Em centavos
  
  // Configurações usadas no cálculo
  profitMargin: int("profitMargin").notNull(), // Porcentagem
  taxRate: int("taxRate").notNull(), // Porcentagem
  
  notes: text("notes"),
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Itens de orçamento (peças individuais)
 */
export const quoteItems = mysqlTable("quoteItems", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  machineId: int("machineId").notNull(),
  partDescription: text("partDescription").notNull(),
  quantity: int("quantity").default(1).notNull(),
  
  // Material
  materialId: int("materialId"),
  partWidthMm: int("partWidthMm"),
  partLengthMm: int("partLengthMm"),
  rawMaterialCost: int("rawMaterialCost").default(0).notNull(), // Em centavos
  
  // Custos adicionais
  toolingCost: int("toolingCost").default(0).notNull(), // Em centavos
  thirdPartyServicesCost: int("thirdPartyServicesCost").default(0).notNull(), // Em centavos
  
  // Tempos
  machineTimeHours: int("machineTimeHours").notNull(), // Tempo de máquina em minutos
  setupTimeHours: int("setupTimeHours").default(0).notNull(), // Tempo de setup em minutos
  
  // Custos calculados para este item
  machineHourlyCost: int("machineHourlyCost").notNull(), // Em centavos
  totalMachineCost: int("totalMachineCost").notNull(), // Em centavos
  totalLaborCost: int("totalLaborCost").notNull(), // Em centavos
  itemSubtotal: int("itemSubtotal").notNull(), // Em centavos (custo total deste item)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

/**
 * Estoque de materiais (matérias-primas)
 */
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  widthMm: int("widthMm").notNull(), // Largura em milímetros
  lengthMm: int("lengthMm").notNull(), // Comprimento em milímetros
  purchasePrice: int("purchasePrice").notNull(), // Preço de compra em centavos
  costPerMm2: int("costPerMm2").notNull(), // Custo por mm² em milésimos de centavo (calculado automaticamente)
  supplier: varchar("supplier", { length: 255 }), // Fornecedor
  stockQuantity: int("stockQuantity").default(0).notNull(), // Quantidade em estoque
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

/**
 * Projetos - gerenciamento de projetos de usinagem
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  clientId: int("clientId"), // Referência ao cliente (opcional)
  leaderId: int("leaderId"), // Líder do projeto (colaborador)
  duration: int("duration"), // Duração em dias
  status: mysqlEnum("status", ["planejamento", "em_andamento", "concluido", "cancelado"]).default("planejamento").notNull(),
  phase: mysqlEnum("phase", ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]).default("planejamento").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  budget: int("budget"), // Orçamento previsto em centavos
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Relacionamento entre projetos e membros da equipe
 */
export const projectTeamMembers = mysqlTable("projectTeamMembers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  teamMemberId: int("teamMemberId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectTeamMember = typeof projectTeamMembers.$inferSelect;
export type InsertProjectTeamMember = typeof projectTeamMembers.$inferInsert;

/**
 * Cronograma de fases do projeto
 */
export const phaseSchedule = mysqlTable("phaseSchedule", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  phase: mysqlEnum("phase", ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PhaseSchedule = typeof phaseSchedule.$inferSelect;
export type InsertPhaseSchedule = typeof phaseSchedule.$inferInsert;

/**
 * Colaboradores/Equipe - gerenciamento de membros da equipe
 */
export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Proprietário do registro
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 100 }), // Cargo/função (ex: Operador CNC, Engenheiro, etc)
  hierarchyLevel: mysqlEnum("hierarchyLevel", [
    "colaborador",  // Sem permissão de aprovação
    "lider",        // Pode aprovar pending → leader
    "gerente",      // Pode aprovar leader → manager
    "comprador",    // Pode fazer cotação manager → quotation
    "diretor",      // Pode aprovar quotation → director
    "financeiro"    // Pode aprovar director → financial
  ]),
  hourlyRate: int("hourlyRate"), // Custo hora do colaborador em centavos
  specialization: varchar("specialization", { length: 255 }), // Especialização (ex: Torno CNC, Fresadora, etc)
  status: mysqlEnum("status", ["ativo", "inativo"]).default("ativo").notNull(),
  hireDate: timestamp("hireDate"), // Data de contratação
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Atividades por fase do projeto
 */
export const phaseActivities = mysqlTable("phaseActivities", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  phase: mysqlEnum("phase", ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  completed: int("completed").default(0).notNull(), // 0 = não concluída, 1 = concluída
  progress: int("progress").default(0).notNull(), // Percentual de progresso (0-100) calculado pelas subtarefas
  order: int("order").default(0).notNull(), // Ordem de exibição dentro da fase
  assignedTo: int("assignedTo"), // ID do usuário responsável pela atividade
  completedAt: timestamp("completedAt"), // Data e hora de conclusão
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PhaseActivity = typeof phaseActivities.$inferSelect;
export type InsertPhaseActivity = typeof phaseActivities.$inferInsert;

/**
 * Subtarefas das atividades de fase do projeto
 */
export const phaseSubtasks = mysqlTable("phase_subtasks", {
  id: int("id").autoincrement().primaryKey(),
  activityId: int("activityId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  completed: int("completed").default(0).notNull(),
  order: int("display_order").default(0).notNull(), // Ordem de exibição dentro da atividade (mapeado para display_order no banco)
  assignedTo: int("assignedTo"), // ID do usuário responsável pela subtarefa
  completedAt: timestamp("completedAt"), // Data e hora de conclusão
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PhaseSubtask = typeof phaseSubtasks.$inferSelect;
export type InsertPhaseSubtask = typeof phaseSubtasks.$inferInsert;

/**
 * Comentários de tarefas (atividades e subtarefas)
 */
export const taskComments = mysqlTable("task_comments", {
  id: int("id").autoincrement().primaryKey(),
  taskType: mysqlEnum("taskType", ["activity", "subtask"]).notNull(),
  taskId: int("taskId").notNull(), // ID da atividade ou subtarefa
  comment: text("comment").notNull(),
  createdBy: int("createdBy").notNull(), // ID do team member que criou o comentário
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;

/**
 * Materiais de compra por projeto
 */
export const projectMaterials = mysqlTable("project_materials", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // unidade (kg, m, un, etc)
  unitPrice: int("unitPrice").notNull(), // Preço unitário em centavos
  supplier: varchar("supplier", { length: 255 }),
  notes: text("notes"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  requestingSector: mysqlEnum("requestingSector", [
    "Software",
    "Hardware",
    "Mecânica",
    "Automação",
    "Administrativo"
  ]).notNull(),
  // Campos de aprovação
  approvalStatus: mysqlEnum("approvalStatus", [
    "pending",      // Pendente - aguardando líder
    "leader",       // Aprovado pelo líder - aguardando gerente
    "manager",      // Aprovado pelo gerente - aguardando cotação
    "quotation",    // Cotação feita - aguardando diretor
    "director",     // Aprovado pelo diretor - aguardando financeiro
    "financial",    // Aprovado pelo financeiro - pode comprar
    "purchased",    // Comprado - aguardando entrega
    "received",     // Recebido - processo concluído
    "rejected"      // Rejeitado em alguma etapa
  ]).default("pending").notNull(),
  quotationValue: int("quotationValue"), // Valor da cotação em centavos
  quotationNotes: text("quotationNotes"), // Observações da cotação
  // Campos de compra e recebimento
  purchaseDate: timestamp("purchaseDate"), // Data em que a compra foi realizada
  expectedDeliveryDate: timestamp("expectedDeliveryDate"), // Data prevista de entrega
  receivedDate: timestamp("receivedDate"), // Data em que a mercadoria foi recebida
  receivedBy: varchar("receivedBy", { length: 255 }), // Nome de quem recebeu a mercadoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectMaterial = typeof projectMaterials.$inferSelect;
export type InsertProjectMaterial = typeof projectMaterials.$inferInsert;

/**
 * Histórico de aprovações de materiais
 */
export const materialApprovals = mysqlTable("material_approvals", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("materialId").notNull(),
  approverUserId: int("approverUserId").notNull(),
  approverName: varchar("approverName", { length: 255 }).notNull(),
  approverRole: varchar("approverRole", { length: 50 }).notNull(), // leader, manager, buyer, director, financial
  action: mysqlEnum("action", ["approved", "rejected", "purchased", "received"]).notNull(),
  fromStatus: varchar("fromStatus", { length: 50 }).notNull(),
  toStatus: varchar("toStatus", { length: 50 }).notNull(),
  comments: text("comments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MaterialApproval = typeof materialApprovals.$inferSelect;
export type InsertMaterialApproval = typeof materialApprovals.$inferInsert;

/**
 * Cotações de fornecedores para materiais
 */
export const materialQuotations = mysqlTable("material_quotations", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("materialId").notNull(),
  supplier: varchar("supplier", { length: 255 }).notNull(),
  quotedPrice: int("quotedPrice").notNull(), // Preço em centavos
  deliveryTime: varchar("deliveryTime", { length: 100 }), // Prazo de entrega
  paymentTerms: varchar("paymentTerms", { length: 255 }), // Condições de pagamento
  notes: text("notes"),
  isRecommended: int("isRecommended").default(0).notNull(), // 1 = recomendada, 0 = não
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaterialQuotation = typeof materialQuotations.$inferSelect;
export type InsertMaterialQuotation = typeof materialQuotations.$inferInsert;

/**
 * Tokens de recuperação de senha
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: int("used").default(0).notNull(), // 0 = não usado, 1 = usado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
