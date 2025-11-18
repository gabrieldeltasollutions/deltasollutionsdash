import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Code,
  DollarSign,
  Download,
  FolderKanban,
  Loader2,
  MoreVertical,
  Package,
  TestTube,
  Users,
  XCircle,
} from "lucide-react";

import { useLocation } from "wouter";
import { toast } from "sonner";
import { PhaseActivitiesModal } from "@/components/PhaseActivitiesModal";

type ProjectStatus = "planejamento" | "em_andamento" | "concluido" | "cancelado";
type ProjectPhase = "planejamento" | "desenvolvimento" | "testes" | "entrega" | "finalizado";

const statusConfig = {
  planejamento: { label: "Planejamento", color: "bg-blue-500", icon: Clock },
  em_andamento: { label: "Em Andamento", color: "bg-yellow-500", icon: Briefcase },
  concluido: { label: "Concluído", color: "bg-green-500", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-red-500", icon: XCircle },
};

const phaseConfig = {
  planejamento: { label: "Planejamento", icon: FolderKanban, color: "text-blue-500" },
  desenvolvimento: { label: "Desenvolvimento", icon: Code, color: "text-purple-500" },
  testes: { label: "Testes", icon: TestTube, color: "text-orange-500" },
  entrega: { label: "Entrega", icon: Package, color: "text-green-500" },
  finalizado: { label: "Finalizado", icon: CheckCircle2, color: "text-emerald-600" },
};

const phaseOrder: ProjectPhase[] = ["planejamento", "desenvolvimento", "testes", "entrega", "finalizado"];

type PhaseScheduleItem = {
  phase: ProjectPhase;
  startDate?: string | null;
  endDate?: string | null;
};

function PhaseDateEditor({
  projectId,
  phase,
  phaseSchedule,
}: {
  projectId: number;
  phase: ProjectPhase;
  phaseSchedule?: { start: Date; end: Date };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const utils = trpc.useUtils();

  // Popular valores iniciais quando abrir modo de edição
  useEffect(() => {
    if (isEditing && phaseSchedule) {
      const formatToISO = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      setStartDate(formatToISO(phaseSchedule.start));
      setEndDate(formatToISO(phaseSchedule.end));
    }
  }, [isEditing, phaseSchedule]);

  // Buscar atividades da fase para pegar o ID da primeira
  const { data: activities } = trpc.projects.getPhaseActivities.useQuery({ projectId, phase });

  const updateDatesMutation = trpc.projects.updatePhaseDates.useMutation({
    onSuccess: () => {
      toast.success("Datas atualizadas com sucesso!");
      setIsEditing(false);
      utils.projects.getPhaseActivities.invalidate({ projectId, phase });
      utils.projects.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar datas");
    },
  });

  const handleSave = () => {
    if (!startDate || !endDate) {
      toast.error("Preencha ambas as datas");
      return;
    }

    // Validar formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      toast.error("Formato de data inválido. Use o seletor de data.");
      return;
    }

    // Usar ID da primeira atividade da fase
    if (!activities || activities.length === 0) {
      toast.error("Esta fase não possui atividades cadastradas");
      return;
    }

    const firstActivityId = activities[0].id;
    updateDatesMutation.mutate({
      phaseId: firstActivityId,
      startDate,
      endDate,
    });
  };

  if (!phaseSchedule) return null;

  const start = phaseSchedule.start?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const end = phaseSchedule.end?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  if (!start && !end) return null;

  return (
    <div className="text-[10px] text-center text-muted-foreground mt-0.5 group relative">
      {isEditing ? (
        <div className="flex flex-col gap-1 p-2 bg-background border rounded shadow-lg">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-[10px] px-1 py-0.5 border rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-[10px] px-1 py-0.5 border rounded"
          />
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="flex-1 text-[9px] px-1 py-0.5 bg-primary text-primary-foreground rounded"
            >
              Salvar
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 text-[9px] px-1 py-0.5 bg-muted rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="cursor-pointer hover:text-primary transition-colors"
          onClick={() => {
            // Usar formatToISO para evitar problema de fuso horário
            const formatToISO = (date: Date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            };
            setStartDate(phaseSchedule.start ? formatToISO(phaseSchedule.start) : "");
            setEndDate(phaseSchedule.end ? formatToISO(phaseSchedule.end) : "");
            setIsEditing(true);
          }}
          title="Clique para editar datas"
        >
          {start && end ? `${start} - ${end}` : start || end}
        </div>
      )}
    </div>
  );
}

function ProjectRoadmap({ 
  projectId,
  currentPhase,
  startDate,
  endDate,
  onPhaseClick,
}: { 
  projectId: number;
  currentPhase: ProjectPhase;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  onPhaseClick: (phase: ProjectPhase) => void;
}) {
  const currentIndex = phaseOrder.indexOf(currentPhase);
  
  // Buscar atividades de todas as fases para este projeto
  const activitiesQueries = {
    planejamento: trpc.projects.getPhaseActivities.useQuery({ projectId, phase: "planejamento" }),
    desenvolvimento: trpc.projects.getPhaseActivities.useQuery({ projectId, phase: "desenvolvimento" }),
    testes: trpc.projects.getPhaseActivities.useQuery({ projectId, phase: "testes" }),
    entrega: trpc.projects.getPhaseActivities.useQuery({ projectId, phase: "entrega" }),
    finalizado: trpc.projects.getPhaseActivities.useQuery({ projectId, phase: "finalizado" }),
  };
  
  // Calcular contagem de atividades por fase
  const getActivityCount = (phase: ProjectPhase) => {
    const activities = activitiesQueries[phase].data || [];
    const completed = activities.filter(a => a.completed).length;
    const total = activities.length;
    return { completed, total };
  };
  
  // Calcular percentual de conclusão da fase
  const getPhaseProgress = (phase: ProjectPhase) => {
    const { completed, total } = getActivityCount(phase);
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Calcular cronograma usando datas reais das atividades ou automático se não houver atividades
  const calculatePhaseSchedule = () => {
    if (!startDate || !endDate) return {};
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const schedule: Record<ProjectPhase, { start: Date; end: Date }> = {} as any;
      
      phaseOrder.forEach((phase) => {
        const activities = activitiesQueries[phase].data || [];
        
        if (activities.length > 0) {
          // Usar datas reais das atividades
          const dates = activities
            .filter(a => a.startDate && a.endDate)
            .map(a => ({
              start: new Date(a.startDate!),
              end: new Date(a.endDate!)
            }));
          
          if (dates.length > 0) {
            // Pegar data mínima de início e máxima de fim
            const minStart = new Date(Math.min(...dates.map(d => d.start.getTime())));
            const maxEnd = new Date(Math.max(...dates.map(d => d.end.getTime())));
            schedule[phase] = { start: minStart, end: maxEnd };
          }
        }
      });
      
      // Preencher fases sem atividades com cálculo automático
      const phasesWithDates = Object.keys(schedule);
      if (phasesWithDates.length < 5) {
        const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const daysPerPhase = Math.floor(totalDays / 5);
        
        phaseOrder.forEach((phase, index) => {
          if (!schedule[phase]) {
            const phaseStart = new Date(start);
            phaseStart.setDate(start.getDate() + (daysPerPhase * index));
            
            const phaseEnd = new Date(start);
            phaseEnd.setDate(start.getDate() + (daysPerPhase * (index + 1)) - 1);
            
            if (index === phaseOrder.length - 1) {
              schedule[phase] = { start: phaseStart, end };
            } else {
              schedule[phase] = { start: phaseStart, end: phaseEnd };
            }
          }
        });
      }
      
      return schedule;
    } catch {
      return {};
    }
  };

  const phaseSchedule = calculatePhaseSchedule();

  const getScheduleForPhase = (phase: ProjectPhase) => {
    return phaseSchedule[phase as keyof typeof phaseSchedule];
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground">Roadmap do Projeto</h4>
      <div className="flex items-start gap-2">
        {phaseOrder.map((phase, index) => {
          const config = phaseConfig[phase];
          const Icon = config.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={phase} className="flex items-start flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  onClick={() => onPhaseClick(phase)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0 cursor-pointer hover:scale-105 ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground scale-110"
                      : isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-muted border-muted-foreground/20 text-muted-foreground"
                  }`}
                  title="Clique para gerenciar atividades"
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-xs text-center font-medium leading-tight ${
                    isActive
                      ? "text-primary"
                      : isCompleted
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {config.label}
                </span>
                {(() => {
                  const { completed, total } = getActivityCount(phase);
                  const progress = getPhaseProgress(phase);
                  if (total > 0) {
                    return (
                      <div className="flex flex-col items-center gap-0.5 mt-0.5">
                        <Badge 
                          variant={completed === total ? "default" : "secondary"}
                          className="text-[9px] px-1 py-0 h-4"
                        >
                          {completed}/{total}
                        </Badge>
                        <span className={`text-[10px] font-bold ${
                          progress === 100 ? "text-green-600" : "text-blue-600"
                        }`}>
                          {progress}%
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
                <PhaseDateEditor 
                  projectId={projectId}
                  phase={phase}
                  phaseSchedule={getScheduleForPhase(phase)}
                />
              </div>
              {index < phaseOrder.length - 1 && (
                <div
                  className={`h-0.5 w-full mx-1 transition-all ${
                    isCompleted ? "bg-green-500" : "bg-muted-foreground/20"
                  }`}
                  style={{ marginTop: "20px" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | null>(null);
  const [activitiesModalOpen, setActivitiesModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | null>(null);

  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const { data: teamMembers } = trpc.team.list.useQuery();

  const updatePhaseMutation = trpc.projects.updatePhase.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("Fase do projeto atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar fase: ${error.message}`);
    },
  });

  const exportScheduleMutation = trpc.projects.exportScheduleExcel.useMutation({
    onSuccess: (result) => {
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Cronograma completo exportado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao exportar cronograma:', error);
      toast.error('Erro ao exportar cronograma');
    },
  });

  const handlePhaseClick = (projectId: number, phase: ProjectPhase) => {
    setSelectedProjectId(projectId);
    setSelectedPhase(phase);
    setActivitiesModalOpen(true);
  };

  const handlePhaseChange = (projectId: number, newPhase: ProjectPhase) => {
    updatePhaseMutation.mutate({ id: projectId, phase: newPhase });
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  const filteredProjects = projects?.filter(
    (p) => statusFilter === null || p.status === statusFilter
  ) || [];

  // Calcular métricas
  const totalProjects = projects?.length || 0;
  const projectsByStatus = {
    planejamento: projects?.filter((p) => p.status === "planejamento").length || 0,
    em_andamento: projects?.filter((p) => p.status === "em_andamento").length || 0,
    concluido: projects?.filter((p) => p.status === "concluido").length || 0,
    cancelado: projects?.filter((p) => p.status === "cancelado").length || 0,
  };

  const activeBudget = projects
    ?.filter((p) => p.status === "em_andamento" || p.status === "planejamento")
    .reduce((sum, p) => sum + (p.budget || 0), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard de Projetos</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral de todos os projetos cadastrados
            </p>
          </div>
          <Button onClick={() => setLocation("/projects")}>
            <FolderKanban className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Projetos cadastrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projectsByStatus.planejamento + projectsByStatus.em_andamento}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(activeBudget)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipe Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Colaboradores cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Status Clicáveis */}
        <div className="grid gap-4 md:grid-cols-4">
          {(Object.keys(statusConfig) as ProjectStatus[]).map((status) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            return (
              <Card
                key={status}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  statusFilter === status ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setStatusFilter(status)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projectsByStatus[status]}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Listagem de Projetos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {statusFilter === null ? "Todos os Projetos" : `Projetos - ${statusConfig[statusFilter]?.label}`}
          </h2>

          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhum projeto encontrado
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusFilter === null
                    ? "Comece criando seu primeiro projeto"
                    : "Não há projetos com este status"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const statusInfo = statusConfig[project.status as ProjectStatus];
                const currentPhase = (project.phase || "planejamento") as ProjectPhase;
                
                return (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{project.name}</CardTitle>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </div>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Alterar Fase</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {phaseOrder.map((phase) => {
                              const config = phaseConfig[phase];
                              const Icon = config.icon;
                              const isCurrentPhase = phase === currentPhase;
                              return (
                                <DropdownMenuItem
                                  key={phase}
                                  onClick={() => handlePhaseChange(project.id, phase)}
                                  disabled={isCurrentPhase}
                                  className={isCurrentPhase ? "bg-muted" : ""}
                                >
                                  <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                                  {config.label}
                                  {isCurrentPhase && " (Atual)"}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Roadmap Visual */}
                      <div className="px-8">
                        <ProjectRoadmap 
                          projectId={project.id}
                          currentPhase={currentPhase}
                          startDate={project.startDate}
                          endDate={project.endDate}
                          onPhaseClick={(phase) => handlePhaseClick(project.id, phase)}
                        />
                      </div>

                      {/* Informações do Projeto */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        {project.clientId && (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Cliente</span>
                            <span className="text-sm font-medium">ID: {project.clientId}</span>
                          </div>
                        )}

                        {project.duration && (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Duração</span>
                            <span className="text-sm font-medium">{project.duration} dias</span>
                          </div>
                        )}

                        {project.startDate && (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Início</span>
                            <span className="text-sm font-medium">
                              {new Date(project.startDate).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}

                        {project.endDate && (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Fim</span>
                            <span className="text-sm font-medium">
                              {new Date(project.endDate).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        )}

                        {project.budget && (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Orçamento</span>
                            <span className="text-sm font-medium">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(project.budget)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Botão de Exportação de Cronograma Completo */}
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-green-600 border-green-600 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportScheduleMutation.mutate({ projectId: project.id });
                          }}
                          disabled={exportScheduleMutation.isPending}
                        >
                          {exportScheduleMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Exportar Cronograma Completo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Atividades */}
      {selectedProjectId && selectedPhase && (
        <PhaseActivitiesModal
          key={`${selectedProjectId}-${selectedPhase}`}
          open={activitiesModalOpen}
          onOpenChange={setActivitiesModalOpen}
          projectId={selectedProjectId}
          phase={selectedPhase}
          phaseName={phaseConfig[selectedPhase].label}
        />
      )}
    </DashboardLayout>
  );
}
