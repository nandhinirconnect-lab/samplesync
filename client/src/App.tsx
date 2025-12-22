import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import HostDashboard from "@/pages/HostDashboard";
import AttendeeMode from "@/pages/AttendeeMode";

function ProtectedRoute({ component: Component, authenticated }: { component: React.ComponentType<any>; authenticated: boolean }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!authenticated) {
      setLocation("/login");
    }
  }, [authenticated, setLocation]);

  return authenticated ? <Component /> : null;
}

function Router({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/dashboard" component={() => isAuthenticated ? <HostDashboard /> : <LoginPage />} />
      <Route path="/host/:id" component={HostDashboard} />
      <Route path="/join/:eventId" component={AttendeeMode} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setIsAuthenticated(!!userId);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-xl">FlashMan</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router isAuthenticated={isAuthenticated} />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
