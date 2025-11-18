import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AdminResetCodes from "@/pages/AdminResetCodes";
import AdminUsers from "@/pages/AdminUsers";
import UserManagement from "@/pages/UserManagement";
import Machines from "@/pages/Machines";
import Materials from "@/pages/Materials";
import Clients from "@/pages/Clients";
import Projects from "@/pages/Projects";
import ProjectsDashboard from "@/pages/ProjectsDashboard";
import TeamActivities from "@/pages/TeamActivities";
import Purchases from "@/pages/Purchases";
import ProjectSchedule from "@/pages/ProjectSchedule";
import ProjectScheduleView from "@/pages/ProjectScheduleView";
import Team from "@/pages/Team";
import Quotes from "@/pages/Quotes";
import NewQuote from "@/pages/NewQuote";
import EditQuote from "@/pages/EditQuote";
import QuoteDetail from "@/pages/QuoteDetail";
import Settings from "@/pages/Settings";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { useEffect } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Aguardar um pouco mais antes de redirecionar para dar tempo do cookie ser processado
    if (!loading && !user) {
      const timer = setTimeout(() => {
        setLocation("/login");
      }, 500); // Aguardar 500ms antes de redirecionar
      
      return () => clearTimeout(timer);
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Mostrar loading enquanto aguarda redirecionamento
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/admin/reset-codes">
        {() => <ProtectedRoute component={AdminResetCodes} />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} />}
      </Route>
      <Route path="/users">
        {() => <ProtectedRoute component={UserManagement} />}
      </Route>
      <Route path="/">
        {() => <ProtectedRoute component={ProjectsDashboard} />}
      </Route>
      <Route path="/machines">
        {() => <ProtectedRoute component={Machines} />}
      </Route>
      <Route path="/materials">
        {() => <ProtectedRoute component={Materials} />}
      </Route>
      <Route path="/clients">
        {() => <ProtectedRoute component={Clients} />}
      </Route>
      <Route path="/projects">
        {() => <ProtectedRoute component={Projects} />}
      </Route>
      <Route path="/projects/dashboard">
        {() => <ProtectedRoute component={ProjectsDashboard} />}
      </Route>
      <Route path="/projects/team-activities">
        {() => <ProtectedRoute component={TeamActivities} />}
      </Route>
      <Route path="/projects/purchases">
        {() => <ProtectedRoute component={Purchases} />}
      </Route>
      <Route path="/projects/schedule/:id" component={() => <ProtectedRoute component={ProjectScheduleView} />} />
      <Route path="/projects/schedule" component={() => <ProtectedRoute component={ProjectSchedule} />} />
      <Route path="/team">
        {() => <ProtectedRoute component={Team} />}
      </Route>
      <Route path="/quotes">
        {() => <ProtectedRoute component={Quotes} />}
      </Route>
      <Route path="/quotes/new">
        {() => <ProtectedRoute component={NewQuote} />}
      </Route>
      <Route path="/quotes/:id/edit">
        {() => <ProtectedRoute component={EditQuote} />}
      </Route>
      <Route path="/quotes/:id">
        {() => <ProtectedRoute component={QuoteDetail} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={Settings} />}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
