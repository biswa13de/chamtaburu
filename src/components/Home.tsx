import { motion } from "motion/react";
import { Home as HomeIcon, MapPin, Info, Phone } from "lucide-react";

export function Home() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-stone-50 text-stone-900 font-sans"
      id="home-page"
    >
      <header className="p-6 flex justify-between items-center border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <HomeIcon className="w-6 h-6 text-stone-700" />
          <span className="text-xl font-bold tracking-tight">Chamtaburu</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest">
          <a href="#about" className="hover:text-stone-500 transition-colors">About</a>
          <a href="#explore" className="hover:text-stone-500 transition-colors">Explore</a>
          <a href="#contact" className="hover:text-stone-500 transition-colors">Contact</a>
        </nav>
      </header>

      <main>
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <img 
            src="https://picsum.photos/seed/chamtaburu-nature/1920/1080" 
            alt="Chamtaburu Nature" 
            className="absolute inset-0 w-full h-full object-cover brightness-50"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-10 text-center text-white px-4">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-serif italic mb-4"
            >
              Welcome to Chamtaburu
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto"
            >
              Discover the soul of the hills, the warmth of the village, and the luxury of nature.
            </motion.p>
          </div>
        </section>

        <section id="about" className="py-24 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-serif italic mb-8">Our Heritage</h2>
          <p className="text-lg text-stone-600 leading-relaxed mb-12">
            Chamtaburu is more than just a destination; it's a journey into the heart of nature and culture. 
            Nestled in the serene landscapes, we offer a unique blend of traditional hospitality and modern comfort.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-sm">Location</h3>
              <p className="text-stone-500 text-sm">A hidden gem in the pristine hills, away from the city noise.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-sm">Experience</h3>
              <p className="text-stone-500 text-sm">Authentic tribal culture, local cuisines, and breathtaking views.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-stone-200 rounded-full flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-bold uppercase tracking-widest text-sm">Connect</h3>
              <p className="text-stone-500 text-sm">Reach out to us for a personalized experience of a lifetime.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-stone-900 text-stone-400 py-12 px-6 text-center">
        <p className="text-sm tracking-widest uppercase mb-4">&copy; 2026 Chamtaburu. All Rights Reserved.</p>
        <div className="flex justify-center gap-6 text-xs uppercase tracking-widest">
          <a href="https://resort.chamtaburu.in" className="hover:text-white transition-colors">Resort</a>
          <a href="https://village.chamtaburu.in" className="hover:text-white transition-colors">Village</a>
          <a href="https://junction.chamtaburu.in" className="hover:text-white transition-colors">Junction</a>
        </div>
      </footer>
    </motion.div>
  );
}
