import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SettingsFormData {
  rentPerSquareMeter: string;
  electricityCostPerKwh: string;
  operatorHourlyCost: string;
  defaultProfitMargin: string;
  defaultTaxRate: string;
  workingHoursPerYear: string;
}

const defaultSettings: SettingsFormData = {
  rentPerSquareMeter: "0",
  electricityCostPerKwh: "0",
  operatorHourlyCost: "0",
  defaultProfitMargin: "20",
  defaultTaxRate: "0",
  workingHoursPerYear: "2080",
};

export default function Settings() {
  const [formData, setFormData] = useState<SettingsFormData>(defaultSettings);

  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();

  const upsertMutation = trpc.settings.upsert.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Configurações salvas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao salvar configurações");
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        rentPerSquareMeter: (settings.rentPerSquareMeter / 100).toFixed(2),
        electricityCostPerKwh: (settings.electricityCostPerKwh / 100).toFixed(2),
        operatorHourlyCost: (settings.operatorHourlyCost / 100).toFixed(2),
        defaultProfitMargin: settings.defaultProfitMargin.toString(),
        defaultTaxRate: settings.defaultTaxRate.toString(),
        workingHoursPerYear: settings.workingHoursPerYear.toString(),
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      rentPerSquareMeter: Math.round(parseFloat(formData.rentPerSquareMeter) * 100),
      electricityCostPerKwh: Math.round(parseFloat(formData.electricityCostPerKwh) * 100),
      operatorHourlyCost: Math.round(parseFloat(formData.operatorHourlyCost) * 100),
      defaultProfitMargin: parseInt(formData.defaultProfitMargin),
      defaultTaxRate: parseInt(formData.defaultTaxRate),
      workingHoursPerYear: parseInt(formData.workingHoursPerYear),
    };

    upsertMutation.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-2">
            Configure os custos fixos e parâmetros do sistema
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custos Fixos</CardTitle>
                <CardDescription>
                  Valores que afetam o cálculo do custo hora-máquina
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="rentPerSquareMeter">Aluguel por m² (R$/mês)</Label>
                    <Input
                      id="rentPerSquareMeter"
                      type="number"
                      step="0.01"
                      value={formData.rentPerSquareMeter}
                      onChange={(e) =>
                        setFormData({ ...formData, rentPerSquareMeter: e.target.value })
                      }
                      placeholder="50.00"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Custo do aluguel ou valor do imóvel por metro quadrado
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="electricityCostPerKwh">Custo do kWh (R$)</Label>
                    <Input
                      id="electricityCostPerKwh"
                      type="number"
                      step="0.01"
                      value={formData.electricityCostPerKwh}
                      onChange={(e) =>
                        setFormData({ ...formData, electricityCostPerKwh: e.target.value })
                      }
                      placeholder="0.75"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor do quilowatt-hora na sua conta de energia
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="operatorHourlyCost">Custo Hora do Operador (R$/h)</Label>
                  <Input
                    id="operatorHourlyCost"
                    type="number"
                    step="0.01"
                    value={formData.operatorHourlyCost}
                    onChange={(e) =>
                      setFormData({ ...formData, operatorHourlyCost: e.target.value })
                    }
                    placeholder="25.00"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Salário + encargos do operador dividido pelas horas trabalhadas
                  </p>
                </div>

                <div>
                  <Label htmlFor="workingHoursPerYear">Horas de Trabalho por Ano</Label>
                  <Input
                    id="workingHoursPerYear"
                    type="number"
                    value={formData.workingHoursPerYear}
                    onChange={(e) =>
                      setFormData({ ...formData, workingHoursPerYear: e.target.value })
                    }
                    placeholder="2080"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Padrão: 2080 horas (40h/semana × 52 semanas)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parâmetros de Precificação</CardTitle>
                <CardDescription>
                  Valores padrão para cálculo de orçamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="defaultProfitMargin">Margem de Lucro Padrão (%)</Label>
                    <Input
                      id="defaultProfitMargin"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.defaultProfitMargin}
                      onChange={(e) =>
                        setFormData({ ...formData, defaultProfitMargin: e.target.value })
                      }
                      placeholder="20"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Margem de lucro aplicada sobre os custos totais
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="defaultTaxRate">Taxa de Impostos Padrão (%)</Label>
                    <Input
                      id="defaultTaxRate"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.defaultTaxRate}
                      onChange={(e) =>
                        setFormData({ ...formData, defaultTaxRate: e.target.value })
                      }
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Impostos aplicados sobre o valor final (ISS, PIS, COFINS, etc.)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                disabled={upsertMutation.isPending}
                className="min-w-32"
              >
                {upsertMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        )}

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Como funciona o cálculo?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Custo Hora-Máquina</h4>
              <p>
                O custo hora-máquina é calculado somando:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Depreciação: (Valor de Compra - Valor Residual) ÷ Vida Útil</li>
                <li>Custo de Área: (Aluguel/m² × Área Ocupada) ÷ Horas Trabalhadas/Ano</li>
                <li>Energia Elétrica: Potência (kW) × Custo do kWh</li>
                <li>Manutenção: Custo Anual de Manutenção ÷ Horas Trabalhadas/Ano</li>
                <li>Consumíveis: Custo Anual de Consumíveis ÷ Horas Trabalhadas/Ano</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Preço Final do Orçamento</h4>
              <p>
                O preço final é calculado da seguinte forma:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Custos Diretos: Matéria-Prima + Ferramentas + Serviços de Terceiros</li>
                <li>Custo de Máquina: Custo Hora-Máquina × Tempo de Usinagem</li>
                <li>Custo de Mão de Obra: Custo Hora-Operador × (Tempo de Usinagem + Setup)</li>
                <li>Subtotal: Soma de todos os custos acima</li>
                <li>Margem de Lucro: Subtotal × (Margem % ÷ 100)</li>
                <li>Impostos: (Subtotal + Lucro) × (Taxa de Impostos % ÷ 100)</li>
                <li>Preço Final: Subtotal + Lucro + Impostos</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
