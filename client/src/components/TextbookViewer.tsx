import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface TextbookViewerProps {
  pdfUrl: string;
  title?: string;
  startPage: number;
  endPage: number;
  moduleNumber: number;
}

export function TextbookViewer({ pdfUrl, title, startPage, endPage, moduleNumber }: TextbookViewerProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(startPage);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const totalAllowedPages = endPage - startPage + 1;
  const relativePageNum = currentPage - startPage + 1;

  // Convert Google Drive link to embed URL with specific page
  const getEmbedUrl = (url: string, page: number) => {
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        // Google Drive doesn't support page parameter in embed, but we can open to specific page
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    return url;
  };

  const embedUrl = getEmbedUrl(pdfUrl, currentPage);

  const handleOpenPdf = () => {
    window.open(pdfUrl, '_blank');
    toast({
      description: 'Abriendo PDF completo en nueva pestaña',
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="vx-course w-full flex flex-col bg-(--vx-surface) rounded-lg border border-(--vx-line) overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-(--vx-primary) to-(--vx-primary-hover) text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <BookOpen className="w-7 h-7" />
            </motion.div>
            <div>
              <h3 className="font-serif font-black text-xl">{title || "Texto Escolar"}</h3>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white">
                  Módulo {moduleNumber}
                </Badge>
                <span className="text-sm text-white/90">
                  Páginas {startPage}-{endPage}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-3xl font-black tracking-tight">{relativePageNum}/{totalAllowedPages}</div>
            <div className="text-xs text-white/80">Página actual</div>
          </div>
        </div>
      </div>

      {/* PDF Viewer - Using Google Drive Embed */}
      <div className="flex-1 bg-(--vx-surface) min-h-[580px] relative">
        <iframe
          src={embedUrl}
          className="w-full h-[580px] border-0"
          title={`${title} - Módulo ${moduleNumber}`}
          allow="autoplay"
        />
        
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-(--vx-ink)">
            📖 Páginas {startPage} - {endPage}
          </p>
          <p className="text-xs text-(--vx-ink-soft) mt-1">
            Solo de este módulo
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-(--vx-card) border-t border-(--vx-line) p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-(--vx-primary)" />
            <div>
              <p className="text-sm font-semibold text-(--vx-ink)">
                {totalAllowedPages} página{totalAllowedPages !== 1 ? 's' : ''} de este módulo
              </p>
              <p className="text-xs text-(--vx-muted)">
                Páginas {startPage} - {endPage} del libro completo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Normal' : 'Expandir'}</span>
            </Button>
            <Button
              onClick={handleOpenPdf}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Abrir PDF Completo</span>
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}
