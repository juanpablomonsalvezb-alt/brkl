import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Sparkles, User, Bot, Minimize2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  suggestions?: string[];
}

interface ChatIntent {
  keywords: string[];
  response: string;
  suggestions?: string[];
  action?: string;
}

const chatIntents: ChatIntent[] = [
  {
    keywords: ["hola", "buenos días", "buenas tardes", "hey", "hi"],
    response: "¡Hola! 👋 Soy tu asistente virtual del Instituto. ¿En qué puedo ayudarte hoy?",
    suggestions: ["Ver planes", "Precios", "Cómo inscribirme", "Horarios"]
  },
  {
    keywords: ["plan", "planes", "curso", "cursos", "programa"],
    response: "Tenemos 3 tipos de planes:\n\n📚 **Plan Menores** (7º y 8º básico)\n👨‍🎓 **Plan Adultos** (Validación de estudios)\n🎯 **Plan PAES** (Preparación PSU)\n\n¿Sobre cuál te gustaría saber más?",
    suggestions: ["Plan Menores", "Plan Adultos", "Plan PAES", "Ver precios"]
  },
  {
    keywords: ["precio", "costo", "valor", "cuanto cuesta", "matrícula"],
    response: "💰 Nuestros precios varían según el plan:\n\n• **Plan Menores**: Desde $654.500 (incluye matrícula e IVA)\n• **Plan Adultos**: Desde $487.900 (incluye matrícula e IVA)\n• **Plan PAES**: Desde $297.500 por asignatura (incluye matrícula e IVA)\n\n*Todos los precios incluyen matrícula de $50.000 e IVA 19%.\n\nIncluyen acceso a nuestra plataforma 24/7 y material digital.",
    suggestions: ["Ver detalles", "Inscribirme", "Formas de pago"]
  },
  {
    keywords: ["inscrib", "matricula", "registro", "como entrar"],
    response: "📝 ¡Inscribirte es muy fácil!\n\n1️⃣ Selecciona tu plan\n2️⃣ Completa el formulario\n3️⃣ Confirma tu inscripción\n\n¿Te gustaría que te lleve al formulario de inscripción?",
    suggestions: ["Sí, llevarme", "Ver planes primero", "Más información"],
    action: "open_inscription"
  },
  {
    keywords: ["horario", "cuando", "fecha", "inicio"],
    response: "📅 **Información de inicio:**\n\n• Inicio de clases: Marzo 2026\n• Duración: 8 meses (Marzo - Octubre)\n• Modalidad: 100% Online\n• Acceso 24/7 a la plataforma",
    suggestions: ["Ver calendario", "Inscribirme", "Más información"]
  },
  {
    keywords: ["contacto", "teléfono", "email", "whatsapp"],
    response: "📞 **Contáctanos:**\n\n• WhatsApp: [Número]\n• Email: contacto@instituto.cl\n• Horario: Lunes a Viernes 9:00 - 18:00\n\n¿Te gustaría que un asesor te contacte?",
    suggestions: ["Sí, contactarme", "Enviar consulta", "Volver"]
  }
];

export default function SalesChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "¡Hola! 👋 Soy tu asistente virtual. Estoy aquí para ayudarte con información sobre nuestros planes, precios y proceso de inscripción. ¿En qué puedo ayudarte?",
      sender: "bot",
      timestamp: new Date(),
      suggestions: ["Ver planes", "Precios", "Cómo inscribirme"]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const findIntent = (userMessage: string): ChatIntent | null => {
    const lowerMessage = userMessage.toLowerCase();
    return chatIntents.find(intent =>
      intent.keywords.some(keyword => lowerMessage.includes(keyword))
    ) || null;
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot thinking
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check for intent match
    const intent = findIntent(messageText);

    if (intent) {
      // Use predefined response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: intent.response,
        sender: "bot",
        timestamp: new Date(),
        suggestions: intent.suggestions
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      // Handle actions
      if (intent.action === "open_inscription") {
        // TODO: Integrate with inscription form
      }
    } else {
      // Use AI for complex queries
      try {
        const response = await fetch("/api/chat/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageText })
        });

        if (response.ok) {
          const data = await response.json();
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.response,
            sender: "bot",
            timestamp: new Date(),
            suggestions: data.suggestions
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          throw new Error("AI response failed");
        }
      } catch (error) {
        // Fallback response
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Disculpa, no entendí bien tu pregunta. ¿Podrías reformularla o elegir una de estas opciones?",
          sender: "bot",
          timestamp: new Date(),
          suggestions: ["Ver planes", "Precios", "Inscribirme", "Hablar con asesor"]
        };
        setMessages(prev => [...prev, botMessage]);
      }
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-16 w-16 rounded-full bg-gradient-to-br from-[#002147] to-[#A51C30] shadow-2xl hover:shadow-[0_0_30px_rgba(165,28,48,0.5)] transition-all duration-300 hover:scale-110"
            >
              <MessageCircle className="w-7 h-7 text-white" />
            </Button>
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "60px" : "600px"
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[400px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50"
            style={{
              boxShadow: "0 20px 60px rgba(0, 33, 71, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)"
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#002147] to-[#A51C30] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Asistente Virtual</h3>
                  <p className="text-xs text-white/70">Siempre disponible</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/10 h-8 w-8"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/10 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <ScrollArea className="h-[420px] p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-2",
                          message.sender === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.sender === "bot" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#002147] to-[#A51C30] flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="space-y-2 max-w-[75%]">
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-3 shadow-md",
                              message.sender === "user"
                                ? "bg-gradient-to-br from-[#002147] to-[#003d82] text-white rounded-tr-sm"
                                : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-800 rounded-tl-sm border border-slate-200"
                            )}
                          >
                            <p className="text-sm whitespace-pre-line leading-relaxed">
                              {message.text}
                            </p>
                          </div>
                          {message.suggestions && (
                            <div className="flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="text-xs border-[#002147]/20 hover:border-[#002147] hover:bg-[#002147]/5 transition-all"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                        {message.sender === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2 items-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#002147] to-[#A51C30] flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-slate-100 rounded-2xl px-4 py-3 rounded-tl-sm">
                          <div className="flex gap-1">
                            <motion.div
                              className="w-2 h-2 bg-slate-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                            />
                            <motion.div
                              className="w-2 h-2 bg-slate-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                            />
                            <motion.div
                              className="w-2 h-2 bg-slate-400 rounded-full"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Escribe tu mensaje..."
                      className="flex-1 border-slate-300 focus:border-[#002147] focus:ring-[#002147]"
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim()}
                      className="bg-gradient-to-br from-[#002147] to-[#A51C30] hover:from-[#003d82] hover:to-[#8B1725] text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Potenciado por IA
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
