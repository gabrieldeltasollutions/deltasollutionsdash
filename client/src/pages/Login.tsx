import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpc.useUtils();
  
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      toast.success("Login realizado com sucesso!");
      // Invalidar a query para forçar refetch
      await utils.auth.me.invalidate();
      // Aguardar o refetch explícito para garantir que o cookie foi processado e o usuário está disponível
      try {
        const result = await utils.auth.me.refetch();
        // Verificar se o usuário foi retornado corretamente
        if (result.data) {
          // Redirecionar apenas após confirmar que o usuário está autenticado
          setLocation("/");
        } else {
          // Se ainda não tem usuário, aguardar um pouco mais e tentar novamente
          await new Promise(resolve => setTimeout(resolve, 200));
          const retryResult = await utils.auth.me.refetch();
          if (retryResult.data) {
            setLocation("/");
          } else {
            toast.error("Erro ao verificar autenticação. Tente fazer login novamente.");
          }
        }
      } catch (error) {
        console.error("[LOGIN] Erro ao refetch auth.me:", error);
        // Mesmo com erro, tentar redirecionar (o cookie pode estar salvo)
        setLocation("/");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[LOGIN FRONTEND] Dados do formulário:", { email, password: password ? "***" : "(vazio)" });
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{APP_TITLE}</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-sm text-center text-muted-foreground space-y-2">
              <div>
                <button
                  type="button"
                  onClick={() => setLocation("/forgot-password")}
                  className="text-primary hover:underline font-medium"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div>
                Não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/register")}
                  className="text-primary hover:underline font-medium"
                >
                  Cadastre-se
                </button>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
