import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveSession } from '../utils/auth';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          saveSession({ token: data.token, user: data.user });
          navigate('/');
        } else {
          // After register, switch to login
          alert('Registration successful! Please sign in.');
          setIsLogin(true);
        }
      } else {
        alert(data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex bg-offwhite">
      {/* Left: Editorial Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop" 
          alt="Fashion Campaign" 
          className="w-full h-full object-cover grayscale-[30%]"
        />
        <div className="absolute inset-0 bg-wine-900/20 mix-blend-multiply" />
      </div>

      {/* Right: Clean Minimal Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-serif tracking-widestest mb-4 font-normal text-wine-700 uppercase">
              LOOK BOOK
            </h1>
            <p className="text-wine-700/60 text-xs font-light tracking-widest uppercase">
              Digitalizing your wardrobe
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="border-b border-wine-700/20 pb-2">
                <input 
                  required
                  type="text" 
                  placeholder="FULL NAME" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-transparent text-wine-700 placeholder:text-wine-700/30 text-xs tracking-widest focus:outline-none focus:placeholder:text-wine-700/50 transition-all"
                />
              </div>
            )}
            <div className="border-b border-wine-700/20 pb-2">
              <input 
                required
                type="email" 
                placeholder="EMAIL ADDRESS" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-transparent text-wine-700 placeholder:text-wine-700/30 text-xs tracking-widest focus:outline-none focus:placeholder:text-wine-700/50 transition-all"
              />
            </div>
            <div className="border-b border-wine-700/20 pb-2">
              <input 
                required
                type="password" 
                placeholder="PASSWORD" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-transparent text-wine-700 placeholder:text-wine-700/30 text-xs tracking-widest focus:outline-none focus:placeholder:text-wine-700/50 transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full luxury-button-solid mt-4 ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? 'PROCESSING...' : (isLogin ? 'ENTER' : 'CREATE ACCOUNT')}
            </button>
          </form>

          <div className="mt-16 border-t border-wine-700/10 pt-8">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-[10px] tracking-widest uppercase text-wine-700/60 hover:text-wine-700 transition-colors"
            >
              {isLogin ? "New here? Create an account" : "Already registered? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
