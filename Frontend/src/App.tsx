import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import Index from "./pages/Index.tsx";
import Story from "./pages/Story.tsx";
import Method from "./pages/Method.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Shell = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center border-b border-border bg-card sticky top-0 z-30">
          <SidebarTrigger className="ml-2" />
          <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-3">
            Bollywood Movie Intelligence
          </span>
        </header>
        <div className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/story" element={<Story />} />
            <Route path="/method" element={<Method />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
