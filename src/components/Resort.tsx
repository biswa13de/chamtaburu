import { motion } from "motion/react";
import { Bed, Coffee, MapPin, Star, Phone } from "lucide-react";
export function Resort() {
  const handleBookNow = () => {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('run.app')) {
      // Navigate to origin without subdomain query param so the main app's /checkout route renders
      window.location.href = window.location.origin + '/checkout';
    } else {
      window.location.href = 'https://chamtaburu.in/checkout';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-stone-100 text-stone-900 font-sans"
      id="resort-page"
    >
      <header className="p-6 flex justify-between items-center border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Bed className="w-6 h-6 text-stone-700" />
          <span className="text-xl font-bold tracking-tight">Chamtaburu Resort</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest">
          <a href="#rooms" className="hover:text-stone-500 transition-colors">Rooms</a>
          <a href="#amenities" className="hover:text-stone-500 transition-colors">Amenities</a>
          <button onClick={handleBookNow} className="hover:text-stone-500 transition-colors uppercase tracking-widest text-sm font-medium">Book Now</button>
        </nav>
      </header>

      <main>
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <img 
            src="https://picsum.photos/seed/resort-luxury/1920/1080" 
            alt="Resort Luxury" 
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
              Luxury in Nature
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto"
            >
              Experience the finest blend of comfort and wilderness at Chamtaburu Resort.
            </motion.p>
          </div>
        </section>

        <section id="rooms" className="py-24 px-6 max-w-6xl mx-auto">
          <h2 className="text-3xl font-serif italic mb-12 text-center">Our Accommodations</h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Special Bamboo Cottage */}
            <div className="group overflow-hidden rounded-3xl bg-white shadow-sm border border-stone-200">
              <img 
                src="https://picsum.photos/seed/bamboo-cottage/800/600" 
                alt="Special Bamboo Cottage" 
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-serif italic">Special Bamboo Cottage</h3>
                  <span className="text-xl font-bold text-stone-700">₹2,000<span className="text-sm font-normal text-stone-400">/night</span></span>
                </div>
                <p className="text-stone-600 mb-6">Experience the charm of bamboo living. Includes complimentary breakfast and attached bathroom with geyser.</p>
                <div className="flex flex-wrap gap-4 text-stone-500 text-sm mb-8">
                  <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> 2 Adults + 1 Child (up to 5y)</div>
                  <div className="flex items-center gap-1"><Coffee className="w-4 h-4" /> Breakfast Included</div>
                  <div className="flex items-center gap-1"><Star className="w-4 h-4" /> Geyser Attached</div>
                </div>
                <button onClick={handleBookNow} className="w-full bg-stone-900 text-white py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-stone-700 transition-colors">Book Now</button>
              </div>
            </div>

            {/* Double Bed Cottage */}
            <div className="group overflow-hidden rounded-3xl bg-white shadow-sm border border-stone-200">
              <img 
                src="https://picsum.photos/seed/double-cottage/800/600" 
                alt="Double Bed Cottage" 
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-serif italic">Double Bed Cottage</h3>
                  <span className="text-xl font-bold text-stone-700">₹1,800<span className="text-sm font-normal text-stone-400">/night</span></span>
                </div>
                <p className="text-stone-600 mb-6">Comfortable and cozy cottages for a perfect getaway. Includes complimentary breakfast and attached bathroom with geyser.</p>
                <div className="flex flex-wrap gap-4 text-stone-500 text-sm mb-8">
                  <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> 2 Adults + 1 Child</div>
                  <div className="flex items-center gap-1"><Coffee className="w-4 h-4" /> Breakfast Included</div>
                  <div className="flex items-center gap-1"><Star className="w-4 h-4" /> Geyser Attached</div>
                </div>
                <button onClick={handleBookNow} className="w-full bg-stone-900 text-white py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-stone-700 transition-colors">Book Now</button>
              </div>
            </div>

            {/* Quardruple Cottage */}
            <div className="group overflow-hidden rounded-3xl bg-white shadow-sm border border-stone-200">
              <img 
                src="https://picsum.photos/seed/quad-cottage/800/600" 
                alt="Quardruple Cottage" 
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-serif italic">Quardruple Cottage</h3>
                  <span className="text-xl font-bold text-stone-700">₹2,400<span className="text-sm font-normal text-stone-400">/night</span></span>
                </div>
                <p className="text-stone-600 mb-6">Spacious cottage with 2 queen size beds, perfect for groups. Includes complimentary breakfast and attached bathroom with geyser.</p>
                <div className="flex flex-wrap gap-4 text-stone-500 text-sm mb-8">
                  <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> 4 Adults (2 Queen Beds)</div>
                  <div className="flex items-center gap-1"><Coffee className="w-4 h-4" /> Breakfast Included</div>
                  <div className="flex items-center gap-1"><Star className="w-4 h-4" /> Geyser Attached</div>
                </div>
                <button onClick={handleBookNow} className="w-full bg-stone-900 text-white py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-stone-700 transition-colors">Book Now</button>
              </div>
            </div>

            {/* Family Cottage */}
            <div className="group overflow-hidden rounded-3xl bg-white shadow-sm border border-stone-200">
              <img 
                src="https://picsum.photos/seed/family-cottage/800/600" 
                alt="Family Cottage" 
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-serif italic">Family Cottage</h3>
                  <span className="text-xl font-bold text-stone-700">₹3,599<span className="text-sm font-normal text-stone-400">/night</span></span>
                </div>
                <p className="text-stone-600 mb-6">Our largest cottage with 2 king size beds for the whole family. Includes complimentary breakfast and attached bathroom with geyser.</p>
                <div className="flex flex-wrap gap-4 text-stone-500 text-sm mb-8">
                  <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> 6 Adults (2 King Beds)</div>
                  <div className="flex items-center gap-1"><Coffee className="w-4 h-4" /> Breakfast Included</div>
                  <div className="flex items-center gap-1"><Star className="w-4 h-4" /> Geyser Attached</div>
                </div>
                <button onClick={handleBookNow} className="w-full bg-stone-900 text-white py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-stone-700 transition-colors">Book Now</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-stone-900 text-stone-400 py-12 px-6 text-center">
        <p className="text-sm tracking-widest uppercase mb-4">&copy; 2026 Chamtaburu Resort. All Rights Reserved.</p>
        <div className="flex justify-center gap-6 text-xs uppercase tracking-widest">
          <a href="https://chamtaburu.in" className="hover:text-white transition-colors">Home</a>
          <a href="https://village.chamtaburu.in" className="hover:text-white transition-colors">Village</a>
          <a href="https://junction.chamtaburu.in" className="hover:text-white transition-colors">Junction</a>
        </div>
      </footer>
    </motion.div>
  );
}
