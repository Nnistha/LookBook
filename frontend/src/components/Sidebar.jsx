import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Shirt, Scissors, Calendar, ShoppingBag, Bot, User, X, Home, Compass, Heart, Share2 } from 'lucide-react';

const navItems = [
  { name: 'Wardrobe', path: '/wardrobe', icon: Shirt, desc: 'Inventory & Collection' },
  { name: 'Dressing Room', path: '/dressing-room', icon: Scissors, desc: 'Canvas & Look Builder' },
  { name: 'Calendar', path: '/calendar', icon: Calendar, desc: 'Daily Fit Schedule' },
  { name: 'Shopping', path: '/shopping', icon: ShoppingBag, desc: 'Curated Selections' },
  { name: 'AI Stylist', path: '/ai-assistant', icon: Bot, desc: 'Intelligent Advice' },
  { name: 'Profile', path: '/social-profile', icon: User, desc: 'Your Social Persona' },
];

export default function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-wine-900/40 backdrop-blur-md z-[110]"
            onClick={closeSidebar}
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[400px] max-w-[90vw] bg-offwhite z-[120] flex flex-col shadow-[20px_0_60px_-15px_rgba(0,0,0,0.3)]"
          >
            {/* Header Area */}
            <div className="p-10 flex items-center justify-between border-b border-wine-700/5 bg-cream-500/10">
              <div className="space-y-1">
                <h2 className="text-2xl font-serif tracking-[0.2em] uppercase text-wine-900">Look Book</h2>
                <p className="text-[9px] uppercase tracking-[0.4em] text-wine-700/40 font-bold">The Directory</p>
              </div>
              <button 
                onClick={closeSidebar}
                className="w-10 h-10 rounded-full border border-wine-700/10 flex items-center justify-center hover:bg-wine-900 hover:text-white transition-all duration-500"
              >
                <X className="w-4 h-4" strokeWidth={1} />
              </button>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex-1 py-12 px-8 space-y-6 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={closeSidebar}
                    className={`flex items-start gap-6 p-6 rounded-[2rem] transition-all duration-500 group relative overflow-hidden ${
                      isActive 
                        ? 'bg-wine-700 text-white shadow-xl translate-x-4' 
                        : 'hover:bg-cream-500/50 hover:translate-x-2'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${isActive ? 'bg-white/10' : 'bg-wine-700/5 group-hover:bg-wine-700/10'} transition-colors`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-wine-700'}`} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <span className={`block text-sm uppercase tracking-[0.2em] font-bold ${isActive ? 'text-white' : 'text-wine-700'}`}>
                        {item.name}
                      </span>
                      <span className={`block text-[10px] lowercase tracking-wide font-light ${isActive ? 'text-white/60' : 'text-wine-700/40'}`}>
                        {item.desc}
                      </span>
                    </div>
                    {isActive && (
                      <motion.div layoutId="active" className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                    )}
                  </Link>
                );
              })}
            </nav>
            
            {/* Footer Area */}
            <div className="p-10 border-t border-wine-700/5 bg-cream-500/10 flex items-center justify-between">
              <div className="flex gap-4">
                <button className="w-8 h-8 rounded-full border border-wine-700/10 flex items-center justify-center hover:bg-wine-700 hover:text-white transition-all"><Heart className="w-3 h-3" /></button>
                <button className="w-8 h-8 rounded-full border border-wine-700/10 flex items-center justify-center hover:bg-wine-700 hover:text-white transition-all"><Share2 className="w-3 h-3" /></button>
              </div>
              <p className="text-[9px] text-wine-700/30 tracking-widest uppercase font-bold">
                EST. 2026
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
