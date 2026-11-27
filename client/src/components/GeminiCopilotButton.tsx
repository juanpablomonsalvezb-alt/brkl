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
          className={`fixed bottom-6 right-6 z-50 p-4 bg-(--vx-violeta) text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group ${className}`}
          title={`Hablar con ${copilot?.name}`}
        >
          <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--vx-turquesa-soft) opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-(--vx-turquesa-text)"></span>
          </span>
        </button>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="vx-course sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-(--vx-violeta)" />
                {copilot?.name}
              </DialogTitle>
              <DialogDescription>
                {copilot?.description || "Tu asistente de IA personalizado para ayudarte en tus estudios"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-(--vx-violeta-soft) rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-(--vx-violeta)" />
                  ¿Qué puede hacer por ti?
                </h4>
                <ul className="text-sm space-y-1 text-(--vx-ink-soft)">
                  <li>✓ Responder preguntas sobre el contenido</li>
                  <li>✓ Explicar conceptos difíciles</li>
                  <li>✓ Ayudarte con ejercicios y tareas</li>
                  <li>✓ Prepararte para evaluaciones</li>
                </ul>
              </div>
              <Button onClick={openCopilot} className="w-full" size="lg">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Chat con {copilot?.name}
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
        className={`border-(--vx-violeta-soft) bg-(--vx-violeta-soft) hover:bg-(--vx-violeta-soft) ${className}`}
      >
        <Bot className="w-4 h-4 mr-2 text-(--vx-violeta)" />
        Pregúntale a {copilot?.name}
      </Button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={openCopilot}
        className={`relative w-full overflow-hidden rounded-[10px] bg-(--vx-night) text-white ${className}`}
      >
        {/* Animated gradient background - inspired by Stripe */}
        <div className="absolute inset-0 bg-(--vx-night)"></div>
        
        {/* Animated mesh gradient overlay - inspired by Apple */}
        <div className="absolute inset-0 hidden">
          <div className="absolute inset-0 bg-(--vx-night)"></div>
        </div>
        
        {/* Noise texture for depth */}
        <div className="absolute inset-0 hidden">
          <svg className="w-full h-full">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)"/>
          </svg>
        </div>
        
        {/* Shimmer effect - inspired by Linear */}
        <div className="absolute inset-0 hidden"></div>
        
        {/* Glass morphism layer */}
        <div className="relative rounded-[10px] p-8">
          {/* Floating orbs background */}
          <div className="hidden"></div>
          <div className="hidden"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Icon with glow */}
            <div className="flex items-center justify-center mb-5">
              <div className="relative">
                <div className="hidden"></div>
                <div className="relative rounded-[10px] p-3">
                  <Bot className="w-8 h-8 text-white drop-shadow-2xl" />
                  <div className="absolute -top-1 -right-1 bg-(--vx-violeta-soft) rounded-full p-1">
                    <Sparkles className="w-3 h-3 text-(--vx-violeta)" />
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
              <div className="hidden"></div>
              <div className="relative flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-(--vx-night) rounded-[10px] font-bold text-base">
                <span>Abrir Chat</span>
                <ExternalLink className="w-4 h-4" />
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
      className={`bg-(--vx-violeta) hover:bg-(--vx-violeta) ${className}`}
    >
      <Bot className="w-4 h-4 mr-2" />
      Chat con IA
    </Button>
  );
}
