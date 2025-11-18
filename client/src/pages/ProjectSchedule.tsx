import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function ProjectSchedule() {
  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const [, setLocation] = useLocation();

  const handleViewSchedule = (projectId: number) => {
    setLocation(`/projects/schedule/${projectId}`);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cronograma de Projetos</h1>
            <p className="text-muted-foreground mt-2">
              Visualize o cronograma completo de cada projeto com gráfico de Gantt
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !projects || projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum projeto encontrado</p>
              <p className="text-sm text-muted-foreground">
                Crie um novo projeto para visualizar o cronograma
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        {project.startDate && project.endDate ? (
                          <>
                            {new Date(project.startDate).toLocaleDateString('pt-BR')} -{' '}
                            {new Date(project.endDate).toLocaleDateString('pt-BR')}
                          </>
                        ) : (
                          'Datas não definidas'
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => handleViewSchedule(project.id)}
                      disabled={!project.startDate || !project.endDate}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Visualizar Cronograma
                    </Button>
                  </div>
                </CardHeader>
                {project.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
