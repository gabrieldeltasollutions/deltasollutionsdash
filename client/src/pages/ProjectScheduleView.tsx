import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronDown, ChevronRight, ArrowLeft, Plus } from "lucide-react";
import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type DragState = {
  type: 'move' | 'resize-start' | 'resize-end';
  itemId: number;
  itemType: 'activity' | 'subtask';
  startX: number;
  originalStart: Date;
  originalEnd: Date;
};

type EditingField = {
  activityId: number;
  field: 'name' | 'startDate' | 'endDate' | 'duration';
  value: string;
};

export default function ProjectScheduleView() {
  const [, params] = useRoute("/projects/schedule/:id");
  const [, setLocation] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : 0;

  const { data: scheduleData, isLoading, refetch } = trpc.projects.getSchedule.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  
  const { data: teamMembers } = trpc.projects.getTeamMembers.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  const updateActivityMutation = trpc.activities.updateDates.useMutation({
    onSuccess: () => {
      toast.success("Datas atualizadas!");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar datas");
    },
  });

  const updateNameMutation = trpc.activities.updateName.useMutation({
    onSuccess: () => {
      toast.success("Nome atualizado!");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar nome");
    },
  });

  const updateAssigneeMutation = trpc.activities.updateAssignee.useMutation({
    onSuccess: () => {
      toast.success("Responsável atualizado!");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar responsável");
    },
  });

  const createActivityMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada!");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao criar tarefa");
    },
  });

  const updateSubtaskMutation = trpc.activities.updateSubtaskDates.useMutation({
    onSuccess: () => {
      toast.success("Datas atualizadas!");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar datas");
    },
  });

  const createSubtaskMutation = trpc.projects.createPhaseSubtask.useMutation({
    onSuccess: () => {
      toast.success("Subtarefa criada!");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao criar subtarefa");
    },
  });

  const updateSubtaskNameMutation = trpc.projects.updatePhaseSubtask.useMutation({
    onSuccess: () => {
      toast.success("Nome atualizado!");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar nome");
    },
  });

  const updateSubtaskDatesMutation = trpc.projects.updatePhaseSubtaskDates.useMutation({
    onSuccess: () => {
      toast.success("Datas atualizadas!");
      refetch();
    },
    onError: (error) => {
      console.error('[MUTATION ERROR - Datas]', error);
      toast.error("Erro ao atualizar datas");
    },
  });

  const updateSubtaskAssigneeMutation = trpc.projects.updatePhaseSubtaskAssignee.useMutation({
    onSuccess: () => {
      toast.success("Responsável atualizado!");
      refetch();
    },
    onError: (error) => {
      console.error('[MUTATION ERROR]', error);
      toast.error("Erro ao atualizar responsável");
    },
  });

  const toggleActivity = (activityId: number) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const handleCreateActivity = (phase: string) => {
    const phaseName = phase.charAt(0).toUpperCase() + phase.slice(1);
    const name = prompt(`Nome da nova tarefa em ${phaseName}:`);
    if (!name) return;

    createActivityMutation.mutate({
      projectId,
      phase: phase as any,
      name,
    });
  };

  const handleCreateSubtask = (activityId: number, phase: string) => {
    const name = prompt("Nome da nova subtarefa:");
    if (!name) return;

    createSubtaskMutation.mutate({
      activityId,
      name,
    });
  };

  const handleSubtaskFieldEdit = (subtaskId: number, field: 'name' | 'startDate' | 'endDate' | 'duration', currentValue: string) => {
    setEditingField({ activityId: subtaskId, field, value: currentValue });
  };

  const handleSubtaskFieldSave = () => {
    if (!editingField) return;

    const { activityId: subtaskId, field, value } = editingField;

    if (field === 'duration') {
      // Buscar subtarefa atual
      let subtask: any = null;
      for (const activity of scheduleData?.activities || []) {
        if (activity.subtasks) {
          subtask = activity.subtasks.find(s => s.id === subtaskId);
          if (subtask) break;
        }
      }

      if (!subtask || !subtask.startDate) {
        toast.error("Defina a data inicial antes de definir a duração");
        setEditingField(null);
        return;
      }

      const durationDays = parseInt(value);
      if (isNaN(durationDays) || durationDays < 1) {
        toast.error("Duração deve ser um número maior que zero");
        setEditingField(null);
        return;
      }

      // Calcular data final = data inicial + duração
      const startDate = new Date(subtask.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);

      updateSubtaskDatesMutation.mutate({
        id: subtaskId,
        startDate: formatDateForInput(startDate),
        endDate: formatDateForInput(endDate),
      });
      
      setEditingField(null);
      return;
    }

    // Buscar subtarefa atual
    let subtask: any = null;
    for (const activity of scheduleData?.activities || []) {
      if (activity.subtasks) {
        subtask = activity.subtasks.find(s => s.id === subtaskId);
        if (subtask) break;
      }
    }

    if (!subtask) {
      setEditingField(null);
      return;
    }

    if (field === 'name') {
        updateSubtaskMutation.mutate({
        subtaskId: subtaskId,
        name: value,
        startDate: formatDateForInput(subtask.startDate) || undefined,
        endDate: formatDateForInput(subtask.endDate) || undefined,
        assignedTo: subtask.assignedTo || undefined,
      });
    } else if (field === 'startDate' || field === 'endDate') {
      if (!value) {
        setEditingField(null);
        return;
      }

      let startDate: string;
      let endDate: string;

      if (field === 'startDate') {
        // Usar valor diretamente do input (já está em YYYY-MM-DD)
        startDate = value;
        // Se não houver data de término, usar a data de início + 1 dia
        if (subtask.endDate) {
          endDate = formatDateForInput(subtask.endDate);
        } else {
          // Manipular string de data diretamente para evitar problema de timezone
          const [year, month, day] = value.split('-').map(Number);
          const nextDate = new Date(year, month - 1, day + 1);
          endDate = formatDateForInput(nextDate);
        }
      } else {
        // Usar valor diretamente do input (já está em YYYY-MM-DD)
        endDate = value;
        // Se não houver data de início, usar a data de término - 1 dia
        if (subtask.startDate) {
          startDate = formatDateForInput(subtask.startDate);
        } else {
          // Manipular string de data diretamente para evitar problema de timezone
          const [year, month, day] = value.split('-').map(Number);
          const prevDate = new Date(year, month - 1, day - 1);
          startDate = formatDateForInput(prevDate);
        }
      }

      // Validar que data de início seja anterior à data de término
      if (new Date(startDate) >= new Date(endDate)) {
        toast.error("Data de início deve ser anterior à data de término");
        setEditingField(null);
        return;
      }

      console.log('[UPDATE SUBTASK DATES] ID:', subtaskId, 'Start:', startDate, 'End:', endDate);
      updateSubtaskDatesMutation.mutate({
        id: subtaskId,
        startDate,
        endDate,
      });
    }

    setEditingField(null);
  };

  const handleSubtaskFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubtaskFieldSave();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  const handleFieldEdit = (activityId: number, field: 'name' | 'startDate' | 'endDate' | 'duration', currentValue: string) => {
    setEditingField({ activityId, field, value: currentValue });
  };

  const handleFieldSave = () => {
    if (!editingField) return;

    const { activityId, field, value } = editingField;

    if (field === 'name') {
      updateNameMutation.mutate({ activityId, name: value });
    } else if (field === 'duration') {
      // Buscar atividade atual
      const activity = scheduleData?.activities.find(a => a.id === activityId);
      if (!activity || !activity.startDate) {
        toast.error("Defina a data inicial antes de definir a duração");
        setEditingField(null);
        return;
      }

      const durationDays = parseInt(value);
      if (isNaN(durationDays) || durationDays < 1) {
        toast.error("Duração deve ser um número maior que zero");
        setEditingField(null);
        return;
      }

      // Calcular data final = data inicial + duração
      const startDate = new Date(activity.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + durationDays);

      const formattedStart = formatDateForInput(startDate);
      const formattedEnd = formatDateForInput(endDate);
      console.log('[UPDATE ACTIVITY DATES] ID:', activityId, 'Start:', formattedStart, 'Type:', typeof formattedStart, 'End:', formattedEnd, 'Type:', typeof formattedEnd);
      updateActivityMutation.mutate({
        activityId,
        startDate: formattedStart,
        endDate: formattedEnd,
      });
    } else if (field === 'startDate' || field === 'endDate') {
      // Buscar atividade atual para pegar a outra data
      const activity = scheduleData?.activities.find(a => a.id === activityId);
      if (!activity) return;

      // Se não houver valor, não salvar
      if (!value) {
        setEditingField(null);
        return;
      }

      let startDate: string;
      let endDate: string;

      if (field === 'startDate') {
        // Usar valor diretamente do input (já está em YYYY-MM-DD)
        startDate = value;
        // Se não houver data de término, usar a mesma data de início + 1 dia
        if (activity.endDate) {
          endDate = formatDateForInput(activity.endDate);
        } else {
          // Manipular string de data diretamente para evitar problema de timezone
          const [year, month, day] = value.split('-').map(Number);
          const nextDate = new Date(year, month - 1, day + 1);
          endDate = formatDateForInput(nextDate);
        }
      } else {
        // Usar valor diretamente do input (já está em YYYY-MM-DD)
        endDate = value;
        // Se não houver data de início, usar a mesma data de término - 1 dia
        if (activity.startDate) {
          startDate = formatDateForInput(activity.startDate);
        } else {
          // Manipular string de data diretamente para evitar problema de timezone
          const [year, month, day] = value.split('-').map(Number);
          const prevDate = new Date(year, month - 1, day - 1);
          startDate = formatDateForInput(prevDate);
        }
      }

      // Validar que data de início seja anterior à data de término
      if (new Date(startDate) >= new Date(endDate)) {
        toast.error("Data de início deve ser anterior à data de término");
        setEditingField(null);
        return;
      }

      console.log('[UPDATE ACTIVITY DATES 2] ID:', activityId, 'Start:', startDate, 'Type:', typeof startDate, 'End:', endDate, 'Type:', typeof endDate);
      updateActivityMutation.mutate({
        activityId,
        startDate,
        endDate,
      });
    }

    setEditingField(null);
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFieldSave();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  if (!scheduleData || !scheduleData.project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const { project, activities } = scheduleData;
  
  // Definir todas as fases do roadmap (em minúsculas como no banco de dados)
  const allPhases = ['planejamento', 'desenvolvimento', 'testes', 'entrega', 'finalizado'];
  
   // Função para capitalizar nome da fase
  const capitalizePhaseName = (phase: string) => {
    return phase.charAt(0).toUpperCase() + phase.slice(1);
  };

  // Função para converter data para formato YYYY-MM-DD de forma segura
  const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Função para garantir que a data seja uma string pura (evita conversão do superjson)
  const ensureDateString = (date: Date | string | null | undefined): string => {
    const formatted = formatDateForInput(date);
    // Forçar como string pura adicionando um espaço invisível e removendo
    // Isso evita que o superjson reconheça como data ISO
    return formatted ? String(formatted) : '';
  };
  
  // Agrupar atividades por fase
  const activitiesByPhase = activities.reduce((acc, activity) => {
    const phase = activity.phase || 'Sem Fase';
    if (!acc[phase]) {
      acc[phase] = [];
    }
    acc[phase].push(activity);
    return acc;
  }, {} as Record<string, typeof activities>);
  
  // Garantir que todas as fases existam no objeto, mesmo vazias
  allPhases.forEach(phase => {
    if (!activitiesByPhase[phase]) {
      activitiesByPhase[phase] = [];
    }
  });
  
  const phases = allPhases;
  
  // Calcular duração do projeto em dias
  const projectStart = new Date(project.startDate);
  const projectEnd = new Date(project.endDate);
  const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));

  // Função para calcular posição e largura da barra no Gantt
  const calculateGanttBar = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysFromStart = Math.ceil((start.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const leftPercent = (daysFromStart / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;
    
    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  // Gerar marcadores de data para o Gantt
  const generateDateMarkers = () => {
    const markers = [];
    const interval = Math.ceil(totalDays / 10); // Aproximadamente 10 marcadores
    
    for (let i = 0; i <= totalDays; i += interval) {
      const date = new Date(projectStart);
      date.setDate(date.getDate() + i);
      markers.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        position: `${(i / totalDays) * 100}%`
      });
    }
    
    return markers;
  };

  const dateMarkers = generateDateMarkers();

  // Funções de arrastar e soltar
  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'move' | 'resize-start' | 'resize-end',
    itemId: number,
    itemType: 'activity' | 'subtask',
    startDate: Date,
    endDate: Date
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      type,
      itemId,
      itemType,
      startX: e.clientX,
      originalStart: new Date(startDate),
      originalEnd: new Date(endDate),
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !ganttRef.current) return;
    // Visual feedback pode ser adicionado aqui
  };

  const handleMouseUp = () => {
    if (!dragState || !ganttRef.current) {
      setDragState(null);
      return;
    }

    const ganttWidth = ganttRef.current.offsetWidth;
    const deltaX = window.event ? (window.event as MouseEvent).clientX - dragState.startX : 0;
    const deltaDays = Math.round((deltaX / ganttWidth) * totalDays);

    // Calcular novas datas
    let newStart = new Date(dragState.originalStart);
    let newEnd = new Date(dragState.originalEnd);

    if (dragState.type === 'move') {
      newStart.setDate(newStart.getDate() + deltaDays);
      newEnd.setDate(newEnd.getDate() + deltaDays);
    } else if (dragState.type === 'resize-start') {
      newStart.setDate(newStart.getDate() + deltaDays);
      if (newStart >= newEnd) {
        newStart = new Date(newEnd);
        newStart.setDate(newStart.getDate() - 1);
      }
    } else if (dragState.type === 'resize-end') {
      newEnd.setDate(newEnd.getDate() + deltaDays);
      if (newEnd <= newStart) {
        newEnd = new Date(newStart);
        newEnd.setDate(newEnd.getDate() + 1);
      }
    }

    // Salvar no backend
    if (dragState.itemType === 'activity') {
      updateActivityMutation.mutate({
        activityId: dragState.itemId,
        startDate: formatDateForInput(newStart),
        endDate: formatDateForInput(newEnd),
      });
    } else {
      updateSubtaskMutation.mutate({
        subtaskId: dragState.itemId,
        startDate: formatDateForInput(newStart),
        endDate: formatDateForInput(newEnd),
      });
    }

    setDragState(null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full" onMouseUp={handleMouseUp}>
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/projects/schedule")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cronograma - {project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {projectStart.toLocaleDateString('pt-BR')} - {projectEnd.toLocaleDateString('pt-BR')} ({totalDays} dias)
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="flex border rounded-lg overflow-hidden bg-background h-full">
              {/* Coluna esquerda - Lista de tarefas (estilo MS Project) */}
              <div className="w-[50%] border-r bg-muted/30 overflow-auto">
                <div className="sticky top-0 z-10 bg-muted border-b">
                  <div className="grid grid-cols-12 gap-2 p-3 text-xs font-semibold">
                    <div className="col-span-4">Nome da Tarefa</div>
                    <div className="col-span-1 text-center">Duração</div>
                    <div className="col-span-2 text-center">Início</div>
                    <div className="col-span-2 text-center">Término</div>
                    <div className="col-span-3 text-center">Responsável</div>
                  </div>
                </div>

                <div>
                  {phases.map((phaseName) => (
                    <div key={phaseName}>
                      {/* Cabeçalho da Fase com botão Nova Tarefa */}
                      <div className="bg-primary/10 border-y border-primary/20 p-3 sticky top-12 z-[5] h-[41px] flex items-center justify-between">
                        <h3 className="font-bold text-sm text-primary">{capitalizePhaseName(phaseName)}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleCreateActivity(phaseName)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Nova Tarefa
                        </Button>
                      </div>
                      
                      {/* Atividades da Fase */}
                      <div className="divide-y">
                        {activitiesByPhase[phaseName].length === 0 ? (
                          <div className="p-6 text-center text-sm text-muted-foreground italic">
                            Nenhuma atividade criada nesta fase
                          </div>
                        ) : (
                          activitiesByPhase[phaseName].map((activity) => {
                    const isExpanded = expandedActivities.has(activity.id);
                    const hasSubtasks = activity.subtasks && activity.subtasks.length > 0;
                    const activityDuration = activity.startDate && activity.endDate
                      ? Math.ceil((new Date(activity.endDate).getTime() - new Date(activity.startDate).getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                    return (
                      <div key={activity.id}>
                        {/* Atividade principal */}
                        <div className={`grid grid-cols-12 gap-2 p-3 text-sm hover:bg-muted/50 h-[52px] ${activity.completed ? 'opacity-60' : ''}`}>
                          <div className="col-span-4 flex items-center gap-2">
                            {hasSubtasks && (
                              <button
                                onClick={() => toggleActivity(activity.id)}
                                className="hover:bg-muted rounded p-0.5"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleCreateSubtask(activity.id, phaseName)}
                              className="hover:bg-muted rounded p-0.5 text-muted-foreground hover:text-foreground"
                              title="Adicionar subtarefa"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {editingField?.activityId === activity.id && editingField.field === 'name' ? (
                              <Input
                                value={editingField.value}
                                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                onBlur={handleFieldSave}
                                onKeyDown={handleFieldKeyDown}
                                className="h-6 text-sm"
                                autoFocus
                              />
                            ) : (
                              <span
                                className={`font-medium cursor-pointer hover:underline ${activity.completed ? 'line-through' : ''}`}
                                onClick={() => handleFieldEdit(activity.id, 'name', activity.name)}
                              >
                                {activity.name}
                              </span>
                            )}
                          </div>
                          <div className="col-span-1 text-center text-xs">
                            {editingField?.activityId === activity.id && editingField.field === 'duration' ? (
                              <Input
                                type="number"
                                min="1"
                                value={editingField.value}
                                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                onBlur={handleFieldSave}
                                onKeyDown={handleFieldKeyDown}
                                className="h-6 text-xs"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:underline inline-block px-2 py-1 hover:bg-muted rounded"
                                onClick={() => handleFieldEdit(
                                  activity.id,
                                  'duration',
                                  activityDuration > 0 ? activityDuration.toString() : '1'
                                )}
                              >
                                {activityDuration > 0 ? `${activityDuration}d` : '-'}
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 text-center text-xs">
                            {editingField?.activityId === activity.id && editingField.field === 'startDate' ? (
                              <Input
                                type="date"
                                value={editingField.value}
                                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                onBlur={handleFieldSave}
                                onKeyDown={handleFieldKeyDown}
                                className="h-6 text-xs"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:underline"
                                onClick={() => handleFieldEdit(
                                  activity.id,
                                  'startDate',
                                  formatDateForInput(activity.startDate)
                                )}
                              >
                                {activity.startDate ? new Date(activity.startDate).toLocaleDateString('pt-BR') : '-'}
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 text-center text-xs">
                            {editingField?.activityId === activity.id && editingField.field === 'endDate' ? (
                              <Input
                                type="date"
                                value={editingField.value}
                                onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                onBlur={handleFieldSave}
                                onKeyDown={handleFieldKeyDown}
                                className="h-6 text-xs"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:underline"
                                onClick={() => handleFieldEdit(
                                  activity.id,
                                  'endDate',
                                  formatDateForInput(activity.endDate)
                                )}
                              >
                                {activity.endDate ? new Date(activity.endDate).toLocaleDateString('pt-BR') : '-'}
                              </span>
                            )}
                          </div>
                          <div className="col-span-3 text-center text-xs">
                            <Select
                              value={activity.assignedTo?.toString() || "none"}
                              onValueChange={(value) => {
                                updateAssigneeMutation.mutate({
                                  activityId: activity.id,
                                  assignedTo: value === "none" ? null : parseInt(value),
                                });
                              }}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue placeholder="Sem responsável" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem responsável</SelectItem>
                                {teamMembers?.map((member) => (
                                  <SelectItem key={member.userId} value={member.userId.toString()}>
                                    {member.userName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Subtarefas */}
                        {isExpanded && hasSubtasks && activity.subtasks.map((subtask) => {
                          const subtaskDuration = subtask.startDate && subtask.endDate
                            ? Math.ceil((new Date(subtask.endDate).getTime() - new Date(subtask.startDate).getTime()) / (1000 * 60 * 60 * 24))
                            : 0;

                          return (
                            <div
                              key={subtask.id}
                              className={`grid grid-cols-12 gap-2 p-3 pl-12 text-sm bg-muted/20 hover:bg-muted/40 h-[52px] relative z-10 ${subtask.completed ? 'opacity-60' : ''}`}
                            >
                              <div className="col-span-4">
                                {editingField?.activityId === subtask.id && editingField.field === 'name' ? (
                                  <Input
                                    value={editingField.value}
                                    onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                    onBlur={handleSubtaskFieldSave}
                                    onKeyDown={handleSubtaskFieldKeyDown}
                                    className="h-6 text-sm"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    className={`text-sm cursor-pointer hover:underline ${subtask.completed ? 'line-through' : ''}`}
                                    onClick={() => handleSubtaskFieldEdit(subtask.id, 'name', subtask.name)}
                                  >
                                    {subtask.name}
                                  </span>
                                )}
                              </div>
                              <div className="col-span-1 text-center text-xs">
                                {editingField?.activityId === subtask.id && editingField.field === 'duration' ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={editingField.value}
                                    onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                                    onBlur={handleSubtaskFieldSave}
                                    onKeyDown={handleSubtaskFieldKeyDown}
                                    className="h-6 text-xs"
                                    autoFocus
                                  />
                                ) : (
                                  <span
                                    className="cursor-pointer hover:underline inline-block px-2 py-1 hover:bg-muted rounded"
                                    onClick={() => handleSubtaskFieldEdit(
                                      subtask.id,
                                      'duration',
                                      subtaskDuration > 0 ? subtaskDuration.toString() : '1'
                                    )}
                                  >
                                    {subtaskDuration > 0 ? `${subtaskDuration}d` : '-'}
                                  </span>
                                )}
                              </div>
                              <div className="col-span-2 text-center text-xs relative z-50 pointer-events-auto">
                                <Input
                                  type="date"
                                  value={formatDateForInput(subtask.startDate)}
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    const newStartDateStr = e.target.value; // Já está no formato YYYY-MM-DD
                                    
                                    // Se não tem data final, apenas salvar data inicial
                                    if (!subtask.endDate) {
                                      updateSubtaskDatesMutation.mutate({
                                        id: subtask.id,
                                        startDate: newStartDateStr,
                                        endDate: null,
                                      });
                                      return;
                                    }
                                    
                                    const endDateStr = formatDateForInput(subtask.endDate);
                                    
                                    // Validar que data inicial < data final
                                    if (newStartDateStr >= endDateStr) {
                                      toast.error('Data de início deve ser anterior à data de término');
                                      return;
                                    }
                                    
                                    updateSubtaskDatesMutation.mutate({
                                      id: subtask.id,
                                      startDate: newStartDateStr,
                                      endDate: endDateStr,
                                    });
                                  }}
                                  className="h-6 text-xs w-full"
                                />
                              </div>
                              <div className="col-span-2 text-center text-xs relative z-50 pointer-events-auto">
                                <Input
                                  type="date"
                                  value={formatDateForInput(subtask.endDate)}
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    const newEndDateStr = e.target.value; // Já está no formato YYYY-MM-DD
                                    
                                    // Se não tem data inicial, apenas salvar data final
                                    if (!subtask.startDate) {
                                      updateSubtaskDatesMutation.mutate({
                                        id: subtask.id,
                                        startDate: null,
                                        endDate: newEndDateStr,
                                      });
                                      return;
                                    }
                                    
                                    const startDateStr = formatDateForInput(subtask.startDate);
                                    
                                    // Validar que data inicial < data final
                                    if (startDateStr >= newEndDateStr) {
                                      toast.error('Data de término deve ser posterior à data de início');
                                      return;
                                    }
                                    
                                    updateSubtaskDatesMutation.mutate({
                                      id: subtask.id,
                                      startDate: startDateStr,
                                      endDate: newEndDateStr,
                                    });
                                  }}
                                  className="h-6 text-xs w-full"
                                />
                              </div>
                              <div className="col-span-3 text-center text-xs relative z-50">
                                <Select
                                  value={subtask.assignedTo?.toString() || "none"}
                                  onValueChange={(value) => {
                                    const assignedTo = value === "none" ? null : parseInt(value);
                                    console.log('[SELECT CHANGE] Subtask ID:', subtask.id, 'AssignedTo:', assignedTo);
                                    updateSubtaskAssigneeMutation.mutate({
                                      id: subtask.id,
                                      assignedTo,
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-6 text-xs">
                                    <SelectValue placeholder="Sem responsável" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sem responsável</SelectItem>
                                    {teamMembers?.map((member) => (
                                      <SelectItem key={member.userId} value={member.userId.toString()}>
                                        {member.userName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna direita - Gráfico de Gantt */}
              <div className="flex-1 overflow-x-auto" ref={ganttRef} onMouseMove={handleMouseMove}>
                <div className="min-w-[600px] h-full">
                  {/* Cabeçalho com marcadores de data */}
                  <div className="sticky top-0 z-10 bg-muted border-b h-12 relative">
                    {dateMarkers.map((marker, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 border-l border-border"
                        style={{ left: marker.position }}
                      >
                        <span className="absolute top-2 left-1 text-xs text-muted-foreground">
                          {marker.date}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Barras do Gantt */}
                  <div className="relative">
                    {phases.map((phaseName) => (
                      <div key={`gantt-phase-${phaseName}`}>
                        {/* Cabeçalho da Fase no Gantt */}
                        <div className="h-[41px] bg-primary/10 border-y border-primary/20 sticky top-12 z-[5]" />
                        
                        {/* Barras das atividades da fase */}
                        {activitiesByPhase[phaseName].length === 0 ? (
                          <div className="h-[60px] border-b" />
                        ) : (
                          activitiesByPhase[phaseName].map((activity) => {
                      const isExpanded = expandedActivities.has(activity.id);
                      const hasSubtasks = activity.subtasks && activity.subtasks.length > 0;
                      const barStyle = calculateGanttBar(activity.startDate, activity.endDate);

                      return (
                        <div key={`gantt-${activity.id}`}>
                          {/* Barra da atividade */}
                          <div className="h-[52px] border-b relative">
                            {barStyle && (
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 h-6 rounded group ${
                                  activity.completed ? 'bg-green-500' : 'bg-blue-500'
                                } cursor-move hover:opacity-80`}
                                style={barStyle}
                                onMouseDown={(e) => handleMouseDown(
                                  e,
                                  'move',
                                  activity.id,
                                  'activity',
                                  activity.startDate!,
                                  activity.endDate!
                                )}
                              >
                                {/* Handle de redimensionar início */}
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    handleMouseDown(
                                      e,
                                      'resize-start',
                                      activity.id,
                                      'activity',
                                      activity.startDate!,
                                      activity.endDate!
                                    );
                                  }}
                                />
                                {/* Handle de redimensionar fim */}
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    handleMouseDown(
                                      e,
                                      'resize-end',
                                      activity.id,
                                      'activity',
                                      activity.startDate!,
                                      activity.endDate!
                                    );
                                  }}
                                />
                              </div>
                            )}
                            {/* Linhas de grade verticais */}
                            {dateMarkers.map((marker, idx) => (
                              <div
                                key={`grid-${activity.id}-${idx}`}
                                className="absolute top-0 bottom-0 border-l border-border/30"
                                style={{ left: marker.position }}
                              />
                            ))}
                          </div>

                          {/* Barras das subtarefas */}
                          {isExpanded && hasSubtasks && activity.subtasks.map((subtask) => {
                            const subtaskBarStyle = calculateGanttBar(subtask.startDate, subtask.endDate);

                            return (
                              <div key={`gantt-subtask-${subtask.id}`} className="h-[52px] border-b relative bg-muted/10">
                                {subtaskBarStyle && (
                                  <div
                                    className={`absolute top-1/2 -translate-y-1/2 h-4 rounded group ${
                                      subtask.completed ? 'bg-green-400' : 'bg-blue-400'
                                    } cursor-move hover:opacity-80`}
                                    style={subtaskBarStyle}
                                    onMouseDown={(e) => handleMouseDown(
                                      e,
                                      'move',
                                      subtask.id,
                                      'subtask',
                                      subtask.startDate!,
                                      subtask.endDate!
                                    )}
                                  >
                                    {/* Handle de redimensionar início */}
                                    <div
                                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleMouseDown(
                                          e,
                                          'resize-start',
                                          subtask.id,
                                          'subtask',
                                          subtask.startDate!,
                                          subtask.endDate!
                                        );
                                      }}
                                    />
                                    {/* Handle de redimensionar fim */}
                                    <div
                                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleMouseDown(
                                          e,
                                          'resize-end',
                                          subtask.id,
                                          'subtask',
                                          subtask.startDate!,
                                          subtask.endDate!
                                        );
                                      }}
                                    />
                                  </div>
                                )}
                                {/* Linhas de grade verticais */}
                                {dateMarkers.map((marker, idx) => (
                                  <div
                                    key={`grid-subtask-${subtask.id}-${idx}`}
                                    className="absolute top-0 bottom-0 border-l border-border/30"
                                    style={{ left: marker.position }}
                                  />
                                ))}
                              </div>
                            );
                          })}
                        </div>
                          );
                          })
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
