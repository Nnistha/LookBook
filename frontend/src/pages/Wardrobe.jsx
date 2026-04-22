import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Upload, Camera, X, LayoutGrid, Shirt, Scissors, ChevronRight, 
  Image as ImageIcon, Heart, Sparkles, Calendar, Clock, Calculator, 
  Droplets, Trash2, Plane, Star, BookOpen, User, Search, Edit3, Save,
  MoreHorizontal, Tag, Info, Trash, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OutfitModal from '../components/OutfitModal';
import OutfitPreview from '../components/OutfitPreview';
import MoodboardStudio from '../components/MoodboardStudio';
import { MOODBOARD_OPEN_REQUEST_KEY } from '../utils/moodboards';
import { clearSession, getAuthToken } from '../utils/auth';

const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Innerwear'];

export default function Wardrobe() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const inspoInputRef = useRef(null);
  
  const [activeCategory, setActiveCategory] = useState('Tops');
  const [activeSidebar, setActiveSidebar] = useState('Wardrobe');
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [isOutfitModalOpen, setIsOutfitModalOpen] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    category: 'Tops',
    notes: '',
    tags: '',
    image: null
  });

  // User State for Fashion Goals
  const [fashionGoals, setFashionGoals] = useState({
    text: "Define your style narrative... What are you trying to express today?",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800"
  });

  const sidebarItems = [
    { name: 'Wardrobe', icon: Shirt, active: true },
    { name: 'Dressing Room', icon: Scissors, path: '/dressing-room' },
    { name: 'Moodboard', icon: ImageIcon },
    { name: 'Outfit Planning', icon: Calendar, path: '/calendar' },
    { name: 'Favourites', icon: Star, filter: true },
  ];

  const getAuthHeader = () => {
    const token = getAuthToken();
    console.log('Using token:', token ? 'Token exists' : 'NO TOKEN FOUND');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchItems();
    fetchOutfits();
    const savedGoals = localStorage.getItem('fashion_goals');
    if (savedGoals) setFashionGoals(JSON.parse(savedGoals));
    if (localStorage.getItem(MOODBOARD_OPEN_REQUEST_KEY)) {
      setActiveSidebar('Moodboard');
    }
  }, []);

  const fetchOutfits = async () => {
    try {
      const res = await fetch('https://lookbook-iwfd.onrender.com/api/outfits', {
        headers: getAuthHeader()
      });
      if (res.ok) {
        setOutfits(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('https://lookbook-iwfd.onrender.com/api/wardrobe', {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else if (res.status === 401) {
        console.warn('Unauthorized access, redirecting to login...');
        clearSession();
        navigate('/login');
      }
    } catch (err) {
      console.error('Fetch items error:', err);
    }
  };

  const handleSaveItem = async () => {
    if (!form.image) {
      alert("Please upload an image first.");
      return;
    }
    if (!form.name) {
      alert("Please give your item a name.");
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch('https://lookbook-iwfd.onrender.com/api/wardrobe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(form)
      });
      
      const responseData = await res.json();

      if (res.ok) {
        await fetchItems();
        setIsUploadOpen(false);
        setForm({ name: '', category: 'Tops', notes: '', tags: '', image: null });
      } else {
        console.error('Save failed:', responseData);
        if (res.status === 401) {
          alert('Your session has expired. Please log in again.');
          clearSession();
          navigate('/login');
        } else {
          alert(`Failed to save: ${responseData.error || responseData.message || 'Server error'}`);
        }
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Network error. Please check if the server is running.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/wardrobe/${selectedItem._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(selectedItem)
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
        setSelectedItem(updated);
        setIsEditingDetail(false);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update item.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFavourite = async (e, id) => {
    if (e) e.stopPropagation();
    const item = items.find(i => i._id === id);
    try {
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/wardrobe/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ favourite: !item.favourite })
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setItems(prev => prev.map(i => i._id === id ? updatedItem : i));
        if (selectedItem && selectedItem._id === id) setSelectedItem(updatedItem);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id) => {
    try {
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/wardrobe/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i._id !== id));
        setIsDetailOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteOutfit = async (id) => {
    if (!confirm('Delete this look from your archive?')) return;
    try {
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/outfits/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        setOutfits(prev => prev.filter(o => o._id !== id));
        setIsOutfitModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditOutfit = async (id, updates) => {
    if (updates.mode === 'studio') {
      const outfit = outfits.find(o => o._id === id);
      // We'll need a way to pass this to DressingRoom, maybe via state or localstorage
      localStorage.setItem('edit_outfit', JSON.stringify(outfit));
      navigate('/dressing-room');
      return;
    }

    try {
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/outfits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setOutfits(prev => prev.map(o => o._id === id ? updated : o));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleOutfit = async (outfitId, date, event) => {
    try {
      const res = await fetch('https://lookbook-iwfd.onrender.com/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ outfitId, date, event })
      });
      if (res.ok) {
        alert(event ? `Look scheduled for ${event} on ${date}!` : `Look scheduled for ${date}!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostOutfit = async (outfitId, caption) => {
    try {
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/outfits/${outfitId}/post`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ caption })
      });
      if (res.ok) {
        const updated = await res.json();
        setOutfits(prev => prev.map(o => o._id === outfitId ? updated : o));
        setSelectedOutfit(updated);
        alert('Look shared to your style feed!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Fill background with white to avoid black background in JPEG conversion
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setForm(prev => ({ ...prev, image: compressedBase64 }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInspoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result;
        setFashionGoals(prev => {
          const newState = { ...prev, image: res };
          localStorage.setItem('fashion_goals', JSON.stringify(newState));
          return newState;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveGoals = () => {
    localStorage.setItem('fashion_goals', JSON.stringify(fashionGoals));
    setIsEditingGoals(false);
  };

  const displayedItems = activeSidebar === 'Favourites' 
    ? items.filter(i => i.favourite)
    : activeCategory === 'All' ? items : items.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-white text-wine-900 font-sans selection:bg-wine-700 selection:text-offwhite flex relative overflow-x-hidden">
      
      {/* FIXED SIDEBAR */}
      <aside className="fixed top-0 left-0 w-[240px] h-screen bg-[#fdfaf6] border-r border-wine-700/5 z-[60] flex flex-col pt-24 pb-12 px-6 overflow-y-auto scrollbar-hide">
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-serif text-wine-900 tracking-tight italic">Your Space</h2>
          <div className="w-full h-[1px] bg-wine-700/10 mt-6" />
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebar === item.name;
            return (
              <button
                key={item.name}
                onClick={() => {
                  if (item.path) navigate(item.path);
                  else setActiveSidebar(item.name);
                }}
                className={`w-full flex items-center gap-5 px-4 py-4 rounded-2xl transition-all duration-500 group relative ${
                  isActive ? 'bg-wine-700 text-white shadow-lg' : 'text-wine-900/40 hover:text-wine-900 hover:bg-wine-700/5 hover:translate-x-1'
                }`}
              >
                <div className="w-5 flex justify-center">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-wine-700/30 group-hover:text-wine-700'}`} strokeWidth={1.5} />
                </div>
                <span className="text-sm uppercase tracking-[0.2em] font-bold text-left leading-tight">
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-12 pt-8 border-t border-wine-700/5 space-y-4 px-2">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-cream-500 overflow-hidden border border-wine-700/10 transition-transform group-hover:scale-110">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-0">
              <p className="text-[13px] uppercase tracking-widest font-bold">Nistha Goyal</p>
              <p className="text-[13px] text-wine-700/40 uppercase tracking-tight">Vogue Member</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              clearSession();
              navigate('/login');
            }}
            className="w-full py-3 text-[13px] uppercase tracking-[0.3em] text-red-500 hover:bg-red-50 transition-colors rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <X className="w-3 h-3" /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-[240px] pt-16 px-8 md:px-12 pb-20 overflow-y-auto">
        {activeSidebar === 'Moodboard' ? (
          <div className="max-w-[1600px] mx-auto">
            <MoodboardStudio items={items} />
          </div>
        ) : (
        <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* CENTER COLUMN: THE CLOSET */}
          <div className="lg:col-span-9 space-y-10">
            <div className="flex items-center justify-between border-b border-wine-700/5 pb-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-serif text-wine-900 italic tracking-wide">My Closet</h2>
                <p className="text-sm uppercase tracking-[0.4em] text-wine-700/30 font-bold">{activeSidebar === 'Favourites' ? 'Curated Favourites' : 'The Archive Collection'}</p>
              </div>
              
              <div className="flex items-center gap-6">
                <button onClick={() => setIsUploadOpen(true)} className="flex items-center gap-3 bg-wine-900 text-white px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-all text-sm uppercase tracking-widest font-bold">
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-12 overflow-x-auto scrollbar-hide border-b border-wine-700/5">
              {['All', ...CATEGORIES, 'Outfits'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`pb-4 text-[13px] uppercase tracking-widestest flex items-center gap-2 transition-all relative ${
                    activeCategory === cat ? 'text-wine-900 font-bold' : 'text-wine-900/40 hover:text-wine-900'
                  }`}
                >
                  {cat}
                  {activeCategory === cat && (
                    <motion.div layoutId="activeCat" className="absolute bottom-0 left-0 right-0 h-0.5 bg-wine-900" />
                  )}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-10">
              <AnimatePresence mode="popLayout">
                {activeCategory === 'Outfits' ? (
                  outfits.length > 0 ? outfits.map((outfit) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={outfit._id}
                      className="group relative cursor-pointer"
                      onClick={() => { setSelectedOutfit(outfit); setIsOutfitModalOpen(true); }}
                    >
                      <div className="aspect-[3/4] w-full bg-white rounded-[2.5rem] overflow-hidden border border-wine-700/5 shadow-sm transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 relative group">
                        <OutfitPreview
                          outfit={outfit}
                          className="w-full h-full transition-transform duration-[2s] group-hover:scale-110"
                          imageClassName="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-wine-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                           <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center justify-between">
                              <span className="text-[13px] uppercase tracking-widestest font-bold text-wine-900">View Lookbook</span>
                              <ChevronRight className="w-4 h-4 text-wine-700" strokeWidth={1} />
                           </div>
                        </div>
                      </div>
                      <div className="mt-6 space-y-1 px-2">
                        <p className="text-sm uppercase tracking-[0.3em] text-wine-900 font-bold leading-tight">{outfit.name}</p>
                        <p className="text-[13px] uppercase tracking-widest text-wine-700/30">Archives • {new Date(outfit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full py-32 text-center space-y-6">
                      <p className="text-xl font-serif italic text-wine-700/40">No outfits saved in the archive</p>
                      <button onClick={() => navigate('/dressing-room')} className="luxury-button-solid text-[13px] py-4 px-10">Create a Look</button>
                    </div>
                  )
                ) : displayedItems.length > 0 ? displayedItems.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item._id}
                    className="group relative cursor-pointer"
                    onClick={() => { setSelectedItem(item); setIsDetailOpen(true); }}
                  >
                    <div className="aspect-[3/4] w-full bg-[#fafafa] rounded-[2.5rem] p-6 flex items-center justify-center overflow-hidden border border-wine-700/5 shadow-sm transition-all duration-700 group-hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] group-hover:-translate-y-2">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000" 
                      />
                      <div className="absolute top-6 right-6 z-10">
                         <button 
                          onClick={(e) => toggleFavourite(e, item._id)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${item.favourite ? 'bg-wine-700 text-white scale-110' : 'bg-white/80 backdrop-blur-md text-wine-700 opacity-0 group-hover:opacity-100 hover:scale-110'}`}
                         >
                           <Star className="w-4 h-4" fill={item.favourite ? "currentColor" : "none"} />
                         </button>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <p className="text-sm uppercase tracking-[0.3em] text-wine-900 font-bold opacity-80">{item.name}</p>
                    </div>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-32 text-center space-y-6">
                    <p className="text-xl font-serif italic text-wine-700/40">No items yet — start building your closet</p>
                    <button onClick={() => setIsUploadOpen(true)} className="luxury-button-solid text-[13px] py-4 px-10">Add Your First Piece</button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT COLUMN: FASHION GOALS */}
          <div className="lg:col-span-3 space-y-12">
             <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-wine-700/10 pb-4">
                <h3 className="text-sm uppercase tracking-[0.5em] text-wine-900 font-bold">Fashion Goals</h3>
                <button 
                  onClick={() => isEditingGoals ? saveGoals() : setIsEditingGoals(true)}
                  className="p-2 hover:bg-cream-500/20 rounded-full transition-colors"
                >
                  {isEditingGoals ? <Save className="w-4 h-4 text-green-600" /> : <Edit3 className="w-4 h-4 text-wine-700/40" />}
                </button>
              </div>
              <div className="relative min-h-[120px]">
                {isEditingGoals ? (
                  <textarea 
                    autoFocus
                    value={fashionGoals.text}
                    onChange={(e) => setFashionGoals(prev => ({...prev, text: e.target.value}))}
                    className="w-full bg-cream-500/5 border border-wine-700/10 rounded-2xl p-4 text-sm font-light italic text-wine-700/80 outline-none focus:border-wine-700/30 transition-all h-40 resize-none"
                  />
                ) : (
                  <p className="text-sm font-light text-wine-700/80 leading-relaxed italic border-l-2 border-wine-700/5 pl-6 py-2">
                    "{fashionGoals.text}"
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm uppercase tracking-[0.5em] text-wine-700/30 font-bold">Inspiration</h3>
              <div className="relative aspect-[3/5] w-full rounded-[3rem] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => inspoInputRef.current.click()}>
                <img src={fashionGoals.image} alt="Inspiration" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-[1500ms]" />
                <div className="absolute inset-0 bg-wine-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                   <Upload className="w-8 h-8 text-white mb-2" />
                   <span className="text-[13px] uppercase tracking-widest font-bold text-white">Update Inspo</span>
                </div>
                <input type="file" ref={inspoInputRef} className="hidden" accept="image/*" onChange={handleInspoUpload} />
              </div>
            </div>
          </div>
        </div>
        )}
      </main>

      {/* ADD ITEM MODAL */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUploadOpen(false)} className="absolute inset-0 bg-wine-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="relative bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide">
              <button onClick={() => setIsUploadOpen(false)} className="absolute top-10 right-10 p-2 hover:bg-cream-500 rounded-full transition-all"><X className="w-6 h-6" /></button>
              
              <div className="text-center mb-10 space-y-2">
                <p className="text-[13px] uppercase tracking-[0.5em] text-wine-700/40 font-bold">New Addition</p>
                <h3 className="text-4xl font-serif italic text-wine-900">Digitize Piece</h3>
              </div>

              <div className="space-y-10">
                <div className="flex gap-6">
                  <div className="w-48 h-60 bg-cream-500/5 border-2 border-wine-700/5 border-dashed rounded-[2rem] flex items-center justify-center overflow-hidden shrink-0 group relative">
                    {form.image ? (
                      <img src={form.image} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-wine-700/10" />
                    )}
                    <button onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-wine-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  </div>
                  <div className="flex-1 space-y-6">
                    <button onClick={() => fileInputRef.current.click()} className="w-full py-5 rounded-2xl bg-cream-500/10 border border-wine-700/10 text-sm uppercase tracking-widest font-bold text-wine-700 hover:bg-cream-500/20 transition-all flex items-center justify-center gap-3">
                      <Upload className="w-4 h-4" /> Upload from Device
                    </button>
                    <button className="w-full py-5 rounded-2xl bg-cream-500/10 border border-wine-700/10 text-sm uppercase tracking-widest font-bold text-wine-700 hover:bg-cream-500/20 transition-all flex items-center justify-center gap-3">
                      <Camera className="w-4 h-4" /> Take Photo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[13px] uppercase tracking-widest text-wine-700/40 font-bold ml-2">Category</label>
                    <select value={form.category} onChange={(e) => setForm(prev => ({...prev, category: e.target.value}))} className="w-full bg-cream-500/5 border border-wine-700/10 rounded-2xl py-5 px-6 text-sm uppercase tracking-widest outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[13px] uppercase tracking-widest text-wine-700/40 font-bold ml-2">Item Name</label>
                    <input type="text" placeholder="e.g. Silk Blazer" value={form.name} onChange={(e) => setForm(prev => ({...prev, name: e.target.value}))} className="w-full bg-cream-500/5 border border-wine-700/10 rounded-2xl py-5 px-6 text-sm outline-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[13px] uppercase tracking-widest text-wine-700/40 font-bold ml-2">Notes (Optional)</label>
                  <textarea placeholder="Describe the fit..." value={form.notes} onChange={(e) => setForm(prev => ({...prev, notes: e.target.value}))} className="w-full bg-cream-500/5 border border-wine-700/10 rounded-3xl p-6 text-sm outline-none h-32 resize-none" />
                </div>

                <div className="space-y-3">
                  <label className="text-[13px] uppercase tracking-widest text-wine-700/40 font-bold ml-2">Tags (Optional)</label>
                  <input type="text" placeholder="casual, winter..." value={form.tags} onChange={(e) => setForm(prev => ({...prev, tags: e.target.value}))} className="w-full bg-cream-500/5 border border-wine-700/10 rounded-2xl py-5 px-6 text-sm outline-none" />
                </div>

                <button 
                  onClick={handleSaveItem}
                  disabled={isSaving}
                  className={`w-full luxury-button-solid py-6 text-sm tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Digitizing...
                    </>
                  ) : 'Save to Archive'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ITEM DETAIL MODAL */}
      <AnimatePresence>
        {isDetailOpen && selectedItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsDetailOpen(false); setIsEditingDetail(false); }} className="absolute inset-0 bg-wine-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-4xl rounded-[4rem] flex overflow-hidden shadow-2xl max-h-[90vh]">
              <div className="w-1/2 bg-[#fafafa] flex items-center justify-center p-12 border-r border-wine-700/5">
                <img src={selectedItem.image} className="w-full h-full object-contain" />
              </div>
              <div className="w-1/2 p-16 space-y-12 relative overflow-y-auto scrollbar-hide">
                <button onClick={() => { setIsDetailOpen(false); setIsEditingDetail(false); }} className="absolute top-10 right-10 p-2 hover:bg-cream-500 rounded-full transition-all"><X className="w-6 h-6" /></button>
                
                <div className="space-y-4">
                  {isEditingDetail ? (
                    <div className="space-y-4">
                      <select 
                        value={selectedItem.category} 
                        onChange={(e) => setSelectedItem({...selectedItem, category: e.target.value})}
                        className="text-sm uppercase tracking-[0.5em] text-wine-700/60 font-bold bg-cream-500/10 rounded-lg px-2 py-1 outline-none"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input 
                        type="text" 
                        value={selectedItem.name} 
                        onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                        className="text-4xl font-serif italic text-wine-900 bg-cream-500/10 rounded-xl px-4 py-2 w-full outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm uppercase tracking-[0.5em] text-wine-700/40 font-bold">{selectedItem.category}</p>
                      <h3 className="text-5xl font-serif italic text-wine-900">{selectedItem.name}</h3>
                    </>
                  )}
                </div>

                <div className="space-y-8 flex-1">
                  <div className="space-y-3">
                    <p className="text-[13px] uppercase tracking-widest text-wine-700/40 font-bold flex items-center gap-2"><Info className="w-3 h-3" /> Notes</p>
                    {isEditingDetail ? (
                      <textarea 
                        value={selectedItem.notes} 
                        onChange={(e) => setSelectedItem({...selectedItem, notes: e.target.value})}
                        className="w-full bg-cream-500/5 border border-wine-700/10 rounded-2xl p-4 text-sm font-light text-wine-700 outline-none h-24 resize-none"
                      />
                    ) : (
                      <p className="text-sm font-light text-wine-700 italic">"{selectedItem.notes || 'No notes added.'}"</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[13px] uppercase tracking-widest text-wine-700/40 font-bold flex items-center gap-2"><Tag className="w-3 h-3" /> Tags</p>
                    {isEditingDetail ? (
                      <input 
                        type="text" 
                        value={selectedItem.tags} 
                        onChange={(e) => setSelectedItem({...selectedItem, tags: e.target.value})}
                        placeholder="casual, winter..."
                        className="w-full bg-cream-500/5 border border-wine-700/10 rounded-xl px-4 py-3 text-sm outline-none"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags ? selectedItem.tags.split(',').map(tag => (
                          <span key={tag} className="px-3 py-1 bg-cream-500/20 text-[13px] uppercase tracking-widest text-wine-700 rounded-full">{tag.trim()}</span>
                        )) : <span className="text-[13px] uppercase tracking-widest text-wine-700/30 italic">No tags</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-12 border-t border-wine-700/5 flex gap-4">
                  {isEditingDetail ? (
                    <button onClick={handleUpdateItem} className="flex-1 luxury-button-solid py-4 text-sm tracking-widest flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  ) : (
                    <>
                      <button onClick={(e) => toggleFavourite(null, selectedItem._id)} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest font-bold transition-all ${selectedItem.favourite ? 'bg-wine-700 text-white' : 'border border-wine-700/10 text-wine-700 hover:bg-wine-700/5'}`}>
                        <Star className="w-4 h-4" fill={selectedItem.favourite ? "currentColor" : "none"} /> {selectedItem.favourite ? 'Favourited' : 'Favourite'}
                      </button>
                      <button onClick={() => setIsEditingDetail(true)} className="w-14 h-14 rounded-2xl border border-wine-700/10 text-wine-700 flex items-center justify-center hover:bg-wine-700/5 transition-all">
                        <Edit3 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button onClick={() => deleteItem(selectedItem._id)} className="w-14 h-14 rounded-2xl border border-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <OutfitModal 
        isOpen={isOutfitModalOpen}
        onClose={() => setIsOutfitModalOpen(false)}
        outfit={selectedOutfit}
        onDelete={deleteOutfit}
        onEdit={handleEditOutfit}
        onSchedule={handleScheduleOutfit}
        onPost={handlePostOutfit}
      />
    </div>
  );
}
