import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import CoursePlayer from "@/pages/CoursePlayer";
import DriveSync from "@/pages/DriveSync";
import TextbookConfig from "@/pages/TextbookConfig";
import TextbookConfigNew from "@/pages/TextbookConfigNew";
import Reservations from "@/pages/Reservations";
import PlanSettings from "@/pages/PlanSettings";
import LevelPlanSettings from "@/pages/LevelPlanSettings";
import PlanSelector2026 from "@/pages/PlanSelector2026";
import BarkleyAdmin from "@/pages/BarkleyAdmin";
import EvaluationLinksAdmin from "@/pages/EvaluationLinksAdmin";
import GeminiCopilotsAdmin from "@/pages/GeminiCopilotsAdmin";
import FaqAdmin from "@/pages/FaqAdmin";

import Lenis from 'lenis';
import { useEffect } from "react";

function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/course/:id" component={CoursePlayer} />
      <Route path="/drive-sync" component={DriveSync} />
      <Route path="/textbook-config" component={TextbookConfig} />
      <Route path="/textbook-config-new" component={TextbookConfigNew} />
      <Route path="/reservations" component={Reservations} />
      <Route path="/plan-settings" component={PlanSettings} />
      <Route path="/level-plan-settings" component={LevelPlanSettings} />
      <Route path="/planes-2026" component={PlanSelector2026} />
      <Route path="/barkley-admin" component={BarkleyAdmin} />
      <Route path="/evaluation-links-admin" component={EvaluationLinksAdmin} />
      <Route path="/gemini-copilots-admin" component={GeminiCopilotsAdmin} />
      <Route path="/faq-admin" component={FaqAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* <SmoothScroll /> */}
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;