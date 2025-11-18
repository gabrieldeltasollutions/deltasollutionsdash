import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Circle, Calendar, Folder, GripVertical } from "lucide-react";
import BurndownChart from "@/components/BurndownChart";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type FilterStatus = 'all' | 'pending' | 'completed' | 'overdue';

export default function TeamActivities() {
  const utils = trpc.useUtils();
  const { data: teamTasks, isLoading } = trpc.projects.getTeamTasks.useQuery();
  const { data: allProjects } = trpc.projects.list.useQuery();
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showOverdueAlert, setShowOverdueAlert] = useState(true);
  
  // Buscar dados do Burndown Chart quando um projeto específico é selecionado
  const { data: burndownData } = trpc.projects.getBurndownData.useQuery(
    { projectId: parseInt(selectedProjectId) },
    { enabled: selectedProjectId !== 'all' }
  );

  // Auto-refresh do Burndown Chart a cada 10 segundos
  useEffect(() => {
    if (selectedProjectId === 'all') return;

    const interval = setInterval(() => {
      utils.projects.getBurndownData.invalidate({ projectId: parseInt(selectedProjectId) });
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [selectedProjectId, utils]);
  
  // Detectar tarefas atrasadas ao carregar
  useEffect(() => {
    if (teamTasks && showOverdueAlert) {
      const overdueTasks = teamTasks.flatMap(member => {
        const allTasks = [
          ...member.activities.map((a: any) => ({ ...a, type: 'activity' as const, memberName: member.member.name })),
          ...member.subtasks.map((s: any) => ({ ...s, type: 'subtask' as const, memberName: member.member.name }))
        ];
        return allTasks.filter((task: any) => !task.completed && new Date(task.endDate) < new Date());
      });
      
      if (overdueTasks.length > 0) {
        const taskNames = overdueTasks.slice(0, 3).map((t: any) => t.name).join(', ');
        const moreText = overdueTasks.length > 3 ? ` e mais ${overdueTasks.length - 3}` : '';
        toast.error(
          `Atenção! Você tem ${overdueTasks.length} tarefa(s) atrasada(s): ${taskNames}${moreText}`,
          {
            duration: 10000,
            action: {
              label: 'Ver Atrasadas',
              onClick: () => setFilterStatus('overdue')
            }
          }
        );
      }
    }
  }, [teamTasks, showOverdueAlert]);
  
  // Calcular contadores globais para os filtros
  const filterCounts = useMemo(() => {
    if (!teamTasks) return { all: 0, pending: 0, completed: 0, overdue: 0 };
    
    const allTeamTasks = teamTasks.flatMap(memberData => {
      const tasks = [
        ...memberData.activities.map(a => ({ ...a, type: 'activity' as const })),
        ...memberData.subtasks.map(s => ({ ...s, type: 'subtask' as const }))
      ];
      
      // Aplicar filtro de projeto
      return tasks.filter(task => {
        if (selectedProjectId !== 'all' && task.project?.id.toString() !== selectedProjectId) {
          return false;
        }
        return true;
      });
    });
    
    const isOverdue = (task: any) => {
      if (task.completed) return false;
      if (!task.endDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(task.endDate);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today;
    };
    
    return {
      all: allTeamTasks.length,
      pending: allTeamTasks.filter(t => !t.completed).length,
      completed: allTeamTasks.filter(t => t.completed).length,
      overdue: allTeamTasks.filter(isOverdue).length,
    };
  }, [teamTasks, selectedProjectId]);
  
  const reorderMutation = trpc.projects.reorderMemberTasks.useMutation({
    onMutate: async (variables) => {
      // Cancelar refetches em andamento
      await utils.projects.getTeamTasks.cancel();
      
      // Salvar snapshot dos dados atuais
      const previousData = utils.projects.getTeamTasks.getData();
      
      // Atualizar cache otimisticamente
      utils.projects.getTeamTasks.setData(undefined, (old) => {
        if (!old) return old;
        
        return old.map(member => {
          if (member.member.id === variables.memberId) {
            // Criar mapa de novas ordens
            const orderMap = new Map(variables.taskOrders.map(t => [`${t.type}-${t.id}`, t.order]));
            
            // Atualizar ordem das atividades
            const updatedActivities = member.activities.map((activity: any) => {
              const key = `activity-${activity.id}`;
              const newOrder = orderMap.get(key);
              return newOrder !== undefined ? { ...activity, order: newOrder } : activity;
            });
            updatedActivities.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
            
            // Atualizar ordem das subtarefas
            const updatedSubtasks = member.subtasks.map((subtask: any) => {
              const key = `subtask-${subtask.id}`;
              const newOrder = orderMap.get(key);
              return newOrder !== undefined ? { ...subtask, order: newOrder } : subtask;
            });
            updatedSubtasks.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
            
            return { ...member, activities: updatedActivities, subtasks: updatedSubtasks };
          }
          return member;
        });
      });
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Reverter para dados anteriores em caso de erro
      if (context?.previousData) {
        utils.projects.getTeamTasks.setData(undefined, context.previousData);
      }
      toast.error("Erro ao reordenar tarefas");
      console.error(error);
    },
    onSettled: () => {
      // Refetch para garantir sincronização com o servidor
      utils.projects.getTeamTasks.invalidate();
    },
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atividades da Equipe</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gerencie as tarefas atribuídas a cada colaborador
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 flex-wrap items-center">
          {/* Filtro por Projeto */}
          <div className="flex items-center gap-2">
            <Label htmlFor="project-filter" className="text-sm font-medium">Projeto:</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger id="project-filter" className="w-[250px]">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Projetos</SelectItem>
                {allProjects
                  ?.sort((a, b) => a.name.localeCompare(b.name))
                  .map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Filtros de Status */}
          <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
            className="relative"
          >
            Todas
            <Badge variant="secondary" className="ml-2">{filterCounts.all}</Badge>
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
            className={filterStatus === 'pending' ? '' : 'border-yellow-500 text-yellow-700 hover:bg-yellow-50'}
          >
            Pendentes
            <Badge 
              variant="secondary" 
              className={`ml-2 ${filterStatus === 'pending' ? '' : 'bg-yellow-100 text-yellow-800'}`}
            >
              {filterCounts.pending}
            </Badge>
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('completed')}
            className={filterStatus === 'completed' ? '' : 'border-green-500 text-green-700 hover:bg-green-50'}
          >
            Concluídas
            <Badge 
              variant="secondary" 
              className={`ml-2 ${filterStatus === 'completed' ? '' : 'bg-green-100 text-green-800'}`}
            >
              {filterCounts.completed}
            </Badge>
          </Button>
          <Button
            variant={filterStatus === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('overdue')}
            className={filterStatus === 'overdue' ? '' : 'border-red-500 text-red-700 hover:bg-red-50'}
          >
            Atrasadas
            <Badge 
              variant="secondary" 
              className={`ml-2 ${filterStatus === 'overdue' ? '' : 'bg-red-100 text-red-800'}`}
            >
              {filterCounts.overdue}
            </Badge>
          </Button>
          </div>
        </div>

        {/* Burndown Chart - Exibir quando projeto específico está selecionado */}
        {selectedProjectId !== 'all' && (
          <div className="mb-6">
            <BurndownChart data={burndownData || null} />
          </div>
        )}

        {/* Cards por colaborador */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamTasks
            ?.filter((memberData) => {
              // Se "Todos os Projetos" estiver selecionado, mostrar todos os membros
              if (selectedProjectId === 'all') return true;
              
              // Verificar se o membro tem pelo menos uma tarefa no projeto selecionado
              const hasTasksInProject = [
                ...memberData.activities,
                ...memberData.subtasks
              ].some((task: any) => task.project?.id.toString() === selectedProjectId);
              
              return hasTasksInProject;
            })
            .map((memberData) => {
            const allTasks = [
              ...memberData.activities.map(a => ({ ...a, type: 'activity' as const })),
              ...memberData.subtasks.map(s => ({ ...s, type: 'subtask' as const }))
            ];
            
            // Função para verificar se tarefa está atrasada
            const isOverdue = (task: typeof allTasks[0]) => {
              if (task.completed) return false;
              if (!task.endDate) return false;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const endDate = new Date(task.endDate);
              endDate.setHours(0, 0, 0, 0);
              return endDate < today;
            };
            
            // Aplicar filtros (projeto + status)
            const filteredTasks = allTasks.filter(task => {
              // Filtro por projeto
              if (selectedProjectId !== 'all' && task.project?.id.toString() !== selectedProjectId) {
                return false;
              }
              
              // Filtro por status
              switch (filterStatus) {
                case 'pending':
                  return !task.completed;
                case 'completed':
                  return task.completed;
                case 'overdue':
                  return isOverdue(task);
                case 'all':
                default:
                  return true;
              }
            });
            
            const pendingTasks = allTasks.filter(t => !t.completed);
            const completedTasks = allTasks.filter(t => t.completed);
            const overdueTasks = allTasks.filter(isOverdue);

            return (
              <Card key={memberData.member.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{memberData.member.name}</CardTitle>
                      {memberData.member.email && (
                        <CardDescription className="mt-1">
                          {memberData.member.email}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {memberData.totalTasks} {memberData.totalTasks === 1 ? 'tarefa' : 'tarefas'}
                    </Badge>
                  </div>
                  
                  {/* Estatísticas */}
                  <div className="flex gap-4 mt-4 text-sm flex-wrap">
                    <div className="flex items-center gap-1">
                      <Circle className="h-4 w-4 text-yellow-500" />
                      <span className="text-muted-foreground">{pendingTasks.length} pendentes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">{completedTasks.length} concluídas</span>
                    </div>
                    {overdueTasks.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Circle className="h-4 w-4 text-red-500 fill-red-500" />
                        <span className="text-muted-foreground">{overdueTasks.length} atrasadas</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {allTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma tarefa atribuída
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma tarefa {filterStatus === 'pending' ? 'pendente' : filterStatus === 'completed' ? 'concluída' : filterStatus === 'overdue' ? 'atrasada' : ''}
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event: DragEndEvent) => {
                        const { active, over } = event;
                        
                        if (over && active.id !== over.id) {
                          const oldIndex = allTasks.findIndex(t => `${t.type}-${t.id}` === active.id);
                          const newIndex = allTasks.findIndex(t => `${t.type}-${t.id}` === over.id);
                          
                          const reorderedTasks = arrayMove(allTasks, oldIndex, newIndex);
                          
                          // Salvar nova ordem no backend
                          const taskOrders = reorderedTasks.map((task, index) => ({
                            type: task.type,
                            id: task.id,
                            order: index,
                          }));
                          
                          reorderMutation.mutate({
                            memberId: memberData.member.id,
                            taskOrders,
                          });
                        }
                      }}
                    >
                      <SortableContext
                        items={filteredTasks.map(t => `${t.type}-${t.id}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {filteredTasks.map((task) => {
                            const taskKey = `${task.type}-${task.id}`;
                            const isSelected = selectedTasks.has(taskKey);
                            
                            return (
                              <SortableTaskItem
                                key={taskKey}
                                task={task}
                                isSelected={isSelected}
                                onToggle={() => toggleTaskSelection(taskKey)}
                                formatDate={formatDate}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}

                  {/* Botão de execução */}
                  {allTasks.length > 0 && (
                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      disabled={selectedTasks.size === 0}
                      onClick={() => {
                        setCurrentMemberId(memberData.member.id);
                        setExecuteModalOpen(true);
                      }}
                    >
                      Executar {selectedTasks.size > 0 ? `(${selectedTasks.size})` : ''}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {teamTasks?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum colaborador cadastrado. Cadastre colaboradores na página de Equipe.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Execução de Tarefas */}
      <ExecuteTasksModal
        open={executeModalOpen}
        onOpenChange={setExecuteModalOpen}
        selectedTasks={selectedTasks}
        teamTasks={teamTasks || []}
        memberId={currentMemberId}
        onSuccess={() => {
          setSelectedTasks(new Set());
          setExecuteModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
}

// Componente Modal de Execução de Tarefas
interface ExecuteTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTasks: Set<string>;
  teamTasks: any[];
  memberId: number | null;
  onSuccess: () => void;
}

// Componente para item drag and drop
function SortableTaskItem({ task, isSelected, onToggle, formatDate }: {
  task: any;
  isSelected: boolean;
  onToggle: () => void;
  formatDate: (date: Date | string | null) => string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${task.type}-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border transition-colors ${
        isSelected ? 'bg-primary/5 border-primary' : 'bg-card hover:bg-accent/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Handle de arrasto */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.name}
              </p>
              
              {/* Tipo e projeto */}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {task.type === 'activity' ? 'Atividade' : 'Subtarefa'}
                </Badge>
                {task.project && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Folder className="h-3 w-3" />
                    <span>{task.project.name}</span>
                  </div>
                )}
              </div>

              {/* Subtarefa: mostrar atividade pai */}
              {task.type === 'subtask' && 'activity' in task && task.activity && (
                <p className="text-xs text-muted-foreground mt-1">
                  Atividade: {task.activity.name}
                </p>
              )}
            </div>

            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (() => {
              // Verificar se está atrasada
              if (!task.endDate) return <Circle className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const endDate = new Date(task.endDate);
              endDate.setHours(0, 0, 0, 0);
              const isOverdue = endDate < today;
              
              return isOverdue ? (
                <Circle className="h-5 w-5 text-red-500 fill-red-500 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              );
            })()}
          </div>

          {/* Datas */}
          {(task.startDate || task.endDate) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDate(task.startDate)} - {formatDate(task.endDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExecuteTasksModal({
  open,
  onOpenChange,
  selectedTasks,
  teamTasks,
  memberId,
  onSuccess,
}: ExecuteTasksModalProps) {
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  const utils = trpc.useUtils();
  
  const completeTasksMutation = trpc.projects.completeTasksWithComments.useMutation({
    onSuccess: async () => {
      toast.success("Tarefas concluídas com sucesso!");
      await utils.projects.getTeamTasks.invalidate();
      onSuccess();
      setTaskComments({});
    },
    onError: (error) => {
      toast.error(`Erro ao concluir tarefas: ${error.message}`);
    },
  });

  // Coletar tarefas selecionadas de todos os membros
  const getSelectedTasksData = () => {
    const tasksData: Array<{ type: 'activity' | 'subtask', id: number, name: string, comment?: string }> = [];
    
    for (const memberData of teamTasks) {
      const allTasks = [
        ...memberData.activities.map((a: any) => ({ ...a, type: 'activity' as const })),
        ...memberData.subtasks.map((s: any) => ({ ...s, type: 'subtask' as const }))
      ];
      
      for (const task of allTasks) {
        const taskKey = `${task.type}-${task.id}`;
        if (selectedTasks.has(taskKey)) {
          tasksData.push({
            type: task.type,
            id: task.id,
            name: task.name,
            comment: taskComments[taskKey],
          });
        }
      }
    }
    
    return tasksData;
  };

  const handleExecute = () => {
    if (!memberId) {
      toast.error("Erro: ID do colaborador não encontrado");
      return;
    }

    const tasksData = getSelectedTasksData();
    
    completeTasksMutation.mutate({
      tasks: tasksData.map(t => ({
        type: t.type,
        id: t.id,
        comment: t.comment,
      })),
      memberId,
    });
  };

  const tasksData = getSelectedTasksData();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Executar Tarefas</DialogTitle>
          <DialogDescription>
            Marque as tarefas como concluídas e adicione comentários opcionais
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {tasksData.map((task) => {
            const taskKey = `${task.type}-${task.id}`;
            
            return (
              <div key={taskKey} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{task.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {task.type === 'activity' ? 'Atividade' : 'Subtarefa'}
                    </Badge>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`comment-${taskKey}`} className="text-sm text-muted-foreground">
                    Comentário (opcional)
                  </Label>
                  <Textarea
                    id={`comment-${taskKey}`}
                    placeholder="Adicione um comentário sobre a conclusão desta tarefa..."
                    value={taskComments[taskKey] || ''}
                    onChange={(e) => {
                      setTaskComments(prev => ({
                        ...prev,
                        [taskKey]: e.target.value,
                      }));
                    }}
                    rows={2}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={completeTasksMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExecute}
            disabled={completeTasksMutation.isPending}
          >
            {completeTasksMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Concluindo...
              </>
            ) : (
              `Concluir ${tasksData.length} ${tasksData.length === 1 ? 'tarefa' : 'tarefas'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
