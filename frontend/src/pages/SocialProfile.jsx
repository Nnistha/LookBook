import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Send, ChevronLeft, Edit3, Save, X, Plus, Upload, ImageIcon, Pencil } from 'lucide-react';
import OutfitPreview from '../components/OutfitPreview';

export default function SocialProfile() {
  const [postedOutfits, setPostedOutfits] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    socialName: 'nistha_goyal',
    socialImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
    stats: {
      posts: 842,
      followers: '12.4k',
      following: 418
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem('lookbook_profile_v2');
    if (saved) {
      setProfile(prev => ({ ...prev, ...JSON.parse(saved) }));
    }
    fetchPostedOutfits();
  }, []);

  const fetchPostedOutfits = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/outfits/posted');
      if (res.ok) {
        const data = await res.json();
        setPostedOutfits(data);
        setProfile(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            posts: data.length
          }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = () => {
    localStorage.setItem('lookbook_profile_v2', JSON.stringify(profile));
    setIsEditing(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, socialImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const EditableText = ({ value, onSave, className }) => {
    if (!isEditing) return <span className={className}>{value}</span>;
    return (
      <span
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onSave(e.target.innerText)}
        className={`${className} outline-none focus:bg-wine-700/5 px-2 rounded border-b border-dotted border-wine-700/30 cursor-text min-w-[50px] inline-block`}
      >
        {value}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-20 px-6 md:px-12 relative overflow-x-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

      {/* Back Button */}
      <Link to="/" className="fixed top-12 left-12 p-3 rounded-full hover:bg-cream-500 transition-colors group z-50">
        <ChevronLeft className="w-6 h-6 text-wine-900 group-hover:-translate-x-1 transition-transform" />
      </Link>

      {/* Action Controls */}
      <div className="fixed bottom-12 right-12 flex flex-col gap-4 z-[100]">
        <AnimatePresence>
          {isEditing && (
            <motion.button 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0, opacity: 0 }} 
              onClick={handleSave} 
              className="bg-wine-700 text-white p-5 rounded-full shadow-2xl hover:bg-wine-900 transition-all flex items-center gap-3 group"
            >
              <Save className="w-6 h-6" />
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 text-xs uppercase tracking-widest px-0 group-hover:px-2 font-bold">Save Changes</span>
            </motion.button>
          )}
        </AnimatePresence>
        
        <button 
          onClick={() => navigate('/dressing-room')}
          className="bg-wine-900 text-white p-5 rounded-full shadow-2xl hover:bg-black transition-all flex items-center gap-3 group"
        >
          <Plus className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 text-xs uppercase tracking-widest px-0 group-hover:px-2 font-bold">New Outfit</span>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white flex flex-col items-center text-center space-y-12"
      >
        {/* Profile Image with Instagram-style Edit Icon */}
        <div className="relative group">
          <div className="w-40 h-40 md:w-56 md:h-56 rounded-full p-1 border border-wine-700/5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden bg-white relative">
            <img 
              src={profile.socialImage} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-full"
            />
            {isEditing && (
              <div 
                onClick={() => fileInputRef.current.click()}
                className="absolute inset-0 bg-wine-900/40 flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px] z-10"
              >
                <Upload className="w-8 h-8 text-white mb-2" />
                <span className="text-[8px] uppercase tracking-widest font-bold text-white">Upload</span>
              </div>
            )}
          </div>
          
          {/* Instagram-style Pen Icon */}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-wine-700/5 transition-all duration-300 z-20 ${isEditing ? 'bg-wine-700 text-white scale-110' : 'bg-white text-wine-900 hover:scale-110'}`}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>

          <div className="absolute top-1/2 -right-4 w-3 h-3 rounded-full bg-green-500 animate-pulse border-2 border-white" />
        </div>

        {/* Identity */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-serif font-bold text-wine-900 tracking-tighter lowercase">
            <EditableText value={profile.socialName} onSave={(v) => setProfile(prev => ({...prev, socialName: v}))} />
          </h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.4em] text-wine-700/40 font-bold">Paris, France</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-[1px] bg-wine-700/5" />

        {/* Stats */}
        <div className="grid grid-cols-3 w-full gap-8 py-4">
          <div className="space-y-1">
            <p className="text-4xl md:text-5xl font-serif font-bold text-wine-900">{profile.stats.posts}</p>
            <p className="text-[10px] uppercase tracking-[0.4em] text-wine-700/30 font-bold">Posts</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl md:text-5xl font-serif font-bold text-wine-900">{profile.stats.followers}</p>
            <p className="text-[10px] uppercase tracking-[0.4em] text-wine-700/30 font-bold">Followers</p>
          </div>
          <div className="space-y-1">
            <p className="text-4xl md:text-5xl font-serif font-bold text-wine-900">{profile.stats.following}</p>
            <p className="text-[10px] uppercase tracking-[0.4em] text-wine-700/30 font-bold">Following</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 w-full pt-4">
          <button className="flex-1 bg-wine-900 text-white py-6 rounded-3xl text-xs font-bold uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(88,28,28,0.2)] hover:bg-black transition-all">
            Follow
          </button>
          <button className="flex-1 bg-white text-wine-900 border border-wine-700/10 py-6 rounded-3xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-wine-900/5 transition-all">
            Message
          </button>
        </div>

        {/* Gallery Section */}
        <div className="w-full pt-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {postedOutfits.length > 0 ? (
              postedOutfits.map((outfit) => (
                <motion.div 
                  key={outfit._id}
                  whileHover={{ y: -10 }}
                  className="aspect-[3/4] rounded-[2rem] overflow-hidden shadow-xl border border-wine-700/5 bg-cream-500/10 group relative"
                >
                  <OutfitPreview outfit={outfit} className="w-full h-full transition-transform duration-700 group-hover:scale-110" imageClassName="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-wine-900/70 via-wine-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                    <p className="text-white text-[10px] uppercase tracking-widest font-bold">{outfit.name}</p>
                    {outfit.caption && <p className="mt-2 text-white/80 text-xs font-light line-clamp-2">{outfit.caption}</p>}
                  </div>
                </motion.div>
              ))
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="aspect-[3/4] rounded-[2rem] bg-wine-700/5 flex items-center justify-center border border-wine-700/5 border-dashed">
                  <p className="text-[8px] uppercase tracking-widest text-wine-700/20 font-bold">No posts yet</p>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
