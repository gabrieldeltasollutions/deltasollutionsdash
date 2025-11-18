import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Copy, Mail, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminResetCodes() {
  const [email, setEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState<{
    code: string;
    expiresAt: Date;
    userName: string | null;
  } | null>(null);

  const activeCodesQuery = trpc.auth.listActiveResetCodes.useQuery();
  
  const generateCodeMutation = trpc.auth.generateResetCode.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setGeneratedCode({
        code: data.code,
        expiresAt: new Date(data.expiresAt),
        userName: data.userName,
      });
      setEmail("");
      activeCodesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar código");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateCodeMutation.mutate({ email });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Código copiado!");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Códigos de Recuperação</h1>
        <p className="text-muted-foreground">
          Gere códigos temporários para usuários recuperarem suas senhas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário para gerar código */}
        <Card>
          <CardHeader>
            <CardTitle>Gerar Novo Código</CardTitle>
            <CardDescription>
              Insira o email do usuário para gerar um código de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do Usuário</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={generateCodeMutation.isPending}
              >
                {generateCodeMutation.isPending ? "Gerando..." : "Gerar Código"}
              </Button>
            </form>

            {generatedCode && (
              <Alert className="mt-4">
                <AlertDescription className="space-y-3">
                  <div>
                    <p className="font-semibold mb-2">✅ Código gerado com sucesso!</p>
                    {generatedCode.userName && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <User className="inline h-3 w-3 mr-1" />
                        {generatedCode.userName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted p-3 rounded-md font-mono text-2xl font-bold text-center tracking-wider">
                      {generatedCode.code}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCode.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    Expira em: {format(generatedCode.expiresAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Informe este código ao usuário para que ele possa redefinir sua senha.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Lista de códigos ativos */}
        <Card>
          <CardHeader>
            <CardTitle>Códigos Ativos</CardTitle>
            <CardDescription>
              Códigos de recuperação que ainda não expiraram
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeCodesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : activeCodesQuery.data && activeCodesQuery.data.length > 0 ? (
              <div className="space-y-3">
                {activeCodesQuery.data.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{item.name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground">{item.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(item.code || "")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-lg">{item.code}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.expiresAt && format(new Date(item.expiresAt), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum código ativo no momento
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
