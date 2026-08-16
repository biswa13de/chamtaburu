import { motion } from "motion/react";
import { MapPin, Home as HomeIcon, Coffee, Star, Heart, Music } from "lucide-react";
import { VideoTrigger } from "./VideoModal";
import { heroImages, villageRooms, type AmenityDetail } from "../data/content";

const amenityIcons: Record<AmenityDetail['icon'], typeof HomeIcon> = { bed: HomeIcon, coffee: Coffee, star: Star };

export function Village() {
  const handleBookNow = () => {
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('run.app')) {
      window.location.href = window.location.origin + '/checkout';
    } else {
      window.location.href = 'https://chamtaburu.in/checkout';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-orange-50 text-stone-900 font-sans"
      id="village-page"
    >
      <header className="p-6 flex justify-between items-center border-b border-orange-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <HomeIcon className="w-6 h-6 text-orange-700" />
          <span className="text-xl font-bold tracking-tight">Chamtaburu Village</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest">
          <a href="#experience" className="hover:text-orange-600 transition-colors">Experience</a>
          <a href="#stay" className="hover:text-orange-600 transition-colors">Stay</a>
          <button onClick={handleBookNow} className="hover:text-orange-600 transition-colors uppercase tracking-widest text-sm font-medium">Book Now</button>
        </nav>
      </header>

      <main>
        <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
          <img
            src={heroImages.villageStandalone}
            alt="Village Life"
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
              The Soul of the Village
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto"
            >
              Immerse yourself in the authentic tribal culture and warm hospitality of Chamtaburu.
            </motion.p>
          </div>
        </section>

        <section id="experience" className="py-24 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-serif italic mb-4">Tribal Rhythms</h3>
              <p className="text-stone-600 leading-relaxed">Join the evening bonfire and witness traditional dances that have been passed down through generations.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-serif italic mb-4">Local Flavors</h3>
              <p className="text-stone-600 leading-relaxed">Savor authentic home-cooked meals prepared with fresh, locally sourced organic ingredients.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-serif italic mb-4">Village Trails</h3>
              <p className="text-stone-600 leading-relaxed">Walk through the winding paths of the village and interact with the friendly local community.</p>
            </div>
          </div>
        </section>

        <section id="stay" className="py-24 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-serif italic mb-12 text-center">Village Stays</h2>
            <div className="grid md:grid-cols-2 gap-12">
              {villageRooms.map((room) => (
                <div key={room.id} className="group overflow-hidden rounded-3xl bg-orange-50 shadow-sm border border-orange-100">
                  {room.video ? (
                    <VideoTrigger videoUrl={room.video}>
                      <img
                        src={room.img}
                        alt={room.title}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </VideoTrigger>
                  ) : (
                    <img
                      src={room.img}
                      alt={room.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-serif italic">{room.title}</h3>
                      <span className="text-xl font-bold text-orange-800">
                        {room.price.split(' / ')[0]}
                        <span className="text-sm font-normal text-stone-400">/{room.price.split(' / ')[1]}</span>
                      </span>
                    </div>
                    <p className="text-stone-600 mb-6">{room.desc}</p>
                    <div className="flex flex-wrap gap-4 text-stone-500 text-sm mb-8">
                      {room.amenities?.map((amenity) => {
                        const Icon = amenityIcons[amenity.icon];
                        return (
                          <div key={amenity.label} className="flex items-center gap-1">
                            <Icon className="w-4 h-4" /> {amenity.label}
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={handleBookNow} className="w-full bg-orange-700 text-white py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-orange-800 transition-colors">Book Now</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-stone-900 text-stone-400 py-12 px-6 text-center">
        <p className="text-sm tracking-widest uppercase mb-4">&copy; 2026 Chamtaburu Village. All Rights Reserved.</p>
        <div className="flex justify-center gap-6 text-xs uppercase tracking-widest">
          <a href="https://chamtaburu.in" className="hover:text-white transition-colors">Home</a>
          <a href="https://resort.chamtaburu.in" className="hover:text-white transition-colors">Resort</a>
          <a href="https://junction.chamtaburu.in" className="hover:text-white transition-colors">Junction</a>
        </div>
      </footer>
    </motion.div>
  );
}
