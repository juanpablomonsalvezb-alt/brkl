import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Menu, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import "./vortice/curso.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

export default function AcademicCopilot() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Nueva conversación",
      messages: [],
      lastUpdated: new Date(),
    },
  ]);
  const [currentConversationId, setCurrentConversationId] = useState("1");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Add user message
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title: conv.messages.length === 0 ? input.trim().slice(0, 30) + "..." : conv.title,
              lastUpdated: new Date(),
            }
          : conv
      )
    );

    setInput("");
    setIsLoading(true);

    try {
      // Preparar historial de conversación para la API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: msg.content,
      }));

      // Llamar a la API
      const response = await fetch("/api/academic-copilot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al comunicarse con Academic Copilot");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                lastUpdated: new Date(),
              }
            : conv
        )
      );
    } catch (error) {
      console.error("Error:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.",
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages: [...conv.messages, errorMessage],
                lastUpdated: new Date(),
              }
            : conv
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "Nueva conversación",
      messages: [],
      lastUpdated: new Date(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
  };

  return (
    <div className="vx-copilot flex h-screen bg-(--vx-bg)">
      {/* Sidebar - Claude style */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 border-r border-(--vx-line) bg-(--vx-card) flex flex-col overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-(--vx-line)">
          <Button
            onClick={createNewConversation}
            className="w-full bg-(--vx-card) hover:bg-(--vx-bg) text-(--vx-ink-soft) border border-(--vx-line) justify-start font-normal h-9 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva conversación
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="px-2 py-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setCurrentConversationId(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all text-sm group ${
                  conv.id === currentConversationId
                    ? "bg-(--vx-surface) text-(--vx-ink)"
                    : "text-(--vx-ink-soft) hover:bg-(--vx-bg)"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${
                    conv.id === currentConversationId ? "text-(--vx-primary)" : "text-(--vx-muted) group-hover:text-(--vx-ink-soft)"
                  }`} />
                  <span className="truncate font-medium">{conv.title}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-(--vx-line)">
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-7 h-7 rounded-lg bg-(--vx-primary) flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-(--vx-ink)">Academic Copilot</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-[60px] border-b border-(--vx-line) flex items-center justify-between px-6 bg-(--vx-card)/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-(--vx-ink-soft) hover:text-(--vx-ink) hover:bg-(--vx-surface) rounded-lg h-9 w-9"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-(--vx-primary) flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold text-(--vx-ink)">Academic Copilot</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 bg-(--vx-bg)" ref={scrollAreaRef}>
          <div className="max-w-[800px] mx-auto px-6 py-12">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-24">
                <div className="w-16 h-16 bg-(--vx-primary) rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-(--vx-ink) mb-3 tracking-tight">
                  ¿En qué puedo ayudarte hoy?
                </h2>
                <p className="text-base text-(--vx-ink-soft) max-w-md mb-10">
                  Soy tu asistente académico personalizado, aquí para apoyarte en tu aprendizaje
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  <button
                    onClick={() => setInput("¿Puedes explicarme un tema de matemáticas?")}
                    className="p-4 text-left border border-(--vx-line) rounded-xl hover:bg-(--vx-card) hover:border-(--vx-primary) hover:shadow-md transition-all bg-(--vx-card) group"
                  >
                    <p className="text-sm font-medium text-(--vx-ink) group-hover:text-(--vx-primary)">Explicar conceptos de estudio</p>
                  </button>
                  <button
                    onClick={() => setInput("¿Cómo puedo mejorar mi técnica de estudio?")}
                    className="p-4 text-left border border-(--vx-line) rounded-xl hover:bg-(--vx-card) hover:border-(--vx-primary) hover:shadow-md transition-all bg-(--vx-card) group"
                  >
                    <p className="text-sm font-medium text-(--vx-ink) group-hover:text-(--vx-primary)">Mejorar técnicas de estudio</p>
                  </button>
                  <button
                    onClick={() => setInput("¿Puedes revisar mi respuesta a esta pregunta?")}
                    className="p-4 text-left border border-(--vx-line) rounded-xl hover:bg-(--vx-card) hover:border-(--vx-primary) hover:shadow-md transition-all bg-(--vx-card) group"
                  >
                    <p className="text-sm font-medium text-(--vx-ink) group-hover:text-(--vx-primary)">Revisar ejercicios y respuestas</p>
                  </button>
                  <button
                    onClick={() => setInput("¿Puedes hacerme preguntas de práctica?")}
                    className="p-4 text-left border border-(--vx-line) rounded-xl hover:bg-(--vx-card) hover:border-(--vx-primary) hover:shadow-md transition-all bg-(--vx-card) group"
                  >
                    <p className="text-sm font-medium text-(--vx-ink) group-hover:text-(--vx-primary)">Practicar con ejercicios</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-5 ${message.role === "user" ? "" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-xl bg-(--vx-primary) flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                        <Sparkles className="w-4.5 h-4.5 text-white" />
                      </div>
                    )}
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-xl bg-(--vx-line) flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4.5 h-4.5 text-(--vx-ink-soft)" />
                      </div>
                    )}
                    <div className="flex-1 pt-1">
                      <div className={`${message.role === "user" ? "font-semibold text-(--vx-ink) mb-1 text-sm" : ""}`}>
                        {message.role === "user" && "Tú"}
                      </div>
                      <p className="text-[15px] leading-[1.7] text-(--vx-ink) whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-5">
                    <div className="w-8 h-8 rounded-xl bg-(--vx-primary) flex items-center justify-center shadow-sm mt-1">
                      <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
                    </div>
                    <div className="flex gap-2 items-center pt-2">
                      <div className="w-2 h-2 bg-(--vx-muted) rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-(--vx-muted) rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-(--vx-muted) rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-(--vx-line) bg-(--vx-card)/50 backdrop-blur-sm p-6">
          <div className="max-w-[800px] mx-auto">
            <div className="relative flex items-end gap-3 bg-(--vx-card) border border-(--vx-line) rounded-2xl px-4 py-3 focus-within:border-(--vx-primary) focus-within:shadow-lg focus-within:shadow-(color:--vx-primary)/10 transition-all">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[28px] max-h-[200px] bg-transparent text-[15px] text-(--vx-ink) placeholder:text-(--vx-muted)"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-(--vx-primary) hover:bg-(--vx-primary-hover) text-white rounded-xl h-9 w-9 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-(--vx-muted) text-center mt-3 font-medium">
              Academic Copilot puede cometer errores. Por favor, verifica la información importante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
