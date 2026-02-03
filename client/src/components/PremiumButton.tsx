import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ReactNode, useRef, MouseEvent } from "react";

interface PremiumButtonProps {
  href?: string;
  onClick?: () => void;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  color: string;
  delay?: number;
  isSecondary?: boolean;
}

export function PremiumButton({
  href,
  onClick,
  title,
  subtitle,
  icon,
  color,
  delay = 0,
  isSecondary = false,
}: PremiumButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Magnetic effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 300 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  
  const rotateX = useTransform(springY, [-50, 50], [5, -5]);
  const rotateY = useTransform(springX, [-50, 50], [-5, 5]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Component = href ? motion.a : motion.button;
  const componentProps = href ? { href } : { onClick };

  return (
    <Component
      ref={ref}
      {...componentProps}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ 
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer"
    >
      {/* Glassmorphism Background */}
      <div 
        className="absolute inset-0 backdrop-blur-xl border transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${color}02 0%, rgba(255,255,255,0.5) 50%, ${color}03 100%)`,
          borderColor: `${color}20`,
        }}
      />
      
      {/* Hover glow effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at center, ${color}10 0%, transparent 70%)`,
        }}
      />
      
      {/* Animated gradient overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color}03 50%, transparent 100%)`,
        }}
      />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color}20 50%, transparent 100%)`,
        }}
        initial={{ x: "-200%" }}
        whileHover={{ 
          x: "200%",
          transition: { duration: 1, ease: "easeInOut" }
        }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center gap-3 px-8 py-4">
        {/* Icon with pulse effect */}
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div style={{ color }}>{icon}</div>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: `${color}20` }}
            initial={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.5, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>

        {/* Text */}
        <div className="flex flex-col items-center">
          <motion.span 
            className="text-[15px] font-semibold text-[#002147] transition-all duration-300"
            style={{ letterSpacing: "0.02em" }}
            whileHover={{ letterSpacing: "0.04em" }}
          >
            {title}
          </motion.span>
          {subtitle && (
            <span 
              className="text-[11px] mt-0.5 opacity-80"
              style={{ color }}
            >
              {subtitle}
            </span>
          )}
        </div>

        {/* Arrow with slide effect */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <ArrowRight 
            className="w-[16px] h-[16px] opacity-60"
            style={{ color }}
          />
        </motion.div>
      </div>

      {/* Border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: `0 0 0 1px ${color}40, 0 20px 40px ${color}10`,
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </Component>
  );
}
