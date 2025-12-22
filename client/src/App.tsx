import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import HostDashboard from "@/pages/HostDashboard";
import AttendeeMode from "@/pages/AttendeeMode";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/host/:id" component={HostDashboard} />
      <Route path="/join/:id" component={AttendeeMode} />
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
