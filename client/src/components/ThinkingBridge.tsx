import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Target, Users } from "lucide-react";

export function ThinkingBridge() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: true, margin: "-100px" });

    // Easing profesional tipo Apple/Stripe
    const smoothEasing = [0.4, 0, 0.2, 1] as const;

    return (
        <section ref={containerRef} className="bg-white py-20 overflow-hidden relative">
            {/* Background Tech Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-[#ff9f1c]/5 via-transparent to-transparent opacity-30" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1e1e08_1px,transparent_1px),linear-gradient(to_bottom,#1e1e1e08_1px,transparent_1px)] bg-[size:4rem_4rem]" />

            <div className="container-harvard relative z-10">
                {/* Header Section */}
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ ease: smoothEasing }}
                        className="text-4xl md:text-5xl font-serif font-bold text-[#1e1e1e] mb-4 leading-tight"
                    >
                        La Mecánica de la Maestría
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2, ease: smoothEasing }}
                        className="text-xl text-[#ff9f1c] italic font-light"
                    >
                        De la Neurociencia a la Competencia Real
                    </motion.p>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={isInView ? { width: 100 } : {}}
                        transition={{ delay: 0.4, duration: 0.8, ease: smoothEasing }}
                        className="h-1 bg-gradient-to-r from-[#ff9f1c] to-[#ffd700] rounded-full mx-auto mt-6"
                    />
                </div>

                {/* PASO 1: Imagen Izquierda + Texto Derecha */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: smoothEasing }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32"
                >
                    {/* Image Left */}
                    <div className="relative">
                        <div className="relative overflow-hidden rounded-2xl">
                            <img 
                                src="/1.png" 
                                alt="Enfoque en Autonomía" 
                                className="w-full h-auto rounded-2xl"
                                style={{
                                    clipPath: 'inset(0 8% 8% 0)',
                                    transform: 'scale(1.1)',
                                    transformOrigin: 'top left'
                                }}
                            />
                        </div>
                    </div>

                    {/* Text Right */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff9f1c] to-[#ff8c00] flex items-center justify-center">
                                <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-[#ff9f1c] uppercase tracking-wider">Paso 1</span>
                                <h3 className="text-3xl md:text-4xl font-bold text-[#1e1e1e]">
                                    Enfoque en Autonomía
                                </h3>
                                <p className="text-lg text-[#ff9f1c] font-light italic">(Self-Paced)</p>
                            </div>
                        </div>
                        <p className="text-xl text-[#1e1e1e]/80 leading-relaxed">
                            Rompemos la inercia de la educación pasiva. Tomas el control total de tu tiempo con contenido On-Demand de alto impacto, eliminando la dependencia de horarios fijos y clases magistrales innecesarias.
                        </p>
                    </div>
                </motion.div>

                {/* PASO 2: Texto Izquierda + Imagen Derecha (CRUZADO) */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: smoothEasing }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32"
                >
                    {/* Text Left */}
                    <div className="space-y-6 order-2 lg:order-1">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff9f1c] to-[#ff8c00] flex items-center justify-center">
                                <Target className="w-8 h-8 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-[#ff9f1c] uppercase tracking-wider">Paso 2</span>
                                <h3 className="text-3xl md:text-4xl font-bold text-[#1e1e1e]">
                                    Aprendizaje Adaptativo
                                </h3>
                                <p className="text-lg text-[#ff9f1c] font-light italic">(Mastery Path)</p>
                            </div>
                        </div>
                        <p className="text-xl text-[#1e1e1e]/80 leading-relaxed">
                            Avanzas solo cuando demuestras dominio. Nuestra IA especialista detecta tus brechas en tiempo real y personaliza tu ruta, asegurando que cada concepto sea una competencia ganada antes de dar el siguiente paso.
                        </p>
                    </div>

                    {/* Image Right */}
                    <div className="relative order-1 lg:order-2">
                        <div className="relative overflow-hidden rounded-2xl">
                            <img 
                                src="/2.png" 
                                alt="Aprendizaje Adaptativo" 
                                className="w-full h-auto rounded-2xl"
                                style={{
                                    clipPath: 'inset(0 8% 8% 0)',
                                    transform: 'scale(1.1)',
                                    transformOrigin: 'top left'
                                }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* PASO 3: Imagen Izquierda + Texto Derecha */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: smoothEasing }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
                >
                    {/* Image Left */}
                    <div className="relative">
                        <div className="relative overflow-hidden rounded-2xl">
                            <img 
                                src="/3.png" 
                                alt="Success Mentoring" 
                                className="w-full h-auto rounded-2xl"
                                style={{
                                    clipPath: 'inset(0 8% 8% 0)',
                                    transform: 'scale(1.1)',
                                    transformOrigin: 'top left'
                                }}
                            />
                        </div>
                    </div>

                    {/* Text Right */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff9f1c] to-[#ff8c00] flex items-center justify-center">
                                <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <span className="text-sm font-semibold text-[#ff9f1c] uppercase tracking-wider">Paso 3</span>
                                <h3 className="text-3xl md:text-4xl font-bold text-[#1e1e1e]">
                                    Success Mentoring
                                </h3>
                                <p className="text-lg text-[#ff9f1c] font-light italic">(Performance)</p>
                            </div>
                        </div>
                        <p className="text-xl text-[#1e1e1e]/80 leading-relaxed">
                            Gestión de éxito estratégica. Tu mentor de rendimiento, inspirado en el modelo del MIT, supervisa tu progreso y entrena tu disciplina para asegurar que alcances tu meta de validación oficial en tiempo récord.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
