/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Leaf, 
  Users, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  Facebook, 
  Instagram, 
  Youtube, 
  ShieldCheck, 
  ChevronRight,
  Menu,
  X,
  Construction,
  Bed,
  Home as HomeIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import our new subdomain components
import { Home as MainHome } from './components/Home';
import { Resort as ResortHome } from './components/Resort';
import { Village as VillageHome } from './components/Village';
import { Junction as JunctionHome } from './components/Junction';

// --- Components ---

const Footer = () => {
  return (
    <footer className="bg-white pt-16 pb-8 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-8">
          <div className="flex space-x-8 text-[11px] font-semibold tracking-widest text-gray-500">
            <Link to="/" className="hover:text-primary">HOME</Link>
            <Link to="/eco-village" className="hover:text-primary">ECO VILLAGE</Link>
            <Link to="/eco-resort" className="hover:text-primary">ECO RESORT</Link>
            <Link to="/legal" className="hover:text-primary">LEGAL POLICIES</Link>
          </div>
          
          <div className="flex space-x-6 text-gray-400">
            <Facebook size={20} className="hover:text-primary cursor-pointer" />
            <Instagram size={20} className="hover:text-primary cursor-pointer" />
            <Youtube size={20} className="hover:text-primary cursor-pointer" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">
              Copyright © 2026 Chamtaburu Eco Village and Resort - All Rights Reserved.
            </p>
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">
              Business Legal Name: Chamtaburu Eco Village & Resort Pvt. Ltd.
            </p>
          </div>

          <div className="pt-4">
            <img 
              src="https://www.trustedsite.com/img/trustmark/trustmark-sm.png" 
              alt="TrustedSite" 
              className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 right-6 z-[60] max-w-sm bg-primary/90 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl border border-white/20"
    >
      <h4 className="font-bold text-sm mb-2 tracking-wide">This website uses cookies.</h4>
      <p className="text-xs text-white/80 leading-relaxed mb-4">
        We use cookies to analyze website traffic and optimize your website experience. By accepting our use of cookies, your data will be aggregated with all other user data.
      </p>
      <button 
        onClick={() => setIsVisible(false)}
        className="w-full bg-ink text-white py-2 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors"
      >
        ACCEPT
      </button>
    </motion.div>
  );
};

// --- Pages ---

const getSubdomainUrl = (sub: string) => {
  const hostname = window.location.hostname;
  if (hostname.includes('localhost') || hostname.includes('run.app')) {
    return `?subdomain=${sub}`;
  }
  return `https://${sub}.chamtaburu.in`;
};

const GroupPortal = () => {
  const units = [
    { 
      id: 'resort', 
      name: 'Chamtaburu Eco Resort', 
      desc: 'Luxury meets nature in our premium resort facilities.', 
      img: 'https://picsum.photos/seed/resort-portal/800/600',
      url: getSubdomainUrl('resort'),
      color: 'bg-primary'
    },
    { 
      id: 'village', 
      name: 'Chamtaburu Eco Village', 
      desc: 'Sustainable living and authentic tribal experiences.', 
      img: 'https://picsum.photos/seed/village-portal/800/600',
      url: getSubdomainUrl('village'),
      color: 'bg-primary/80'
    },
    { 
      id: 'junction', 
      name: 'Chamtaburu Junction', 
      desc: 'Our upcoming hub for community and commerce.', 
      img: 'https://picsum.photos/seed/junction-portal/800/600',
      url: getSubdomainUrl('junction'),
      color: 'bg-gray-400',
      comingSoon: true
    },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      <header className="py-24 text-center space-y-4">
        <h1 className="text-6xl serif font-medium text-primary">Chamtaburu Group</h1>
        <p className="text-sm tracking-[0.4em] uppercase text-gray-500">Excellence in Sustainable Hospitality</p>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {units.map((unit) => (
            <motion.div 
              key={unit.id}
              whileHover={{ y: -10 }}
              className="card group cursor-pointer"
              onClick={() => {
                if (unit.url.startsWith('?')) {
                  window.location.search = unit.url;
                } else {
                  window.location.href = unit.url;
                }
              }}
            >
              <div className="relative h-80 overflow-hidden">
                <img src={unit.img} alt={unit.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                {unit.comingSoon && (
                  <div className="absolute top-4 right-4 bg-white text-ink px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                    Coming Soon
                  </div>
                )}
              </div>
              <div className="p-8 space-y-4">
                <h3 className="text-2xl serif font-medium">{unit.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{unit.desc}</p>
                <div className="pt-4 flex items-center text-primary font-bold text-[10px] tracking-widest uppercase">
                  {unit.comingSoon ? 'Stay Tuned' : 'Explore Unit'} <ChevronRight size={14} className="ml-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const JunctionTeaser = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-[1px] bg-primary mb-8" />
      <h1 className="text-6xl serif font-medium mb-4">Chamtaburu Junction</h1>
      <p className="text-xl font-light tracking-widest uppercase text-gray-400 mb-12">Coming Soon to the Ajodhya Hills</p>
      <Link to="/" className="btn-primary">Back to Group Portal</Link>
    </div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isGroupPortal = location.pathname === '/';

  const navLinks = isGroupPortal ? [
    { name: 'GROUP', url: '/' },
    { name: 'RESORT', url: getSubdomainUrl('resort') },
    { name: 'VILLAGE', url: getSubdomainUrl('village') },
    { name: 'JUNCTION', url: getSubdomainUrl('junction') },
  ] : [
    { name: 'GROUP PORTAL', url: '/' },
    { name: 'HOME', url: location.pathname.startsWith('/resort') ? '/resort' : '/village' },
    { name: 'ECO VILLAGE', url: '/village' },
    { name: 'ECO RESORT', url: '/resort' },
    { name: 'CONTACT', url: '/contact' },
  ];

  const handleLinkClick = (url: string) => {
    setIsOpen(false);
    if (url.startsWith('http') || url.startsWith('?')) {
      if (url.startsWith('?')) {
        window.location.search = url;
      } else {
        window.location.href = url;
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="bg-primary text-white text-[10px] py-1 text-center tracking-widest uppercase flex items-center justify-center gap-2">
        <Leaf size={10} /> Chamtaburu Group: Sustainable Luxury & Community <Leaf size={10} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="text-3xl serif font-medium text-primary tracking-tight">
            Chamtaburu
          </Link>
          
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              link.url.startsWith('http') || link.url.startsWith('?') ? (
                <a
                  key={link.name}
                  href={link.url}
                  className="text-[11px] font-semibold tracking-widest text-gray-500 hover:text-primary transition-colors"
                  onClick={(e) => {
                    if (link.url.startsWith('?')) {
                      e.preventDefault();
                      window.location.search = link.url;
                    }
                  }}
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.url}
                  className={`text-[11px] font-semibold tracking-widest hover:text-primary transition-colors ${
                    location.pathname === link.url ? 'text-primary border-b-2 border-primary pb-1' : 'text-gray-500'
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
            {!isGroupPortal && (
              <Link to="/checkout" className="bg-primary/10 text-primary px-4 py-2 rounded-full text-[11px] font-bold tracking-widest hover:bg-primary hover:text-white transition-all">
                BOOK NOW
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              {navLinks.map((link) => (
                link.url.startsWith('http') || link.url.startsWith('?') ? (
                  <a
                    key={link.name}
                    href={link.url}
                    onClick={(e) => {
                      if (link.url.startsWith('?')) {
                        e.preventDefault();
                        window.location.search = link.url;
                      }
                      setIsOpen(false);
                    }}
                    className="block text-[11px] font-semibold tracking-widest text-gray-500 hover:text-primary"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.url}
                    onClick={() => setIsOpen(false)}
                    className="block text-[11px] font-semibold tracking-widest text-gray-500 hover:text-primary"
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Home = () => {
  const location = useLocation();
  const isResort = location.pathname.startsWith('/resort');
  
  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <img 
          src={isResort ? "https://picsum.photos/seed/resort-hero/1920/1080" : "https://picsum.photos/seed/village-hero/1920/1080"} 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-7xl serif font-medium mb-6 leading-tight"
          >
            {isResort ? "Chamtaburu Eco Resort" : "Chamtaburu Eco Village"}
          </motion.h1>
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl font-light tracking-widest uppercase mb-10 opacity-90"
          >
            {isResort ? "Luxury meets nature in the heart of Ajodhya Hills." : "Sustainable living and authentic tribal experiences."}
          </motion.p>
          <motion.button 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-primary text-white px-10 py-4 rounded-full text-xs font-bold tracking-[0.3em] uppercase hover:scale-105 transition-transform"
          >
            LEARN MORE
          </motion.button>
        </div>
      </section>

      {/* Our Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl serif font-medium">Our Story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
              <p>
                Chamtaburu {isResort ? 'Eco Resort' : 'Eco Village'} is a testament to our commitment to the land and its people. Nestled in the Ajodhya Hills, we provide a sanctuary where nature and luxury coexist in perfect harmony.
              </p>
              <p>
                Our journey began with a simple vision: to create a space that respects the environment while offering world-class hospitality. Today, we are proud to be a leader in sustainable tourism in West Bengal.
              </p>
            </div>
          </div>
          <div className="relative">
            <img 
              src={isResort ? "https://picsum.photos/seed/resort-story/800/600" : "https://picsum.photos/seed/village-story/800/600"} 
              alt="Story" 
              className="rounded-2xl shadow-xl w-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 mb-16">
            <div className="h-[1px] bg-gray-200 flex-1" />
            <h2 className="text-3xl serif font-medium whitespace-nowrap">Our Mission</h2>
            <div className="h-[1px] bg-gray-200 flex-1" />
          </div>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="flex justify-center text-primary"><Leaf size={40} /></div>
              <h3 className="text-xl font-semibold">Eco-conservation</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We are committed to preserving the natural beauty of the Ajodhya Hills through sustainable practices and reforestation efforts.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center text-primary"><Users size={40} /></div>
              <h3 className="text-xl font-semibold">Community support</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We work closely with local tribal communities to provide education, employment, and cultural preservation.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-center text-primary"><Globe size={40} /></div>
              <h3 className="text-xl font-semibold">Providing immersive</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                We offer guests a chance to truly connect with nature through immersive experiences and authentic cultural exchanges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stay Connected Banner */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden mx-4 sm:mx-8 rounded-3xl">
        <img 
          src="https://picsum.photos/seed/forest-footer/1920/600" 
          alt="Forest" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-4 max-w-2xl">
          <h2 className="text-4xl serif font-medium mb-4">Stay connected</h2>
          <p className="text-xs font-light leading-relaxed mb-8 opacity-80">
            Be the first to hear about local events and new amenities at Chamtaburu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="Email Address" 
              className="flex-1 bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-6 py-3 text-sm focus:outline-none focus:bg-white/20 transition-all placeholder:text-white/50"
            />
            <button className="bg-primary text-white px-8 py-3 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-primary transition-all">
              SIGN UP
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

// --- Pages ---

const Accommodations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isResort = location.pathname.startsWith('/eco-resort');
  
  const items = isResort ? [
    { id: 1, title: 'Special Bamboo Cottage', desc: 'Experience the charm of bamboo living. Includes complimentary breakfast and attached bathroom with geyser.', price: '₹2,000 / night', img: 'https://picsum.photos/seed/bamboo-cottage/400/300' },
    { id: 2, title: 'Double Bed Cottage', desc: 'Comfortable and cozy cottages for a perfect getaway. Includes complimentary breakfast and attached bathroom with geyser.', price: '₹1,800 / night', img: 'https://picsum.photos/seed/double-cottage/400/300' },
    { id: 3, title: 'Quardruple Cottage', desc: 'Spacious cottage with 2 queen size beds, perfect for groups. Includes complimentary breakfast and attached bathroom with geyser.', price: '₹2,400 / night', img: 'https://picsum.photos/seed/quad-cottage/400/300' },
    { id: 4, title: 'Family Cottage', desc: 'Our largest cottage with 2 king size beds for the whole family. Includes complimentary breakfast and attached bathroom with geyser.', price: '₹3,599 / night', img: 'https://picsum.photos/seed/family-cottage/400/300' },
    { id: 7, title: 'Guided Nature Walk', desc: '3-hour guided tour with an expert naturalist. Binoculars provided.', price: '₹1,200 / person', img: 'https://picsum.photos/seed/walk/400/300' },
    { id: 8, title: 'Organic Farming Workshop', desc: 'Hands-on workshop on sustainable farming techniques. Farm-to-table lunch included.', price: '₹2,000 / person', img: 'https://picsum.photos/seed/farming/400/300' },
  ] : [
    { id: 1, title: 'Traditional Mud House', desc: 'Stay in a beautifully decorated traditional mud house. Cool in summer and warm in winter. Authentic village experience.', price: '₹1,200 / night', img: 'https://picsum.photos/seed/mud-house/400/300' },
    { id: 2, title: 'Tree Top Cabin', desc: 'Elevated wooden cabin offering a unique perspective of the village and surrounding greenery. Perfect for nature lovers.', price: '₹1,500 / night', img: 'https://picsum.photos/seed/tree-cabin/400/300' },
    { id: 3, title: 'Tribal Pottery Workshop', desc: 'Learn the ancient art of pottery from local masters. Take home your own creation.', price: '₹800 / person', img: 'https://picsum.photos/seed/pottery/400/300' },
    { id: 4, title: 'Traditional Weaving Class', desc: 'Discover the intricate patterns and techniques of tribal weaving. Materials included.', price: '₹1,000 / person', img: 'https://picsum.photos/seed/weaving/400/300' },
  ];

  return (
    <div className="pb-24">
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden mb-16">
        <img src="https://picsum.photos/seed/services-hero/1920/400" alt="Services" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl serif font-medium mb-4">{isResort ? 'Resort' : 'Village'} Accommodations & Services</h1>
          <p className="text-sm font-light tracking-widest uppercase opacity-80">Explore our diverse stay options and enriching experiences. Book your sustainable getaway today.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.id} className="card group">
              <div className="relative h-64 overflow-hidden">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                <div className="pt-4 flex items-center justify-between">
                  <span className="font-bold text-ink">{item.price}</span>
                  <button 
                    onClick={() => navigate('/checkout')}
                    className="bg-primary/10 text-primary px-5 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-primary hover:text-white transition-all"
                  >
                    BOOK NOW
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 pt-12 border-t border-gray-200 text-center space-y-6">
          <div className="flex justify-center gap-6 opacity-60">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" alt="RuPay" className="h-4" referrerPolicy="no-referrer" />
          </div>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-primary" /> Secure Booking & Payment Gateway Compliance. All transactions are encrypted.
          </p>
        </div>
      </div>
    </div>
  );
};

const Contact = () => {
  return (
    <div className="pb-24">
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden mb-16">
        <img src="https://picsum.photos/seed/contact-hero/1920/400" alt="Contact" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl serif font-medium">Contact Us</h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="h-[1px] bg-gray-200 flex-1" />
          <h2 className="text-2xl serif font-medium whitespace-nowrap text-gray-500">Get in Touch with Us</h2>
          <div className="h-[1px] bg-gray-200 flex-1" />
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-12">
            <div className="space-y-8">
              <div className="flex gap-4">
                <MapPin className="text-primary shrink-0" size={20} />
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">OUR LOCATION</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">Chamtaburu Eco Resort, Matha Forest, Ajodhya Hills, Baghmundi, Purulia, West Bengal 723152, India</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Phone className="text-primary shrink-0" size={20} />
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">PHONE NUMBERS</h4>
                  <p className="text-sm text-gray-600">+91 8918550242</p>
                  <p className="text-sm text-gray-600">+91 700325792</p>
                  <p className="text-sm text-gray-600">+91 9242748100</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Mail className="text-primary shrink-0" size={20} />
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">SUPPORT EMAIL</h4>
                  <p className="text-sm text-gray-600">info@chamtaburu.com</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Clock className="text-primary shrink-0" size={20} />
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">FRONT DESK HOURS</h4>
                  <p className="text-sm text-gray-600">Monday - Sunday: 09:00 AM - 05:00 PM</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 whitespace-nowrap">SEND US A MESSAGE</h3>
                <div className="h-[1px] bg-gray-200 flex-1" />
              </div>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Name" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" />
                  <input type="email" placeholder="Email" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" />
                </div>
                <input type="text" placeholder="Subject" className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="Message" rows={4} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none" />
                <button className="bg-primary/60 text-white px-8 py-3 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-primary transition-all flex items-center gap-2">
                  SEND MESSAGE <Send size={12} />
                </button>
              </form>
            </div>
          </div>

          <div className="h-[600px] rounded-2xl overflow-hidden shadow-lg bg-gray-100 relative">
            {/* Mock Map */}
            <div className="absolute inset-0 bg-[#e5e3df] flex items-center justify-center">
              <img 
                src="https://picsum.photos/seed/map/800/1000" 
                alt="Map" 
                className="w-full h-full object-cover opacity-50 grayscale"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg animate-bounce" />
                <div className="bg-white px-3 py-1 rounded shadow-md text-[10px] font-bold mt-2">Chamtaburu Eco Resort</div>
              </div>
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <button className="w-8 h-8 bg-white rounded shadow flex items-center justify-center font-bold">+</button>
                <button className="w-8 h-8 bg-white rounded shadow flex items-center justify-center font-bold">-</button>
              </div>
              <button className="absolute top-4 right-4 bg-primary text-white px-4 py-2 rounded shadow text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                <MapPin size={12} /> GET DIRECTIONS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Legal = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-24 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-5xl serif font-medium">Chamtaburu Legal Policies</h1>
        <p className="text-sm text-gray-500 tracking-widest uppercase">Ensuring transparency and trust for your eco-resort experience.</p>
      </div>

      <div className="space-y-12">
        <section className="space-y-4">
          <h2 className="text-2xl serif font-medium border-b border-gray-100 pb-2">Business Legal Name</h2>
          <p className="text-sm text-gray-600">Chamtaburu Eco Village & Resort Private Limited</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl serif font-medium border-b border-gray-100 pb-2">Privacy Policy</h2>
          <div className="text-sm text-gray-600 space-y-4 leading-relaxed">
            <p>Chamtaburu Eco Village & Resort protects your data in collection only from how solo, contact via-or industry, and resorts via your information about your user and privacy policy, usage, and en provides its information.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl serif font-medium border-b border-gray-100 pb-2">Terms & Conditions</h2>
          <div className="text-sm text-gray-600 space-y-4 leading-relaxed">
            <p>Chamtaburu Eco Village & Resort terms and conditions on our Service Agreement. We use it to ensure compatibility with our Service Agreement and protect you and our services.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl serif font-medium border-b border-gray-100 pb-2">Refund & Cancellation Policy</h2>
          <div className="text-sm text-gray-600 space-y-4 leading-relaxed">
            <p>Cancellation timeline and refund policy for your bookings. Please review our full policy for details on how to request a refund.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl serif font-medium border-b border-gray-100 pb-2">Shipping Policy</h2>
          <div className="text-sm text-gray-600 space-y-4 leading-relaxed">
            <p>Delivery of merchandise or vouchers. For digital items, delivery is usually within 24 hours. For physical items, please allow up to 7-10 business days.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState('paytm');

  return (
    <div className="max-w-6xl mx-auto px-4 py-24">
      <h1 className="text-5xl serif font-medium text-center mb-16 text-gray-600">Booking Checkout</h1>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Booking Summary */}
        <div className="bg-[#f0f2ed] p-12 rounded-2xl space-y-8">
          <h2 className="text-2xl serif font-medium text-gray-500">Booking Summary</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Dates:</h4>
              <p className="text-sm text-gray-700">Oct 28, 2023 – Oct 31, 2023 (3 nights)</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Accommodation:</h4>
              <p className="text-sm text-gray-700">Premium Eco Cottage</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Guests:</h4>
              <p className="text-sm text-gray-700">2 Adults, 1 Child</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-medium">₹ 18,000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxes & Fees (18% GST):</span>
              <span className="font-medium">₹ 3,240</span>
            </div>
            <div className="flex justify-between items-end pt-4">
              <span className="text-2xl serif font-medium text-gray-600">Total Price:</span>
              <span className="text-3xl serif font-medium text-ink">₹ 21,240</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white border border-gray-100 p-12 rounded-2xl shadow-sm space-y-8">
          <h2 className="text-2xl serif font-medium">Secure Payment Details</h2>

          <div className="space-y-4">
            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="accent-primary" />
              <span className="text-sm font-medium">Credit/Debit Card</span>
            </label>
            
            <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'paytm' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}>
              <input type="radio" name="payment" checked={paymentMethod === 'paytm'} onChange={() => setPaymentMethod('paytm')} className="accent-primary" />
              <span className="text-sm font-medium">Paytm / UPI</span>
            </label>
          </div>

          <div className="space-y-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" className="mt-1 accent-primary" />
              <span className="text-[11px] text-gray-500 leading-relaxed">
                I agree to the <Link to="/legal" className="text-ink font-bold hover:underline">Terms & Conditions</Link> and <Link to="/legal" className="text-ink font-bold hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button className="w-full bg-primary text-white py-4 rounded-full text-xs font-bold tracking-[0.2em] uppercase hover:bg-ink transition-all">
              COMPLETE BOOKING
            </button>

            <div className="bg-[#f0f2ed] py-3 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 tracking-widest uppercase">
              <ShieldCheck size={14} className="text-primary" /> Secure Transaction
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  const subdomain = useMemo(() => {
    const hostname = window.location.hostname;
    
    // For development and preview URLs, we use query params to simulate subdomains
    // Example: ?subdomain=resort
    const params = new URLSearchParams(window.location.search);
    const querySubdomain = params.get('subdomain');
    if (querySubdomain) return querySubdomain.toLowerCase();

    // Production domain logic
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const sub = parts[0].toLowerCase();
      if (['resort', 'village', 'junction'].includes(sub)) {
        return sub;
      }
    }
    return null;
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col selection:bg-primary selection:text-white">
        {/* If we are on a specific subdomain, we render that site's experience */}
        {subdomain === 'resort' ? (
          <ResortHome />
        ) : subdomain === 'village' ? (
          <VillageHome />
        ) : subdomain === 'junction' ? (
          <JunctionHome />
        ) : (
          <>
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<GroupPortal />} />
                <Route path="/resort" element={<Home />} />
                <Route path="/village" element={<Home />} />
                <Route path="/junction" element={<JunctionTeaser />} />
                <Route path="/eco-village" element={<Accommodations />} />
                <Route path="/eco-resort" element={<Accommodations />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/checkout" element={<Checkout />} />
                {/* Fallback for unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <CookieConsent />
          </>
        )}
      </div>
    </Router>
  );
}
