import { eq, and, isNotNull, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, phaseSchedule, InsertPhaseSchedule, phaseActivities, InsertPhaseActivity, phaseSubtasks, InsertPhaseSubtask, machines, settings, quotes, materials, quoteItems, clients, projects, teamMembers, projectTeamMembers, taskComments, InsertTaskComment, InsertMachine, InsertSettings, InsertQuote, InsertMaterial, InsertQuoteItem, InsertClient, InsertProject, InsertTeamMember, InsertProjectTeamMember } from "./drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _connection: mysql.Connection | null = null;

export async function getDb() {
  // Verificar se DATABASE_URL está configurado
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("[Database] DATABASE_URL não está configurado no .env");
    return null;
  }

  if (!_db) {
    try {
      console.log("[Database] Tentando conectar ao banco de dados...");
      console.log("[Database] DATABASE_URL:", databaseUrl.replace(/:[^:@]+@/, ":****@"));
      
      // Criar conexão MySQL2
      _connection = await mysql.createConnection(databaseUrl);
      
      // Testar a conexão
      await _connection.ping();
      console.log("[Database] ✅ Conexão estabelecida com sucesso!");
      
      // Criar instância do Drizzle
      _db = drizzle(_connection);
      
    } catch (error: any) {
      console.error("[Database] ❌ Erro ao conectar ao banco de dados:", error.message);
      console.error("[Database] Detalhes:", error);
      _db = null;
      _connection = null;
    }
  }
  
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
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
    const values: InsertUser = {
      openId: user.openId,
      email: user.email, // Email obrigatório
      authType: user.authType || 'oauth',
    };
    const updateSet: Record<string, unknown> = {};

    // Campos opcionais
    if (user.name !== undefined) {
      values.name = user.name;
      updateSet.name = user.name;
    }
    
    if (user.loginMethod !== undefined) {
      values.loginMethod = user.loginMethod;
      updateSet.loginMethod = user.loginMethod;
    }
    
    if (user.email !== undefined) {
      updateSet.email = user.email;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== MACHINES =====

export async function getMachinesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(machines).where(eq(machines.userId, userId)).orderBy(desc(machines.createdAt));
}

export async function getMachineById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(machines).where(eq(machines.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMachine(machine: InsertMachine) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(machines).values(machine);
}

export async function updateMachine(id: number, machine: Partial<InsertMachine>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(machines).set(machine).where(eq(machines.id, id));
}

export async function deleteMachine(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(machines).where(eq(machines.id, id));
}

// ===== SETTINGS =====

export async function getSettingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSettings(settingsData: InsertSettings) {
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
      updatedAt: new Date(),
    }
  });
}

// ===== QUOTES =====

export async function createQuote(quote: InsertQuote): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Inserir o orçamento
    const result = await db.insert(quotes).values(quote);
    
    // Para mysql2, o resultado tem a estrutura: [ResultSetHeader, FieldPacket[]]
    // O insertId está em result[0].insertId
    const insertId = (result as any)[0]?.insertId;
    
    console.error('[CRITICAL DEBUG] Insert result:', JSON.stringify(result));
    console.error('[CRITICAL DEBUG] insertId extracted:', insertId, 'type:', typeof insertId);
    
    if (!insertId || typeof insertId !== 'number') {
      console.error('[CRITICAL ERROR] Failed to extract insertId from result:', result);
      throw new Error(`Failed to get inserted quote ID. insertId: ${insertId}`);
    }
    
    return insertId;
  } catch (error) {
    console.error('[CRITICAL ERROR] createQuote failed:', error);
    throw error;
  }
}

export async function getQuotesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(quotes).where(eq(quotes.userId, userId)).orderBy(desc(quotes.createdAt));
}

export async function getQuoteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateQuote(id: number, data: Partial<InsertQuote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(quotes)
    .set(data)
    .where(eq(quotes.id, id));
}

export async function deleteQuote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deletar itens primeiro
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
  // Depois deletar o orçamento
  return await db.delete(quotes).where(eq(quotes.id, id));
}

export async function approveQuote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(quotes)
    .set({ status: "aprovado" })
    .where(eq(quotes.id, id));
}

export async function getTotalQuotesValue(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allQuotes = await db.select()
    .from(quotes)
    .where(eq(quotes.userId, userId));
  
  const total = allQuotes.reduce((sum, quote) => sum + quote.finalPrice, 0);
  return total;
}

export async function getTotalApprovedQuotesValue(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const approvedQuotes = await db.select()
    .from(quotes)
    .where(and(eq(quotes.userId, userId), eq(quotes.status, "aprovado")));
  
  const total = approvedQuotes.reduce((sum, quote) => sum + quote.finalPrice, 0);
  return total;
}

export async function getMonthlyApprovedQuotesValue(userId: number): Promise<Array<{ month: string; value: number }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const approvedQuotes = await db.select()
    .from(quotes)
    .where(and(eq(quotes.userId, userId), eq(quotes.status, "aprovado")))
    .orderBy(quotes.createdAt);
  
  // Agrupar por mês
  const monthlyData: Record<string, number> = {};
  
  approvedQuotes.forEach(quote => {
    const date = new Date(quote.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey] += quote.finalPrice;
  });
  
  // Converter para array e ordenar
  const result = Object.entries(monthlyData)
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  return result;
}

export async function getQuotesByStatus(userId: number): Promise<{ pendentes: number; aprovados: number; rejeitados: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allQuotes = await db.select()
    .from(quotes)
    .where(eq(quotes.userId, userId));
  
  const pendentes = allQuotes.filter(q => q.status === "pendente").length;
  const aprovados = allQuotes.filter(q => q.status === "aprovado").length;
  const rejeitados = allQuotes.filter(q => q.status === "rejeitado").length;
  
  return { pendentes, aprovados, rejeitados };
}

// ===== QUOTE ITEMS =====

export async function createQuoteItem(item: InsertQuoteItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.error('[CRITICAL DEBUG] createQuoteItem - Received item:', JSON.stringify(item, null, 2));
  console.error('[CRITICAL DEBUG] createQuoteItem - quoteId:', item.quoteId, 'type:', typeof item.quoteId);
  
  if (!item.quoteId || typeof item.quoteId !== 'number') {
    throw new Error(`Invalid quoteId in createQuoteItem: ${item.quoteId} (type: ${typeof item.quoteId})`);
  }
  
  const result = await db.insert(quoteItems).values(item);
  console.error('[CRITICAL DEBUG] createQuoteItem - Insert successful');
  return result;
}

export async function getQuoteItemsByQuoteId(quoteId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
}

export async function updateQuoteItem(id: number, data: Partial<InsertQuoteItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(quoteItems)
    .set(data)
    .where(eq(quoteItems.id, id));
}

export async function deleteQuoteItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(quoteItems).where(eq(quoteItems.id, id));
}

// ===== MATERIALS =====

export async function getMaterialsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(materials).where(eq(materials.userId, userId)).orderBy(desc(materials.createdAt));
}

export async function getMaterialById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createMaterial(material: InsertMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(materials).values(material);
}

export async function updateMaterial(id: number, material: Partial<InsertMaterial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(materials).set(material).where(eq(materials.id, id));
}

export async function deleteMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(materials).where(eq(materials.id, id));
}

// ==================== CLIENTS ====================

export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(clients).values(client).$returningId();
  return result[0].id;
}

export async function getClientsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(clients).where(eq(clients.id, id));
}

export async function getClientByName(userId: number, name: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients).where(
    and(eq(clients.userId, userId), eq(clients.name, name))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== PROJECTS ====================

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(project).$returningId();
  const projectId = result[0].id;
  
  // Criar atividades automáticas para cada fase do roadmap
  await createDefaultPhaseActivities(projectId, project.startDate, project.endDate);
  
  return projectId;
}

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  
  // Retornar todos os projetos para que todos os colaboradores possam visualizá-los
  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

// Mantida para compatibilidade, mas agora retorna todos os projetos
export async function getProjectsByUserId(userId: number) {
  return await getAllProjects();
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function updateProjectPhase(id: number, phase: "planejamento" | "desenvolvimento" | "testes" | "entrega" | "finalizado") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set({ phase }).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Deletar membros da equipe primeiro
  await db.delete(projectTeamMembers).where(eq(projectTeamMembers.projectId, id));
  // Depois deletar o projeto
  await db.delete(projects).where(eq(projects.id, id));
}

// ==================== PROJECT TEAM MEMBERS ====================

export async function addTeamMemberToProject(projectId: number, teamMemberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(projectTeamMembers).values({ projectId, teamMemberId });
}

export async function removeTeamMemberFromProject(projectId: number, teamMemberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectTeamMembers)
    .where(and(
      eq(projectTeamMembers.projectId, projectId),
      eq(projectTeamMembers.teamMemberId, teamMemberId)
    ));
}

export async function getProjectTeamMembers(projectId: number) {
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
    status: teamMembers.status,
  })
  .from(projectTeamMembers)
  .innerJoin(teamMembers, eq(projectTeamMembers.teamMemberId, teamMembers.id))
  .where(eq(projectTeamMembers.projectId, projectId));
  
  return result;
}

export async function setProjectTeamMembers(projectId: number, teamMemberIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remover todos os membros atuais
  await db.delete(projectTeamMembers).where(eq(projectTeamMembers.projectId, projectId));
  
  // Adicionar novos membros
  if (teamMemberIds.length > 0) {
    await db.insert(projectTeamMembers).values(
      teamMemberIds.map(teamMemberId => ({ projectId, teamMemberId }))
    );
  }
}

// ==================== TEAM MEMBERS ====================

export async function createTeamMember(member: InsertTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(teamMembers).values(member).$returningId();
  return result[0].id;
}

export async function getTeamMembersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(teamMembers).where(eq(teamMembers.userId, userId)).orderBy(desc(teamMembers.createdAt));
}

export async function getAllTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(teamMembers).orderBy(desc(teamMembers.createdAt));
}

export async function getTeamMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserHierarchyLevel(userEmail: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Buscar colaborador pelo email do usuário logado
  const result = await db.select().from(teamMembers).where(eq(teamMembers.email, userEmail)).limit(1);
  
  if (result.length === 0) return null;
  return result[0].hierarchyLevel || null;
}

export async function updateTeamMember(id: number, data: Partial<InsertTeamMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(teamMembers).set(data).where(eq(teamMembers.id, id));
}

export async function deleteTeamMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
}

export async function getActiveTeamMembers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Retornar todos os membros ativos, independente de quem os criou
  return await db.select().from(teamMembers).where(
    eq(teamMembers.status, "ativo")
  ).orderBy(teamMembers.name);
}


// ==================== PHASE SCHEDULE ====================

export async function createPhaseSchedule(schedule: InsertPhaseSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(phaseSchedule).values(schedule).$returningId();
  return result[0].id;
}

export async function getPhaseScheduleByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(phaseSchedule).where(eq(phaseSchedule.projectId, projectId));
}

export async function updatePhaseSchedule(id: number, data: Partial<InsertPhaseSchedule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(phaseSchedule).set(data).where(eq(phaseSchedule.id, id));
}

export async function deletePhaseSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(phaseSchedule).where(eq(phaseSchedule.id, id));
}

export async function setProjectPhaseSchedule(projectId: number, schedules: Array<{ phase: string; startDate?: Date; endDate?: Date }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remove cronogramas existentes
  await db.delete(phaseSchedule).where(eq(phaseSchedule.projectId, projectId));
  
  // Insere novos cronogramas
  if (schedules.length > 0) {
    await db.insert(phaseSchedule).values(
      schedules.map(s => ({
        projectId,
        phase: s.phase as "planejamento" | "desenvolvimento" | "testes" | "entrega" | "finalizado",
        startDate: s.startDate,
        endDate: s.endDate,
      }))
    );
  }
}


// ==================== PHASE ACTIVITIES ====================

// Função auxiliar para criar atividades padrão do roadmap
export async function createDefaultPhaseActivities(
  projectId: number, 
  startDate: Date | null | undefined, 
  endDate: Date | null | undefined
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Se não houver datas, não criar atividades
  if (!startDate || !endDate) return;
  
  const phases = [
    { name: "Planejamento", phase: "planejamento" },
    { name: "Desenvolvimento", phase: "desenvolvimento" },
    { name: "Testes", phase: "testes" },
    { name: "Entrega", phase: "entrega" },
    { name: "Finalizado", phase: "finalizado" },
  ];
  
  // Calcular duração total do projeto em dias
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysPerPhase = Math.ceil(totalDays / phases.length);
  
  // Criar uma atividade para cada fase
  for (let i = 0; i < phases.length; i++) {
    const phaseStartDate = new Date(startDate);
    phaseStartDate.setDate(phaseStartDate.getDate() + (i * daysPerPhase));
    
    const phaseEndDate = new Date(startDate);
    phaseEndDate.setDate(phaseEndDate.getDate() + ((i + 1) * daysPerPhase) - 1);
    
    // Última fase termina na data final do projeto
    if (i === phases.length - 1) {
      phaseEndDate.setTime(endDate.getTime());
    }
    
    await db.insert(phaseActivities).values({
      projectId,
      phase: phases[i].phase as any,
      name: phases[i].name,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      completed: 0,
      progress: 0,
      order: i,
    });
  }
}

export async function createPhaseActivity(activity: InsertPhaseActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(phaseActivities).values(activity).$returningId();
  return result[0].id;
}

export async function getPhaseActivitiesByProjectAndPhase(projectId: number, phase: string) {
  const db = await getDb();
  if (!db) return [];
  
  const activities = await db.select().from(phaseActivities).where(
    and(eq(phaseActivities.projectId, projectId), eq(phaseActivities.phase, phase as any))
  ).orderBy(phaseActivities.order);
  
  // Buscar informações dos responsáveis da tabela team_members
  const activitiesWithAssignee = await Promise.all(activities.map(async (activity) => {
    if (activity.assignedTo) {
      const assignee = await db.select({
        id: teamMembers.id,
        name: teamMembers.name,
        email: teamMembers.email,
      }).from(teamMembers).where(eq(teamMembers.id, activity.assignedTo)).limit(1);
      
      return {
        ...activity,
        assignee: assignee.length > 0 ? assignee[0] : null,
      };
    }
    return {
      ...activity,
      assignee: null,
    };
  }));
  
  return activitiesWithAssignee;
}

export async function updatePhaseActivity(id: number, data: Partial<InsertPhaseActivity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(phaseActivities).set(data).where(eq(phaseActivities.id, id));
}

export async function updatePhaseActivityDates(id: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(phaseActivities).set({ startDate, endDate }).where(eq(phaseActivities.id, id));
}

export async function togglePhaseActivityCompleted(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar atividade atual
  const result = await db.select().from(phaseActivities).where(eq(phaseActivities.id, id)).limit(1);
  if (result.length === 0) throw new Error("Activity not found");
  
  const currentCompleted = result[0].completed;
  const newCompleted = currentCompleted === 1 ? 0 : 1;
  
  await db.update(phaseActivities).set({ completed: newCompleted }).where(eq(phaseActivities.id, id));
}

export async function deletePhaseActivity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(phaseActivities).where(eq(phaseActivities.id, id));
}

export async function reorderPhaseActivities(updates: Array<{ id: number; order: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Atualizar ordem de cada atividade
  for (const update of updates) {
    await db.update(phaseActivities)
      .set({ order: update.order })
      .where(eq(phaseActivities.id, update.id));
  }
}


// ==================== PHASE SUBTASKS ====================

export async function createPhaseSubtask(subtask: InsertPhaseSubtask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(phaseSubtasks).values(subtask).$returningId();
  const newSubtaskId = result[0].id;
  
  // Recalcular datas da atividade principal baseada nas subtarefas
  await recalculateActivityDatesFromSubtasks(subtask.activityId);
  
  return newSubtaskId;
}

export async function getPhaseSubtasksByActivity(activityId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const subtasks = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activityId));
  
  // Buscar informações dos responsáveis da tabela team_members
  const subtasksWithAssignee = await Promise.all(subtasks.map(async (subtask) => {
    if (subtask.assignedTo) {
      const assignee = await db.select({
        id: teamMembers.id,
        name: teamMembers.name,
        email: teamMembers.email,
      }).from(teamMembers).where(eq(teamMembers.id, subtask.assignedTo)).limit(1);
      
      return {
        ...subtask,
        assignee: assignee.length > 0 ? assignee[0] : null,
      };
    }
    return {
      ...subtask,
      assignee: null,
    };
  }));
  
  return subtasksWithAssignee;
}

export async function updatePhaseSubtask(id: number, data: Partial<InsertPhaseSubtask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(phaseSubtasks).set(data).where(eq(phaseSubtasks.id, id));
}

export async function updatePhaseSubtaskAssignee(id: number, assignedTo: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log('[UPDATE SUBTASK ASSIGNEE] ID:', id, 'AssignedTo:', assignedTo);
  await db.update(phaseSubtasks).set({ assignedTo }).where(eq(phaseSubtasks.id, id));
  console.log('[UPDATE SUBTASK ASSIGNEE] Atualizado com sucesso');
}

export async function updatePhaseSubtaskDates(id: number, startDate: Date | null, endDate: Date | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar subtarefa para pegar o activityId
  const result = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.id, id)).limit(1);
  if (result.length === 0) throw new Error("Subtask not found");
  
  const activityId = result[0].activityId;
  
  // Atualizar datas da subtarefa
  await db.update(phaseSubtasks).set({ startDate, endDate }).where(eq(phaseSubtasks.id, id));
  
  // Recalcular datas da atividade principal baseada nas subtarefas
  await recalculateActivityDatesFromSubtasks(activityId);
}

/**
 * Recalcula as datas da atividade principal baseada nas datas das subtarefas
 * Data inicial = menor data inicial das subtarefas
 * Data final = maior data final das subtarefas
 */
export async function recalculateActivityDatesFromSubtasks(activityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar todas as subtarefas da atividade
  const subtasks = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activityId));
  
  // Se não há subtarefas, não faz nada
  if (subtasks.length === 0) {
    console.log('[RECALCULATE DATES] Nenhuma subtarefa encontrada para atividade', activityId);
    return;
  }
  
  // Filtrar subtarefas que têm datas definidas
  const subtasksWithDates = subtasks.filter(st => st.startDate && st.endDate);
  
  // Se nenhuma subtarefa tem datas, não faz nada
  if (subtasksWithDates.length === 0) {
    console.log('[RECALCULATE DATES] Nenhuma subtarefa com datas definidas para atividade', activityId);
    return;
  }
  
  // Encontrar menor data inicial e maior data final
  const minStartDate = new Date(Math.min(...subtasksWithDates.map(st => st.startDate!.getTime())));
  const maxEndDate = new Date(Math.max(...subtasksWithDates.map(st => st.endDate!.getTime())));
  
  console.log('[RECALCULATE DATES] Atividade', activityId, '- Nova data inicial:', minStartDate, '- Nova data final:', maxEndDate);
  
  // Atualizar atividade com as novas datas
  await db.update(phaseActivities).set({ 
    startDate: minStartDate,
    endDate: maxEndDate
  }).where(eq(phaseActivities.id, activityId));
  
  console.log('[RECALCULATE DATES] Datas da atividade atualizadas com sucesso');
}

export async function togglePhaseSubtaskCompleted(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar subtarefa atual
  const result = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.id, id)).limit(1);
  if (result.length === 0) throw new Error("Subtask not found");
  
  const subtask = result[0];
  const currentCompleted = subtask.completed;
  const newCompleted = currentCompleted === 1 ? 0 : 1;
  
  // Atualizar subtarefa
  await db.update(phaseSubtasks).set({ completed: newCompleted }).where(eq(phaseSubtasks.id, id));
  
  // Recalcular progresso da atividade pai
  const activityId = subtask.activityId;
  const allSubtasks = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activityId));
  
  if (allSubtasks.length > 0) {
    const completedCount = allSubtasks.filter(st => st.id === id ? newCompleted === 1 : st.completed === 1).length;
    const totalCount = allSubtasks.length;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);
    
    // Atualizar atividade com progresso e status de conclusão
    const allCompleted = progressPercentage === 100 ? 1 : 0;
    await db.update(phaseActivities).set({ 
      completed: allCompleted,
      progress: progressPercentage 
    }).where(eq(phaseActivities.id, activityId));
    
    // Verificar se deve avançar fase automaticamente
    const activity = await db.select().from(phaseActivities).where(eq(phaseActivities.id, activityId)).limit(1);
    if (activity.length > 0) {
      await checkAndAdvancePhase(activity[0].projectId, activity[0].phase);
    }
  }
}

export async function deletePhaseSubtask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar subtarefa antes de deletar para pegar o activityId
  const result = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.id, id)).limit(1);
  if (result.length === 0) throw new Error("Subtask not found");
  
  const activityId = result[0].activityId;
  
  // Deletar subtarefa
  await db.delete(phaseSubtasks).where(eq(phaseSubtasks.id, id));
  
  // Recalcular progresso da atividade pai
  const remainingSubtasks = await db.select().from(phaseSubtasks).where(eq(phaseSubtasks.activityId, activityId));
  
  if (remainingSubtasks.length > 0) {
    const completedCount = remainingSubtasks.filter(st => st.completed === 1).length;
    const totalCount = remainingSubtasks.length;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);
    
    const allCompleted = progressPercentage === 100 ? 1 : 0;
    await db.update(phaseActivities).set({ 
      completed: allCompleted,
      progress: progressPercentage 
    }).where(eq(phaseActivities.id, activityId));
  } else {
    // Se não há mais subtarefas, resetar atividade para pendente com progresso 0
    await db.update(phaseActivities).set({ 
      completed: 0,
      progress: 0 
    }).where(eq(phaseActivities.id, activityId));
  }
  
  // Recalcular datas da atividade principal baseada nas subtarefas restantes
  await recalculateActivityDatesFromSubtasks(activityId);
}

// ==================== AUTO PHASE ADVANCEMENT ====================

/**
 * Verifica se todas as atividades de uma fase estão concluídas
 * e avança automaticamente para a próxima fase se aplicável
 */
export async function checkAndAdvancePhase(projectId: number, currentPhase: "planejamento" | "desenvolvimento" | "testes" | "entrega" | "finalizado") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar todas as atividades da fase atual
  const activities = await db.select()
    .from(phaseActivities)
    .where(
      and(
        eq(phaseActivities.projectId, projectId),
        eq(phaseActivities.phase, currentPhase)
      )
    );
  
  // Se não há atividades, não avançar
  if (activities.length === 0) return false;
  
  // Verificar se todas as atividades estão concluídas (100% de progresso)
  const allCompleted = activities.every(activity => activity.progress === 100);
  
  if (!allCompleted) return false;
  
  // Mapear fases para ordem sequencial
  const phaseOrder: Array<"planejamento" | "desenvolvimento" | "testes" | "entrega" | "finalizado"> = 
    ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  
  // Se já está na última fase ou fase não encontrada, não avançar
  if (currentIndex === -1 || currentIndex >= phaseOrder.length - 1) return false;
  
  // Avançar para próxima fase
  const nextPhase = phaseOrder[currentIndex + 1];
  await db.update(projects).set({ phase: nextPhase }).where(eq(projects.id, projectId));
  
  return true;
}

// ==================== CRONOGRAMA EXPORT ====================

/**
 * Busca dados completos do cronograma do projeto para exportação
 * Retorna todas as fases com suas atividades e subtarefas
 */
export async function getProjectScheduleForExport(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar informações do projeto
  const projectData = await db.select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  
  if (projectData.length === 0) {
    throw new Error("Project not found");
  }
  
  const project = projectData[0];
  
  // Definir todas as fases
  const phases: Array<"planejamento" | "desenvolvimento" | "testes" | "entrega" | "finalizado"> = 
    ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"];
  
  // Buscar atividades e subtarefas para cada fase
  const scheduleData = await Promise.all(
    phases.map(async (phase) => {
      // Buscar atividades da fase ordenadas por order
      const activities = await db.select()
        .from(phaseActivities)
        .where(
          and(
            eq(phaseActivities.projectId, projectId),
            eq(phaseActivities.phase, phase)
          )
        )
        .orderBy(asc(phaseActivities.order));
      
      // Para cada atividade, buscar suas subtarefas
      const activitiesWithSubtasks = await Promise.all(
        activities.map(async (activity) => {
          const subtasks = await db.select()
            .from(phaseSubtasks)
            .where(eq(phaseSubtasks.activityId, activity.id))
            .orderBy(asc(phaseSubtasks.id));
          
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

// Buscar todas as atividades e subtarefas atribuídas a cada colaborador
export async function getAllTasksByTeamMember() {
  const db = await getDb();
  if (!db) return [];

  // Buscar todos os colaboradores
  const members = await db.select().from(teamMembers);

  // Para cada colaborador, buscar atividades e subtarefas atribuídas
  const membersWithTasks = await Promise.all(members.map(async (member) => {
    // Buscar atividades atribuídas ao colaborador
    const activities = await db.select({
      id: phaseActivities.id,
      name: phaseActivities.name,
      startDate: phaseActivities.startDate,
      endDate: phaseActivities.endDate,
      completed: phaseActivities.completed,
      projectId: phaseActivities.projectId,
      phase: phaseActivities.phase,
      order: phaseActivities.order,
    }).from(phaseActivities)
      .where(eq(phaseActivities.assignedTo, member.id))
      .orderBy(phaseActivities.order);

    // Buscar subtarefas atribuídas ao colaborador
    const subtasks = await db.select({
      id: phaseSubtasks.id,
      name: phaseSubtasks.name,
      startDate: phaseSubtasks.startDate,
      endDate: phaseSubtasks.endDate,
      completed: phaseSubtasks.completed,
      activityId: phaseSubtasks.activityId,
      order: phaseSubtasks.order,
    }).from(phaseSubtasks)
      .where(eq(phaseSubtasks.assignedTo, member.id))
      .orderBy(phaseSubtasks.order);

    // Para cada atividade e subtarefa, buscar informações do projeto
    const activitiesWithProject = await Promise.all(activities.map(async (activity) => {
      const project = await db.select({
        id: projects.id,
        name: projects.name,
      }).from(projects).where(eq(projects.id, activity.projectId)).limit(1);

      return {
        ...activity,
        project: project.length > 0 ? project[0] : null,
        type: 'activity' as const,
      };
    }));

    const subtasksWithActivity = await Promise.all(subtasks.map(async (subtask) => {
      const activity = await db.select({
        id: phaseActivities.id,
        name: phaseActivities.name,
        projectId: phaseActivities.projectId,
        phase: phaseActivities.phase,
      }).from(phaseActivities).where(eq(phaseActivities.id, subtask.activityId)).limit(1);

      if (activity.length > 0) {
        const project = await db.select({
          id: projects.id,
          name: projects.name,
        }).from(projects).where(eq(projects.id, activity[0].projectId)).limit(1);

        return {
          ...subtask,
          activity: activity[0],
          project: project.length > 0 ? project[0] : null,
          type: 'subtask' as const,
        };
      }

      return {
        ...subtask,
        activity: null,
        project: null,
        type: 'subtask' as const,
      };
    }));

    return {
      member,
      activities: activitiesWithProject,
      subtasks: subtasksWithActivity,
      totalTasks: activitiesWithProject.length + subtasksWithActivity.length,
    };
  }));

  return membersWithTasks;
}

// Task Comments
export async function createTaskComment(data: InsertTaskComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(taskComments).values(data);
}

export async function getTaskComments(taskType: 'activity' | 'subtask', taskId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const comments = await db.select().from(taskComments)
    .where(and(eq(taskComments.taskType, taskType), eq(taskComments.taskId, taskId)))
    .orderBy(taskComments.createdAt);
  
  // Buscar informações dos criadores
  const commentsWithCreator = await Promise.all(comments.map(async (comment) => {
    const creator = await db.select({
      id: teamMembers.id,
      name: teamMembers.name,
    }).from(teamMembers).where(eq(teamMembers.id, comment.createdBy)).limit(1);
    
    return {
      ...comment,
      creator: creator.length > 0 ? creator[0] : null,
    };
  }));
  
  return commentsWithCreator;
}

// Marcar múltiplas tarefas como concluídas
export async function completeMultipleTasks(tasks: Array<{ type: 'activity' | 'subtask', id: number }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  
  for (const task of tasks) {
    if (task.type === 'activity') {
      await db.update(phaseActivities).set({ completed: 1, completedAt: now }).where(eq(phaseActivities.id, task.id));
    } else {
      await db.update(phaseSubtasks).set({ completed: 1, completedAt: now }).where(eq(phaseSubtasks.id, task.id));
    }
  }
}


// Reordenar tarefas de um colaborador
export async function reorderMemberTasks(memberId: number, taskOrders: Array<{ type: 'activity' | 'subtask', id: number, order: number }>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot reorder tasks: database not available");
    return;
  }

  try {
    // Atualizar ordem de cada tarefa
    for (const task of taskOrders) {
      if (task.type === 'activity') {
        await db.update(phaseActivities)
          .set({ order: task.order })
          .where(eq(phaseActivities.id, task.id));
      } else {
        await db.update(phaseSubtasks)
          .set({ order: task.order })
          .where(eq(phaseSubtasks.id, task.id));
      }
    }
  } catch (error) {
    console.error("[Database] Failed to reorder tasks:", error);
    throw error;
  }
}

// Função para calcular dados do Burndown Chart de um projeto
export async function getBurndownChartData(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  // Buscar informações do projeto (data início e fim)
  const projectData = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (projectData.length === 0) return null;
  
  const project = projectData[0];
  if (!project.startDate || !project.endDate) {
    return null; // Projeto precisa ter datas definidas
  }

  // Buscar todas as atividades e subtarefas do projeto
  const activities = await db.select().from(phaseActivities).where(eq(phaseActivities.projectId, projectId));
  const subtasks = await db.select({
    id: phaseSubtasks.id,
    activityId: phaseSubtasks.activityId,
    name: phaseSubtasks.name,
    completed: phaseSubtasks.completed,
    completedAt: phaseSubtasks.completedAt,
    createdAt: phaseSubtasks.createdAt,
  }).from(phaseSubtasks)
    .innerJoin(phaseActivities, eq(phaseSubtasks.activityId, phaseActivities.id))
    .where(eq(phaseActivities.projectId, projectId));

  // Total de tarefas (atividades + subtarefas)
  const totalTasks = activities.length + subtasks.length;

  // Criar histórico de conclusões por data
  const completionHistory: { [date: string]: number } = {};

  // Processar atividades concluídas
  for (const activity of activities) {
    if (activity.completed === 1 && activity.completedAt) {
      const dateKey = activity.completedAt.toISOString().split('T')[0];
      completionHistory[dateKey] = (completionHistory[dateKey] || 0) + 1;
    }
  }

  // Processar subtarefas concluídas
  for (const subtask of subtasks) {
    if (subtask.completed === 1 && subtask.completedAt) {
      const dateKey = subtask.completedAt.toISOString().split('T')[0];
      completionHistory[dateKey] = (completionHistory[dateKey] || 0) + 1;
    }
  }

  // Gerar array de datas do início ao fim do projeto
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const dates: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calcular linha ideal (decremento linear)
  const totalDays = dates.length;
  const taskDecreasePerDay = totalTasks / totalDays;

  // Calcular dados do gráfico
  let remainingTasksReal = totalTasks;
  const chartData = dates.map((date, index) => {
    // Linha ideal
    const idealRemaining = Math.max(0, totalTasks - (taskDecreasePerDay * (index + 1)));

    // Linha real (subtrair tarefas concluídas até esta data)
    if (completionHistory[date]) {
      remainingTasksReal -= completionHistory[date];
    }

    return {
      date,
      ideal: Math.round(idealRemaining),
      real: Math.max(0, remainingTasksReal),
    };
  });

  return {
    projectName: project.name,
    startDate: project.startDate,
    endDate: project.endDate,
    totalTasks,
    chartData,
  };
}


// ==================== PROJECT MATERIALS ====================

export async function getMaterialsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { projectMaterials, materialQuotations } = await import("./drizzle/schema");
  
  // Buscar materiais com cotação recomendada (se houver)
  const materials = await db
    .select({
      id: projectMaterials.id,
      projectId: projectMaterials.projectId,
      itemName: projectMaterials.itemName,
      quantity: projectMaterials.quantity,
      unit: projectMaterials.unit,
      unitPrice: projectMaterials.unitPrice,
      supplier: projectMaterials.supplier,
      notes: projectMaterials.notes,
      imageUrl: projectMaterials.imageUrl,
      approvalStatus: projectMaterials.approvalStatus,
      createdAt: projectMaterials.createdAt,
      updatedAt: projectMaterials.updatedAt,
      recommendedSupplier: materialQuotations.supplier,
      recommendedPrice: materialQuotations.quotedPrice,
      purchaseDate: projectMaterials.purchaseDate,
      expectedDeliveryDate: projectMaterials.expectedDeliveryDate,
      receivedDate: projectMaterials.receivedDate,
      receivedBy: projectMaterials.receivedBy,
      requestingSector: projectMaterials.requestingSector,
    })
    .from(projectMaterials)
    .leftJoin(
      materialQuotations,
      and(
        eq(materialQuotations.materialId, projectMaterials.id),
        eq(materialQuotations.isRecommended, 1)
      )
    )
    .where(eq(projectMaterials.projectId, projectId));
  
  return materials;
}

export async function addProjectMaterial(data: {
  projectId: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  supplier?: string;
  notes?: string;
  imageUrl?: string;
  requestingSector: "Software" | "Hardware" | "Mecânica" | "Automação" | "Administrativo";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { projectMaterials } = await import("./drizzle/schema");
  const result = await db.insert(projectMaterials).values(data);
  return result;
}

export async function updateProjectMaterial(id: number, data: {
  itemName?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  supplier?: string;
  notes?: string;
  imageUrl?: string;
  requestingSector?: "Software" | "Hardware" | "Mecânica" | "Automação" | "Administrativo";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { projectMaterials } = await import("./drizzle/schema");
  await db.update(projectMaterials).set(data).where(eq(projectMaterials.id, id));
}

export async function deleteProjectMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { projectMaterials } = await import("./drizzle/schema");
  await db.delete(projectMaterials).where(eq(projectMaterials.id, id));
}


// ==================== Material Approvals ====================

export async function approveMaterial(data: {
  materialId: number;
  approverUserId: number;
  approverName: string;
  approverRole: string;
  comments?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { projectMaterials, materialApprovals } = await import("./drizzle/schema");
  
  // Buscar material atual
  const material = await db.select().from(projectMaterials).where(eq(projectMaterials.id, data.materialId)).limit(1);
  if (material.length === 0) throw new Error("Material not found");
  
  const currentStatus = material[0].approvalStatus;
  
  // Mapear status atual para o nível hierárquico necessário
  const requiredLevel: Record<string, string> = {
    "pending": "lider",      // Apenas líder pode aprovar
    "leader": "gerente",     // Apenas gerente pode aprovar
    "manager": "comprador",  // Apenas comprador pode fazer cotação
    "quotation": "diretor",  // Apenas diretor pode aprovar
    "director": "financeiro", // Apenas financeiro pode aprovar
  };
  
  // Validar se o usuário tem permissão para aprovar neste status
  const required = requiredLevel[currentStatus];
  if (!required) throw new Error("Invalid approval flow");
  
  if (data.approverRole !== required) {
    throw new Error(`Apenas usuários com nível "${required}" podem aprovar nesta etapa. Status atual: ${currentStatus}`);
  }
  
  // Determinar próximo status baseado no papel do aprovador
  const statusFlow: Record<string, string> = {
    "pending": "leader",      // Líder aprova
    "leader": "manager",       // Gerente aprova
    "manager": "quotation",    // Vai para cotação
    "quotation": "director",   // Diretor aprova
    "director": "financial",   // Financeiro aprova
  };
  
  const nextStatus = statusFlow[currentStatus];
  if (!nextStatus) throw new Error("Invalid approval flow");
  
  // Atualizar status do material
  await db.update(projectMaterials)
    .set({ approvalStatus: nextStatus as any })
    .where(eq(projectMaterials.id, data.materialId));
  
  // Registrar no histórico
  await db.insert(materialApprovals).values({
    materialId: data.materialId,
    approverUserId: data.approverUserId,
    approverName: data.approverName,
    approverRole: data.approverRole,
    action: "approved",
    fromStatus: currentStatus,
    toStatus: nextStatus,
    comments: data.comments || null,
  });
  
  return { success: true, newStatus: nextStatus };
}

export async function rejectMaterial(data: {
  materialId: number;
  approverUserId: number;
  approverName: string;
  approverRole: string;
  comments: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { projectMaterials, materialApprovals } = await import("./drizzle/schema");
  
  // Buscar material atual
  const material = await db.select().from(projectMaterials).where(eq(projectMaterials.id, data.materialId)).limit(1);
  if (material.length === 0) throw new Error("Material not found");
  
  const currentStatus = material[0].approvalStatus;
  
  // Mapear status atual para o nível hierárquico necessário
  const requiredLevel: Record<string, string> = {
    "pending": "lider",      // Apenas líder pode rejeitar
    "leader": "gerente",     // Apenas gerente pode rejeitar
    "manager": "comprador",  // Apenas comprador pode rejeitar
    "quotation": "diretor",  // Apenas diretor pode rejeitar
    "director": "financeiro", // Apenas financeiro pode rejeitar
  };
  
  // Validar se o usuário tem permissão para rejeitar neste status
  const required = requiredLevel[currentStatus];
  if (!required) throw new Error("Invalid approval flow");
  
  if (data.approverRole !== required) {
    throw new Error(`Apenas usuários com nível "${required}" podem rejeitar nesta etapa. Status atual: ${currentStatus}`);
  }
  
  // Atualizar status para rejeitado
  await db.update(projectMaterials)
    .set({ approvalStatus: "rejected" as any })
    .where(eq(projectMaterials.id, data.materialId));
  
  // Registrar no histórico
  await db.insert(materialApprovals).values({
    materialId: data.materialId,
    approverUserId: data.approverUserId,
    approverName: data.approverName,
    approverRole: data.approverRole,
    action: "rejected",
    fromStatus: currentStatus,
    toStatus: "rejected",
    comments: data.comments,
  });
  
  return { success: true };
}

export async function addQuotationToMaterial(data: {
  materialId: number;
  quotationValue: number;
  quotationNotes: string;
  approverUserId: number;
  approverName: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { projectMaterials, materialApprovals } = await import("./drizzle/schema");
  
  // Buscar material atual
  const material = await db.select().from(projectMaterials).where(eq(projectMaterials.id, data.materialId)).limit(1);
  if (material.length === 0) throw new Error("Material not found");
  
  const currentStatus = material[0].approvalStatus;
  if (currentStatus !== "manager") throw new Error("Material must be in manager status to add quotation");
  
  // Atualizar material com cotação e avançar status
  await db.update(projectMaterials)
    .set({ 
      quotationValue: data.quotationValue,
      quotationNotes: data.quotationNotes,
      approvalStatus: "quotation" as any
    })
    .where(eq(projectMaterials.id, data.materialId));
  
  // Registrar no histórico
  await db.insert(materialApprovals).values({
    materialId: data.materialId,
    approverUserId: data.approverUserId,
    approverName: data.approverName,
    approverRole: "buyer",
    action: "approved",
    fromStatus: currentStatus,
    toStatus: "quotation",
    comments: `Cotação adicionada: R$ ${(data.quotationValue / 100).toFixed(2)}`,
  });
  
  return { success: true };
}

export async function getApprovalHistory(materialId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { materialApprovals } = await import("./drizzle/schema");
  return db.select()
    .from(materialApprovals)
    .where(eq(materialApprovals.materialId, materialId))
    .orderBy(materialApprovals.createdAt);
}


// ==================== MATERIAL QUOTATIONS ====================

export async function createMaterialQuotation(data: {
  materialId: number;
  supplier: string;
  quotedPrice: number;
  deliveryTime?: string;
  paymentTerms?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { materialQuotations } = await import("./drizzle/schema");
  const result = await db.insert(materialQuotations).values(data);
  return result;
}

export async function getMaterialQuotations(materialId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { materialQuotations } = await import("./drizzle/schema");
  return await db.select().from(materialQuotations).where(eq(materialQuotations.materialId, materialId));
}

export async function updateMaterialQuotation(id: number, data: {
  supplier?: string;
  quotedPrice?: number;
  deliveryTime?: string;
  paymentTerms?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { materialQuotations } = await import("./drizzle/schema");
  await db.update(materialQuotations).set(data).where(eq(materialQuotations.id, id));
}

export async function deleteMaterialQuotation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { materialQuotations } = await import("./drizzle/schema");
  await db.delete(materialQuotations).where(eq(materialQuotations.id, id));
}

export async function setRecommendedQuotation(materialId: number, quotationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { materialQuotations } = await import("./drizzle/schema");
  
  // Primeiro, remove a recomendação de todas as cotações deste material
  await db.update(materialQuotations)
    .set({ isRecommended: 0 })
    .where(eq(materialQuotations.materialId, materialId));
  
  // Depois, marca a cotação selecionada como recomendada
  await db.update(materialQuotations)
    .set({ isRecommended: 1 })
    .where(eq(materialQuotations.id, quotationId));
}


// ==================== PURCHASE AND RECEIVING ====================

export async function confirmPurchase(data: {
  materialId: number;
  expectedDeliveryDate: Date;
  buyerUserId: number;
  buyerName: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { projectMaterials, materialApprovals } = await import("./drizzle/schema");
  
  // Buscar material atual
  const material = await db.select().from(projectMaterials).where(eq(projectMaterials.id, data.materialId)).limit(1);
  if (material.length === 0) throw new Error("Material not found");
  
  const currentStatus = material[0].approvalStatus;
  
  // Validar que está no status "financial" (aprovado pelo financeiro)
  if (currentStatus !== "financial") {
    throw new Error("Material must be approved by financial before purchase");
  }
  
  // Atualizar material com dados da compra
  await db.update(projectMaterials)
    .set({ 
      approvalStatus: "purchased" as any,
      purchaseDate: new Date(),
      expectedDeliveryDate: data.expectedDeliveryDate,
    })
    .where(eq(projectMaterials.id, data.materialId));
  
  // Registrar no histórico
  await db.insert(materialApprovals).values({
    materialId: data.materialId,
    approverUserId: data.buyerUserId,
    approverName: data.buyerName,
    approverRole: "Comprador",
    action: "purchased",
    fromStatus: currentStatus,
    toStatus: "purchased",
    comments: `Compra realizada. Entrega prevista para ${data.expectedDeliveryDate.toLocaleDateString('pt-BR')}`,
  });
  
  return { success: true };
}

export async function confirmReceiving(data: {
  materialId: number;
  receivedBy: string;
  receiverUserId: number;
  receiverName: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { projectMaterials, materialApprovals } = await import("./drizzle/schema");
  
  // Buscar material atual
  const material = await db.select().from(projectMaterials).where(eq(projectMaterials.id, data.materialId)).limit(1);
  if (material.length === 0) throw new Error("Material not found");
  
  const currentStatus = material[0].approvalStatus;
  
  // Validar que está no status "purchased" (comprado, aguardando entrega)
  if (currentStatus !== "purchased") {
    throw new Error("Material must be purchased before receiving");
  }
  
  // Atualizar material com dados do recebimento
  await db.update(projectMaterials)
    .set({ 
      approvalStatus: "received" as any,
      receivedDate: new Date(),
      receivedBy: data.receivedBy,
    })
    .where(eq(projectMaterials.id, data.materialId));
  
  // Registrar no histórico
  await db.insert(materialApprovals).values({
    materialId: data.materialId,
    approverUserId: data.receiverUserId,
    approverName: data.receiverName,
    approverRole: "Recebedor",
    action: "received",
    fromStatus: currentStatus,
    toStatus: "received",
    comments: `Mercadoria recebida por ${data.receivedBy}`,
  });
  
  return { success: true };
}

// ===== AUTHENTICATION =====
import * as bcrypt from 'bcryptjs';

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
  level?: 'Dev' | 'Líder' | 'Gerente' | 'Financeiro' | 'Diretor' | 'Comprador';
  sector?: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Verificar se email já existe
  const existing = await getUserByEmail(data.email);
  if (existing) {
    throw new Error("Email já cadastrado");
  }

  // Hash da senha
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Verificar se é o primeiro usuário (será admin)
  const allUsers = await db.select().from(users);
  const isFirstUser = allUsers.length === 0;

  // Inserir usuário
  const [insertedUser] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: passwordHash,
    authType: 'local',
    role: data.role || (isFirstUser ? 'admin' : 'user'),
    level: data.level as any,
    sector: data.sector as any,
    lastSignedIn: new Date(),
  });

  // Obter o ID do usuário recém-criado
  const newUser = await getUserByEmail(data.email);
  if (!newUser) {
    throw new Error("Erro ao recuperar usuário recém-criado");
  }

  console.log('[REGISTER USER] Adicionando usuário à equipe:', {
    userId: newUser.id,
    name: data.name,
    email: data.email,
  });

  // Adicionar automaticamente à equipe de projetos
  try {
    await db.insert(teamMembers).values({
      userId: newUser.id,
      name: data.name,
      email: data.email,
      role: data.level || data.sector || 'Colaborador', // Usar level ou sector como cargo
      status: 'ativo',
      hireDate: new Date(),
    });
    console.log('[REGISTER USER] Usuário adicionado à equipe com sucesso');
  } catch (error) {
    console.error('[REGISTER USER] Erro ao adicionar usuário à equipe:', error);
    // Não lançar erro para não bloquear criação do usuário
  }

  return insertedUser;
}

export async function loginUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  
  if (!user) {
    throw new Error("Credenciais inválidas");
  }

  if (user.authType !== 'local' || !user.password) {
    throw new Error("Este usuário usa autenticação OAuth");
  }

  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    throw new Error("Credenciais inválidas");
  }

  // Atualizar lastSignedIn
  const db = await getDb();
  if (db) {
    await db.update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));
  }

  return user;
}


// ============================================
// Funções de Gerenciamento de Usuários (Admin)
// ============================================

export async function getAllUsers() {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  const result = await database
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      level: users.level,
      sector: users.sector,
      authType: users.authType,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(users.createdAt);

  return result;
}

export async function updateUser(userId: number, data: {
  name?: string;
  role?: typeof users.$inferSelect.role;
  level?: typeof users.$inferSelect.level;
  sector?: typeof users.$inferSelect.sector;
}) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  await database
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function resetUserPassword(userId: number, newPassword: string) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await database
    .update(users)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function deleteUser(userId: number) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  await database
    .delete(users)
    .where(eq(users.id, userId));

  return { success: true };
}


// ============================================
// Funções de Recuperação de Senha
// ============================================

import { passwordResetTokens, InsertPasswordResetToken } from "./drizzle/schema";
import crypto from "crypto";
import { sendPasswordResetEmail } from "./email";

export async function createPasswordResetToken(email: string) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  // Buscar usuário pelo email
  const userResult = await database
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("Usuário não encontrado");
  }

  const user = userResult[0];

  // Gerar token único
  const token = crypto.randomBytes(32).toString('hex');
  
  // Token expira em 1 hora
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Salvar token no banco
  await database.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
    used: 0,
  });

  // Enviar email com link de recuperação
  const emailResult = await sendPasswordResetEmail(user.email, token, user.name || undefined);
  
  if (!emailResult.success) {
    console.error('[Password Reset] Erro ao enviar email:', emailResult.message);
    // Não lançar erro - token foi criado, apenas email falhou
    // Em produção, você pode querer lançar erro aqui
  }

  return { 
    token: emailResult.success ? undefined : token, // Retorna token apenas se email falhou
    email: user.email, 
    name: user.name,
    emailSent: emailResult.success,
    emailError: emailResult.success ? undefined : emailResult.message,
  };
}

export async function validatePasswordResetToken(token: string) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  const tokenResult = await database
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (tokenResult.length === 0) {
    throw new Error("Token inválido");
  }

  const resetToken = tokenResult[0];

  // Verificar se token já foi usado
  if (resetToken.used === 1) {
    throw new Error("Token já foi utilizado");
  }

  // Verificar se token expirou
  if (new Date() > resetToken.expiresAt) {
    throw new Error("Token expirado");
  }

  return { userId: resetToken.userId, tokenId: resetToken.id };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  // Validar token
  const { userId, tokenId } = await validatePasswordResetToken(token);

  // Hash da nova senha
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Atualizar senha do usuário
  await database
    .update(users)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Marcar token como usado
  await database
    .update(passwordResetTokens)
    .set({ used: 1 })
    .where(eq(passwordResetTokens.id, tokenId));

  return { success: true };
}


// ============================================
// Funções de Código Temporário (Admin)
// ============================================

/**
 * Gera código temporário de 6 dígitos para recuperação de senha
 * Apenas admins podem gerar códigos
 */
export async function generateTemporaryResetCode(email: string) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  // Buscar usuário pelo email
  const userResult = await database
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("Usuário não encontrado");
  }

  const user = userResult[0];

  // Gerar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Código expira em 24 horas
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Atualizar usuário com código temporário
  await database
    .update(users)
    .set({
      temporaryResetCode: code,
      resetCodeExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return {
    code,
    expiresAt,
    userName: user.name,
    userEmail: user.email,
  };
}

/**
 * Valida código temporário + email
 */
export async function validateTemporaryResetCode(email: string, code: string) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  const userResult = await database
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("Usuário não encontrado");
  }

  const user = userResult[0];

  // Verificar se código existe
  if (!user.temporaryResetCode) {
    throw new Error("Nenhum código de recuperação foi gerado para este usuário");
  }

  // Verificar se código corresponde
  if (user.temporaryResetCode !== code) {
    throw new Error("Código inválido");
  }

  // Verificar se código expirou
  if (!user.resetCodeExpiresAt || new Date() > user.resetCodeExpiresAt) {
    throw new Error("Código expirado");
  }

  return { userId: user.id };
}

/**
 * Reseta senha usando código temporário
 */
export async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  // Validar código
  const { userId } = await validateTemporaryResetCode(email, code);

  // Hash da nova senha
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Atualizar senha e limpar código temporário
  await database
    .update(users)
    .set({
      password: hashedPassword,
      temporaryResetCode: null,
      resetCodeExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true };
}

/**
 * Lista usuários com códigos temporários ativos (apenas para admin)
 */
export async function listActiveResetCodes() {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  const result = await database
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      code: users.temporaryResetCode,
      expiresAt: users.resetCodeExpiresAt,
    })
    .from(users)
    .where(and(
      isNotNull(users.temporaryResetCode),
      isNotNull(users.resetCodeExpiresAt)
    ));

  return result;
}


export async function getProjectScheduleWithActivities(projectId: number) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  // Buscar projeto
  const projectResult = await dbInstance
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (projectResult.length === 0) {
    throw new Error("Projeto não encontrado");
  }

  const project = projectResult[0];

  // Buscar todas as atividades do projeto
  const activitiesResult = await dbInstance
    .select({
      id: phaseActivities.id,
      name: phaseActivities.name,
      phase: phaseActivities.phase,
      startDate: phaseActivities.startDate,
      endDate: phaseActivities.endDate,
      completed: phaseActivities.completed,
      assignedTo: phaseActivities.assignedTo,
      order: phaseActivities.order,
    })
    .from(phaseActivities)
    .where(eq(phaseActivities.projectId, projectId))
    .orderBy(phaseActivities.order);

  // Para cada atividade, buscar suas subtarefas
  const activities = await Promise.all(
    activitiesResult.map(async (activity) => {
      const subtasksResult = await dbInstance
        .select({
          id: phaseSubtasks.id,
          name: phaseSubtasks.name,
          startDate: phaseSubtasks.startDate,
          endDate: phaseSubtasks.endDate,
          completed: phaseSubtasks.completed,
          assignedTo: phaseSubtasks.assignedTo,
          order: phaseSubtasks.order,
        })
        .from(phaseSubtasks)
        .where(eq(phaseSubtasks.activityId, activity.id))
        .orderBy(phaseSubtasks.order);

      return {
        ...activity,
        subtasks: subtasksResult,
      };
    })
  );

  return {
    project,
    activities,
  };
}
