import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, Printer, Check, Edit } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function QuoteDetail() {
  const [, params] = useRoute("/quotes/:id");
  const [, setLocation] = useLocation();
  const quoteId = params?.id ? parseInt(params.id) : 0;

  const { data: quoteData, isLoading, error } = trpc.quotes.getById.useQuery({ id: quoteId });
  const { data: machines } = trpc.machines.list.useQuery();
  const { data: materials } = trpc.materials.list.useQuery();

  const exportPdfMutation = trpc.quotes.exportPdf.useMutation();
  const approveMutation = trpc.quotes.approve.useMutation();
  const utils = trpc.useUtils();

  const handlePrint = () => {
    window.print();
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({ id: quoteId });
      // Invalidar query para atualizar dados
      utils.quotes.getById.invalidate({ id: quoteId });
    } catch (error) {
      console.error("Erro ao aprovar orçamento:", error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const result = await exportPdfMutation.mutateAsync({ id: quoteId });
      
      if (!result.pdf || result.pdf.length === 0) {
        throw new Error('PDF vazio recebido do servidor');
      }
      
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
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert(`Erro ao exportar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      </DashboardLayout>
    );
  }

  if (!quoteData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground">Orçamento não encontrado</div>
      </DashboardLayout>
    );
  }

  const quote = quoteData;
  const items = quote.items || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 print:space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/orcamentos")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Orçamento #{quote.id}</h1>
                <Badge variant={quote.status === "aprovado" ? "default" : "secondary"}>
                  {quote.status === "aprovado" ? "Aprovado" : "Pendente"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{quote.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img 
              src="/logo-delta.png" 
              alt="Delta Solutions" 
              className="h-12 w-auto object-contain"
            />
            <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation(`/quotes/${quote.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleExportPDF} disabled={exportPdfMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {exportPdfMutation.isPending ? "Gerando..." : "Exportar PDF"}
            </Button>
            </div>
          </div>
        </div>

        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{quote.clientName}</p>
              </div>
              {quote.client?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{quote.client.email}</p>
                </div>
              )}
              {quote.client?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{quote.client.phone}</p>
                </div>
              )}
              {quote.client?.document && (
                <div>
                  <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-medium">{quote.client.document}</p>
                </div>
              )}
              {quote.client?.address && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">
                    {quote.client.address}
                    {quote.client.city && `, ${quote.client.city}`}
                    {quote.client.state && ` - ${quote.client.state}`}
                    {quote.client.zipCode && ` - CEP: ${quote.client.zipCode}`}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Data do Orçamento</p>
                <p className="font-medium">
                  {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Peças */}
        <Card>
          <CardHeader>
            <CardTitle>Peças do Orçamento</CardTitle>
            <CardDescription>{items.length} peça(s) neste orçamento</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead>Máquina</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Tempo</TableHead>
                  <TableHead className="text-right">Valor Unitário</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: any, index: number) => {
                  const machine = machines?.find(m => m.id === item.machineId);
                  const material = item.materialId ? materials?.find(m => m.id === item.materialId) : null;
                  const totalTime = (item.machineTimeHours + item.setupTimeHours) / 60;
                  const unitPrice = item.itemSubtotal / item.quantity;
                  
                  return (
                    <TableRow key={item.id || index}>
                      <TableCell className="font-medium">{item.partDescription}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell>{machine?.name || "-"}</TableCell>
                      <TableCell>
                        {material ? (
                          <div className="text-sm">
                            <div>{material.name}</div>
                            {item.partWidthMm && item.partLengthMm && (
                              <div className="text-muted-foreground">
                                {item.partWidthMm} × {item.partLengthMm} mm
                              </div>
                            )}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {totalTime.toFixed(2)}h
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(unitPrice / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {(item.itemSubtotal / 100).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Observações */}
        {quote.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{quote.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Resumo Final */}
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Resumo do Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span>Subtotal (todas as peças):</span>
                <span className="font-semibold">R$ {(quote.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Margem de Lucro ({quote.profitMargin}%):
                </span>
                <span>R$ {(quote.profitAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impostos ({quote.taxRate}%):</span>
                <span>R$ {(quote.taxAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-3 border-t">
                <span>Valor Final:</span>
                <span className="text-primary">R$ {(quote.finalPrice / 100).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        {quote.status !== "aprovado" && (
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>
                Aprovar este orçamento irá marcar como aprovado e não poderá ser revertido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleApprove} 
                disabled={approveMutation.isPending}
                className="w-full sm:w-auto"
              >
                <Check className="h-4 w-4 mr-2" />
                {approveMutation.isPending ? "Aprovando..." : "Aprovar Orçamento"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
