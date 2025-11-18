import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Download, Eye, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type StatusFilter = "all" | "pendente" | "aprovado" | "rejeitado";

export default function Quotes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const utils = trpc.useUtils();
  
  const { data: quotes, isLoading } = trpc.quotes.list.useQuery();
  const { data: machines } = trpc.machines.list.useQuery();

  const deleteMutation = trpc.quotes.delete.useMutation({
    onSuccess: () => {
      utils.quotes.list.invalidate();
      toast.success("Orçamento excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir orçamento");
    },
  });

  const exportPdfMutation = trpc.quotes.exportPdf.useMutation();

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este orçamento?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExportPDF = async (id: number, clientName: string) => {
    try {
      const result = await exportPdfMutation.mutateAsync({ id });
      
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(result.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar PDF. Tente novamente.");
    }
  };

  const getMachineName = (machineId: number) => {
    const machine = machines?.find((m) => m.id === machineId);
    return machine?.name || "Máquina não encontrada";
  };

  const filteredQuotes = quotes?.filter((quote) => {
    const matchesSearch =
      quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.id.toString().includes(searchTerm);
    
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pendente" && quote.status === "pendente") ||
      (statusFilter === "aprovado" && quote.status === "aprovado") ||
      (statusFilter === "rejeitado" && quote.status === "rejeitado");
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Orçamentos</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus orçamentos de usinagem
            </p>
          </div>
          <Link href="/quotes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou descrição da peça..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "pendente" ? "default" : "outline"}
              onClick={() => setStatusFilter("pendente")}
              size="sm"
            >
              Pendentes
            </Button>
            <Button
              variant={statusFilter === "aprovado" ? "default" : "outline"}
              onClick={() => setStatusFilter("aprovado")}
              size="sm"
            >
              Aprovados
            </Button>
            <Button
              variant={statusFilter === "rejeitado" ? "default" : "outline"}
              onClick={() => setStatusFilter("rejeitado")}
              size="sm"
            >
              Rejeitados
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : !filteredQuotes || filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? "Nenhum orçamento encontrado" : "Nenhum orçamento gerado"}
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {searchTerm
                  ? "Tente buscar com outros termos"
                  : "Comece criando seu primeiro orçamento para calcular o preço de serviços de usinagem"}
              </p>
              {!searchTerm && (
                <Link href="/quotes/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Orçamento
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuotes.map((quote) => (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {quote.clientName}
                          </h3>
                          <Badge variant={quote.status === "aprovado" ? "default" : "secondary"} className="text-xs">
                            {quote.status === "aprovado" ? "Aprovado" : "Pendente"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Orçamento #{quote.id}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Data</p>
                          <p className="font-medium">
                            {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Margem de Lucro</p>
                          <p className="font-medium">{quote.profitMargin}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Impostos</p>
                          <p className="font-medium">{quote.taxRate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Margem de Lucro</p>
                          <p className="font-medium">{quote.profitMargin}%</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-2 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Subtotal</p>
                          <p className="font-medium">R$ {(quote.subtotal / 100).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Lucro</p>
                          <p className="font-medium text-green-600">
                            R$ {(quote.profitAmount / 100).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Impostos</p>
                          <p className="font-medium">R$ {(quote.taxAmount / 100).toFixed(2)}</p>
                        </div>
                        <div className="ml-auto">
                          <p className="text-xs text-muted-foreground">Preço Final</p>
                          <p className="text-xl font-bold text-primary">
                            R$ {(quote.finalPrice / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-6">
                      <Link href={`/quotes/${quote.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPDF(quote.id, quote.clientName)}
                        disabled={exportPdfMutation.isPending}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(quote.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                        Excluir
                      </Button>
                    </div>
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
