import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface GanttChartModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function GanttChartModal({ projectId, isOpen, onClose }: GanttChartModalProps) {
  const { data: scheduleData, isLoading } = trpc.projects.getSchedule.useQuery(
    { projectId },
    { enabled: isOpen }
  );
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());

  const toggleActivity = (activityId: number) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  if (!scheduleData) return null;

  const { project, activities } = scheduleData;
  
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

  // Gerar marcadores de data no topo do Gantt
  const generateDateMarkers = () => {
    const markers = [];
    const interval = Math.ceil(totalDays / 10); // Aproximadamente 10 marcadores
    
    for (let i = 0; i <= totalDays; i += interval) {
      const date = new Date(projectStart);
      date.setDate(date.getDate() + i);
      const position = (i / totalDays) * 100;
      
      markers.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        position: `${position}%`
      });
    }
    
    return markers;
  };

  const dateMarkers = generateDateMarkers();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Cronograma - {project.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {projectStart.toLocaleDateString('pt-BR')} - {projectEnd.toLocaleDateString('pt-BR')} ({totalDays} dias)
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="flex border rounded-lg overflow-hidden bg-background">
              {/* Coluna esquerda - Lista de tarefas (estilo MS Project) */}
              <div className="w-[50%] border-r bg-muted/30">
                <div className="sticky top-0 z-10 bg-muted border-b">
                  <div className="grid grid-cols-12 gap-2 p-3 text-xs font-semibold">
                    <div className="col-span-6">Nome da Tarefa</div>
                    <div className="col-span-2 text-center">Início</div>
                    <div className="col-span-2 text-center">Término</div>
                    <div className="col-span-2 text-center">Duração</div>
                  </div>
                </div>

                <div className="divide-y">
                  {activities.map((activity) => {
                    const isExpanded = expandedActivities.has(activity.id);
                    const hasSubtasks = activity.subtasks && activity.subtasks.length > 0;
                    const activityDuration = activity.startDate && activity.endDate
                      ? Math.ceil((new Date(activity.endDate).getTime() - new Date(activity.startDate).getTime()) / (1000 * 60 * 60 * 24))
                      : 0;

                    return (
                      <div key={activity.id}>
                        {/* Atividade principal */}
                        <div className={`grid grid-cols-12 gap-2 p-3 text-sm hover:bg-muted/50 ${activity.completed ? 'opacity-60' : ''}`}>
                          <div className="col-span-6 flex items-center gap-2">
                            {hasSubtasks && (
                              <button
                                onClick={() => toggleActivity(activity.id)}
                                className="hover:bg-muted rounded p-0.5"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <span className={`font-medium ${activity.completed ? 'line-through' : ''}`}>
                              {activity.name}
                            </span>
                          </div>
                          <div className="col-span-2 text-center text-xs">
                            {activity.startDate ? new Date(activity.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                          </div>
                          <div className="col-span-2 text-center text-xs">
                            {activity.endDate ? new Date(activity.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                          </div>
                          <div className="col-span-2 text-center text-xs">
                            {activityDuration > 0 ? `${activityDuration}d` : '-'}
                          </div>
                        </div>

                        {/* Subtarefas (se expandido) */}
                        {isExpanded && hasSubtasks && activity.subtasks.map((subtask) => {
                          const subtaskDuration = subtask.startDate && subtask.endDate
                            ? Math.ceil((new Date(subtask.endDate).getTime() - new Date(subtask.startDate).getTime()) / (1000 * 60 * 60 * 24))
                            : 0;

                          return (
                            <div
                              key={subtask.id}
                              className={`grid grid-cols-12 gap-2 p-3 pl-12 text-sm bg-muted/20 hover:bg-muted/40 ${subtask.completed ? 'opacity-60' : ''}`}
                            >
                              <div className="col-span-6">
                                <span className={`text-sm ${subtask.completed ? 'line-through' : ''}`}>
                                  {subtask.name}
                                </span>
                              </div>
                              <div className="col-span-2 text-center text-xs">
                                {subtask.startDate ? new Date(subtask.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                              </div>
                              <div className="col-span-2 text-center text-xs">
                                {subtask.endDate ? new Date(subtask.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                              </div>
                              <div className="col-span-2 text-center text-xs">
                                {subtaskDuration > 0 ? `${subtaskDuration}d` : '-'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coluna direita - Gráfico de Gantt */}
              <div className="flex-1 overflow-x-auto">
                <div className="min-w-[600px]">
                  {/* Cabeçalho com marcadores de data */}
                  <div className="sticky top-0 z-10 bg-muted border-b h-12 relative">
                    {dateMarkers.map((marker, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 border-l border-border"
                        style={{ left: marker.position }}
                      >
                        <span className="absolute top-1 left-1 text-[10px] text-muted-foreground">
                          {marker.date}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Barras do Gantt */}
                  <div className="relative">
                    {/* Linhas verticais de grade */}
                    {dateMarkers.map((marker, idx) => (
                      <div
                        key={idx}
                        className="absolute top-0 bottom-0 border-l border-border/30"
                        style={{ left: marker.position }}
                      />
                    ))}

                    {/* Barras de atividades */}
                    <div className="divide-y">
                      {activities.map((activity) => {
                        const isExpanded = expandedActivities.has(activity.id);
                        const hasSubtasks = activity.subtasks && activity.subtasks.length > 0;
                        const activityBar = calculateGanttBar(activity.startDate, activity.endDate);

                        return (
                          <div key={activity.id}>
                            {/* Barra da atividade */}
                            <div className="h-[52px] relative hover:bg-muted/30">
                              {activityBar && (
                                <div
                                  className={`absolute top-1/2 -translate-y-1/2 h-6 rounded ${
                                    activity.completed ? 'bg-green-500' : 'bg-blue-500'
                                  } shadow-sm`}
                                  style={{
                                    left: activityBar.left,
                                    width: activityBar.width,
                                  }}
                                />
                              )}
                            </div>

                            {/* Barras das subtarefas (se expandido) */}
                            {isExpanded && hasSubtasks && activity.subtasks.map((subtask) => {
                              const subtaskBar = calculateGanttBar(subtask.startDate, subtask.endDate);

                              return (
                                <div key={subtask.id} className="h-[52px] relative bg-muted/10 hover:bg-muted/30">
                                  {subtaskBar && (
                                    <div
                                      className={`absolute top-1/2 -translate-y-1/2 h-4 rounded ${
                                        subtask.completed ? 'bg-green-400' : 'bg-blue-400'
                                      } shadow-sm`}
                                      style={{
                                        left: subtaskBar.left,
                                        width: subtaskBar.width,
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
