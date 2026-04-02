import { motion } from "motion/react";
import { Construction, Home as HomeIcon } from "lucide-react";

export function Junction() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-stone-900 text-stone-100 font-sans flex flex-col items-center justify-center p-6 text-center"
      id="junction-page"
    >
      <Construction className="w-16 h-16 text-stone-500 mb-8 animate-pulse" />
      <h1 className="text-4xl md:text-6xl font-serif italic mb-4">Chamtaburu Junction</h1>
      <p className="text-xl text-stone-400 font-light tracking-widest uppercase mb-12">Coming Soon</p>
      <p className="text-stone-500 max-w-md mb-12">
        We are building something exciting. A central hub for all things Chamtaburu. Stay tuned for updates.
      </p>
      <a 
        href="https://chamtaburu.in" 
        className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest hover:text-white transition-colors border border-stone-700 px-6 py-3 rounded-full"
      >
        <HomeIcon className="w-4 h-4" />
        Back to Home
      </a>
    </motion.div>
  );
}
