import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BurndownChartProps {
  data: {
    projectName: string;
    startDate: Date;
    endDate: Date;
    totalTasks: number;
    chartData: Array<{
      date: string;
      ideal: number;
      real: number;
    }>;
  } | null;
}

export default function BurndownChart({ data }: BurndownChartProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
          <CardDescription>Selecione um projeto para visualizar o gráfico de progresso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhum projeto selecionado ou projeto sem datas definidas
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formatar dados para exibição
  const formattedData = data.chartData.map(item => ({
    ...item,
    // Formatar data para exibição (dd/mm)
    displayDate: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }));

  // Mostrar apenas algumas datas no eixo X para não poluir
  const tickInterval = Math.ceil(formattedData.length / 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Burndown Chart - {data.projectName}</CardTitle>
        <CardDescription>
          Acompanhe o progresso do projeto: {data.totalTasks} tarefas totais | 
          {' '}{new Date(data.startDate).toLocaleDateString('pt-BR')} - {new Date(data.endDate).toLocaleDateString('pt-BR')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayDate" 
              interval={tickInterval}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              label={{ value: 'Tarefas Pendentes', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                const label = name === 'ideal' ? 'Ideal' : 'Real';
                return [`${value} tarefas`, label];
              }}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend 
              formatter={(value) => value === 'ideal' ? 'Progresso Ideal' : 'Progresso Real'}
            />
            <Line 
              type="monotone" 
              dataKey="ideal" 
              stroke="#94a3b8" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="ideal"
            />
            <Line 
              type="monotone" 
              dataKey="real" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="real"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
