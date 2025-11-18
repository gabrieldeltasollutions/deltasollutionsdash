import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { generateToken } from "./auth";
import { generateQuotePDF } from "./pdfGenerator";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { teamMembers } from "./drizzle/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
        sector: z.enum(["Software", "Hardware", "Mecânica", "Automação", "Administrativo"]).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await db.registerUser(input);
          return { success: true, message: "Usuário registrado com sucesso!" };
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'Erro ao registrar usuário',
          });
        }
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log("[LOGIN DEBUG] Tentativa de login:", input.email);
        try {
          const user = await db.loginUser(input.email, input.password);
          console.log("[LOGIN DEBUG] Usuário autenticado:", user.email);
          
          // Criar token JWT
          const token = generateToken({
            userId: user.id!,
            email: user.email!,
            role: user.role!,
          });
          
          // Salvar token em cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          console.log("[LOGIN DEBUG] Opções de cookie:", cookieOptions);
          ctx.res.cookie(COOKIE_NAME, token, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
          });
          console.log("[LOGIN DEBUG] Cookie salvo com nome:", COOKIE_NAME);
          
          return { 
            success: true, 
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              sector: user.sector,
            }
          };
        } catch (error: any) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message || 'Credenciais inválidas',
          });
        }
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    
    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await db.createPasswordResetToken(input.email);
          
          if (result.emailSent) {
            // Email enviado com sucesso
            return { 
              success: true, 
              message: "Email de recuperação enviado! Verifique sua caixa de entrada.",
              emailSent: true,
            };
          } else {
            // Email falhou - retornar token para simulação
            return { 
              success: true, 
              message: `Erro ao enviar email: ${result.emailError}. Token gerado para teste.`,
              emailSent: false,
              token: result.token, // Apenas para fallback quando email falha
            };
          }
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'Erro ao solicitar recuperação de senha',
          });
        }
      }),
    
    validateResetToken: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Token é obrigatório"),
      }))
      .query(async ({ input }) => {
        try {
          await db.validatePasswordResetToken(input.token);
          return { valid: true };
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'Token inválido',
          });
        }
      }),
    
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Token é obrigatório"),
        newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      }))
      .mutation(async ({ input }) => {
        try {
          await db.resetPasswordWithToken(input.token, input.newPassword);
          return { 
            success: true, 
            message: "Senha redefinida com sucesso!"
          };
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'Erro ao redefinir senha',
          });
        }
      }),
    
    // Código Temporário (Admin)
    generateResetCode: protectedProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Apenas admin pode gerar códigos
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas administradores podem gerar códigos de recuperação',
          });
        }
        
        try {
          const result = await db.generateTemporaryResetCode(input.email);
          return {
            success: true,
            message: "Código gerado com sucesso!",
            code: result.code,
            expiresAt: result.expiresAt,
            userName: result.userName,
          };
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'Erro ao gerar código',
          });
        }
      }),
    
    resetPasswordWithCode: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        code: z.string().length(6, "Código deve ter 6 dígitos"),
        newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      }))
      .mutation(async ({ input }) => {
        try {
          await db.resetPasswordWithCode(input.email, input.code, input.newPassword);
          return {
            success: true,
            message: "Senha redefinida com sucesso!"
          };
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'Erro ao redefinir senha',
          });
        }
      }),
    
    listActiveResetCodes: protectedProcedure
      .query(async ({ ctx }) => {
        // Apenas admin pode listar códigos ativos
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas administradores podem visualizar códigos ativos',
          });
        }
        
        return await db.listActiveResetCodes();
      }),
  }),

  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Apenas admin pode listar usuários
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem acessar esta funcionalidade',
        });
      }
      return await db.getAllUsers();
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
        role: z.enum(["user", "admin"]).default("user"),
        level: z.enum(["Dev", "Líder", "Gerente", "Financeiro", "Diretor", "Comprador"]).optional(),
        sector: z.enum(["Software", "Hardware", "Mecânica", "Automação", "Administrativo"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas administradores podem criar usuários',
          });
        }
        
        // Criar usuário (registerUser já adiciona automaticamente à equipe)
        const result = await db.registerUser(input);
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        userId: z.number().int(),
        name: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
        level: z.enum(["Dev", "Líder", "Gerente", "Financeiro", "Diretor", "Comprador"]).optional(),
        sector: z.enum(["Software", "Hardware", "Mecânica", "Automação", "Administrativo"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas administradores podem editar usuários',
          });
        }
        const { userId, ...data } = input;
        return await db.updateUser(userId, data);
      }),

    resetPassword: protectedProcedure
      .input(z.object({
        userId: z.number().int(),
        newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas administradores podem resetar senhas',
          });
        }
        return await db.resetUserPassword(input.userId, input.newPassword);
      }),

    delete: protectedProcedure
      .input(z.object({
        userId: z.number().int(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Apenas administradores podem excluir usuários',
          });
        }
        // Não pode excluir a si mesmo
        if (ctx.user.id === input.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Você não pode excluir sua própria conta',
          });
        }
        return await db.deleteUser(input.userId);
      }),
  }),

  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Retornar todos os projetos para que todos os colaboradores possam visualizá-los
      return await db.getAllProjects();
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        clientId: z.number().int().nullable().optional(),
        leaderId: z.number().int().nullable().optional(),
        duration: z.number().int().min(1).optional(),
        status: z.enum(["planejamento", "em_andamento", "concluido", "cancelado"]).default("planejamento"),
        startDate: z.union([z.string(), z.date()]).optional(),
        endDate: z.union([z.string(), z.date()]).optional(),
        budget: z.number().int().min(0).optional(),
        notes: z.string().optional(),
        teamMemberIds: z.array(z.number().int()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { teamMemberIds, ...projectData } = input;
        const projectId = await db.createProject({
          ...projectData,
          userId: ctx.user.id,
          startDate: input.startDate ? (input.startDate instanceof Date ? input.startDate : new Date(input.startDate)) : null,
          endDate: input.endDate ? (input.endDate instanceof Date ? input.endDate : new Date(input.endDate)) : null,
        });
        
        // Adicionar membros da equipe
        if (teamMemberIds && teamMemberIds.length > 0) {
          await db.setProjectTeamMembers(projectId, teamMemberIds);
        }
        
        return { success: true, projectId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        clientId: z.number().int().nullable().optional(),
        leaderId: z.number().int().nullable().optional(),
        duration: z.number().int().min(1).optional(),
        status: z.enum(["planejamento", "em_andamento", "concluido", "cancelado"]).optional(),
        startDate: z.union([z.string(), z.date()]).optional(),
        endDate: z.union([z.string(), z.date()]).optional(),
        budget: z.number().int().min(0).optional(),
        notes: z.string().optional(),
        teamMemberIds: z.array(z.number().int()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, teamMemberIds, ...data } = input;
        await db.updateProject(id, {
          ...data,
          startDate: data.startDate ? (data.startDate instanceof Date ? data.startDate : new Date(data.startDate)) : undefined,
          endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : undefined,
        });
        
        // Atualizar membros da equipe se fornecido
        if (teamMemberIds !== undefined) {
          await db.setProjectTeamMembers(id, teamMemberIds);
        }
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const project = await db.getProjectById(input.id);
        if (!project) return null;
        
        const teamMembers = await db.getProjectTeamMembers(input.id);
        return { ...project, teamMembers };
      }),

    updatePhase: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        phase: z.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateProjectPhase(input.id, input.phase);
        return { success: true };
      }),

    getPhaseSchedule: protectedProcedure
      .input(z.object({ projectId: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getPhaseScheduleByProjectId(input.projectId);
      }),

    setPhaseSchedule: protectedProcedure
      .input(z.object({
        projectId: z.number().int(),
        schedules: z.array(z.object({
          phase: z.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]),
          startDate: z.union([z.string(), z.date()]).optional(),
          endDate: z.union([z.string(), z.date()]).optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const schedules = input.schedules.map(s => ({
          phase: s.phase,
          startDate: s.startDate ? (s.startDate instanceof Date ? s.startDate : new Date(s.startDate)) : undefined,
          endDate: s.endDate ? (s.endDate instanceof Date ? s.endDate : new Date(s.endDate)) : undefined,
        }));
        await db.setProjectPhaseSchedule(input.projectId, schedules);
        return { success: true };
      }),

    // Phase Activities
    getPhaseActivities: protectedProcedure
      .input(z.object({
        projectId: z.number().int(),
        phase: z.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]),
      }))
      .query(async ({ input }) => {
        return await db.getPhaseActivitiesByProjectAndPhase(input.projectId, input.phase);
      }),

    createPhaseActivity: protectedProcedure
      .input(z.object({
        projectId: z.number().int(),
        phase: z.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]),
        name: z.string().min(1),
        startDate: z.union([z.string(), z.date()]).optional(),
        endDate: z.union([z.string(), z.date()]).optional(),
        assignedTo: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        // Helper para converter string de data sem timezone (evita bug de -1 dia)
        const parseLocalDate = (dateStr: string | Date) => {
          if (dateStr instanceof Date) return dateStr;
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        
        const activityId = await db.createPhaseActivity({
          projectId: input.projectId,
          phase: input.phase,
          name: input.name,
          startDate: input.startDate ? parseLocalDate(input.startDate) : null,
          endDate: input.endDate ? parseLocalDate(input.endDate) : null,
          completed: 0,
          assignedTo: input.assignedTo || null,
        });
        return { success: true, activityId };
      }),

    updatePhaseActivity: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).optional(),
        startDate: z.union([z.string(), z.date()]).optional(),
        endDate: z.union([z.string(), z.date()]).optional(),
        assignedTo: z.number().int().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Helper para converter string de data sem timezone (evita bug de -1 dia)
        const parseLocalDate = (dateStr: string | Date) => {
          if (dateStr instanceof Date) return dateStr;
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        
        await db.updatePhaseActivity(id, {
          ...data,
          startDate: data.startDate ? parseLocalDate(data.startDate) : undefined,
          endDate: data.endDate ? parseLocalDate(data.endDate) : undefined,
          assignedTo: data.assignedTo !== undefined ? data.assignedTo : undefined,
        });
        return { success: true };
      }),

    updatePhaseDates: protectedProcedure
      .input(z.object({
        phaseId: z.number().int(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { phaseId, startDate, endDate } = input;
        
        // Helper para converter string de data sem timezone (evita bug de -1 dia)
        const parseLocalDate = (dateStr: string) => {
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        
        // Validar que startDate < endDate
        const start = parseLocalDate(startDate);
        const end = parseLocalDate(endDate);
        if (start >= end) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Data de início deve ser anterior à data de fim',
          });
        }

        await db.updatePhaseActivity(phaseId, {
          startDate: start,
          endDate: end,
        });
        return { success: true };
      }),

    togglePhaseActivityCompleted: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.togglePhaseActivityCompleted(input.id);
        return { success: true };
      }),

    deletePhaseActivity: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deletePhaseActivity(input.id);
        return { success: true };
      }),

    reorderPhaseActivities: protectedProcedure
      .input(z.object({
        updates: z.array(z.object({
          id: z.number().int(),
          order: z.number().int(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.reorderPhaseActivities(input.updates);
        return { success: true };
      }),

    // Phase Subtasks
    getPhaseSubtasks: protectedProcedure
      .input(z.object({
        activityId: z.number().int(),
      }))
      .query(async ({ input }) => {
        return await db.getPhaseSubtasksByActivity(input.activityId);
      }),

    createPhaseSubtask: protectedProcedure
      .input(z.object({
        activityId: z.number().int(),
        name: z.string().min(1),
        startDate: z.union([z.string(), z.date()]).optional(),
        endDate: z.union([z.string(), z.date()]).optional(),
        assignedTo: z.number().int().optional(),
      }))
      .mutation(async ({ input }) => {
        // Helper para converter string de data sem timezone (evita bug de -1 dia)
        const parseLocalDate = (dateStr: string | Date) => {
          if (dateStr instanceof Date) return dateStr;
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        
        const subtaskData = {
          activityId: input.activityId,
          name: input.name,
          startDate: input.startDate ? parseLocalDate(input.startDate) : undefined,
          endDate: input.endDate ? parseLocalDate(input.endDate) : undefined,
          completed: 0,
          assignedTo: input.assignedTo || null,
        };
        const subtaskId = await db.createPhaseSubtask(subtaskData);
        return { success: true, subtaskId };
      }),

    updatePhaseSubtask: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1),
        startDate: z.union([z.string(), z.date()]).optional(),
        endDate: z.union([z.string(), z.date()]).optional(),
        assignedTo: z.number().int().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, startDate, endDate, ...data } = input;
        // Helper para converter string de data sem timezone (evita bug de -1 dia)
        const parseLocalDate = (dateStr: string | Date) => {
          if (dateStr instanceof Date) return dateStr;
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        
        await db.updatePhaseSubtask(id, {
          ...data,
          startDate: startDate ? parseLocalDate(startDate) : undefined,
          endDate: endDate ? parseLocalDate(endDate) : undefined,
          assignedTo: data.assignedTo !== undefined ? data.assignedTo : undefined,
        });
        return { success: true };
      }),

    updatePhaseSubtaskAssignee: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        assignedTo: z.number().int().nullable(),
      }))
      .mutation(async ({ input }) => {
        console.log('[TRPC updatePhaseSubtaskAssignee] Input:', input);
        await db.updatePhaseSubtaskAssignee(input.id, input.assignedTo);
        return { success: true };
      }),

    updatePhaseSubtaskDates: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        startDate: z.union([z.string(), z.date(), z.null()]).nullable().optional(),
        endDate: z.union([z.string(), z.date(), z.null()]).nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const parseLocalDate = (dateStr: string | Date | null | undefined) => {
          if (!dateStr) return null;
          if (dateStr instanceof Date) return dateStr;
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        
        console.log('[TRPC updatePhaseSubtaskDates] Input:', input);
        const startDate = parseLocalDate(input.startDate);
        const endDate = parseLocalDate(input.endDate);
        await db.updatePhaseSubtaskDates(input.id, startDate, endDate);
        return { success: true };
      }),

    togglePhaseSubtaskCompleted: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.togglePhaseSubtaskCompleted(input.id);
        return { success: true };
      }),

    deletePhaseSubtask: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deletePhaseSubtask(input.id);
        return { success: true };
      }),

    // Team Tasks
    getTeamTasks: protectedProcedure
      .query(async () => {
        return await db.getAllTasksByTeamMember();
      }),

    completeTasksWithComments: protectedProcedure
      .input(z.object({
        tasks: z.array(z.object({
          type: z.enum(["activity", "subtask"]),
          id: z.number().int(),
          comment: z.string().optional(),
        })),
        memberId: z.number().int(), // ID do team member que está executando
      }))
      .mutation(async ({ input }) => {
        // Marcar tarefas como concluídas
        await db.completeMultipleTasks(input.tasks.map(t => ({ type: t.type, id: t.id })));
        
        // Adicionar comentários para tarefas que têm comentário
        for (const task of input.tasks) {
          if (task.comment && task.comment.trim()) {
            await db.createTaskComment({
              taskType: task.type,
              taskId: task.id,
              comment: task.comment,
              createdBy: input.memberId,
            });
          }
        }
        
        return { success: true };
      }),

    getTaskComments: protectedProcedure
      .input(z.object({
        taskType: z.enum(["activity", "subtask"]),
        taskId: z.number().int(),
      }))
      .query(async ({ input }) => {
        return await db.getTaskComments(input.taskType, input.taskId);
      }),

    reorderMemberTasks: protectedProcedure
      .input(z.object({
        memberId: z.number().int(),
        taskOrders: z.array(z.object({
          type: z.enum(["activity", "subtask"]),
          id: z.number().int(),
          order: z.number().int(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.reorderMemberTasks(input.memberId, input.taskOrders);
        return { success: true };
      }),

    exportScheduleExcel: protectedProcedure
      .input(z.object({ projectId: z.number().int() }))
      .mutation(async ({ input }) => {
        const ExcelJS = (await import('exceljs')).default;
        const scheduleData = await db.getProjectScheduleForExport(input.projectId);
        
        // Criar workbook e worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Cronograma');
        
        // Configurar largura das colunas
        worksheet.columns = [
          { key: 'tipo', width: 15 },
          { key: 'nome', width: 40 },
          { key: 'dataInicio', width: 15 },
          { key: 'dataFim', width: 15 },
          { key: 'duracao', width: 12 },
          { key: 'progresso', width: 12 },
          { key: 'status', width: 15 },
        ];
        
        // Adicionar cabeçalho do projeto
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `CRONOGRAMA DO PROJETO: ${scheduleData.project.name.toUpperCase()}`;
        titleCell.font = { bold: true, size: 14 };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).height = 25;
        
        // Adicionar informações do projeto
        worksheet.addRow([]);
        worksheet.addRow(['Descrição:', scheduleData.project.description || 'N/A']);
        worksheet.addRow(['Fase Atual:', scheduleData.project.phase]);
        worksheet.addRow(['Início:', scheduleData.project.startDate ? new Date(scheduleData.project.startDate).toLocaleDateString('pt-BR') : 'N/A']);
        worksheet.addRow(['Fim:', scheduleData.project.endDate ? new Date(scheduleData.project.endDate).toLocaleDateString('pt-BR') : 'N/A']);
        worksheet.addRow([]);
        
        // Adicionar cabeçalho da tabela
        const headerRow = worksheet.addRow(['Tipo', 'Nome', 'Data Início', 'Data Fim', 'Duração', 'Progresso', 'Status']);
        headerRow.font = { bold: true };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.height = 20;
        
        // Mapear nomes das fases
        const phaseNames: Record<string, string> = {
          planejamento: 'Planejamento',
          desenvolvimento: 'Desenvolvimento',
          testes: 'Testes',
          entrega: 'Entrega',
          finalizado: 'Finalizado'
        };
        
        // Adicionar dados do cronograma
        scheduleData.schedule.forEach((phaseData) => {
          if (phaseData.activities.length === 0) return;
          
          // Adicionar linha da fase
          const phaseRow = worksheet.addRow([
            'FASE',
            phaseNames[phaseData.phase] || phaseData.phase,
            '', '', '', '', ''
          ]);
          phaseRow.font = { bold: true, size: 12 };
          phaseRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } };
          
          // Adicionar atividades
          phaseData.activities.forEach((activity) => {
            const activityRow = worksheet.addRow([
              'Atividade',
              activity.name,
              activity.startDate ? new Date(activity.startDate).toLocaleDateString('pt-BR') : '-',
              activity.endDate ? new Date(activity.endDate).toLocaleDateString('pt-BR') : '-',
              activity.startDate && activity.endDate 
                ? `${Math.ceil((new Date(activity.endDate).getTime() - new Date(activity.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias`
                : '-',
              `${activity.progress}%`,
              activity.completed === 1 ? 'Concluída' : 'Pendente'
            ]);
            activityRow.font = { bold: true };
            
            // Adicionar subtarefas
            activity.subtasks.forEach((subtask) => {
              const subtaskRow = worksheet.addRow([
                'Subtarefa',
                `  → ${subtask.name}`,
                subtask.startDate ? new Date(subtask.startDate).toLocaleDateString('pt-BR') : '-',
                subtask.endDate ? new Date(subtask.endDate).toLocaleDateString('pt-BR') : '-',
                subtask.startDate && subtask.endDate 
                  ? `${Math.ceil((new Date(subtask.endDate).getTime() - new Date(subtask.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias`
                  : '-',
                subtask.completed === 1 ? '100%' : '50%',
                subtask.completed === 1 ? 'Concluída' : 'Pendente'
              ]);
              subtaskRow.font = { italic: true };
            });
          });
        });
        
        // Adicionar bordas a todas as células com dados
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber >= 8) { // Começar após cabeçalho da tabela
            row.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
            });
          }
        });
        
        // Gerar buffer do Excel
        const buffer = await workbook.xlsx.writeBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        return {
          data: base64,
          filename: `cronograma_${scheduleData.project.name.replace(/\s+/g, '_')}.xlsx`
        };
      }),

    getBurndownData: protectedProcedure
      .input(z.object({ projectId: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getBurndownChartData(input.projectId);
      }),

    getSchedule: protectedProcedure
      .input(z.object({ projectId: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getProjectScheduleWithActivities(input.projectId);
      }),

    getTeamMembers: protectedProcedure
      .input(z.object({ projectId: z.number().int() }))
      .query(async ({ input }) => {
        const members = await db.getProjectTeamMembers(input.projectId);
        return members.map(m => ({
          userId: m.id,
          userName: m.name,
          userEmail: m.email,
        }));
      }),
  }),

  team: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Mostrar todos os membros da equipe, não apenas os criados pelo usuário logado
      return await db.getAllTeamMembers();
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        role: z.string().optional(),
        hierarchyLevel: z.enum(["colaborador", "lider", "gerente", "comprador", "diretor", "financeiro"]).optional(),
        hourlyRate: z.number().int().min(0).optional(),
        specialization: z.string().optional(),
        status: z.enum(["ativo", "inativo"]).default("ativo"),
        hireDate: z.string().optional(), // ISO date string
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const memberId = await db.createTeamMember({
          ...input,
          userId: ctx.user.id,
          email: input.email || null,
          hireDate: input.hireDate ? new Date(input.hireDate) : null,
        });
        return { success: true, memberId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        role: z.string().optional(),
        hierarchyLevel: z.enum(["colaborador", "lider", "gerente", "comprador", "diretor", "financeiro"]).optional(),
        hourlyRate: z.number().int().min(0).optional(),
        specialization: z.string().optional(),
        status: z.enum(["ativo", "inativo"]).optional(),
        hireDate: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTeamMember(id, {
          ...data,
          email: data.email || null,
          hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deleteTeamMember(input.id);
        return { success: true };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getTeamMemberById(input.id);
      }),

    getActive: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveTeamMembers(ctx.user.id);
    }),
    
    getMyHierarchyLevel: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserHierarchyLevel(ctx.user.email || "");
    }),
  }),

  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getClientsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        document: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().max(2).optional(),
        zipCode: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const clientId = await db.createClient({
          ...input,
          email: input.email || null,
          userId: ctx.user.id,
        });
        return { success: true, clientId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        document: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().max(2).optional(),
        zipCode: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateClient(id, {
          ...data,
          email: data.email || null,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deleteClient(input.id);
        return { success: true };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getClientById(input.id);
      }),
  }),

  machines: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMachinesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["centro_usinagem", "torno_convencional", "torno_cnc", "fresadora", "outros"]),
        purchaseValue: z.number().int().min(0),
        residualValue: z.number().int().min(0).default(0),
        usefulLifeHours: z.number().int().min(1),
        occupiedArea: z.number().int().min(1),
        powerKw: z.number().int().min(0),
        maintenanceCostPerYear: z.number().int().min(0).default(0),
        consumablesCostPerYear: z.number().int().min(0).default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createMachine({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).optional(),
        type: z.enum(["centro_usinagem", "torno_convencional", "torno_cnc", "fresadora", "outros"]).optional(),
        purchaseValue: z.number().int().min(0).optional(),
        residualValue: z.number().int().min(0).optional(),
        usefulLifeHours: z.number().int().min(1).optional(),
        occupiedArea: z.number().int().min(1).optional(),
        powerKw: z.number().int().min(0).optional(),
        maintenanceCostPerYear: z.number().int().min(0).optional(),
        consumablesCostPerYear: z.number().int().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMachine(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deleteMachine(input.id);
        return { success: true };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getMachineById(input.id);
      }),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getSettingsByUserId(ctx.user.id);
    }),

    upsert: protectedProcedure
      .input(z.object({
        rentPerSquareMeter: z.number().int().min(0),
        electricityCostPerKwh: z.number().int().min(0),
        operatorHourlyCost: z.number().int().min(0),
        defaultProfitMargin: z.number().int().min(0).max(100),
        defaultTaxRate: z.number().int().min(0).max(100),
        workingHoursPerYear: z.number().int().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertSettings({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  quotes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getQuotesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        clientName: z.string().min(1),
        profitMargin: z.number().int(),
        taxRate: z.number().int(),
        subtotal: z.number().int(),
        taxAmount: z.number().int(),
        profitAmount: z.number().int(),
        finalPrice: z.number().int(),
        notes: z.string().optional(),
        items: z.array(z.object({
          machineId: z.number().int(),
          partDescription: z.string().min(1),
          quantity: z.number().int().min(1),
          materialId: z.number().int().nullable().optional(),
          partWidthMm: z.number().int().nullable().optional(),
          partLengthMm: z.number().int().nullable().optional(),
          rawMaterialCost: z.number().int().min(0),
          toolingCost: z.number().int().min(0),
          thirdPartyServicesCost: z.number().int().min(0),
          machineTimeHours: z.number().min(0),
          setupTimeHours: z.number().min(0),
          machineHourlyCost: z.number().int(),
          totalMachineCost: z.number().int(),
          totalLaborCost: z.number().int(),
          itemSubtotal: z.number().int(),
        })).min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Criar orçamento principal e obter o ID inserido
          const quoteId = await db.createQuote({
            userId: ctx.user.id,
            clientName: input.clientName,
            subtotal: input.subtotal,
            taxAmount: input.taxAmount,
            profitAmount: input.profitAmount,
            finalPrice: input.finalPrice,
            profitMargin: input.profitMargin,
            taxRate: input.taxRate,
            notes: input.notes,
          });

          console.log('[INFO] Created quote with ID:', quoteId);
          console.log('[INFO] Number of items to create:', input.items.length);

          // Criar itens do orçamento
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
                itemSubtotal: item.itemSubtotal,
              };
              
              console.log(`[DEBUG] Item data before createQuoteItem:`, JSON.stringify(itemData, null, 2));
              console.log(`[DEBUG] quoteId value:`, quoteId, 'type:', typeof quoteId);
              
              await db.createQuoteItem(itemData);
              console.log(`[INFO] Item ${i + 1} created successfully`);
            } catch (itemError) {
              console.error(`[ERROR] Failed to create item ${i + 1}:`, itemError);
              throw itemError;
            }
          }
          
          console.log('[INFO] All items created successfully');

          return { success: true, quoteId };
        } catch (error) {
          throw error;
        }
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const quote = await db.getQuoteById(input.id);
        if (!quote) return null;
        
        const items = await db.getQuoteItemsByQuoteId(input.id);
        
        // Buscar dados completos do cliente pelo nome
        const client = await db.getClientByName(ctx.user.id, quote.clientName);
        
        return { ...quote, items, client };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deleteQuote(input.id);
        return { success: true };
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.approveQuote(input.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        clientName: z.string().min(1),
        profitMargin: z.number().int(),
        taxRate: z.number().int(),
        subtotal: z.number().int(),
        taxAmount: z.number().int(),
        profitAmount: z.number().int(),
        finalPrice: z.number().int(),
        notes: z.string().optional(),
        items: z.array(z.object({
          id: z.number().int().optional(), // Se tem ID, é update; senão, é insert
          machineId: z.number().int(),
          partDescription: z.string().min(1),
          quantity: z.number().int().min(1),
          materialId: z.number().int().nullable().optional(),
          partWidthMm: z.number().int().nullable().optional(),
          partLengthMm: z.number().int().nullable().optional(),
          rawMaterialCost: z.number().int().min(0),
          toolingCost: z.number().int().min(0),
          thirdPartyServicesCost: z.number().int().min(0),
          machineTimeHours: z.number().min(0),
          setupTimeHours: z.number().min(0),
          machineHourlyCost: z.number().int(),
          totalMachineCost: z.number().int(),
          totalLaborCost: z.number().int(),
          itemSubtotal: z.number().int(),
        })),
        deletedItemIds: z.array(z.number().int()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, items, deletedItemIds, ...quoteData } = input;
        
        // Atualizar orçamento
        await db.updateQuote(id, quoteData);
        
        // Deletar itens removidos
        if (deletedItemIds && deletedItemIds.length > 0) {
          for (const itemId of deletedItemIds) {
            await db.deleteQuoteItem(itemId);
          }
        }
        
        // Atualizar/criar itens
        for (const item of items) {
          if (item.id) {
            // Atualizar item existente
            const { id: itemId, ...itemData } = item;
            await db.updateQuoteItem(itemId, itemData);
          } else {
            // Criar novo item
            await db.createQuoteItem({ ...item, quoteId: id });
          }
        }
        
        return { success: true };
      }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      const totalGenerated = await db.getTotalQuotesValue(ctx.user.id);
      const totalApproved = await db.getTotalApprovedQuotesValue(ctx.user.id);
      return {
        totalGenerated,
        totalApproved,
      };
    }),

    monthlyStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMonthlyApprovedQuotesValue(ctx.user.id);
    }),

    statusCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getQuotesByStatus(ctx.user.id);
    }),

    exportPdf: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const quote = await db.getQuoteById(input.id);
        if (!quote) {
          throw new Error("Orçamento não encontrado");
        }

        const items = await db.getQuoteItemsByQuoteId(input.id);
        
        // Buscar dados completos do cliente pelo nome
        const allClients = await db.getClientsByUserId(quote.userId);
        const client = allClients.find(c => c.name === quote.clientName);
        
        // Buscar informações das máquinas e materiais de cada item
        const itemsWithDetails = await Promise.all(
          items.map(async (item) => {
            const machine = await db.getMachineById(item.machineId);
            const material = item.materialId ? await db.getMaterialById(item.materialId) : null;
            return {
              ...item,
              machineName: machine?.name || "Máquina não encontrada",
              materialName: material?.name || null,
            };
          })
        );

        // Carregar logo da empresa
        let companyLogo: string | undefined;
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
          client: client || null,
        });

        // Retornar PDF como base64
        return {
          pdf: pdfBuffer.toString("base64"),
          filename: `orcamento-${quote.id}-${quote.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        };
      }),
  }),

  materials: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getMaterialsByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        widthMm: z.number().int().min(1),
        lengthMm: z.number().int().min(1),
        purchasePrice: z.number().int().min(0),
        supplier: z.string().optional(),
        stockQuantity: z.number().int().min(0).default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        // Calcular custo por mm² (armazenado em milésimos de centavo para manter precisão)
        const areaMm2 = input.widthMm * input.lengthMm;
        const costPerMm2 = Math.round((input.purchasePrice * 1000) / areaMm2);

        await db.createMaterial({
          ...input,
          userId: ctx.user.id,
          costPerMm2,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        widthMm: z.number().int().min(1).optional(),
        lengthMm: z.number().int().min(1).optional(),
        purchasePrice: z.number().int().min(0).optional(),
        supplier: z.string().optional(),
        stockQuantity: z.number().int().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // Se largura, comprimento ou preço foram alterados, recalcular custo por mm²
        if (data.widthMm || data.lengthMm || data.purchasePrice) {
          const material = await db.getMaterialById(id);
          if (material) {
            const widthMm = data.widthMm || material.widthMm;
            const lengthMm = data.lengthMm || material.lengthMm;
            const purchasePrice = data.purchasePrice || material.purchasePrice;
            const areaMm2 = widthMm * lengthMm;
            const costPerMm2 = Math.round((purchasePrice * 1000) / areaMm2);
            (data as any).costPerMm2 = costPerMm2;
          }
        }

        await db.updateMaterial(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deleteMaterial(input.id);
        return { success: true };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getMaterialById(input.id);
      }),
  }),

  projectMaterials: router({
    getByProject: protectedProcedure
      .input(z.object({ projectId: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getMaterialsByProject(input.projectId);
      }),

    add: protectedProcedure
      .input(z.object({
        projectId: z.number().int(),
        itemName: z.string().min(1),
        quantity: z.number().int().positive(),
        unit: z.string().min(1),
        unitPrice: z.number().int().nonnegative(),
        supplier: z.string().optional(),
        notes: z.string().optional(),
        imageUrl: z.string().optional(),
        requestingSector: z.enum(["Software", "Hardware", "Mecânica", "Automação", "Administrativo"]),
      }))
      .mutation(async ({ input }) => {
        await db.addProjectMaterial(input);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        itemName: z.string().min(1).optional(),
        quantity: z.number().int().positive().optional(),
        unit: z.string().min(1).optional(),
        unitPrice: z.number().int().nonnegative().optional(),
        supplier: z.string().optional(),
        notes: z.string().optional(),
        imageUrl: z.string().optional(),
        requestingSector: z.enum(["Software", "Hardware", "Mecânica", "Automação", "Administrativo"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProjectMaterial(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deleteProjectMaterial(input.id);
        return { success: true };
      }),

    approve: protectedProcedure
      .input(z.object({
        materialId: z.number().int(),
        comments: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Obter nível hierárquico do usuário logado
        const userLevel = await db.getUserHierarchyLevel(ctx.user.email || "");
        if (!userLevel) {
          throw new Error("Usuário não cadastrado como colaborador ou sem nível hierárquico definido");
        }
        
        return await db.approveMaterial({
          materialId: input.materialId,
          approverUserId: ctx.user.id,
          approverName: ctx.user.name || ctx.user.email || "Unknown",
          approverRole: userLevel,
          comments: input.comments,
        });
      }),

    reject: protectedProcedure
      .input(z.object({
        materialId: z.number().int(),
        comments: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        // Obter nível hierárquico do usuário logado
        const userLevel = await db.getUserHierarchyLevel(ctx.user.email || "");
        if (!userLevel) {
          throw new Error("Usuário não cadastrado como colaborador ou sem nível hierárquico definido");
        }
        
        return await db.rejectMaterial({
          materialId: input.materialId,
          approverUserId: ctx.user.id,
          approverName: ctx.user.name || ctx.user.email || "Unknown",
          approverRole: userLevel,
          comments: input.comments,
        });
      }),

    getApprovalHistory: protectedProcedure
      .input(z.object({ materialId: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getApprovalHistory(input.materialId);
      }),

    // Cotações de fornecedores
    addSupplierQuotation: protectedProcedure
      .input(z.object({
        materialId: z.number().int(),
        supplier: z.string().min(1),
        quotedPrice: z.number().int().positive(),
        deliveryTime: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createMaterialQuotation(input);
      }),

    getQuotations: protectedProcedure
      .input(z.object({ materialId: z.number().int() }))
      .query(async ({ input }) => {
        return await db.getMaterialQuotations(input.materialId);
      }),

    updateQuotation: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        supplier: z.string().min(1).optional(),
        quotedPrice: z.number().int().positive().optional(),
        deliveryTime: z.string().optional(),
        paymentTerms: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateMaterialQuotation(id, data);
      }),

    deleteQuotation: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        return await db.deleteMaterialQuotation(input.id);
      }),

    setRecommendedQuotation: protectedProcedure
      .input(z.object({
        materialId: z.number().int(),
        quotationId: z.number().int(),
      }))
      .mutation(async ({ input }) => {
        return await db.setRecommendedQuotation(input.materialId, input.quotationId);
      }),

    confirmPurchase: protectedProcedure
      .input(z.object({
        materialId: z.number().int(),
        expectedDeliveryDate: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.confirmPurchase({
          materialId: input.materialId,
          expectedDeliveryDate: input.expectedDeliveryDate,
          buyerUserId: ctx.user.id,
          buyerName: ctx.user.name || ctx.user.email || "Unknown",
        });
      }),

    confirmReceiving: protectedProcedure
      .input(z.object({
        materialId: z.number().int(),
        receivedBy: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.confirmReceiving({
          materialId: input.materialId,
          receivedBy: input.receivedBy,
          receiverUserId: ctx.user.id,
          receiverName: ctx.user.name || ctx.user.email || "Unknown",
        });
      }),
  }),

  activities: router({
    updateDates: protectedProcedure
      .input(z.object({
        activityId: z.number().int(),
        startDate: z.union([z.string(), z.date()]), // Aceita string ou Date (superjson)
        endDate: z.union([z.string(), z.date()]),
      }))
      .mutation(async ({ input }) => {
        // Helper para converter string de data sem timezone (evita bug de -1 dia)
        const parseLocalDate = (dateStr: string | Date) => {
          if (dateStr instanceof Date) return dateStr;
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        
        await db.updatePhaseActivityDates(
          input.activityId,
          parseLocalDate(input.startDate),
          parseLocalDate(input.endDate)
        );
        return { success: true };
      }),

    updateSubtaskDates: protectedProcedure
      .input(z.object({
        subtaskId: z.number().int(),
        startDate: z.union([z.string(), z.date()]), // Aceita string ou Date (superjson)
        endDate: z.union([z.string(), z.date()]),
      }))
      .mutation(async ({ input }) => {
        // Helper para converter string de data sem timezone (evita bug de -1 dia)
        const parseLocalDate = (dateStr: string | Date) => {
          if (dateStr instanceof Date) return dateStr;
          const [year, month, day] = dateStr.split('-').map(Number);
          return new Date(year, month - 1, day);
        };
        
        await db.updatePhaseSubtaskDates(
          input.subtaskId,
          parseLocalDate(input.startDate),
          parseLocalDate(input.endDate)
        );
        return { success: true };
      }),

    updateName: protectedProcedure
      .input(z.object({
        activityId: z.number().int(),
        name: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.updatePhaseActivity(input.activityId, { name: input.name });
        return { success: true };
      }),

    updateAssignee: protectedProcedure
      .input(z.object({
        activityId: z.number().int(),
        assignedTo: z.number().int().nullable(),
      }))
      .mutation(async ({ input }) => {
        await db.updatePhaseActivity(input.activityId, { assignedTo: input.assignedTo });
        return { success: true };
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number().int(),
        phase: z.enum(["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"]),
        name: z.string().min(1),
        startDate: z.union([z.string(), z.date()]).optional(),
        endDate: z.union([z.string(), z.date()]).optional(),
      }))
      .mutation(async ({ input }) => {
        const activityId = await db.createPhaseActivity({
          projectId: input.projectId,
          phase: input.phase,
          name: input.name,
          startDate: input.startDate ? (input.startDate instanceof Date ? input.startDate : new Date(input.startDate)) : null,
          endDate: input.endDate ? (input.endDate instanceof Date ? input.endDate : new Date(input.endDate)) : null,
          completed: 0,
          progress: 0,
          order: 999, // Adicionar no final
        });
        return { success: true, activityId };
      }),
  }),
});

export type AppRouter = typeof appRouter;
