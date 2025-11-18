import { useState } from "react";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X, ChevronRight, ChevronDown, GripVertical, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ProjectPhase = "planejamento" | "desenvolvimento" | "testes" | "entrega" | "finalizado";

// Componente de Avatar do Usuário
const UserAvatar = ({ name }: { name: string }) => {
  const initial = name.charAt(0).toUpperCase();
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-red-500",
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className={`w-7 h-7 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-semibold`}>
      {initial}
    </div>
  );
};

interface PhaseActivitiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  phase: ProjectPhase;
  phaseName: string;
}

interface Activity {
  id: number;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  completed: number;
  progress: number;
  assignedTo?: number | null;
  assignee?: { id: number; name: string | null; email: string | null } | null;
}

interface Subtask {
  id: number;
  activityId: number;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  completed: number;
  assignedTo?: number | null;
  assignee?: { id: number; name: string | null; email: string | null } | null;
}

interface SubtaskRowsProps {
  activityId: number;
  addingSubtaskTo: number | null;
  setAddingSubtaskTo: (id: number | null) => void;
  newSubtaskName: string;
  setNewSubtaskName: (name: string) => void;
  newSubtaskStartDate: string;
  setNewSubtaskStartDate: (date: string) => void;
  newSubtaskEndDate: string;
  setNewSubtaskEndDate: (date: string) => void;
  handleAddSubtask: (activityId: number) => void;
  editingSubtaskId: number | null;
  editSubtaskName: string;
  setEditSubtaskName: (name: string) => void;
  editSubtaskStartDate: string;
  setEditSubtaskStartDate: (date: string) => void;
  editSubtaskEndDate: string;
  setEditSubtaskEndDate: (date: string) => void;
  handleStartEditSubtask: (subtask: Subtask, activityId: number) => void;
  handleSaveEditSubtask: (activityId: number) => void;
  handleCancelEditSubtask: () => void;
  toggleSubtaskMutation: any;
  deleteSubtaskMutation: any;
  newSubtaskAssignedTo: string;
  setNewSubtaskAssignedTo: (value: string) => void;
  editSubtaskAssignedTo: string;
  setEditSubtaskAssignedTo: (value: string) => void;
  teamMembers: Array<{ userId: number; userName: string | null; userEmail: string | null }>;
}

// Componente sortable para cada linha de atividade
interface SortableActivityRowProps {
  activity: Activity;
  editingId: number | null;
  editName: string;
  editStartDate: string;
  editEndDate: string;
  expandedActivities: Set<number>;
  formatDate: (date: Date | null) => string;
  calculateDuration: (startDate: Date | null, endDate: Date | null) => string;
  handleStartEdit: (activity: Activity) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  toggleExpanded: (id: number) => void;
  toggleMutation: any;
  deleteMutation: any;
  updateMutation: any;
  setEditName: (name: string) => void;
  setEditStartDate: (date: string) => void;
  setEditEndDate: (date: string) => void;
}

function SortableActivityRow({
  activity,
  editingId,
  editName,
  editStartDate,
  editEndDate,
  expandedActivities,
  formatDate,
  calculateDuration,
  handleStartEdit,
  handleSaveEdit,
  handleCancelEdit,
  toggleExpanded,
  toggleMutation,
  deleteMutation,
  updateMutation,
  setEditName,
  setEditStartDate,
  setEditEndDate,
}: SortableActivityRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`${
        activity.completed === 1
          ? "bg-green-50/50 hover:bg-green-50"
          : "hover:bg-muted/30"
      } ${isDragging ? "bg-blue-100 shadow-lg" : ""}`}
    >
      {editingId === activity.id ? (
        // Modo de edição inline
        <>
          <TableCell className="py-2">
            <div className="text-muted-foreground cursor-not-allowed">
              <GripVertical className="h-4 w-4" />
            </div>
          </TableCell>
          <TableCell>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-9"
            />
          </TableCell>
          <TableCell>
            <Input
              type="date"
              value={editStartDate}
              onChange={(e) => setEditStartDate(e.target.value)}
              className="h-9"
            />
          </TableCell>
          <TableCell>
            <Input
              type="date"
              value={editEndDate}
              onChange={(e) => setEditEndDate(e.target.value)}
              className="h-9"
            />
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            -
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {editStartDate && editEndDate
              ? calculateDuration(new Date(editStartDate), new Date(editEndDate))
              : "-"}
          </TableCell>
          <TableCell>
            <div className="text-xs text-muted-foreground text-center">Editando...</div>
          </TableCell>
          <TableCell colSpan={2} className="text-center">
            <div className="flex gap-1 justify-center">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="h-8"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </>
      ) : (
        // Modo de visualização
        <>
          <TableCell className="py-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleExpanded(activity.id)}
                className="h-6 w-6 p-0"
              >
                {expandedActivities.has(activity.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <span
                className={`font-medium ${
                  activity.completed === 1 ? "line-through text-muted-foreground" : ""
                }`}
              >
                {activity.name}
              </span>
            </div>
          </TableCell>
          <TableCell className="text-sm">
            {formatDate(activity.startDate)}
          </TableCell>
          <TableCell className="text-sm">
            {formatDate(activity.endDate)}
          </TableCell>
          <TableCell>
            {activity.assignee ? (
              <div className="flex items-center gap-2">
                <UserAvatar name={activity.assignee.name || "?"} />
                <span className="text-sm">{activity.assignee.name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {calculateDuration(activity.startDate, activity.endDate)}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    activity.completed === 1
                      ? "bg-green-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${activity.progress || 0}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground min-w-[35px]">
                {activity.progress || 0}%
              </span>
            </div>
          </TableCell>
          <TableCell className="text-center">
            <Button
              size="sm"
              variant={activity.completed === 1 ? "default" : "outline"}
              onClick={() => toggleMutation.mutate({ id: activity.id })}
              className="h-8 px-3"
            >
              {activity.completed === 1 ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Concluída
                </>
              ) : (
                "Pendente"
              )}
            </Button>
          </TableCell>
          <TableCell className="text-center">
            <div className="flex gap-1 justify-center">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStartEdit(activity)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm("Deseja realmente excluir esta atividade?")) {
                    deleteMutation.mutate({ id: activity.id });
                  }
                }}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </>
      )}
    </TableRow>
  );
}

function SubtaskRows({
  activityId,
  addingSubtaskTo,
  setAddingSubtaskTo,
  newSubtaskName,
  setNewSubtaskName,
  newSubtaskStartDate,
  setNewSubtaskStartDate,
  newSubtaskEndDate,
  setNewSubtaskEndDate,
  handleAddSubtask,
  editingSubtaskId,
  editSubtaskName,
  setEditSubtaskName,
  editSubtaskStartDate,
  setEditSubtaskStartDate,
  editSubtaskEndDate,
  setEditSubtaskEndDate,
  handleStartEditSubtask,
  handleSaveEditSubtask,
  handleCancelEditSubtask,
  toggleSubtaskMutation,
  deleteSubtaskMutation,
  newSubtaskAssignedTo,
  setNewSubtaskAssignedTo,
  editSubtaskAssignedTo,
  setEditSubtaskAssignedTo,
  teamMembers,
}: SubtaskRowsProps) {
  const { data: subtasks = [] } = trpc.projects.getPhaseSubtasks.useQuery(
    { activityId },
    { enabled: true }
  );

  return (
    <>
      {/* Botão para adicionar subtarefa */}
      {addingSubtaskTo !== activityId && (
        <TableRow className="bg-blue-50/30">
          <TableCell colSpan={9} className="py-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAddingSubtaskTo(activityId)}
              className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Subtarefa
            </Button>
          </TableCell>
        </TableRow>
      )}

      {/* Formulário de adicionar subtarefa */}
      {addingSubtaskTo === activityId && (
        <TableRow className="bg-blue-100/50">
          <TableCell className="py-2"></TableCell>
          <TableCell className="py-2">
            <div className="flex items-center gap-2 pl-8">
              <Input
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                placeholder="Nome da subtarefa..."
                className="h-8 bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSubtask(activityId);
                  } else if (e.key === 'Escape') {
                    setAddingSubtaskTo(null);
                    setNewSubtaskName("");
                    setNewSubtaskStartDate("");
                    setNewSubtaskEndDate("");
                  }
                }}
                autoFocus
              />
            </div>
          </TableCell>
          <TableCell className="py-2">
            <Input
              type="date"
              value={newSubtaskStartDate}
              onChange={(e) => setNewSubtaskStartDate(e.target.value)}
              className="h-8 bg-white"
            />
          </TableCell>
          <TableCell className="py-2">
            <Input
              type="date"
              value={newSubtaskEndDate}
              onChange={(e) => setNewSubtaskEndDate(e.target.value)}
              className="h-8 bg-white"
            />
          </TableCell>
          <TableCell className="py-2">
            <Select value={newSubtaskAssignedTo} onValueChange={setNewSubtaskAssignedTo}>
              <SelectTrigger className="h-8 bg-white">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId.toString()}>
                    {member.userName || member.userEmail || `Usuário ${member.userId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell colSpan={2} className="py-2 text-center">
            <div className="flex gap-1 justify-center">
              <Button
                size="sm"
                onClick={() => handleAddSubtask(activityId)}
                className="h-8"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAddingSubtaskTo(null);
                  setNewSubtaskName("");
                  setNewSubtaskStartDate("");
                  setNewSubtaskEndDate("");
                }}
                className="h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}

      {/* Lista de subtarefas */}
      {subtasks.map((subtask: Subtask) => (
        <TableRow key={subtask.id} className="bg-gray-50/50 hover:bg-gray-100/50">
          {editingSubtaskId === subtask.id ? (
            // Modo de edição
            <>
              <TableCell className="py-2"></TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2 pl-8">
                  <Input
                    value={editSubtaskName}
                    onChange={(e) => setEditSubtaskName(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEditSubtask(activityId);
                      } else if (e.key === 'Escape') {
                        handleCancelEditSubtask();
                      }
                    }}
                    autoFocus
                  />
                </div>
              </TableCell>
              <TableCell className="py-2">
                <Input
                  type="date"
                  value={editSubtaskStartDate}
                  onChange={(e) => setEditSubtaskStartDate(e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell className="py-2">
                <Input
                  type="date"
                  value={editSubtaskEndDate}
                  onChange={(e) => setEditSubtaskEndDate(e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell className="py-2">
                <Select value={editSubtaskAssignedTo} onValueChange={setEditSubtaskAssignedTo}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.userId} value={member.userId.toString()}>
                        {member.userName || member.userEmail || `Usuário ${member.userId}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell colSpan={3} className="py-2 text-center">
                <div className="flex gap-1 justify-center">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEditSubtask(activityId)}
                    className="h-8"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditSubtask}
                    className="h-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </>
          ) : (
            // Modo de visualização
            <>
              <TableCell className="py-2"></TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2 pl-8">
                  <input
                    type="checkbox"
                    checked={subtask.completed === 1}
                    onChange={() => toggleSubtaskMutation.mutate({ id: subtask.id })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span
                    className={`text-sm ${
                      subtask.completed === 1 ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {subtask.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-2 text-center text-sm">
                {subtask.startDate ? new Date(subtask.startDate).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
              <TableCell className="py-2 text-center text-sm">
                {subtask.endDate ? new Date(subtask.endDate).toLocaleDateString('pt-BR') : '-'}
              </TableCell>
              <TableCell className="py-2 text-center text-sm">
                {subtask.assignee ? (
                  <div className="flex items-center gap-2 justify-center">
                    <UserAvatar name={subtask.assignee.name || subtask.assignee.email || ''} />
                    <span>{subtask.assignee.name || subtask.assignee.email || `Usuário ${subtask.assignedTo}`}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="py-2 text-center text-sm text-muted-foreground">
                {subtask.startDate && subtask.endDate
                  ? `${Math.ceil((new Date(subtask.endDate).getTime() - new Date(subtask.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias`
                  : '-'}
              </TableCell>
              <TableCell className="py-2 text-center">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2 min-w-[60px]">
                    <div
                      className={`h-2 rounded-full ${
                        subtask.completed === 1 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: subtask.completed === 1 ? '100%' : '50%' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[35px]">
                    {subtask.completed === 1 ? '100%' : '50%'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-2 text-center">
                <Badge variant={subtask.completed === 1 ? "default" : "secondary"} className="text-xs">
                  {subtask.completed === 1 ? "Concluída" : "Pendente"}
                </Badge>
              </TableCell>
              <TableCell className="py-2 text-center">
                <div className="flex gap-1 justify-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEditSubtask(subtask, activityId)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Deseja realmente excluir esta subtarefa?")) {
                        deleteSubtaskMutation.mutate({ id: subtask.id });
                      }
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </>
          )}
        </TableRow>
      ))}
    </>
  );
}

export function PhaseActivitiesModal({ open, onOpenChange, projectId, phase, phaseName }: PhaseActivitiesModalProps) {
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityStartDate, setNewActivityStartDate] = useState("");
  const [newActivityEndDate, setNewActivityEndDate] = useState("");
  const [newActivityAssignedTo, setNewActivityAssignedTo] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState<string>("");
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<number | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [newSubtaskStartDate, setNewSubtaskStartDate] = useState("");
  const [newSubtaskEndDate, setNewSubtaskEndDate] = useState("");
  const [newSubtaskAssignedTo, setNewSubtaskAssignedTo] = useState<string>("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editingSubtaskActivityId, setEditingSubtaskActivityId] = useState<number | null>(null);
  const [editSubtaskName, setEditSubtaskName] = useState("");
  const [editSubtaskStartDate, setEditSubtaskStartDate] = useState("");
  const [editSubtaskEndDate, setEditSubtaskEndDate] = useState("");
  const [editSubtaskAssignedTo, setEditSubtaskAssignedTo] = useState<string>("");
  const [localActivities, setLocalActivities] = useState<Activity[]>([]);

  const utils = trpc.useUtils();

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: activities = [], isLoading } = trpc.projects.getPhaseActivities.useQuery(
    { projectId, phase },
    { enabled: open }
  );

  const { data: teamMembers = [] } = trpc.projects.getTeamMembers.useQuery(
    { projectId },
    { enabled: open }
  );

  // Sincronizar localActivities com activities do servidor
  React.useEffect(() => {
    if (activities.length > 0) {
      setLocalActivities(activities);
    }
  }, [activities]);

  const reorderMutation = trpc.projects.reorderPhaseActivities.useMutation({
    onSuccess: () => {
      utils.projects.getPhaseActivities.invalidate({ projectId, phase });
      toast.success("Ordem atualizada!");
    },
    onError: () => {
      toast.error("Erro ao reordenar atividades");
      // Reverter para ordem original em caso de erro
      setLocalActivities(activities);
    },
  });

  const createMutation = trpc.projects.createPhaseActivity.useMutation({
    onSuccess: async () => {
      await utils.projects.getPhaseActivities.invalidate({ projectId, phase });
      await utils.projects.getPhaseActivities.refetch({ projectId, phase });
      setNewActivityName("");
      setNewActivityStartDate("");
      setNewActivityEndDate("");
      setNewActivityAssignedTo("");
      toast.success("Atividade adicionada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao adicionar atividade");
    },
  });

  const updateMutation = trpc.projects.updatePhaseActivity.useMutation({
    onSuccess: async () => {
      await utils.projects.getPhaseActivities.invalidate({ projectId, phase });
      await utils.projects.getPhaseActivities.refetch({ projectId, phase });
      setEditingId(null);
      toast.success("Atividade atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar atividade");
    },
  });

  const toggleMutation = trpc.projects.togglePhaseActivityCompleted.useMutation({
    onSuccess: () => {
      utils.projects.getPhaseActivities.invalidate({ projectId, phase });
    },
  });

  const deleteMutation = trpc.projects.deletePhaseActivity.useMutation({
    onSuccess: () => {
      utils.projects.getPhaseActivities.invalidate({ projectId, phase });
      toast.success("Atividade removida!");
    },
    onError: () => {
      toast.error("Erro ao remover atividade");
    },
  });

  // Subtasks mutations
  const createSubtaskMutation = trpc.projects.createPhaseSubtask.useMutation({
    onSuccess: async (_, variables) => {
      await utils.projects.getPhaseSubtasks.invalidate({ activityId: variables.activityId });
      await utils.projects.getPhaseSubtasks.refetch({ activityId: variables.activityId });
      // Também refetch das atividades para atualizar dados do assignee
      await utils.projects.getPhaseActivities.invalidate({ projectId, phase });
      await utils.projects.getPhaseActivities.refetch({ projectId, phase });
      setAddingSubtaskTo(null);
      setNewSubtaskName("");
      setNewSubtaskStartDate("");
      setNewSubtaskEndDate("");
      setNewSubtaskAssignedTo("");
      toast.success("Subtarefa adicionada!");
    },
    onError: () => {
      toast.error("Erro ao adicionar subtarefa");
    },
  });

  const updateSubtaskMutation = trpc.projects.updatePhaseSubtask.useMutation({
    onSuccess: async () => {
      // Refetch das subtarefas para atualizar dados do assignee
      if (editingSubtaskActivityId !== null) {
        await utils.projects.getPhaseSubtasks.invalidate({ activityId: editingSubtaskActivityId });
        await utils.projects.getPhaseSubtasks.refetch({ activityId: editingSubtaskActivityId });
      }
      // Refetch das atividades para atualizar dados do assignee
      await utils.projects.getPhaseActivities.invalidate({ projectId, phase });
      await utils.projects.getPhaseActivities.refetch({ projectId, phase });
      setEditingSubtaskId(null);
      setEditingSubtaskActivityId(null);
      toast.success("Subtarefa atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar subtarefa");
    },
  });

  const toggleSubtaskMutation = trpc.projects.togglePhaseSubtaskCompleted.useMutation({
    onSuccess: (_, variables) => {
      // Encontrar a atividade pai para invalidar
      const activityId = activities.find(a => 
        expandedActivities.has(a.id)
      )?.id;
      if (activityId) {
        utils.projects.getPhaseSubtasks.invalidate({ activityId });
      }
      // Invalidar query de atividades para atualizar barra de progresso
      utils.projects.getPhaseActivities.invalidate({ projectId, phase });
    },
  });

  const deleteSubtaskMutation = trpc.projects.deletePhaseSubtask.useMutation({
    onSuccess: () => {
      // Invalidar query de atividades para atualizar barra de progresso
      utils.projects.getPhaseActivities.invalidate({ projectId, phase });
      toast.success("Subtarefa removida!");
    },
    onError: (error) => {
      toast.error(`Erro ao remover subtarefa: ${error.message}`);
    },
  });

  // Export mutation
  const exportMutation = trpc.projects.exportScheduleExcel.useMutation({
    onSuccess: (result) => {
      // Criar link de download
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Cronograma exportado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao exportar cronograma: ${error.message}`);
    },
  });

  const handleExportExcel = () => {
    exportMutation.mutate({ projectId });
  };

  const handleAddActivity = () => {
    if (!newActivityName.trim()) {
      toast.error("Nome da atividade é obrigatório");
      return;
    }

    createMutation.mutate({
      projectId,
      phase,
      name: newActivityName,
      startDate: newActivityStartDate || undefined,
      endDate: newActivityEndDate || undefined,
      assignedTo: newActivityAssignedTo ? parseInt(newActivityAssignedTo) : undefined,
    });
  };

  const handleStartEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditName(activity.name);
    setEditStartDate(activity.startDate ? new Date(activity.startDate).toISOString().split('T')[0] : "");
    setEditEndDate(activity.endDate ? new Date(activity.endDate).toISOString().split('T')[0] : "");
    setEditAssignedTo(activity.assignedTo ? activity.assignedTo.toString() : "");
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      toast.error("Nome da atividade é obrigatório");
      return;
    }

    updateMutation.mutate({
      id: editingId!,
      name: editName,
      startDate: editStartDate || undefined,
      endDate: editEndDate || undefined,
      assignedTo: editAssignedTo ? parseInt(editAssignedTo) : null,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditStartDate("");
    setEditEndDate("");
  };

  const toggleExpanded = (activityId: number) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleAddSubtask = (activityId: number) => {
    if (!newSubtaskName.trim()) {
      toast.error("Nome da subtarefa é obrigatório");
      return;
    }

    createSubtaskMutation.mutate({
      activityId,
      name: newSubtaskName,
      startDate: newSubtaskStartDate || undefined,
      endDate: newSubtaskEndDate || undefined,
      assignedTo: newSubtaskAssignedTo ? parseInt(newSubtaskAssignedTo) : undefined,
    });
  };

  const handleStartEditSubtask = (subtask: Subtask, activityId: number) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskActivityId(activityId);
    setEditSubtaskName(subtask.name);
    setEditSubtaskStartDate(subtask.startDate ? new Date(subtask.startDate).toISOString().split('T')[0] : "");
    setEditSubtaskEndDate(subtask.endDate ? new Date(subtask.endDate).toISOString().split('T')[0] : "");
    setEditSubtaskAssignedTo(subtask.assignedTo ? subtask.assignedTo.toString() : "");
  };

  const handleSaveEditSubtask = (activityId: number) => {
    if (!editSubtaskName.trim()) {
      toast.error("Nome da subtarefa é obrigatório");
      return;
    }

    if (editingSubtaskId === null) return;

    updateSubtaskMutation.mutate({
      id: editingSubtaskId,
      name: editSubtaskName,
      startDate: editSubtaskStartDate || undefined,
      endDate: editSubtaskEndDate || undefined,
      assignedTo: editSubtaskAssignedTo ? parseInt(editSubtaskAssignedTo) : null,
    });
  };

  const handleCancelEditSubtask = () => {
    setEditingSubtaskId(null);
    setEditSubtaskName("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localActivities.findIndex((a) => a.id === active.id);
    const newIndex = localActivities.findIndex((a) => a.id === over.id);

    // Atualizar ordem local imediatamente para feedback visual
    const reorderedActivities = arrayMove(localActivities, oldIndex, newIndex);
    setLocalActivities(reorderedActivities);

    // Criar array de updates com nova ordem
    const updates = reorderedActivities.map((activity, index) => ({
      id: activity.id,
      order: index,
    }));

    // Enviar para o servidor
    reorderMutation.mutate({ updates });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const calculateDuration = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return "-";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  };

  const completedCount = localActivities.filter((a: Activity) => a.completed === 1).length;
  const totalCount = localActivities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] !max-w-[1600px] sm:!max-w-[1600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>Cronograma - {phaseName}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={exportMutation.isPending}
                className="h-8"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportMutation.isPending ? "Exportando..." : "Exportar Excel"}
              </Button>
              <Badge variant={progressPercent === 100 ? "default" : "secondary"} className="text-sm">
                {completedCount}/{totalCount} concluídas ({progressPercent}%)
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Formulário de nova atividade - estilo MS Project */}
          <div className="border rounded-lg bg-muted/20">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[30%]">Nome da Atividade</TableHead>
                  <TableHead className="w-[12%]">Data Início</TableHead>
                  <TableHead className="w-[12%]">Data Fim</TableHead>
                  <TableHead className="w-[15%]">Responsável</TableHead>
                  <TableHead className="w-[12%]">Duração</TableHead>
                  <TableHead className="w-[19%] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-blue-50/50 hover:bg-blue-50">
                  <TableCell>
                    <Input
                      value={newActivityName}
                      onChange={(e) => setNewActivityName(e.target.value)}
                      placeholder="Digite o nome da atividade..."
                      className="h-9 bg-white"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={newActivityStartDate}
                      onChange={(e) => setNewActivityStartDate(e.target.value)}
                      className="h-9 bg-white"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={newActivityEndDate}
                      onChange={(e) => setNewActivityEndDate(e.target.value)}
                      className="h-9 bg-white"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={newActivityAssignedTo} onValueChange={setNewActivityAssignedTo}>
                      <SelectTrigger className="h-9 bg-white">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member: any) => (
                          <SelectItem key={member.userId} value={member.userId.toString()}>
                            {member.userName || member.userEmail || `Usuário ${member.userId}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {newActivityStartDate && newActivityEndDate
                      ? calculateDuration(new Date(newActivityStartDate), new Date(newActivityEndDate))
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      onClick={handleAddActivity}
                      disabled={createMutation.isPending}
                      className="h-9"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Tabela de atividades - estilo MS Project */}
          <div className="border rounded-lg">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-semibold w-[3%]"></TableHead>
                    <TableHead className="font-semibold w-[20%]">Nome da Atividade</TableHead>
                    <TableHead className="font-semibold w-[10%]">Data Início</TableHead>
                    <TableHead className="font-semibold w-[10%]">Data Fim</TableHead>
                    <TableHead className="font-semibold w-[12%]">Responsável</TableHead>
                    <TableHead className="font-semibold w-[8%]">Duração</TableHead>
                    <TableHead className="font-semibold w-[18%]">Progresso</TableHead>
                    <TableHead className="font-semibold w-[10%] text-center">Status</TableHead>
                    <TableHead className="font-semibold w-[9%] text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Carregando atividades...
                      </TableCell>
                    </TableRow>
                  ) : localActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Nenhuma atividade cadastrada. Use o formulário acima para adicionar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <SortableContext
                      items={localActivities.map((a) => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {localActivities.map((activity: Activity) => (
                      <React.Fragment key={activity.id}>
                      <SortableActivityRow
                        activity={activity}
                        editingId={editingId}
                        editName={editName}
                        editStartDate={editStartDate}
                        editEndDate={editEndDate}
                        expandedActivities={expandedActivities}
                        formatDate={formatDate}
                        calculateDuration={calculateDuration}
                        handleStartEdit={handleStartEdit}
                        handleSaveEdit={handleSaveEdit}
                        handleCancelEdit={handleCancelEdit}
                        toggleExpanded={toggleExpanded}
                        toggleMutation={toggleMutation}
                        deleteMutation={deleteMutation}
                        updateMutation={updateMutation}
                        setEditName={setEditName}
                        setEditStartDate={setEditStartDate}
                        setEditEndDate={setEditEndDate}
                      />
                      {/* Subtarefas */}
                      {expandedActivities.has(activity.id) && (
                        <SubtaskRows
                          activityId={activity.id}
                          addingSubtaskTo={addingSubtaskTo}
                          setAddingSubtaskTo={setAddingSubtaskTo}
                          newSubtaskName={newSubtaskName}
                          setNewSubtaskName={setNewSubtaskName}
                          newSubtaskStartDate={newSubtaskStartDate}
                          setNewSubtaskStartDate={setNewSubtaskStartDate}
                          newSubtaskEndDate={newSubtaskEndDate}
                          setNewSubtaskEndDate={setNewSubtaskEndDate}
                          handleAddSubtask={handleAddSubtask}
                          editingSubtaskId={editingSubtaskId}
                          editSubtaskName={editSubtaskName}
                          setEditSubtaskName={setEditSubtaskName}
                          editSubtaskStartDate={editSubtaskStartDate}
                          setEditSubtaskStartDate={setEditSubtaskStartDate}
                          editSubtaskEndDate={editSubtaskEndDate}
                          setEditSubtaskEndDate={setEditSubtaskEndDate}
                          handleStartEditSubtask={handleStartEditSubtask}
                          handleSaveEditSubtask={handleSaveEditSubtask}
                          handleCancelEditSubtask={handleCancelEditSubtask}
                          toggleSubtaskMutation={toggleSubtaskMutation}
                          deleteSubtaskMutation={deleteSubtaskMutation}
                          newSubtaskAssignedTo={newSubtaskAssignedTo}
                          setNewSubtaskAssignedTo={setNewSubtaskAssignedTo}
                          editSubtaskAssignedTo={editSubtaskAssignedTo}
                          setEditSubtaskAssignedTo={setEditSubtaskAssignedTo}
                          teamMembers={teamMembers}
                        />
                      )}
                    </React.Fragment>
                      ))}
                    </SortableContext>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
