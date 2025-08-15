import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Journal from "@/pages/Journal";
import Progress from "@/pages/Progress";
import Personas from "@/pages/Personas";
import { AdminDashboard } from "@/pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/chat" component={Chat} />
          <Route path="/chat/:id" component={Chat} />
          <Route path="/journal" component={Journal} />
          <Route path="/journal/:id" component={Journal} />
          <Route path="/progress" component={Progress} />
          <Route path="/personas" component={Personas} />
        </>
      )}
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
