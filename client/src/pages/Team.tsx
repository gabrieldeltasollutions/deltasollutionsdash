import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Users, Mail, Phone, Briefcase } from "lucide-react";
import { toast } from "sonner";

const statusLabels = {
  ativo: "Ativo",
  inativo: "Inativo",
};

const statusColors = {
  ativo: "bg-green-100 text-green-800",
  inativo: "bg-gray-100 text-gray-800",
};

export default function Team() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    hierarchyLevel: "" as "" | "colaborador" | "lider" | "gerente" | "comprador" | "diretor" | "financeiro",
    hourlyRate: "",
    specialization: "",
    status: "ativo" as "ativo" | "inativo",
    hireDate: "",
    notes: "",
  });

  const { data: teamMembers = [], refetch } = trpc.team.list.useQuery();
  const createMutation = trpc.team.create.useMutation();
  const updateMutation = trpc.team.update.useMutation();
  const deleteMutation = trpc.team.delete.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome do colaborador é obrigatório");
      return;
    }

    try {
      const memberData = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role || undefined,
        hierarchyLevel: formData.hierarchyLevel || undefined,
        hourlyRate: formData.hourlyRate ? parseInt(formData.hourlyRate) * 100 : undefined, // Converter para centavos
        specialization: formData.specialization || undefined,
        status: formData.status,
        hireDate: formData.hireDate || undefined,
        notes: formData.notes || undefined,
      };

      if (editingMember) {
        await updateMutation.mutateAsync({ id: editingMember.id, ...memberData });
        toast.success("Colaborador atualizado com sucesso!");
      } else {
        await createMutation.mutateAsync(memberData);
        toast.success("Colaborador cadastrado com sucesso!");
      }

      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Erro ao salvar colaborador");
      console.error(error);
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      role: member.role || "",
      hierarchyLevel: member.hierarchyLevel || "",
      hourlyRate: member.hourlyRate ? (member.hourlyRate / 100).toString() : "",
      specialization: member.specialization || "",
      status: member.status,
      hireDate: member.hireDate ? new Date(member.hireDate).toISOString().split("T")[0] : "",
      notes: member.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este colaborador?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Colaborador excluído com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir colaborador");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      hierarchyLevel: "",
      hourlyRate: "",
      specialization: "",
      status: "ativo",
      hireDate: "",
      notes: "",
    });
    setEditingMember(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "Não definido";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Não informada";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Equipe</h1>
            <p className="text-muted-foreground">Gerencie os colaboradores da sua equipe</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMember ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
                <DialogDescription>
                  {editingMember ? "Atualize as informações do colaborador" : "Preencha os dados do novo colaborador"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="joao@exemplo.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Cargo/Função</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Ex: Operador CNC"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hierarchyLevel">Nível Hierárquico (Aprovações)</Label>
                    <Select value={formData.hierarchyLevel} onValueChange={(value: any) => setFormData({ ...formData, hierarchyLevel: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colaborador">Colaborador (sem permissão)</SelectItem>
                        <SelectItem value="lider">Líder (aprova pendentes)</SelectItem>
                        <SelectItem value="gerente">Gerente (aprova após líder)</SelectItem>
                        <SelectItem value="comprador">Comprador (faz cotações)</SelectItem>
                        <SelectItem value="diretor">Diretor (aprova cotações)</SelectItem>
                        <SelectItem value="financeiro">Financeiro (aprova final)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="specialization">Especialização</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="Ex: Torno CNC, Fresadora"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hourlyRate">Custo Hora (R$)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="hireDate">Data de Contratação</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Anotações adicionais sobre o colaborador..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingMember ? "Atualizar" : "Cadastrar"} Colaborador
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {teamMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum colaborador cadastrado</h3>
              <p className="text-muted-foreground mb-4">Comece adicionando membros à sua equipe</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Colaborador
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{member.name}</CardTitle>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColors[member.status]}`}>
                        {statusLabels[member.status]}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {member.role && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{member.role}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.specialization && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Especialização:</span>
                      <span className="font-medium">{member.specialization}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custo/Hora:</span>
                    <span className="font-medium">{formatCurrency(member.hourlyRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contratação:</span>
                    <span>{formatDate(member.hireDate)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
