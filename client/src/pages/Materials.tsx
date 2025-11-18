import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MaterialFormData {
  name: string;
  description: string;
  widthMm: string;
  lengthMm: string;
  purchasePrice: string;
  supplier: string;
  stockQuantity: string;
}

const emptyForm: MaterialFormData = {
  name: "",
  description: "",
  widthMm: "",
  lengthMm: "",
  purchasePrice: "",
  supplier: "",
  stockQuantity: "0",
};

export default function Materials() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: materials, isLoading } = trpc.materials.list.useQuery();

  const createMutation = trpc.materials.create.useMutation({
    onSuccess: () => {
      utils.materials.list.invalidate();
      toast.success("Material cadastrado com sucesso!");
      setDialogOpen(false);
      setFormData(emptyForm);
    },
    onError: () => {
      toast.error("Erro ao cadastrar material");
    },
  });

  const updateMutation = trpc.materials.update.useMutation({
    onSuccess: () => {
      utils.materials.list.invalidate();
      toast.success("Material atualizado com sucesso!");
      setDialogOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
    onError: () => {
      toast.error("Erro ao atualizar material");
    },
  });

  const deleteMutation = trpc.materials.delete.useMutation({
    onSuccess: () => {
      utils.materials.list.invalidate();
      toast.success("Material excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir material");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios
    if (!formData.name.trim()) {
      toast.error("Nome do material é obrigatório");
      return;
    }

    const widthMm = parseInt(formData.widthMm);
    const lengthMm = parseInt(formData.lengthMm);
    const purchasePrice = parseFloat(formData.purchasePrice);
    const stockQuantity = parseInt(formData.stockQuantity || "0");

    // Validar valores numéricos
    if (isNaN(widthMm) || widthMm <= 0) {
      toast.error("Largura deve ser um número positivo");
      return;
    }
    if (isNaN(lengthMm) || lengthMm <= 0) {
      toast.error("Comprimento deve ser um número positivo");
      return;
    }
    if (isNaN(purchasePrice) || purchasePrice < 0) {
      toast.error("Preço de compra deve ser um número válido");
      return;
    }
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      toast.error("Quantidade em estoque deve ser um número válido");
      return;
    }

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      widthMm,
      lengthMm,
      purchasePrice: Math.round(purchasePrice * 100),
      supplier: formData.supplier || undefined,
      stockQuantity,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (material: any) => {
    setEditingId(material.id);
    setFormData({
      name: material.name,
      description: material.description || "",
      widthMm: material.widthMm.toString(),
      lengthMm: material.lengthMm.toString(),
      purchasePrice: (material.purchasePrice / 100).toFixed(2),
      supplier: material.supplier || "",
      stockQuantity: material.stockQuantity.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este material?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Estoque de Materiais</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas matérias-primas e consulte custos por mm²
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setFormData(emptyForm);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Material
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : materials && materials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum material cadastrado
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Comece cadastrando seus materiais para facilitar a criação de orçamentos
              </p>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData(emptyForm);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Material
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {materials?.map((material) => (
              <Card key={material.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{material.name}</CardTitle>
                      {material.description && (
                        <CardDescription className="mt-1">{material.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(material)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Custo por mm²</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {(material.costPerMm2 / 100000).toFixed(5)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dimensões</p>
                      <p className="font-medium">
                        {material.widthMm} × {material.lengthMm} mm
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Área Total</p>
                      <p className="font-medium">
                        {((material.widthMm * material.lengthMm) / 1000000).toFixed(2)} m²
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Preço de Compra</p>
                      <p className="font-medium">R$ {(material.purchasePrice / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Em Estoque</p>
                      <p className="font-medium">{material.stockQuantity} un.</p>
                    </div>
                  </div>

                  {material.supplier && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">Fornecedor</p>
                      <p className="text-sm font-medium">{material.supplier}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Material" : "Novo Material"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do material. O custo por mm² será calculado automaticamente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Nome do Material *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Chapa de Aço 1020"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Informações adicionais sobre o material"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="widthMm">Largura (mm) *</Label>
                    <Input
                      id="widthMm"
                      type="number"
                      value={formData.widthMm}
                      onChange={(e) => setFormData({ ...formData, widthMm: e.target.value })}
                      placeholder="1000"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="lengthMm">Comprimento (mm) *</Label>
                    <Input
                      id="lengthMm"
                      type="number"
                      value={formData.lengthMm}
                      onChange={(e) => setFormData({ ...formData, lengthMm: e.target.value })}
                      placeholder="2000"
                      required
                    />
                  </div>
                </div>

                {formData.widthMm && formData.lengthMm && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Área Total Calculada</p>
                    <p className="text-lg font-semibold">
                      {((parseInt(formData.widthMm) * parseInt(formData.lengthMm)) / 1000000).toFixed(2)} m²
                      {" "}
                      ({(parseInt(formData.widthMm) * parseInt(formData.lengthMm)).toLocaleString()} mm²)
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="purchasePrice">Preço de Compra (R$) *</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="500.00"
                    required
                  />
                </div>

                {formData.widthMm && formData.lengthMm && formData.purchasePrice && (
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Custo por mm² (calculado)</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {(
                        parseFloat(formData.purchasePrice) /
                        (parseInt(formData.widthMm) * parseInt(formData.lengthMm))
                      ).toFixed(5)}
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div>
                  <Label htmlFor="stockQuantity">Quantidade em Estoque</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingId(null);
                    setFormData(emptyForm);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
