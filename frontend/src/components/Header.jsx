import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, User, LogOut, Settings, Moon, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clearSession } from '../utils/auth';

export default function Header({ toggleSidebar }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] w-full px-4 md:px-12 max-w-[95vw] pointer-events-none">
      <header className="w-full bg-wine-900 text-offwhite rounded-full py-2 px-10 flex items-center justify-between shadow-2xl pointer-events-auto border border-white/10 backdrop-blur-md">
        
        {/* Left: Hamburger Menu + Look Book */}
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleSidebar}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-wine-900 transition-all duration-300 group"
          >
            <Menu className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          </button>
          <Link to="/" className="text-xl font-serif tracking-[0.3em] uppercase text-white hover:opacity-80 transition-opacity pl-2">
            LOOK BOOK
          </Link>
        </div>

        {/* Right: Search & Profile */}
        <div className="flex items-center gap-6 relative" ref={dropdownRef}>
          <button className="p-2 opacity-60 hover:opacity-100 transition-opacity">
            <Search className="w-5 h-5" strokeWidth={1.5} />
          </button>
          
          <div className="w-[1px] h-6 bg-white/20" />

          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-full border border-white/20 p-0.5 group-hover:border-white transition-all overflow-hidden bg-offwhite/10">
              <div className="w-full h-full rounded-full bg-cream-500/20 flex items-center justify-center text-offwhite font-serif text-sm">
                NG
              </div>
            </div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-14 w-60 bg-wine-900 border border-white/10 rounded-3xl py-4 shadow-2xl z-50 text-offwhite overflow-hidden"
              >
                <div className="px-6 py-6 border-b border-white/10 mb-2 text-center bg-white/5">
                  <p className="font-serif text-offwhite text-lg mb-1 italic">Nistha Goyal</p>
                  <p className="text-[9px] uppercase text-white/40 font-light tracking-widest">Premium Member</p>
                </div>
                <div className="py-2">
                  <Link to="/social-profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-6 py-3 text-sm hover:bg-white/10 transition-colors">
                    <User className="w-4 h-4 mr-4" strokeWidth={1} /> Profile
                  </Link>
                  <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center px-6 py-3 text-sm hover:bg-white/10 transition-colors text-left">
                    <Settings className="w-4 h-4 mr-4" strokeWidth={1} /> Settings
                  </Link>
                </div>
                <div className="py-2 border-t border-white/10 mt-2">
                  <button onClick={handleLogout} className="w-full flex items-center px-6 py-3 text-sm hover:bg-red-500/20 text-red-400 transition-colors text-left">
                    <LogOut className="w-4 h-4 mr-4" strokeWidth={1} /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </div>
  );
}
