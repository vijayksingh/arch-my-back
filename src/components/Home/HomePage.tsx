import { Link } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'motion/react';
import Canvas from '@/components/Canvas/Canvas';
import { ReactFlowProvider } from '@xyflow/react';
import { heroNodes, heroEdges } from './heroDiagram';
import { Layers, Wand2, ArrowRight, Server, Network, GitBranch, Database, Cpu, PenTool, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

import type { Transition } from 'motion/react';

// ----------------------------------------------------------------------------
// STORYBOARD & ANIMATION CONFIG
// ----------------------------------------------------------------------------
const SPRINGS: Record<string, Transition> = {
  heavy: { type: 'spring', bounce: 0, duration: 0.8 },
  snappy: { type: 'spring', bounce: 0.15, duration: 0.5 },
  subtle: { type: 'spring', bounce: 0, duration: 0.6 },
};

const TIMING = {
  heroStart: 0.1,
  staggerDelay: 0.15,
};

// ----------------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------------

export function HomePage() {
  const shouldReduceMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle parallax effect on mouse move
  useEffect(() => {
    if (shouldReduceMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 -> 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [shouldReduceMotion]);

  // Framer Motion variants
  const heroVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        ...SPRINGS.heavy,
        delay: TIMING.heroStart + custom * TIMING.staggerDelay,
      },
    }),
  };

  const bentoItemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20, scale: shouldReduceMotion ? 1 : 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: SPRINGS.subtle 
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground selection:bg-primary/20 overflow-x-hidden font-sans">
      
      {/* HEADER */}
      <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <header className="flex w-full max-w-6xl items-center justify-between px-6 py-4 rounded-2xl backdrop-blur-md bg-card/60 border border-border/40 shadow-sm pointer-events-auto">
          <motion.div 
            custom={0}
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="flex flex-1 items-center gap-2"
          >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Layers className="h-5 w-5" />
              </div>
            <span className="text-sm font-semibold tracking-wide">Arch</span>
          </motion.div>

          <motion.div 
            custom={0}
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="hidden md:flex flex-1 items-center justify-center gap-8"
          >
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1">Product</Link>
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1">Pricing</Link>
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1">Docs</Link>
          </motion.div>

          <motion.div 
            custom={0}
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="flex flex-1 items-center justify-end gap-6"
          >
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 mr-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-xs font-medium text-success">Global Status: Operational</span>
            </div>
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1">
              Log in
            </Link>
            <Link to="/signup" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
              >
                Sign up
              </motion.button>
            </Link>
          </motion.div>
        </header>
      </div>

      {/* HERO SECTION */}
      <section className="relative flex min-h-svh w-full flex-col items-center justify-center pt-20">
        
        {/* Live Canvas Background */}
        <div 
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-60 mix-blend-plus-lighter"
          style={{
            transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`,
            transition: 'transform 0.4s ease-out'
          }}
        >
          <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px] z-10" />
          {/* Subtle primary radial gradient for depth */}
          <div className="absolute inset-0 z-10" style={{
            background: 'radial-gradient(ellipse at top, hsl(var(--primary)/0.08), transparent 70%)'
          }} />
          {/* Radial fade to background color so edges blend seamlessly */}
          <div className="absolute inset-0 z-20" style={{
            background: 'radial-gradient(circle at center, transparent 40%, hsl(var(--background)) 90%)'
          }} />
          <ReactFlowProvider>
            <Canvas>
              <Canvas.Walkthrough 
                nodes={heroNodes} 
                edges={heroEdges} 
                simulationEnabled={false}
              />
            </Canvas>
          </ReactFlowProvider>
        </div>

        {/* Hero Content */}
        <div className="relative z-30 flex max-w-4xl flex-col items-center text-center px-6 mt-16">
          <motion.div 
            custom={1}
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="mb-6 rounded-full border border-border/50 bg-card/40 px-4 py-1.5 backdrop-blur-xl shadow-sm"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground drop-shadow-sm">
              A NEW SYSTEM IS BORN
            </span>
          </motion.div>

          <motion.h1 
            custom={2}
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground"
            style={{ lineHeight: 1.1 }}
          >
            Architect with <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-foreground to-muted-foreground">
              Intention.
            </span>
          </motion.h1>

          <motion.p 
            custom={3}
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground/80 font-medium tracking-tight"
          >
            The canvas for engineering teams. Build, simulate, and document system architecture with a tool that feels like magic.
          </motion.p>

          <motion.div 
            custom={4}
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <Link to="/signup">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "group flex h-12 items-center gap-2 rounded-full px-8",
                  "bg-primary text-primary-foreground font-medium shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
                  "hover:shadow-[0_12px_32px_rgba(0,0,0,0.16)] transition-shadow",
                  "dark:bg-white dark:text-black"
                )}
              >
                Start Diagramming
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "flex h-12 items-center gap-2 rounded-full px-8",
                  "bg-transparent border border-border text-foreground font-medium",
                  "hover:bg-accent/50 transition-colors"
                )}
              >
                View Examples
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section className="relative z-30 mx-auto max-w-6xl px-6 pb-32">
        <div className="mb-16 text-center">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={bentoItemVariants}
            className="text-3xl font-semibold tracking-tight"
          >
            Engineered for clarity.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <BentoCard 
            title="Auto-Layout Engine"
            description="Powered by ELK.js. Drop components and let the semantic layout engine perfectly route edges and position nodes."
            visual={<SvgAutoLayout />}
            glowVar="--glow-compute"
            delay={0.1}
          />
          <BentoCard 
            title="AI Generation"
            description="Describe your architecture in plain English. The AI drafts a fully editable, connected diagram instantly."
            visual={<SvgAIGeneration />}
            glowVar="--glow-ml"
            delay={0.2}
          />
          <BentoCard 
            title="Interactive Walkthroughs"
            description="Create step-by-step interactive tutorials of your system flows. Perfect for onboarding new engineers."
            visual={<SvgWalkthrough />}
            glowVar="--glow-traffic"
            delay={0.3}
          />
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="relative z-30 w-full border-y border-border/50 bg-muted/20 py-32">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { ...SPRINGS.heavy } }
            }}
            className="mx-auto max-w-2xl"
          >
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              From concept to documentation in minutes.
            </h2>
            <p className="text-lg text-muted-foreground mb-16">
              A streamlined workflow designed to keep you in the flow state, eliminating the friction of manual diagramming.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            {[
              {
                step: "01",
                icon: <Wand2 className="w-5 h-5 text-[hsl(var(--category-ml-accent))]" />,
                title: "Draft with AI",
                desc: "Describe your system components. Watch as the AI instantiates the initial nodes and relationships."
              },
              {
                step: "02",
                icon: <PenTool className="w-5 h-5 text-[hsl(var(--category-compute-accent))]" />,
                title: "Refine & Connect",
                desc: "Drag and drop to add resources. Connect components freely—the auto-layout engine handles the positioning."
              },
              {
                step: "03",
                icon: <Share2 className="w-5 h-5 text-[hsl(var(--category-traffic-accent))]" />,
                title: "Simulate & Share",
                desc: "Run request traces to validate your design. Export interactive walkthroughs for team onboarding."
              }
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { ...SPRINGS.snappy, delay: i * 0.2 } }
                }}
                className="relative flex flex-col items-center md:items-start text-center md:text-left z-10"
              >
                <div className="relative mb-6">
                  {/* Absolute positioned icon badge that breaks out of the bounds to prevent cropping */}
                  <div className="absolute -top-4 -right-8 z-20 bg-card border border-border/50 p-2.5 rounded-xl shadow-lg">
                    {item.icon}
                  </div>
                  {/* Large number text with sufficient height so it is never cropped */}
                  <div className="text-7xl font-black bg-gradient-to-b from-foreground/80 to-foreground/10 bg-clip-text text-transparent drop-shadow-sm leading-tight pr-4 pt-4 pb-2">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Animated Connecting Paths (Desktop Only) */}
          <div className="hidden md:block absolute top-[180px] left-[16.6%] w-[66.6%] h-[120px] pointer-events-none z-0">
            <svg width="100%" height="100%" viewBox="0 0 1000 120" preserveAspectRatio="none" className="opacity-60 overflow-visible">
              <defs>
                <linearGradient id="flowGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--category-ml-accent))" stopOpacity="0" />
                  <stop offset="50%" stopColor="hsl(var(--category-ml-accent))" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(var(--category-compute-accent))" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="flowGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--category-compute-accent))" stopOpacity="0" />
                  <stop offset="50%" stopColor="hsl(var(--category-traffic-accent))" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(var(--category-traffic-accent))" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Static faint paths connecting the exact centers of the 3 columns (0 to 500, and 500 to 1000 in this local SVG coordinate space) */}
              <path d="M 0,40 C 150,40 150,80 300,80 C 400,80 400,40 500,40" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
              <path d="M 500,40 C 650,40 650,80 800,80 C 900,80 900,40 1000,40" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
              
              {/* Animated glowing paths */}
              <motion.path 
                d="M 0,40 C 150,40 150,80 300,80 C 400,80 400,40 500,40" 
                fill="none" 
                stroke="url(#flowGrad1)" 
                strokeWidth="3"
                filter="url(#glow)"
                strokeDasharray="500"
                initial={{ strokeDashoffset: 500 }}
                animate={{ strokeDashoffset: -500 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.path 
                d="M 500,40 C 650,40 650,80 800,80 C 900,80 900,40 1000,40" 
                fill="none" 
                stroke="url(#flowGrad2)" 
                strokeWidth="3"
                filter="url(#glow)"
                strokeDasharray="500"
                initial={{ strokeDashoffset: 500 }}
                animate={{ strokeDashoffset: -500 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }}
              />
              
              {/* Flow particles */}
              {[...Array(3)].map((_, i) => (
                <motion.circle
                  key={`p1-${i}`}
                  r="3"
                  fill="#fff"
                  filter="url(#glow)"
                  animate={{
                    offsetDistance: ["0%", "100%"]
                  }}
                  style={{
                    offsetPath: "path('M 0,40 C 150,40 150,80 300,80 C 400,80 400,40 500,40')",
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 1
                  }}
                />
              ))}
              {[...Array(3)].map((_, i) => (
                <motion.circle
                  key={`p2-${i}`}
                  r="3"
                  fill="#fff"
                  filter="url(#glow)"
                  animate={{
                    offsetDistance: ["0%", "100%"]
                  }}
                  style={{
                    offsetPath: "path('M 500,40 C 650,40 650,80 800,80 C 900,80 900,40 1000,40')",
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 1 + 1.5
                  }}
                />
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="relative z-30 mx-auto w-full max-w-5xl px-6 py-40 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1, transition: { ...SPRINGS.heavy } }
          }}
          className="relative flex flex-col items-center rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-lg p-12 md:p-20 overflow-hidden"
        >
          {/* Subtle glow behind the CTA content */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />
          
          <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-background/50 text-primary border border-border/50 shadow-sm">
            <Wand2 className="h-8 w-8 text-foreground" />
          </div>
          <h2 className="relative z-10 text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Ready to build better systems?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mb-10">
            Join the teams already using Arch to design, document, and communicate their infrastructure.
          </p>
          
          <Link to="/signup">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-shadow"
            >
              Get Started for Free
            </motion.button>
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required. Start diagramming instantly.
          </p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-30 border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Arch. Engineered for clarity.</p>
      </footer>
    </div>
  );
}

// ----------------------------------------------------------------------------
// BENTO CARD COMPONENT (with interactive spotlight)
// ----------------------------------------------------------------------------
function BentoCard({ 
  title, 
  description, 
  visual, 
  glowVar, 
  delay 
}: { 
  title: string; 
  description: string; 
  visual: React.ReactNode; 
  glowVar: string;
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { ...SPRINGS.snappy, delay } 
        }
      }}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-8 shadow-sm",
        "transition-colors hover:border-border hover:bg-card/60"
      )}
    >
      {/* Spotlight effect */}
      <div 
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, var(${glowVar}), transparent 40%)`,
        }}
      />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-6 flex-1 rounded-xl border border-border/30 bg-background/50 overflow-hidden relative shadow-inner" style={{ minHeight: '160px' }}>
          {visual}
        </div>
        <div className="mt-auto">
          <h3 className="mb-2 text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// INTERACTIVE SVG COMPONENTS
// ----------------------------------------------------------------------------

function SvgAutoLayout() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-transparent to-background/20">
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div 
          animate={{ y: [-4, 4, -4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-6 top-6 bg-card border border-border/50 p-3 rounded-xl shadow-lg text-[hsl(var(--category-compute-accent))]"
        >
          <Cpu className="w-8 h-8" />
        </motion.div>

        <motion.div 
          animate={{ y: [4, -4, 4] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-6 top-4 bg-card border border-border/50 p-3 rounded-xl shadow-lg text-[hsl(var(--category-storage-accent))]"
        >
          <Database className="w-8 h-8" />
        </motion.div>

        <motion.div 
          animate={{ y: [-2, 2, -2] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-12 bottom-4 bg-card border border-border/50 p-3 rounded-xl shadow-lg text-[hsl(var(--category-messaging-accent))]"
        >
          <Server className="w-8 h-8" />
        </motion.div>
        
        <motion.div 
          animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="z-10 bg-background/90 backdrop-blur-md border border-border/60 p-4 rounded-2xl shadow-xl text-foreground"
        >
          <Network className="w-10 h-10" />
        </motion.div>
        
        <svg className="absolute inset-0 w-full h-full -z-10 opacity-40">
          <path d="M 60 40 L 100 80" stroke="hsl(var(--category-compute-accent))" strokeWidth="2" strokeDasharray="4 4" fill="none" />
          <path d="M 140 40 L 100 80" stroke="hsl(var(--category-storage-accent))" strokeWidth="2" strokeDasharray="4 4" fill="none" />
          <path d="M 140 100 L 100 80" stroke="hsl(var(--category-messaging-accent))" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        </svg>
      </div>
    </div>
  );
}

function SvgAIGeneration() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-transparent to-background/20">
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 m-auto w-24 h-24 bg-[hsl(var(--category-ml-accent))]/10 rounded-full blur-xl"
        />
        <motion.div 
          animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="z-10 bg-card border border-[hsl(var(--category-ml-accent))]/20 p-5 rounded-2xl shadow-xl text-[hsl(var(--category-ml-accent))]"
        >
          <Wand2 className="w-12 h-12" />
        </motion.div>
        
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -20, 0], 
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5] 
            }}
            transition={{ 
              duration: 2 + i * 0.5, 
              repeat: Infinity, 
              delay: i * 0.4 
            }}
            className="absolute w-2 h-2 rounded-full bg-[hsl(var(--category-ml-accent))]"
            style={{
              left: `${30 + i * 15}%`,
              top: `${60 + (i % 2) * 20}%`
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SvgWalkthrough() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-transparent to-background/20">
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="flex gap-4 items-center">
          {[1, 2, 3].map((step, i) => (
            <motion.div
              key={step}
              animate={{ y: [0, -8, 0] }} 
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
              className={cn(
                "relative z-10 bg-card border p-3 rounded-xl shadow-lg flex items-center justify-center w-12 h-12 font-bold",
                i === 1 ? "border-[hsl(var(--category-traffic-accent))]/40 text-[hsl(var(--category-traffic-accent))]" : "border-border/50 text-muted-foreground"
              )}
            >
              {step}
              {i < 2 && (
                <div className="absolute -right-5 top-1/2 -translate-y-1/2 text-border">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}