import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

const NAVY = "#003366";
const GOLD = "#FFC548";
const RED = "#FF3D37";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

const WELCOME_MESSAGE =
  "Hola, soy el asistente de Barkley Online. Puedo responderte sobre Umbral™, Brújula™, el Programa Adaptativo, precios y cómo funciona el colegio. ¿Qué te gustaría saber?";

const SUGGESTIONS_INICIALES = [
  "¿Cómo funciona Umbral™?",
  "¿Cuánto cuesta?",
  "¿Y si mi hijo tiene TDAH o dislexia?",
];

export default function SalesChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", text: WELCOME_MESSAGE, sender: "bot" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleSendMessage = async (text?: string) => {
    const messageText = (text ?? inputValue).trim();
    if (!messageText || isTyping) return;

    const userMessage: Message = { id: `${Date.now()}-u`, text: messageText, sender: "user" };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      const history = nextMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

      const response = await fetch("/api/chat/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, history: history.slice(0, -1) }),
      });

      const data = await response.json();
      const botMessage: Message = {
        id: `${Date.now()}-b`,
        text: data.response || "No pude responder eso. Escríbenos a notificaciones@barkleyinstituto.cl.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          text: "Tuve un problema para responder. Escríbenos a notificaciones@barkleyinstituto.cl y te ayudamos directo.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
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
              aria-label="Abrir chat con Barkley"
              className="h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300"
              style={{ background: NAVY, border: `2px solid ${GOLD}` }}
            >
              <MessageCircle className="w-7 h-7 text-white" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
            style={{ height: 560, boxShadow: "0 20px 60px rgba(0,51,102,0.28)" }}
          >
            <div className="p-4 flex items-center justify-between" style={{ background: NAVY }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-white"
                  style={{ background: NAVY, border: `2px solid ${GOLD}` }}
                >
                  BK
                </div>
                <div>
                  <h3 className="font-bold text-white text-[15px] leading-tight">Barkley Online</h3>
                  <p className="text-xs text-white/70">Asistente virtual</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="text-white hover:bg-white/10 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex gap-2", message.sender === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.sender === "bot" && (
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-extrabold text-white mt-0.5"
                        style={{ background: NAVY }}
                      >
                        BK
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[80%] whitespace-pre-line",
                        message.sender === "user" ? "text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm",
                      )}
                      style={message.sender === "user" ? { background: NAVY } : undefined}
                    >
                      {message.text}
                    </div>
                    {message.sender === "user" && (
                      <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                  </div>
                ))}

                {messages.length === 1 && (
                  <div className="flex flex-wrap gap-2 pl-9">
                    {SUGGESTIONS_INICIALES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSendMessage(s)}
                        className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                        style={{ borderColor: NAVY, color: NAVY }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {isTyping && (
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white" style={{ background: NAVY }}>
                      BK
                    </div>
                    <div className="bg-slate-100 rounded-2xl px-4 py-3 rounded-tl-sm flex gap-1">
                      {[0, 0.15, 0.3].map((delay) => (
                        <motion.div
                          key={delay}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#9aa5b1" }}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.7, delay }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-slate-200">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1"
                  maxLength={2000}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  style={{ background: RED }}
                  className="text-white hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Respuestas basadas en información real de Barkley — para casos específicos, escribe a{" "}
                <a href="mailto:notificaciones@barkleyinstituto.cl" style={{ color: NAVY }} className="underline">
                  notificaciones@barkleyinstituto.cl
                </a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
