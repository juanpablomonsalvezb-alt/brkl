import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bot, ExternalLink, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GeminiCopilot {
  id: string;
  name: string;
  geminiLink: string;
  description?: string;
  levelIds: string;
  isActive: boolean;
}

interface GeminiCopilotButtonProps {
  levelId: string;
  variant?: "default" | "floating" | "inline" | "sidebar";
  className?: string;
}

export function GeminiCopilotButton({ 
  levelId, 
  variant = "default",
  className = "" 
}: GeminiCopilotButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  // Fetch copilot for this level
  const { data: copilot, isLoading } = useQuery<GeminiCopilot>({
    queryKey: [`/api/gemini-copilots/by-level/${levelId}`],
    retry: false,
  });

  const openCopilot = () => {
    if (copilot?.geminiLink) {
      window.open(copilot.geminiLink, "_blank", "noopener,noreferrer");
      setShowDialog(false);
    } else {
      // Navigate to Academic Copilot page
      window.location.href = "/academic-copilot";
    }
  };

  // For non-sidebar variants, hide if loading or no copilot
  if ((isLoading || !copilot) && variant !== "sidebar") {
    return null;
  }

  if (variant === "floating") {
    return (
      <>
        <button
          onClick={() => setShowDialog(true)}
          className={`fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group ${className}`}
          title={`Hablar con ${copilot.name}`}
        >
          <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </button>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-purple-600" />
                {copilot.name}
              </DialogTitle>
              <DialogDescription>
                {copilot.description || "Tu asistente de IA personalizado para ayudarte en tus estudios"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  ¿Qué puede hacer por ti?
                </h4>
                <ul className="text-sm space-y-1 text-slate-700">
                  <li>✓ Responder preguntas sobre el contenido</li>
                  <li>✓ Explicar conceptos difíciles</li>
                  <li>✓ Ayudarte con ejercicios y tareas</li>
                  <li>✓ Prepararte para evaluaciones</li>
                </ul>
              </div>
              <Button onClick={openCopilot} className="w-full" size="lg">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Chat con {copilot.name}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (variant === "inline") {
    return (
      <Button
        onClick={openCopilot}
        variant="outline"
        className={`border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 ${className}`}
      >
        <Bot className="w-4 h-4 mr-2 text-purple-600" />
        Pregúntale a {copilot.name}
      </Button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={openCopilot}
        className={`group relative w-full overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] ${className}`}
      >
        {/* Animated gradient background - inspired by Stripe */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-700 opacity-100 transition-opacity duration-500"></div>
        
        {/* Animated mesh gradient overlay - inspired by Apple */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-600 animate-pulse"></div>
        </div>
        
        {/* Noise texture for depth */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay">
          <svg className="w-full h-full">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)"/>
          </svg>
        </div>
        
        {/* Shimmer effect - inspired by Linear */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        {/* Glass morphism layer */}
        <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-900/50">
          {/* Floating orbs background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 delay-150"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Icon with glow */}
            <div className="flex items-center justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20 group-hover:border-white/40 transition-all duration-500">
                  <Bot className="w-8 h-8 text-white drop-shadow-2xl" />
                  <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-300 to-pink-400 rounded-full p-1">
                    <Sparkles className="w-3 h-3 text-white animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Text */}
            <div className="text-center mb-6">
              <h3 className="font-bold text-xl text-white mb-2 tracking-tight drop-shadow-lg">
                Academic Copilot
              </h3>
              <p className="text-sm text-white/90 font-medium drop-shadow-md">
                Tu asistente de IA personalizado
              </p>
            </div>
            
            {/* CTA Button with micro-interactions */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
              <div className="relative flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-purple-700 rounded-2xl font-bold text-base shadow-xl shadow-white/25 group-hover:shadow-2xl group-hover:shadow-white/40 transition-all duration-500 group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-50">
                <span className="group-hover:scale-105 transition-transform duration-300">Abrir Chat</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Default variant
  return (
    <Button
      onClick={openCopilot}
      className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 ${className}`}
    >
      <Bot className="w-4 h-4 mr-2" />
      Chat con IA
    </Button>
  );
}
