import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Calculator, Wrench, FileText, Plus, DollarSign, Clock, CheckCircle, XCircle, Shield } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Home() {
  const { data: machines, isLoading: loadingMachines } = trpc.machines.list.useQuery();
  const { data: quotes, isLoading: loadingQuotes } = trpc.quotes.list.useQuery();
  const { data: stats, isLoading: loadingStats } = trpc.quotes.stats.useQuery();
  const { data: monthlyStats, isLoading: loadingMonthlyStats } = trpc.quotes.monthlyStats.useQuery();
  const { data: statusCount, isLoading: loadingStatusCount } = trpc.quotes.statusCount.useQuery();

  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('todos');

  const totalMachines = machines?.length || 0;
  const totalQuotes = quotes?.length || 0;
  
  // Filtrar orçamentos por status
  const filteredQuotes = quotes?.filter(quote => {
    if (statusFilter === 'todos') return true;
    return quote.status === statusFilter;
  }) || [];
  
  const recentQuotes = filteredQuotes.slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  const chartData = monthlyStats?.map(item => ({
    month: formatMonth(item.month),
    value: item.value / 100, // Converter centavos para reais
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral do sistema de orçamento de usinagem
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Máquinas</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingMachines ? "..." : totalMachines}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Máquinas cadastradas no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamentos Gerados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingQuotes ? "..." : totalQuotes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de orçamentos criados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Gerado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : formatCurrency(stats?.totalGenerated || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Soma de todos os orçamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Aprovado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loadingStats ? "..." : formatCurrency(stats?.totalApproved || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Soma dos orçamentos aprovados
              </p>
            </CardContent>
          </Card>


        </div>

        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'todos' ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
            onClick={() => setStatusFilter('todos')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Todos os Orçamentos</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loadingQuotes ? "..." : totalQuotes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de orçamentos
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'pendente' ? 'ring-2 ring-gray-500 shadow-lg' : ''
            }`}
            onClick={() => setStatusFilter('pendente')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamentos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {loadingStatusCount ? "..." : statusCount?.pendentes || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'aprovado' ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
            onClick={() => setStatusFilter('aprovado')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamentos Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loadingStatusCount ? "..." : statusCount?.aprovados || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Confirmados pelo cliente
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'rejeitado' ? 'ring-2 ring-red-500 shadow-lg' : ''
            }`}
            onClick={() => setStatusFilter('rejeitado')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamentos Rejeitados</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loadingStatusCount ? "..." : statusCount?.rejeitados || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Não aprovados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal de Orçamentos Aprovados</CardTitle>
            <CardDescription>
              Valor total de orçamentos aprovados por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMonthlyStats ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : chartData.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum orçamento aprovado ainda</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis 
                    className="text-xs text-muted-foreground"
                    tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Valor']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter === 'todos' && 'Orçamentos Recentes'}
              {statusFilter === 'pendente' && 'Orçamentos Pendentes'}
              {statusFilter === 'aprovado' && 'Orçamentos Aprovados'}
              {statusFilter === 'rejeitado' && 'Orçamentos Rejeitados'}
            </CardTitle>
            <CardDescription>
              {statusFilter === 'todos' && 'Últimos orçamentos gerados no sistema'}
              {statusFilter === 'pendente' && 'Orçamentos aguardando aprovação'}
              {statusFilter === 'aprovado' && 'Orçamentos confirmados pelo cliente'}
              {statusFilter === 'rejeitado' && 'Orçamentos não aprovados'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingQuotes ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : recentQuotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum orçamento gerado ainda</p>
                <Link href="/quotes/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Orçamento
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{quote.clientName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Orçamento #{quote.id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-foreground">
                        R$ {(quote.finalPrice / 100).toFixed(2)}
                      </p>
                      <Link href={`/quotes/${quote.id}`}>
                        <Button variant="outline" size="sm" className="mt-2">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {totalQuotes > 5 && (
                  <div className="text-center pt-4">
                    <Link href="/quotes">
                      <Button variant="outline">Ver Todos os Orçamentos</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        {totalMachines === 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle>Comece Aqui</CardTitle>
              <CardDescription>
                Configure seu sistema em 3 passos simples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Configure os Custos Fixos</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Defina aluguel, energia elétrica e custos de mão de obra
                  </p>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="mt-2">
                      Ir para Configurações
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Cadastre suas Máquinas</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione centros de usinagem, tornos e fresadoras
                  </p>
                  <Link href="/machines">
                    <Button variant="outline" size="sm" className="mt-2">
                      Cadastrar Máquinas
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Gere seu Primeiro Orçamento</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Calcule preços precisos para seus clientes
                  </p>
                  <Link href="/quotes/new">
                    <Button variant="outline" size="sm" className="mt-2" disabled={totalMachines === 0}>
                      Criar Orçamento
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
