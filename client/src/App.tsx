import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import Adaptativo from "@/pages/Adaptativo";

// Code-splitting: solo Home va en el bundle inicial (es la landing pública y
// define el LCP). Todo lo demás — dashboards, admin, course player — se carga
// bajo demanda; un visitante que solo mira la landing no descarga nada de eso.
const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CoursePlayer = lazy(() => import("@/pages/CoursePlayer"));
const DriveSync = lazy(() => import("@/pages/DriveSync"));
const TextbookConfig = lazy(() => import("@/pages/TextbookConfig"));
const Reservations = lazy(() => import("@/pages/Reservations"));
const PlanSettings = lazy(() => import("@/pages/PlanSettings"));
const LevelPlanSettings = lazy(() => import("@/pages/LevelPlanSettings"));
const PlanSelector2026 = lazy(() => import("@/pages/PlanSelector2026"));
const BarkleyAdmin = lazy(() => import("@/pages/BarkleyAdmin"));
const EvaluationLinksAdmin = lazy(() => import("@/pages/EvaluationLinksAdmin"));
const GeminiCopilotsAdmin = lazy(() => import("@/pages/GeminiCopilotsAdmin"));
const FaqAdmin = lazy(() => import("@/pages/FaqAdmin"));
const PaesAdmin = lazy(() => import("@/pages/PaesAdmin"));
const ReservationsAdmin = lazy(() => import("@/pages/ReservationsAdmin"));
const AcademicCopilot = lazy(() => import("@/pages/AcademicCopilot"));
const PaymentResult = lazy(() => import("@/pages/PaymentResult"));
const PrivacyPolicy = lazy(() => import("@/pages/Legal").then((m) => ({ default: m.PrivacyPolicy })));
const TermsOfUse = lazy(() => import("@/pages/Legal").then((m) => ({ default: m.TermsOfUse })));
const RefundPolicy = lazy(() => import("@/pages/Legal").then((m) => ({ default: m.RefundPolicy })));

import Lenis from 'lenis';
import { useEffect, lazy, Suspense } from "react";

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
    <Suspense fallback={null}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/adaptativo" component={Adaptativo} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/course/:id" component={CoursePlayer} />
      <Route path="/drive-sync" component={DriveSync} />
      <Route path="/textbook-config" component={TextbookConfig} />
      {/* <Route path="/textbook-config-new" component={TextbookConfigNew} /> */}
      <Route path="/reservations" component={Reservations} />
      <Route path="/plan-settings" component={PlanSettings} />
      <Route path="/level-plan-settings" component={LevelPlanSettings} />
      <Route path="/planes-2026" component={PlanSelector2026} />
      <Route path="/barkley-admin" component={BarkleyAdmin} />
      <Route path="/evaluation-links-admin" component={EvaluationLinksAdmin} />
      <Route path="/gemini-copilots-admin" component={GeminiCopilotsAdmin} />
      <Route path="/faq-admin" component={FaqAdmin} />
      <Route path="/paes-admin" component={PaesAdmin} />
      <Route path="/reservations-admin" component={ReservationsAdmin} />
      <Route path="/academic-copilot" component={AcademicCopilot} />
      <Route path="/payment-result" component={PaymentResult} />
      <Route path="/privacidad" component={PrivacyPolicy} />
      <Route path="/terminos" component={TermsOfUse} />
      <Route path="/reembolso" component={RefundPolicy} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
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