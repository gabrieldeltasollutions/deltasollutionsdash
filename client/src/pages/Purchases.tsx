import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, X, Check, CheckCircle2, XCircle, Clock, DollarSign, History, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function Purchases() {
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  if (projectsLoading) {
    return (
      <DashboardLayout>
        <div className="container py-8">
          <p>Carregando projetos...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Compras</h1>
        <p className="text-muted-foreground">Gerencie a lista de materiais de cada projeto</p>
      </div>

      <div className="space-y-6">
        {projects?.map((project) => (
          <ProjectPurchaseCard
            key={project.id}
            project={project}
            isExpanded={selectedProjectId === project.id}
            onToggle={() => setSelectedProjectId(selectedProjectId === project.id ? null : project.id)}
          />
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
}

interface ProjectPurchaseCardProps {
  project: any;
  isExpanded: boolean;
  onToggle: () => void;
}

// Mapeamento de status para labels e cores
const STATUS_CONFIG = {
  pending: { label: "Pendente Líder", color: "bg-yellow-500", icon: Clock },
  leader: { label: "Pendente Gerente", color: "bg-blue-500", icon: Clock },
  manager: { label: "Pendente Cotação", color: "bg-purple-500", icon: DollarSign },
  quotation: { label: "Pendente Diretor", color: "bg-orange-500", icon: Clock },
  director: { label: "Pendente Financeiro", color: "bg-indigo-500", icon: Clock },
  financial: { label: "Aprovado - Pode Comprar", color: "bg-green-500", icon: CheckCircle2 },
  purchased: { label: "Comprado - Aguardando Entrega", color: "bg-cyan-500", icon: Clock },
  received: { label: "Recebido", color: "bg-emerald-600", icon: CheckCircle2 },
  rejected: { label: "Rejeitado", color: "bg-red-500", icon: XCircle },
};

function ProjectPurchaseCard({ project, isExpanded, onToggle }: ProjectPurchaseCardProps) {
  const { data: materials, refetch } = trpc.projectMaterials.getByProject.useQuery(
    { projectId: project.id },
    { enabled: isExpanded }
  );
  
  // Obter nível hierárquico do usuário logado
  const { data: userLevel } = trpc.team.getMyHierarchyLevel.useQuery();
  const addMutation = trpc.projectMaterials.add.useMutation();
  const updateMutation = trpc.projectMaterials.update.useMutation();
  const deleteMutation = trpc.projectMaterials.delete.useMutation();
  const approveMutation = trpc.projectMaterials.approve.useMutation();
  const rejectMutation = trpc.projectMaterials.reject.useMutation();
  // Múltiplas cotações
  const addQuotationMutation = trpc.projectMaterials.addSupplierQuotation.useMutation();
  const updateQuotationMutation = trpc.projectMaterials.updateQuotation.useMutation();
  const deleteQuotationMutation = trpc.projectMaterials.deleteQuotation.useMutation();
  const setRecommendedMutation = trpc.projectMaterials.setRecommendedQuotation.useMutation();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; material: any; action: "approve" | "reject" }>({
    open: false,
    material: null,
    action: "approve"
  });
  const [approvalComments, setApprovalComments] = useState("");
  const [quotationData, setQuotationData] = useState({ value: 0, notes: "" });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; materialId: number | null }>({ open: false, materialId: null });
  
  // Modal de múltiplas cotações
  const [quotationsModal, setQuotationsModal] = useState<{ open: boolean; materialId: number | null; materialName: string }>({ 
    open: false, 
    materialId: null,
    materialName: ""
  });
  const [quotationForm, setQuotationForm] = useState({
    supplier: "",
    quotedPrice: 0,
    deliveryTime: "",
    paymentTerms: "",
    notes: ""
  });
  const [editingQuotationId, setEditingQuotationId] = useState<number | null>(null);

  // Modais de compra e recebimento
  const [purchaseModal, setPurchaseModal] = useState<{ open: boolean; materialId: number | null; materialName: string }>({
    open: false,
    materialId: null,
    materialName: ""
  });
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [receivingModal, setReceivingModal] = useState<{ open: boolean; materialId: number | null; materialName: string }>({
    open: false,
    materialId: null,
    materialName: ""
  });
  const [receivedBy, setReceivedBy] = useState("");

  // Filtro por setor
  const [sectorFilter, setSectorFilter] = useState<"all" | "Software" | "Hardware" | "Mecânica" | "Automação" | "Administrativo">("all");
  
  // Filtro por status
  const [statusFilter, setStatusFilter] = useState<"all" | "leader" | "manager" | "buyer" | "director" | "financial" | "purchased" | "received" | "rejected">("all");

  const confirmPurchaseMutation = trpc.projectMaterials.confirmPurchase.useMutation();
  const confirmReceivingMutation = trpc.projectMaterials.confirmReceiving.useMutation();

  const [formData, setFormData] = useState({
    itemName: "",
    quantity: 1,
    unit: "",
    unitPrice: 0,
    supplier: "",
    notes: "",
    imageUrl: "",
    requestingSector: "Software" as "Software" | "Hardware" | "Mecânica" | "Automação" | "Administrativo",
  });

  const resetForm = () => {
    setFormData({
      itemName: "",
      quantity: 1,
      unit: "",
      unitPrice: 0,
      supplier: "",
      notes: "",
      imageUrl: "",
      requestingSector: "Software" as "Software" | "Hardware" | "Mecânica" | "Automação" | "Administrativo",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    // Validar campos obrigatórios
    if (!formData.itemName.trim()) {
      toast.error("Nome do item é obrigatório");
      return;
    }
    if (!formData.unit.trim()) {
      toast.error("Unidade é obrigatória");
      return;
    }
    if (formData.quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }
    if (formData.unitPrice < 0) {
      toast.error("Preço unitário não pode ser negativo");
      return;
    }

    // Validar URL da imagem se fornecida
    if (formData.imageUrl && formData.imageUrl.trim()) {
      try {
        new URL(formData.imageUrl);
      } catch {
        toast.error("URL da imagem inválida");
        return;
      }
    }

    try {
      await addMutation.mutateAsync({
        projectId: project.id,
        ...formData,
        unitPrice: Math.round(formData.unitPrice * 100),
      });
      toast.success("Material adicionado com sucesso!");
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Erro ao adicionar material");
    }
  };

  const handleUpdate = async (id: number) => {
    // Validar campos obrigatórios
    if (!formData.itemName.trim()) {
      toast.error("Nome do item é obrigatório");
      return;
    }
    if (!formData.unit.trim()) {
      toast.error("Unidade é obrigatória");
      return;
    }
    if (formData.quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }
    if (formData.unitPrice < 0) {
      toast.error("Preço unitário não pode ser negativo");
      return;
    }

    // Validar URL da imagem se fornecida
    if (formData.imageUrl && formData.imageUrl.trim()) {
      try {
        new URL(formData.imageUrl);
      } catch {
        toast.error("URL da imagem inválida");
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        id,
        ...formData,
        unitPrice: Math.round(formData.unitPrice * 100),
      });
      toast.success("Material atualizado com sucesso!");
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar material");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este material?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Material excluído com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao excluir material");
    }
  };

  const exportToPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text(`Lista de Materiais - ${project.name}`, 14, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);
      
      // Filtros aplicados
      const sectorLabel = sectorFilter === 'all' ? 'Todos os Setores' : sectorFilter;
      const statusLabel = statusFilter === 'all' ? 'Todos os Status' : STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label || statusFilter;
      doc.text(`Filtros: Setor: ${sectorLabel} | Status: ${statusLabel}`, 14, 34);
      
      // Preparar dados da tabela
      const tableData = filteredMaterials.map(m => [
        m.itemName,
        m.quantity,
        m.unit,
        `R$ ${(m.unitPrice / 100).toFixed(2)}`,
        `R$ ${((m.quantity * m.unitPrice) / 100).toFixed(2)}`,
        m.requestingSector,
        STATUS_CONFIG[m.approvalStatus as keyof typeof STATUS_CONFIG]?.label || m.approvalStatus
      ]);
      
      // Adicionar tabela
      autoTable(doc, {
        startY: 40,
        head: [['Item', 'Qtd', 'Unidade', 'Preço Unit.', 'Total', 'Setor', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      });
      
      // Total geral
      const finalY = (doc as any).lastAutoTable.finalY || 40;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Geral: R$ ${(totalValue / 100).toFixed(2)}`, 14, finalY + 10);
      
      // Salvar PDF
      doc.save(`materiais-${project.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const startEdit = (material: any) => {
    setEditingId(material.id);
    setFormData({
      itemName: material.itemName,
      quantity: material.quantity,
      unit: material.unit,
      unitPrice: material.unitPrice / 100,
      supplier: material.supplier || "",
      notes: material.notes || "",
      imageUrl: material.imageUrl || "",
      requestingSector: material.requestingSector || "Software",
    });
  };

  const handleApprove = async () => {
    if (!approvalModal.material) return;

    try {
      if (approvalModal.action === "approve") {
        await approveMutation.mutateAsync({
          materialId: approvalModal.material.id,
          comments: approvalComments,
        });
        toast.success("Material aprovado com sucesso!");
      } else {
        await rejectMutation.mutateAsync({
          materialId: approvalModal.material.id,
          comments: approvalComments,
        });
        toast.success("Material rejeitado");
      }
      
      setApprovalModal({ open: false, material: null, action: "approve" });
      setApprovalComments("");
      setQuotationData({ value: 0, notes: "" });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar aprovação");
    }
  };

  const getRoleFromStatus = (status: string): string => {
    const roleMap: Record<string, string> = {
      pending: "leader",
      leader: "manager",
      manager: "buyer",
      quotation: "director",
      director: "financial",
    };
    return roleMap[status] || "unknown";
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseModal.materialId || !expectedDeliveryDate) {
      toast.error("Por favor, informe a data prevista de entrega");
      return;
    }

    try {
      await confirmPurchaseMutation.mutateAsync({
        materialId: purchaseModal.materialId,
        expectedDeliveryDate: new Date(expectedDeliveryDate),
      });
      toast.success("Compra confirmada com sucesso!");
      setPurchaseModal({ open: false, materialId: null, materialName: "" });
      setExpectedDeliveryDate("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao confirmar compra");
    }
  };

  const handleConfirmReceiving = async () => {
    if (!receivingModal.materialId || !receivedBy) {
      toast.error("Por favor, informe quem recebeu a mercadoria");
      return;
    }

    try {
      await confirmReceivingMutation.mutateAsync({
        materialId: receivingModal.materialId,
        receivedBy: receivedBy,
      });
      toast.success("Recebimento confirmado com sucesso!");
      setReceivingModal({ open: false, materialId: null, materialName: "" });
      setReceivedBy("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao confirmar recebimento");
    }
  };

  const getActionButton = (material: any) => {
    const status = material.approvalStatus;
    
    if (status === "rejected" || status === "received") {
      return null; // Sem ações para rejeitados ou recebidos
    }

    // Mapear status para nível hierárquico necessário
    const requiredLevel: Record<string, string> = {
      "pending": "lider",
      "leader": "gerente",
      "manager": "comprador",
      "quotation": "diretor",
      "director": "financeiro",
    };

    const required = requiredLevel[status];
    const hasPermission = userLevel === required;

    if (status === "manager") {
      // Comprador adiciona cotação
      if (!hasPermission) {
        return (
          <Badge variant="outline" className="text-xs">
            Aguardando Comprador
          </Badge>
        );
      }
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setQuotationsModal({ open: true, materialId: material.id, materialName: material.itemName });
          }}
        >
          <DollarSign className="w-4 h-4 mr-1" />
          Gerenciar Cotações
        </Button>
      );
    }

    if (status === "financial") {
      // Comprador confirma compra (não precisa de permissão hierárquica)
      return (
        <Button
          size="sm"
          variant="default"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setPurchaseModal({ open: true, materialId: material.id, materialName: material.itemName })}
        >
          <DollarSign className="w-4 h-4 mr-1" />
          Confirmar Compra
        </Button>
      );
    }

    if (status === "purchased") {
      // Almoxarifado confirma recebimento (não precisa de permissão hierárquica)
      return (
        <Button
          size="sm"
          variant="default"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setReceivingModal({ open: true, materialId: material.id, materialName: material.itemName })}
        >
          <Check className="w-4 h-4 mr-1" />
          Confirmar Recebimento
        </Button>
      );
    }

    // Botões de aprovar/rejeitar - apenas se tiver permissão
    if (!hasPermission) {
      const levelNames: Record<string, string> = {
        "lider": "Líder",
        "gerente": "Gerente",
        "comprador": "Comprador",
        "diretor": "Diretor",
        "financeiro": "Financeiro"
      };
      return (
        <Badge variant="outline" className="text-xs">
          Aguardando {levelNames[required] || required}
        </Badge>
      );
    }

    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={() => setApprovalModal({ open: true, material, action: "approve" })}
        >
          <CheckCircle2 className="w-4 h-4 mr-1" />
          Aprovar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setApprovalModal({ open: true, material, action: "reject" })}
        >
          <XCircle className="w-4 h-4 mr-1" />
          Rejeitar
        </Button>
      </div>
    );
  };

  // Calcular total apenas dos materiais filtrados (setor + status)
  const filteredMaterials = materials?.filter(material => {
    const matchesSector = sectorFilter === "all" || material.requestingSector === sectorFilter;
    const matchesStatus = statusFilter === "all" || material.approvalStatus === statusFilter;
    return matchesSector && matchesStatus;
  }) || [];
  const totalValue = filteredMaterials.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>{project.description || "Sem descrição"}</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            {isExpanded ? "Ocultar" : "Expandir"}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Lista de Materiais</h3>
              <div className="flex gap-2">
                <Button onClick={exportToPDF} variant="outline" disabled={!materials || materials.length === 0}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Material
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Label htmlFor="sector-filter">Filtrar por Setor</Label>
                <Select value={sectorFilter} onValueChange={(value: any) => setSectorFilter(value)}>
                  <SelectTrigger id="sector-filter">
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Setores</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Mecânica">Mecânica</SelectItem>
                    <SelectItem value="Automação">Automação</SelectItem>
                    <SelectItem value="Administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="status-filter">Filtrar por Status</Label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="leader">Pendente Líder</SelectItem>
                    <SelectItem value="manager">Pendente Gerente</SelectItem>
                    <SelectItem value="buyer">Pendente Comprador</SelectItem>
                    <SelectItem value="director">Pendente Diretor</SelectItem>
                    <SelectItem value="financial">Pendente Financeiro</SelectItem>
                    <SelectItem value="purchased">Comprado</SelectItem>
                    <SelectItem value="received">Recebido</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isAdding && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Item *</Label>
                      <Input
                        value={formData.itemName}
                        onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                        placeholder="Ex: Chapa de aço 1020"
                      />
                    </div>
                    <div>
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label>Unidade *</Label>
                      <Input
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="Ex: kg, m, un"
                      />
                    </div>
                    <div>
                      <Label>Preço Unitário (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Fornecedor</Label>
                      <Input
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="Nome do fornecedor"
                      />
                    </div>
                    <div>
                      <Label>URL da Imagem (opcional)</Label>
                      <Input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://exemplo.com/imagem.jpg"
                      />
                      {formData.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={formData.imageUrl} 
                            alt="Preview" 
                            className="w-24 h-24 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Setor Solicitante *</Label>
                      <select
                        value={formData.requestingSector}
                        onChange={(e) => setFormData({ ...formData, requestingSector: e.target.value as any })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Mecânica">Mecânica</option>
                        <option value="Automação">Automação</option>
                        <option value="Administrativo">Administrativo</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label>Justificativa</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Justificativa para a compra"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}
                      disabled={!formData.itemName || !formData.unit || formData.quantity <= 0}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {editingId ? "Salvar" : "Adicionar"}
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {materials && materials.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material) => {
                      const statusConfig = STATUS_CONFIG[material.approvalStatus as keyof typeof STATUS_CONFIG];
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              {material.imageUrl ? (
                                <img 
                                  src={material.imageUrl} 
                                  alt={material.itemName}
                                  className="w-12 h-12 object-cover rounded border"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                                  Sem imagem
                                </div>
                              )}
                              <span>{material.itemName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{material.quantity}</TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell className="text-right">
                            R$ {(material.unitPrice / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {((material.quantity * material.unitPrice) / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {material.requestingSector}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={`${statusConfig.color} text-white`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {material.recommendedSupplier && (
                                <div className="text-xs text-muted-foreground">
                                  <span className="font-semibold">Recomendado:</span> {material.recommendedSupplier} - R$ {((material.recommendedPrice || 0) / 100).toFixed(2)}
                                </div>
                              )}
                              {material.approvalStatus === "purchased" && material.expectedDeliveryDate && (
                                <div className="text-xs text-muted-foreground">
                                  <span className="font-semibold">Entrega prevista:</span> {new Date(material.expectedDeliveryDate).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                              {material.approvalStatus === "received" && (
                                <div className="text-xs text-muted-foreground">
                                  <span className="font-semibold">Recebido por:</span> {material.receivedBy}
                                  {material.receivedDate && (
                                    <span> em {new Date(material.receivedDate).toLocaleDateString('pt-BR')}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              {getActionButton(material)}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setHistoryModal({ open: true, materialId: material.id })}
                                title="Ver histórico"
                              >
                                <History className="w-4 h-4" />
                              </Button>
                              {material.approvalStatus === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEdit(material)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(material.id)}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Geral</p>
                    <p className="text-2xl font-bold">R$ {(totalValue / 100).toFixed(2)}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum material cadastrado para este projeto
              </p>
            )}
          </div>
        </CardContent>
      )}

      {/* Modal de Aprovação/Rejeição/Cotação */}
      <Dialog open={approvalModal.open} onOpenChange={(open) => {
        if (!open) {
          setApprovalModal({ open: false, material: null, action: "approve" });
          setApprovalComments("");
          setQuotationData({ value: 0, notes: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalModal.action === "approve" ? "Aprovar Material" : "Rejeitar Material"}
            </DialogTitle>
            <DialogDescription>
              {approvalModal.material?.itemName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Comentários {approvalModal.action === "reject" && "*"}</Label>
              <Textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder={approvalModal.action === "reject" ? "Motivo da rejeição (obrigatório)" : "Comentários opcionais"}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalModal({ open: false, material: null, action: "approve" })}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={approvalModal.action === "reject" && !approvalComments}
              variant={approvalModal.action === "reject" ? "destructive" : "default"}
            >
              {approvalModal.action === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico */}
      <ApprovalHistoryModal
        open={historyModal.open}
        materialId={historyModal.materialId}
        onClose={() => setHistoryModal({ open: false, materialId: null })}
      />

      {/* Modal de Múltiplas Cotações */}
      <QuotationsModal
        open={quotationsModal.open}
        materialId={quotationsModal.materialId}
        materialName={quotationsModal.materialName}
        onClose={() => {
          setQuotationsModal({ open: false, materialId: null, materialName: "" });
          setQuotationForm({ supplier: "", quotedPrice: 0, deliveryTime: "", paymentTerms: "", notes: "" });
          setEditingQuotationId(null);
        }}
        onSuccess={refetch}
      />

      {/* Modal de Confirmação de Compra */}
      <PurchaseModal
        open={purchaseModal.open}
        materialName={purchaseModal.materialName}
        onClose={() => {
          setPurchaseModal({ open: false, materialId: null, materialName: "" });
          setExpectedDeliveryDate("");
        }}
        onConfirm={handleConfirmPurchase}
        expectedDeliveryDate={expectedDeliveryDate}
        setExpectedDeliveryDate={setExpectedDeliveryDate}
        isLoading={confirmPurchaseMutation.isPending}
      />

      {/* Modal de Confirmação de Recebimento */}
      <ReceivingModal
        open={receivingModal.open}
        materialName={receivingModal.materialName}
        onClose={() => {
          setReceivingModal({ open: false, materialId: null, materialName: "" });
          setReceivedBy("");
        }}
        onConfirm={handleConfirmReceiving}
        receivedBy={receivedBy}
        setReceivedBy={setReceivedBy}
        isLoading={confirmReceivingMutation.isPending}
      />
    </Card>
  );
}

// Componente de Modal de Histórico
function ApprovalHistoryModal({ open, materialId, onClose }: { open: boolean; materialId: number | null; onClose: () => void }) {
  const { data: history } = trpc.projectMaterials.getApprovalHistory.useQuery(
    { materialId: materialId! },
    { enabled: open && materialId !== null }
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de Aprovações</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {history && history.length > 0 ? (
            history.map((item, index) => (
              <div key={item.id} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{item.approverName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.action === "approved" 
                        ? "Aprovou" 
                        : item.action === "rejected" 
                        ? "Rejeitou" 
                        : item.action === "purchased"
                        ? "Confirmou Compra"
                        : item.action === "received"
                        ? "Confirmou Recebimento"
                        : item.action} • {item.approverRole}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      item.action === "approved" || item.action === "purchased" || item.action === "received"
                        ? "default" 
                        : "destructive"
                    }
                    className={
                      item.action === "purchased" || item.action === "received"
                        ? "bg-green-600 text-white"
                        : ""
                    }
                  >
                    {item.fromStatus} → {item.toStatus}
                  </Badge>
                </div>
                {item.comments && (
                  <p className="text-sm mt-2 text-muted-foreground italic">"{item.comments}"</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma aprovação registrada ainda</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


// Componente de Modal de Múltiplas Cotações
function QuotationsModal({ 
  open, 
  materialId, 
  materialName,
  onClose, 
  onSuccess 
}: { 
  open: boolean; 
  materialId: number | null;
  materialName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: quotations, refetch } = trpc.projectMaterials.getQuotations.useQuery(
    { materialId: materialId! },
    { enabled: open && materialId !== null }
  );
  
  const addMutation = trpc.projectMaterials.addSupplierQuotation.useMutation();
  const updateMutation = trpc.projectMaterials.updateQuotation.useMutation();
  const deleteMutation = trpc.projectMaterials.deleteQuotation.useMutation();
  const setRecommendedMutation = trpc.projectMaterials.setRecommendedQuotation.useMutation();
  const approveMutation = trpc.projectMaterials.approve.useMutation();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    supplier: "",
    quotedPrice: 0,
    deliveryTime: "",
    paymentTerms: "",
    notes: ""
  });
  
  const resetForm = () => {
    setFormData({
      supplier: "",
      quotedPrice: 0,
      deliveryTime: "",
      paymentTerms: "",
      notes: ""
    });
    setIsAdding(false);
    setEditingId(null);
  };
  
  const handleAdd = async () => {
    if (!materialId) return;
    
    try {
      await addMutation.mutateAsync({
        materialId,
        supplier: formData.supplier,
        quotedPrice: Math.round(formData.quotedPrice * 100),
        deliveryTime: formData.deliveryTime || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        notes: formData.notes || undefined,
      });
      toast.success("Cotação adicionada com sucesso!");
      resetForm();
      refetch();
      onSuccess();
    } catch (error) {
      toast.error("Erro ao adicionar cotação");
    }
  };
  
  const handleUpdate = async () => {
    if (!editingId) return;
    
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        supplier: formData.supplier,
        quotedPrice: Math.round(formData.quotedPrice * 100),
        deliveryTime: formData.deliveryTime || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        notes: formData.notes || undefined,
      });
      toast.success("Cotação atualizada com sucesso!");
      resetForm();
      refetch();
      onSuccess();
    } catch (error) {
      toast.error("Erro ao atualizar cotação");
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta cotação?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Cotação excluída com sucesso!");
      refetch();
      onSuccess();
    } catch (error) {
      toast.error("Erro ao excluir cotação");
    }
  };
  
  const handleSetRecommended = async (quotationId: number) => {
    if (!materialId) return;
    
    try {
      await setRecommendedMutation.mutateAsync({ materialId, quotationId });
      toast.success("Cotação marcada como recomendada!");
      refetch();
      onSuccess();
    } catch (error) {
      toast.error("Erro ao marcar cotação");
    }
  };
  
  const startEdit = (quotation: any) => {
    setEditingId(quotation.id);
    setIsAdding(true);
    setFormData({
      supplier: quotation.supplier,
      quotedPrice: quotation.quotedPrice / 100,
      deliveryTime: quotation.deliveryTime || "",
      paymentTerms: quotation.paymentTerms || "",
      notes: quotation.notes || ""
    });
  };
  
  // Encontrar menor preço
  const lowestPrice = quotations && quotations.length > 0 
    ? Math.min(...quotations.map(q => q.quotedPrice))
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Gerenciar Cotações</DialogTitle>
          <DialogDescription>{materialName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Botão Adicionar Cotação */}
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Cotações Cadastradas ({quotations?.length || 0})</h3>
            <Button 
              size="sm" 
              onClick={() => setIsAdding(!isAdding)}
              disabled={isAdding}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Cotação
            </Button>
          </div>

          {/* Formulário de Adicionar/Editar */}
          {isAdding && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fornecedor *</Label>
                    <Input
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="Nome do fornecedor"
                    />
                  </div>
                  <div>
                    <Label>Preço Cotado (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.quotedPrice}
                      onChange={(e) => setFormData({ ...formData, quotedPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Prazo de Entrega</Label>
                    <Input
                      value={formData.deliveryTime}
                      onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                      placeholder="Ex: 15 dias"
                    />
                  </div>
                  <div>
                    <Label>Condições de Pagamento</Label>
                    <Input
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      placeholder="Ex: 30/60 dias"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Detalhes adicionais da cotação"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => editingId ? handleUpdate() : handleAdd()}
                    disabled={!formData.supplier || formData.quotedPrice <= 0}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {editingId ? "Salvar" : "Adicionar"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Cotações */}
          {quotations && quotations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => {
                  const isLowest = quotation.quotedPrice === lowestPrice;
                  const isRecommended = quotation.isRecommended === 1;
                  
                  return (
                    <TableRow key={quotation.id} className={isRecommended ? "bg-green-50" : ""}>
                      <TableCell className="font-medium">{quotation.supplier}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          R$ {(quotation.quotedPrice / 100).toFixed(2)}
                          {isLowest && (
                            <Badge variant="secondary" className="text-xs">
                              Menor preço
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{quotation.deliveryTime || "-"}</TableCell>
                      <TableCell>{quotation.paymentTerms || "-"}</TableCell>
                      <TableCell className="text-center">
                        {isRecommended && (
                          <Badge className="bg-green-600 text-white">
                            ⭐ Recomendada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {!isRecommended && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetRecommended(quotation.id)}
                              title="Marcar como recomendada"
                            >
                              ⭐
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(quotation)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(quotation.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma cotação cadastrada ainda. Clique em "Nova Cotação" para adicionar.
            </p>
          )}
          
          {quotations && quotations.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Total de {quotations.length} cotação(ões) cadastrada(s)
              </p>
              {quotations.some(q => q.isRecommended === 1) && (
                <Badge className="bg-green-600 text-white">
                  Cotação recomendada selecionada
                </Badge>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {quotations && quotations.some(q => q.isRecommended === 1) && (
            <Button 
              onClick={() => {
                if (!materialId) return;
                
                const recommendedQuotation = quotations.find(q => q.isRecommended === 1);
                const comment = `Cotações analisadas. Recomendada: ${recommendedQuotation?.supplier} - R$ ${((recommendedQuotation?.quotedPrice || 0) / 100).toFixed(2)}`;
                
                approveMutation.mutate(
                  { materialId, comments: comment },
                  {
                    onSuccess: () => {
                      toast.success("Material avançado para aprovação do diretor!");
                      onClose();
                      onSuccess?.();
                    },
                    onError: () => {
                      toast.error("Erro ao avançar material");
                    }
                  }
                );
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Processando..." : "Continuar Aprovação"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal de Confirmação de Compra
function PurchaseModal({ 
  open, 
  materialName, 
  onClose, 
  onConfirm, 
  expectedDeliveryDate,
  setExpectedDeliveryDate,
  isLoading 
}: { 
  open: boolean; 
  materialName: string; 
  onClose: () => void; 
  onConfirm: () => void;
  expectedDeliveryDate: string;
  setExpectedDeliveryDate: (date: string) => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Compra</DialogTitle>
          <DialogDescription>
            Material: <strong>{materialName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Data da Compra</Label>
            <Input 
              type="text" 
              value={new Date().toLocaleDateString('pt-BR')} 
              disabled 
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">Data gerada automaticamente</p>
          </div>

          <div>
            <Label>Data Prevista de Entrega *</Label>
            <Input 
              type="date" 
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading || !expectedDeliveryDate}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Confirmando..." : "Confirmar Compra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal de Confirmação de Recebimento
function ReceivingModal({ 
  open, 
  materialName, 
  onClose, 
  onConfirm, 
  receivedBy,
  setReceivedBy,
  isLoading 
}: { 
  open: boolean; 
  materialName: string; 
  onClose: () => void; 
  onConfirm: () => void;
  receivedBy: string;
  setReceivedBy: (name: string) => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Recebimento</DialogTitle>
          <DialogDescription>
            Material: <strong>{materialName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Data de Recebimento</Label>
            <Input 
              type="text" 
              value={new Date().toLocaleDateString('pt-BR')} 
              disabled 
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">Data gerada automaticamente</p>
          </div>

          <div>
            <Label>Quem Recebeu *</Label>
            <Input 
              type="text" 
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="Nome de quem recebeu a mercadoria"
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading || !receivedBy}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Confirmando..." : "Confirmar Recebimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
