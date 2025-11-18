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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const machineTypes = {
  centro_usinagem: "Centro de Usinagem",
  torno_convencional: "Torno Convencional",
  torno_cnc: "Torno CNC",
  fresadora: "Fresadora",
  outros: "Outros",
};

type MachineType = keyof typeof machineTypes;

interface MachineFormData {
  name: string;
  type: MachineType;
  purchaseValue: string;
  residualValue: string;
  usefulLifeHours: string;
  occupiedArea: string;
  powerKw: string;
  maintenanceCostPerYear: string;
  consumablesCostPerYear: string;
  manualHourlyCost: string;
  useManualCost: boolean;
}

const emptyForm: MachineFormData = {
  name: "",
  type: "centro_usinagem",
  purchaseValue: "",
  residualValue: "",
  usefulLifeHours: "",
  occupiedArea: "",
  powerKw: "",
  maintenanceCostPerYear: "",
  consumablesCostPerYear: "",
  manualHourlyCost: "",
  useManualCost: false,
};

export default function Machines() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MachineFormData>(emptyForm);

  const utils = trpc.useUtils();
  const { data: machines, isLoading } = trpc.machines.list.useQuery();
  const createMutation = trpc.machines.create.useMutation({
    onSuccess: () => {
      utils.machines.list.invalidate();
      toast.success("Máquina cadastrada com sucesso!");
      setDialogOpen(false);
      setFormData(emptyForm);
    },
    onError: () => {
      toast.error("Erro ao cadastrar máquina");
    },
  });

  const updateMutation = trpc.machines.update.useMutation({
    onSuccess: () => {
      utils.machines.list.invalidate();
      toast.success("Máquina atualizada com sucesso!");
      setDialogOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
    },
    onError: () => {
      toast.error("Erro ao atualizar máquina");
    },
  });

  const deleteMutation = trpc.machines.delete.useMutation({
    onSuccess: () => {
      utils.machines.list.invalidate();
      toast.success("Máquina excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir máquina");
    },
  });

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      type: formData.type,
      purchaseValue: Math.round(parseFloat(formData.purchaseValue) * 100),
      residualValue: Math.round(parseFloat(formData.residualValue || "0") * 100),
      usefulLifeHours: parseInt(formData.usefulLifeHours),
      occupiedArea: Math.round(parseFloat(formData.occupiedArea) * 10000), // m² para cm²
      powerKw: Math.round(parseFloat(formData.powerKw) * 1000), // kW para W
      maintenanceCostPerYear: Math.round(parseFloat(formData.maintenanceCostPerYear || "0") * 100),
      consumablesCostPerYear: Math.round(parseFloat(formData.consumablesCostPerYear || "0") * 100),
      manualHourlyCost: formData.useManualCost && formData.manualHourlyCost 
        ? Math.round(parseFloat(formData.manualHourlyCost) * 100) 
        : null,
    };
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (machine: any) => {
    setEditingId(machine.id);
    setFormData({
      name: machine.name,
      type: machine.type,
      purchaseValue: (machine.purchaseValue / 100).toFixed(2),
      residualValue: (machine.residualValue / 100).toFixed(2),
      usefulLifeHours: machine.usefulLifeHours.toString(),
      occupiedArea: (machine.occupiedArea / 10000).toFixed(2),
      powerKw: (machine.powerKw / 1000).toFixed(2),
      maintenanceCostPerYear: (machine.maintenanceCostPerYear / 100).toFixed(2),
      consumablesCostPerYear: (machine.consumablesCostPerYear / 100).toFixed(2),
      manualHourlyCost: machine.manualHourlyCost ? (machine.manualHourlyCost / 100).toFixed(2) : "",
      useManualCost: !!machine.manualHourlyCost,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta máquina?")) {
      deleteMutation.mutate({ id });
    }
  };

  const calculateHourlyCost = (machine: any, settings: any) => {
    if (!settings) return 0;

    const depreciation = (machine.purchaseValue - machine.residualValue) / machine.usefulLifeHours;
    const areaInM2 = machine.occupiedArea / 10000;
    const rentCost = (settings.rentPerSquareMeter * areaInM2) / settings.workingHoursPerYear;
    const electricityCost = (machine.powerKw / 1000) * (settings.electricityCostPerKwh / 100);
    const maintenanceCost = machine.maintenanceCostPerYear / settings.workingHoursPerYear;
    const consumablesCost = machine.consumablesCostPerYear / settings.workingHoursPerYear;

    return depreciation + rentCost + electricityCost + maintenanceCost + consumablesCost;
  };

  const { data: settings } = trpc.settings.get.useQuery();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Máquinas</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas máquinas de usinagem
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
            Nova Máquina
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : machines && machines.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma máquina cadastrada
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Comece cadastrando suas máquinas para poder calcular o custo hora-máquina e gerar orçamentos
              </p>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData(emptyForm);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeira Máquina
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {machines?.map((machine) => (
              <Card key={machine.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{machine.name}</CardTitle>
                      <CardDescription>{machineTypes[machine.type]}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(machine)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(machine.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-muted-foreground">Custo Hora-Máquina</p>
                      {machine.manualHourlyCost && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          Manual
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      R$ {(calculateHourlyCost(machine, settings) / 100).toFixed(2)}
                    </p>
                    {!machine.manualHourlyCost && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Calculado automaticamente
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor de Compra</p>
                      <p className="font-medium">R$ {(machine.purchaseValue / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vida Útil</p>
                      <p className="font-medium">{machine.usefulLifeHours.toLocaleString()}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Área Ocupada</p>
                      <p className="font-medium">{(machine.occupiedArea / 10000).toFixed(2)} m²</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Potência</p>
                      <p className="font-medium">{(machine.powerKw / 1000).toFixed(2)} kW</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Máquina" : "Nova Máquina"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da máquina para calcular o custo hora-máquina
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Nome da Máquina *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Centro de Usinagem Haas VF-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as MachineType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(machineTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseValue">Valor de Compra (R$) *</Label>
                    <Input
                      id="purchaseValue"
                      type="number"
                      step="0.01"
                      value={formData.purchaseValue}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseValue: e.target.value })
                      }
                      placeholder="200000.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="residualValue">Valor Residual (R$)</Label>
                    <Input
                      id="residualValue"
                      type="number"
                      step="0.01"
                      value={formData.residualValue}
                      onChange={(e) =>
                        setFormData({ ...formData, residualValue: e.target.value })
                      }
                      placeholder="20000.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="usefulLifeHours">Vida Útil (horas) *</Label>
                  <Input
                    id="usefulLifeHours"
                    type="number"
                    value={formData.usefulLifeHours}
                    onChange={(e) =>
                      setFormData({ ...formData, usefulLifeHours: e.target.value })
                    }
                    placeholder="10000"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="occupiedArea">Área Ocupada (m²) *</Label>
                    <Input
                      id="occupiedArea"
                      type="number"
                      step="0.01"
                      value={formData.occupiedArea}
                      onChange={(e) =>
                        setFormData({ ...formData, occupiedArea: e.target.value })
                      }
                      placeholder="12.5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="powerKw">Potência (kW) *</Label>
                    <Input
                      id="powerKw"
                      type="number"
                      step="0.01"
                      value={formData.powerKw}
                      onChange={(e) =>
                        setFormData({ ...formData, powerKw: e.target.value })
                      }
                      placeholder="15.5"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maintenanceCostPerYear">
                      Custo Anual de Manutenção (R$)
                    </Label>
                    <Input
                      id="maintenanceCostPerYear"
                      type="number"
                      step="0.01"
                      value={formData.maintenanceCostPerYear}
                      onChange={(e) =>
                        setFormData({ ...formData, maintenanceCostPerYear: e.target.value })
                      }
                      placeholder="5000.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="consumablesCostPerYear">
                      Custo Anual de Consumíveis (R$)
                    </Label>
                    <Input
                      id="consumablesCostPerYear"
                      type="number"
                      step="0.01"
                      value={formData.consumablesCostPerYear}
                      onChange={(e) =>
                        setFormData({ ...formData, consumablesCostPerYear: e.target.value })
                      }
                      placeholder="3000.00"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="useManualCost"
                      checked={formData.useManualCost}
                      onChange={(e) => setFormData({ ...formData, useManualCost: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="useManualCost" className="font-medium">
                      Definir custo hora-máquina manualmente
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Por padrão, o custo é calculado automaticamente com base em depreciação, energia, manutenção e outros custos. 
                    Ative esta opção para definir um valor fixo.
                  </p>
                  
                  {formData.useManualCost && (
                    <div>
                      <Label htmlFor="manualHourlyCost">Custo Hora-Máquina (R$/h) *</Label>
                      <Input
                        id="manualHourlyCost"
                        type="number"
                        step="0.01"
                        value={formData.manualHourlyCost}
                        onChange={(e) => setFormData({ ...formData, manualHourlyCost: e.target.value })}
                        placeholder="150.00"
                        required={formData.useManualCost}
                      />
                    </div>
                  )}
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
