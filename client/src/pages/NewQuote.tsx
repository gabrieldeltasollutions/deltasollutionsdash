import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface QuoteItem {
  id: string; // ID temporário para gerenciar a lista
  machineId: string;
  partDescription: string;
  quantity: string;
  selectedMaterialId: string;
  partWidthMm: string;
  partLengthMm: string;
  rawMaterialCost: string;
  toolingCost: string;
  thirdPartyServicesCost: string;
  machineTimeHours: string;
  setupTimeHours: string;
  // Valores calculados
  machineHourlyCost: number;
  totalMachineCost: number;
  totalLaborCost: number;
  itemSubtotal: number;
}

interface QuoteFormData {
  clientName: string;
  profitMargin: string;
  taxRate: string;
  notes: string;
  items: QuoteItem[];
}

const emptyItem: Omit<QuoteItem, 'id'> = {
  machineId: "",
  partDescription: "",
  quantity: "1",
  selectedMaterialId: "",
  partWidthMm: "",
  partLengthMm: "",
  rawMaterialCost: "0",
  toolingCost: "0",
  thirdPartyServicesCost: "0",
  machineTimeHours: "0",
  setupTimeHours: "0",
  machineHourlyCost: 0,
  totalMachineCost: 0,
  totalLaborCost: 0,
  itemSubtotal: 0,
};

export default function NewQuote() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<QuoteFormData>({
    clientName: "",
    profitMargin: "",
    taxRate: "",
    notes: "",
    items: [{ ...emptyItem, id: crypto.randomUUID() }],
  });

  const { data: machines } = trpc.machines.list.useQuery();
  const { data: materials } = trpc.materials.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: (data) => {
      console.log('Orçamento criado:', data);
      toast.success("Orçamento criado com sucesso!");
      setLocation("/quotes");
    },
    onError: (error) => {
      console.error('Erro ao criar orçamento:', error);
      toast.error(`Erro ao criar orçamento: ${error.message}`);
    },
  });

  // Carregar configurações padrão
  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        profitMargin: settings.defaultProfitMargin.toString(),
        taxRate: settings.defaultTaxRate.toString(),
      }));
    }
  }, [settings]);

  // Calcular custo hora-máquina
  const calculateMachineHourlyCost = (machineId: string) => {
    if (!machineId || !machines || !settings) return 0;

    const machine = machines.find((m) => m.id === parseInt(machineId));
    if (!machine) return 0;

    // Se tem custo manual definido, usa ele
    if (machine.manualHourlyCost) {
      return machine.manualHourlyCost;
    }

    // Senão, calcula automaticamente
    const depreciation = (machine.purchaseValue - machine.residualValue) / machine.usefulLifeHours;
    const areaInM2 = machine.occupiedArea / 10000;
    const rentCost = (settings.rentPerSquareMeter * areaInM2) / settings.workingHoursPerYear;
    const electricityCost = (machine.powerKw / 1000) * (settings.electricityCostPerKwh / 100);
    const maintenanceCost = machine.maintenanceCostPerYear / settings.workingHoursPerYear;
    const consumablesCost = machine.consumablesCostPerYear / settings.workingHoursPerYear;

    return Math.round(depreciation + rentCost + electricityCost + maintenanceCost + consumablesCost);
  };

  // Recalcular valores de um item
  const recalculateItem = (item: QuoteItem): QuoteItem => {
    if (!settings) return item;

    const machineHourlyCost = calculateMachineHourlyCost(item.machineId);
    const totalTimeMinutes = parseInt(item.machineTimeHours || "0") + parseInt(item.setupTimeHours || "0");
    const totalTimeHours = totalTimeMinutes / 60;
    
    const totalMachineCost = Math.round((machineHourlyCost / 100) * totalTimeHours * 100);
    const totalLaborCost = Math.round((settings.operatorHourlyCost / 100) * totalTimeHours * 100);
    
    const rawMaterialCost = Math.round(parseFloat(item.rawMaterialCost || "0") * 100);
    const toolingCost = Math.round(parseFloat(item.toolingCost || "0") * 100);
    const thirdPartyServicesCost = Math.round(parseFloat(item.thirdPartyServicesCost || "0") * 100);
    
    const quantity = parseInt(item.quantity || "1");
    // Apenas material é multiplicado pela quantidade
    // Máquina, mão de obra, ferramentas e serviços são custos fixos do lote
    const itemSubtotal = totalMachineCost + totalLaborCost + (rawMaterialCost * quantity) + toolingCost + thirdPartyServicesCost;

    return {
      ...item,
      machineHourlyCost,
      totalMachineCost,
      totalLaborCost,
      itemSubtotal,
    };
  };

  // Recalcular todos os itens quando settings ou machines mudarem
  useEffect(() => {
    if (!settings || !machines) return;

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map(item => recalculateItem(item)),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.operatorHourlyCost, machines?.length]);

  // Calcular totais do orçamento
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.itemSubtotal, 0);
    const profitMargin = parseInt(formData.profitMargin || "0");
    const taxRate = parseInt(formData.taxRate || "0");
    
    const profitAmount = Math.round((subtotal * profitMargin) / 100);
    const taxAmount = Math.round(((subtotal + profitAmount) * taxRate) / 100);
    const finalPrice = subtotal + profitAmount + taxAmount;

    return {
      subtotal,
      profitAmount,
      taxAmount,
      finalPrice,
    };
  };

  const totals = calculateTotals();

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem, id: crypto.randomUUID() }],
    }));
  };

  const removeItem = (id: string) => {
    if (formData.items.length === 1) {
      toast.error("O orçamento deve ter pelo menos uma peça");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => 
        item.id === id ? recalculateItem({ ...item, ...updates }) : item
      ),
    }));
  };

  // Atualizar material e calcular custo automaticamente
  const handleMaterialChange = (itemId: string, materialId: string) => {
    const item = formData.items.find(i => i.id === itemId);
    if (!item) return;

    const material = materials?.find(m => m.id === parseInt(materialId));
    
    updateItem(itemId, { selectedMaterialId: materialId });
    
    // Recalcular custo se já tem dimensões
    if (material && item.partWidthMm && item.partLengthMm) {
      const partArea = parseInt(item.partWidthMm) * parseInt(item.partLengthMm);
      const cost = (partArea * material.costPerMm2) / 100000;
      updateItem(itemId, { 
        selectedMaterialId: materialId,
        rawMaterialCost: cost.toFixed(2) 
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName) {
      toast.error("Informe o nome do cliente");
      return;
    }

    if (!formData.profitMargin || isNaN(parseInt(formData.profitMargin))) {
      toast.error("Informe a margem de lucro");
      return;
    }

    if (!formData.taxRate || isNaN(parseInt(formData.taxRate))) {
      toast.error("Informe a taxa de impostos");
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Adicione pelo menos uma peça ao orçamento");
      return;
    }

    // Validar cada item
    for (const item of formData.items) {
      if (!item.machineId) {
        toast.error("Selecione uma máquina para todas as peças");
        return;
      }
      if (!item.partDescription) {
        toast.error("Preencha a descrição de todas as peças");
        return;
      }
      if (!item.quantity || isNaN(parseInt(item.quantity)) || parseInt(item.quantity) < 1) {
        toast.error("Informe uma quantidade válida para todas as peças");
        return;
      }
      if (!item.machineTimeHours || isNaN(parseInt(item.machineTimeHours))) {
        toast.error("Informe o tempo de usinagem para todas as peças");
        return;
      }
      if (!item.setupTimeHours || isNaN(parseInt(item.setupTimeHours))) {
        toast.error("Informe o tempo de setup para todas as peças");
        return;
      }
    }

    const data = {
      clientName: formData.clientName,
      profitMargin: parseInt(formData.profitMargin),
      taxRate: parseInt(formData.taxRate),
      notes: formData.notes || undefined,
      subtotal: totals.subtotal,
      profitAmount: totals.profitAmount,
      taxAmount: totals.taxAmount,
      finalPrice: totals.finalPrice,
      items: formData.items.map((item) => ({
        machineId: parseInt(item.machineId),
        partDescription: item.partDescription,
        quantity: parseInt(item.quantity),
        materialId: item.selectedMaterialId ? parseInt(item.selectedMaterialId) : undefined,
        partWidthMm: item.partWidthMm ? parseInt(item.partWidthMm) : undefined,
        partLengthMm: item.partLengthMm ? parseInt(item.partLengthMm) : undefined,
        rawMaterialCost: Math.round(parseFloat(item.rawMaterialCost) * 100),
        toolingCost: Math.round(parseFloat(item.toolingCost) * 100),
        thirdPartyServicesCost: Math.round(parseFloat(item.thirdPartyServicesCost) * 100),
        machineTimeHours: parseInt(item.machineTimeHours),
        setupTimeHours: parseInt(item.setupTimeHours),
        machineHourlyCost: item.machineHourlyCost,
        totalMachineCost: item.totalMachineCost,
        totalLaborCost: item.totalLaborCost,
        itemSubtotal: item.itemSubtotal,
      })),
    };

    // Validar que todos os valores calculados são válidos
    if (totals.subtotal === 0) {
      toast.error("O subtotal não pode ser zero. Verifique os dados das peças.");
      return;
    }

    for (const item of data.items) {
      if (isNaN(item.machineHourlyCost) || isNaN(item.totalMachineCost) || isNaN(item.totalLaborCost) || isNaN(item.itemSubtotal)) {
        toast.error("Erro nos cálculos. Verifique todos os campos das peças.");
        console.error('Item com valores inválidos:', item);
        return;
      }
    }

    createMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Novo Orçamento</h1>
          <p className="text-muted-foreground mt-2">
            Crie um orçamento com múltiplas peças
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Gerais</CardTitle>
              <CardDescription>Selecione o cliente para este orçamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clientName">Cliente *</Label>
                {clients && clients.length > 0 ? (
                  <div className="flex gap-2">
                    <Select
                      value={formData.clientName}
                      onValueChange={(value) => setFormData({ ...formData, clientName: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.name}>
                            {client.name}
                            {client.document && ` - ${client.document}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open('/clients', '_blank')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Nenhum cliente cadastrado. Cadastre um cliente primeiro.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open('/clients', '_blank')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar Cliente
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Peças */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Peças</h2>
                <p className="text-sm text-muted-foreground">
                  Adicione as peças que farão parte deste orçamento
                </p>
              </div>
              <Button type="button" onClick={addItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Peça
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Peça {index + 1}</CardTitle>
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Descrição da Peça *</Label>
                      <Input
                        value={item.partDescription}
                        onChange={(e) => updateItem(item.id, { partDescription: e.target.value })}
                        placeholder="Ex: Flange de alumínio"
                        required
                      />
                    </div>
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Máquina *</Label>
                    <Select
                      value={item.machineId}
                      onValueChange={(value) => updateItem(item.id, { machineId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma máquina" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines?.map((machine) => (
                          <SelectItem key={machine.id} value={machine.id.toString()}>
                            {machine.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Material */}
                  <div className="space-y-3">
                    <Label>Material do Estoque</Label>
                    <Select
                      value={item.selectedMaterialId}
                      onValueChange={(value) => handleMaterialChange(item.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um material (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map((material) => (
                          <SelectItem key={material.id} value={material.id.toString()}>
                            {material.name} - R$ {(material.costPerMm2 / 100000).toFixed(5)}/mm²
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {item.selectedMaterialId && (() => {
                      const selectedMaterial = materials?.find(m => m.id === parseInt(item.selectedMaterialId));
                      if (!selectedMaterial) return null;
                      return (
                        <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                          <div className="font-medium">{selectedMaterial.name}</div>
                          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                            <div>
                              <span>Dimensões: </span>
                              <span className="font-medium">{selectedMaterial.widthMm} × {selectedMaterial.lengthMm} mm</span>
                            </div>
                            <div>
                              <span>Custo/mm²: </span>
                              <span className="font-medium">R$ {(selectedMaterial.costPerMm2 / 100000).toFixed(5)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Largura da Peça (mm)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.partWidthMm}
                          onChange={(e) => {
                            const newWidth = e.target.value;
                            updateItem(item.id, { partWidthMm: newWidth });
                            
                            // Recalcular custo se tem material e comprimento
                            if (item.selectedMaterialId && newWidth && item.partLengthMm) {
                              const material = materials?.find(m => m.id === parseInt(item.selectedMaterialId));
                              if (material) {
                                const partArea = parseInt(newWidth) * parseInt(item.partLengthMm);
                                const cost = (partArea * material.costPerMm2) / 100000;
                                updateItem(item.id, { partWidthMm: newWidth, rawMaterialCost: cost.toFixed(2) });
                              }
                            }
                          }}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label>Comprimento da Peça (mm)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.partLengthMm}
                          onChange={(e) => {
                            const newLength = e.target.value;
                            updateItem(item.id, { partLengthMm: newLength });
                            
                            // Recalcular custo se tem material e largura
                            if (item.selectedMaterialId && item.partWidthMm && newLength) {
                              const material = materials?.find(m => m.id === parseInt(item.selectedMaterialId));
                              if (material) {
                                const partArea = parseInt(item.partWidthMm) * parseInt(newLength);
                                const cost = (partArea * material.costPerMm2) / 100000;
                                updateItem(item.id, { partLengthMm: newLength, rawMaterialCost: cost.toFixed(2) });
                              }
                            }
                          }}
                          placeholder="200"
                        />
                      </div>
                    </div>

                    {item.partWidthMm && item.partLengthMm && item.selectedMaterialId && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Área calculada e custo de material</p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {(parseInt(item.partWidthMm) * parseInt(item.partLengthMm)).toLocaleString()} mm² 
                          {" → "}
                          R$ {parseFloat(item.rawMaterialCost).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Custo de Matéria-Prima (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.rawMaterialCost}
                        onChange={(e) => updateItem(item.id, { rawMaterialCost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Custo de Ferramentas (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.toolingCost}
                        onChange={(e) => updateItem(item.id, { toolingCost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Serviços de Terceiros (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.thirdPartyServicesCost}
                        onChange={(e) => updateItem(item.id, { thirdPartyServicesCost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tempo de Usinagem (minutos)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.machineTimeHours}
                        onChange={(e) => updateItem(item.id, { machineTimeHours: e.target.value })}
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <Label>Tempo de Setup (minutos)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.setupTimeHours}
                        onChange={(e) => updateItem(item.id, { setupTimeHours: e.target.value })}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  {/* Resumo do Item */}
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Resumo da Peça</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Custo de Máquina:</span>
                        <span className="font-medium">R$ {(item.totalMachineCost / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Custo de Mão de Obra:</span>
                        <span className="font-medium">R$ {(item.totalLaborCost / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between col-span-2 pt-2 border-t">
                        <span className="font-medium">Subtotal (× {item.quantity}):</span>
                        <span className="font-bold text-lg">R$ {(item.itemSubtotal / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Configurações e Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Financeiras e Observações</CardTitle>
              <CardDescription>Ajustes de margem, impostos e informações adicionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
                  <Input
                    id="profitMargin"
                    type="number"
                    min="0"
                    value={formData.profitMargin}
                    onChange={(e) => setFormData({ ...formData, profitMargin: e.target.value })}
                    placeholder="20"
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Impostos (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    placeholder="15"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais sobre o orçamento..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumo Final */}
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumo do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Subtotal (todas as peças):</span>
                  <span className="font-semibold">R$ {(totals.subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem de Lucro ({formData.profitMargin}%):</span>
                  <span>R$ {(totals.profitAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impostos ({formData.taxRate}%):</span>
                  <span>R$ {(totals.taxAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold pt-3 border-t">
                  <span>Valor Final:</span>
                  <span className="text-primary">R$ {(totals.finalPrice / 100).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/orcamentos")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? "Criando..." : "Criar Orçamento"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
