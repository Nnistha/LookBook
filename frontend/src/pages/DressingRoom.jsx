import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, Plus, Trash2, Maximize2, RotateCcw, Image as ImageIcon,
  LayoutGrid, X, ChevronRight, ChevronLeft, Edit3
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { useNavigate } from 'react-router-dom';
import OutfitModal from '../components/OutfitModal';
import OutfitPreview from '../components/OutfitPreview';
import { getAuthToken } from '../utils/auth';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];
const SNAPSHOT_BACKGROUND = '#f0ede8';

export default function DressingRoom() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const exportRef = useRef(null);
  const inspoInputRef = useRef(null);
  
  const [wardrobe, setWardrobe] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [canvasItems, setCanvasItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedOutfits, setShowSavedOutfits] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [inspoImages, setInspoImages] = useState([]);
  const [editingOutfitId, setEditingOutfitId] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [isOutfitModalOpen, setIsOutfitModalOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 640 });

  const getAuthHeader = () => {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchData();
    const editOutfitData = localStorage.getItem('edit_outfit');
    if (editOutfitData) {
      const outfit = JSON.parse(editOutfitData);
      loadOutfitForEdit(outfit);
      localStorage.removeItem('edit_outfit');
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || typeof ResizeObserver === 'undefined') return undefined;

    const updateCanvasSize = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height))
      });
    };

    updateCanvasSize();

    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(canvasRef.current);
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [wardrobeRes, outfitsRes] = await Promise.all([
        fetch('https://lookbook-iwfd.onrender.com/api/wardrobe', { headers: getAuthHeader() }),
        fetch('https://lookbook-iwfd.onrender.com/api/outfits', { headers: getAuthHeader() })
      ]);
      if (wardrobeRes.ok) setWardrobe(await wardrobeRes.json());
      if (outfitsRes.ok) setOutfits(await outfitsRes.json());
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const addToCanvas = (item) => {
    const yOffset = canvasItems.length * 40;
    const xOffset = canvasItems.length * 20;
    const newItem = {
      ...item,
      canvasId: Date.now() + Math.random(),
      x: 150 + xOffset,
      y: 100 + yOffset,
      scale: 1,
      rotation: 0,
      zIndex: canvasItems.length + 1
    };
    setCanvasItems([...canvasItems, newItem]);
  };

  const removeFromCanvas = (canvasId) => {
    setCanvasItems(canvasItems.filter(item => item.canvasId !== canvasId));
  };

  const updateItemProperty = (canvasId, property, value) => {
    setCanvasItems(prev => prev.map(item => 
      item.canvasId === canvasId ? { ...item, [property]: value } : item
    ));
  };

  const bringToFront = (canvasId) => {
    const maxZ = Math.max(...canvasItems.map(i => i.zIndex), 0);
    setCanvasItems(prev => prev.map(item => 
      item.canvasId === canvasId ? { ...item, zIndex: maxZ + 1 } : item
    ));
  };

  const handleSaveOutfit = async () => {
    if (canvasItems.length === 0) return;
    setIsSaving(true);
    
    try {
      if (!exportRef.current) return;

      if (document.fonts?.ready) await document.fonts.ready;
      await Promise.all(
        Array.from(exportRef.current.querySelectorAll('img')).map((img) => (
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              })
        ))
      );
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const thumbnail = await toPng(exportRef.current, {
        backgroundColor: SNAPSHOT_BACKGROUND,
        quality: 1,
        pixelRatio: 2,
        cacheBust: true
      });
      
      const payload = {
        name: outfitName || `Look ${new Date().toLocaleDateString()}`,
        items: canvasItems.map(item => ({
          wardrobeId: item._id,
          x: item.x,
          y: item.y,
          scale: item.scale,
          rotation: item.rotation,
          zIndex: item.zIndex
        })),
        thumbnail
      };

      const url = editingOutfitId 
        ? `https://lookbook-iwfd.onrender.com/api/outfits/${editingOutfitId}`
        : 'https://lookbook-iwfd.onrender.com/api/outfits';
      
      const method = editingOutfitId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchData();
        setCanvasItems([]);
        setOutfitName('');
        setEditingOutfitId(null);
        alert(editingOutfitId ? 'Look Updated in Archive' : 'Look Saved to Archive');
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Snapshot failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadOutfitForEdit = (outfit) => {
    setEditingOutfitId(outfit._id);
    setOutfitName(outfit.name);
    const items = outfit.items.map(i => ({
      ...i.wardrobeId,
      x: i.x,
      y: i.y,
      scale: i.scale,
      rotation: i.rotation || 0,
      zIndex: i.zIndex,
      canvasId: Date.now() + Math.random()
    }));
    setCanvasItems(items);
    setShowSavedOutfits(false);
  };

  const deleteOutfit = async (id) => {
    if (!confirm('Permanently remove this look?')) return;
    try {
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/outfits/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        setOutfits(prev => prev.filter(o => o._id !== id));
        if (selectedOutfit?._id === id) setIsOutfitModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditOutfit = async (id, updates) => {
    if (updates.mode === 'studio') {
      const outfit = outfits.find(o => o._id === id);
      loadOutfitForEdit(outfit);
      setIsOutfitModalOpen(false);
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
        setSelectedOutfit(updated);
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
      const res = await fetch(`hhttps://lookbook-iwfd.onrender.com/api/outfits/${outfitId}/post`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ caption, isPosted: true })
      });
      if (res.ok) {
        const updated = await res.json();
        setOutfits(prev => prev.map(o => o._id === outfitId ? updated : o));
        setSelectedOutfit(updated);
        alert('Outfit shared to your style feed!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInspoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInspoImages([...inspoImages, { id: Date.now(), image: reader.result }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredWardrobe = activeCategory === 'All' 
    ? wardrobe 
    : wardrobe.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#fdfaf6] text-wine-900 font-sans flex overflow-hidden selection:bg-wine-700 selection:text-white">
      <div
        ref={exportRef}
        aria-hidden="true"
        className="fixed pointer-events-none overflow-hidden"
        style={{
          top: '0',
          left: '-200vw',
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          zIndex: -1,
          background: SNAPSHOT_BACKGROUND,
          opacity: 1,
          isolation: 'isolate'
        }}
      >
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {canvasItems.map((item) => (
          <div
            key={`export-${item.canvasId}`}
            style={{
              position: 'absolute',
              left: `${item.x}px`,
              top: `${item.y}px`,
              zIndex: item.zIndex,
              transform: `translate(0, 0)`
            }}
          >
            <div
              style={{
                padding: '24px',
                transform: `scale(${item.scale}) rotate(${item.rotation}deg)`,
                transformOrigin: 'top left'
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{
                  width: '288px',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.15))'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* LEFT PANEL: INSPIRATION & RECENT */}
      <aside className="w-[300px] h-[calc(100vh-6rem)] border-r border-wine-700/5 flex flex-col pt-12 pb-8 px-6 overflow-y-auto scrollbar-hide bg-white/40 backdrop-blur-xl z-30">
        <div className="space-y-12">
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm uppercase tracking-[0.5em] text-wine-900 font-bold">Studio Mood</h3>
              <button onClick={() => inspoInputRef.current?.click()} className="p-2 hover:bg-wine-700/5 rounded-full transition-all flex items-center gap-2 group">
                <span className="text-[13px] uppercase tracking-widest text-wine-700/0 group-hover:text-wine-700/40 transition-all">Add Piece</span>
                <Edit3 className="w-4 h-4 text-wine-700/40" />
              </button>
              <input type="file" ref={inspoInputRef} className="hidden" accept="image/*" onChange={handleInspoUpload} />
            </div>
            <div className="space-y-6">
              {inspoImages.map(inspo => (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={inspo.id} 
                    className="group relative aspect-square w-full rounded-[2.5rem] overflow-hidden shadow-sm border border-wine-700/5"
                >
                  <img src={inspo.image} alt="Inspo" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                  <button onClick={() => setInspoImages(prev => prev.filter(i => i.id !== inspo.id))} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
              {inspoImages.length === 0 && (
                <div className="aspect-square w-full rounded-[2.5rem] border border-dashed border-wine-700/10 flex flex-col items-center justify-center p-8 text-center gap-3">
                   <ImageIcon className="w-6 h-6 text-wine-700/10" />
                   <p className="text-[13px] uppercase tracking-widest text-wine-700/30">Add inspiration pieces</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
             <div className="flex items-center justify-between">
               <h3 className="text-sm uppercase tracking-[0.5em] text-wine-900 font-bold">Archive</h3>
               <button onClick={() => setShowSavedOutfits(true)} className="text-[13px] uppercase tracking-widest text-wine-700/40 hover:text-wine-900 transition-colors">View All</button>
             </div>
             <div className="grid grid-cols-2 gap-4">
               {outfits.slice(0, 4).map(outfit => (
                 <motion.div 
                  layoutId={outfit._id}
                  key={outfit._id} 
                  onClick={() => { setSelectedOutfit(outfit); setIsOutfitModalOpen(true); }}
                  className="group/card aspect-[3/4] rounded-[1.5rem] overflow-hidden border border-wine-700/5 hover:translate-y-[-4px] transition-all cursor-pointer bg-white relative shadow-sm"
                 >
                   <OutfitPreview outfit={outfit} className="w-full h-full" imageClassName="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-wine-900/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <Maximize2 className="w-5 h-5 text-white" strokeWidth={1.5} />
                   </div>
                 </motion.div>
               ))}
             </div>
          </section>
        </div>
      </aside>

      {/* CENTER PANEL: THE STUDIO CANVAS */}
      <main className="flex-1 flex flex-col relative bg-[#f7f5f2] z-10 overflow-hidden">
        <header className="h-24 flex items-center justify-between px-12 z-40 bg-white/30 backdrop-blur-xl border-b border-wine-700/5">
          <div className="space-y-1">
            <p className="text-[13px] uppercase tracking-[0.5em] text-wine-700/40 font-bold flex items-center gap-2">
               Creation Name <Edit3 className="w-2.5 h-2.5" />
            </p>
            <input 
               type="text" 
               placeholder="NAME YOUR CREATION..." 
               value={outfitName}
               onChange={(e) => setOutfitName(e.target.value)}
               className="bg-transparent border-none p-0 text-lg font-serif italic text-wine-900 outline-none placeholder:text-wine-700/20 w-64"
             />
          </div>
          <div className="flex items-center gap-6">
             <button onClick={() => setCanvasItems([])} className="p-3 hover:bg-wine-700/5 rounded-full transition-all text-wine-700/30 group" title="Clear Canvas">
               <RotateCcw className="w-5 h-5 group-hover:rotate-[-90deg] transition-transform duration-500" />
             </button>
             <button 
              onClick={handleSaveOutfit} 
              disabled={isSaving || canvasItems.length === 0}
              className="bg-wine-900 text-white px-10 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-[0.2em] font-bold disabled:opacity-20 disabled:grayscale"
             >
               {isSaving ? 'Digitizing Look...' : 'Save Creation'}
             </button>
          </div>
        </header>

        <div className="flex-1 relative cursor-crosshair overflow-hidden m-8 rounded-[3rem] border border-wine-900/5 bg-[#f0ede8] shadow-inner" ref={canvasRef}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          
          <AnimatePresence>
            {canvasItems.map((item) => (
              <motion.div
                key={item.canvasId}
                drag
                dragMomentum={false}
                onDragEnd={(e, info) => {
                  updateItemProperty(item.canvasId, 'x', item.x + info.offset.x);
                  updateItemProperty(item.canvasId, 'y', item.y + info.offset.y);
                }}
                onMouseDown={() => bringToFront(item.canvasId)}
                style={{ 
                  zIndex: item.zIndex, 
                  position: 'absolute', 
                  left: 0, 
                  top: 0,
                  x: item.x,
                  y: item.y
                }}
                className="cursor-grab active:cursor-grabbing group/item touch-none"
              >
                <motion.div
                  animate={{ scale: item.scale, rotate: item.rotation }}
                  className="relative p-6"
                >
                  <img src={item.image} alt={item.name} className="w-72 h-auto pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]" />
                  
                  {/* Controls Overlay - Hidden in snapshot */}
                  <div className="controls-overlay absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-full border border-wine-700/10 px-4 py-2 flex items-center gap-4 shadow-xl opacity-0 group-hover/item:opacity-100 transition-all z-50">
                    <button onClick={(e) => { e.stopPropagation(); updateItemProperty(item.canvasId, 'scale', Math.max(0.2, item.scale - 0.1)) }} className="p-1 hover:text-wine-900 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-[13px] font-bold text-wine-700/40 w-8 text-center">{Math.round(item.scale * 100)}%</span>
                    <button onClick={(e) => { e.stopPropagation(); updateItemProperty(item.canvasId, 'scale', Math.min(2, item.scale + 0.1)) }} className="p-1 hover:text-wine-900 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    <div className="w-[1px] h-3 bg-wine-700/10 mx-1" />
                    <button onClick={(e) => { e.stopPropagation(); removeFromCanvas(item.canvasId) }} className="p-1 text-red-500 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {canvasItems.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-24 h-24 rounded-full bg-wine-700/5 flex items-center justify-center animate-pulse">
                    <Scissors className="w-8 h-8 text-wine-700/20" strokeWidth={1} />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-serif italic text-wine-900/30">Your Masterpiece Awaits</h3>
                    <p className="text-sm uppercase tracking-widest text-wine-700/20 font-bold max-w-xs leading-relaxed">Select pieces from your archive to begin curating your next iconic look.</p>
                </div>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT PANEL: CLOSET INVENTORY */}
      <aside className="w-[380px] h-[calc(100vh-6rem)] bg-white border-l border-wine-700/5 flex flex-col pt-12 z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
        <div className="px-8 flex-1 flex flex-col min-h-0">
             <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <h3 className="text-sm uppercase tracking-[0.5em] text-wine-900 font-bold">The Archive</h3>
                    <p className="text-[13px] uppercase tracking-widest text-wine-700/40 font-bold">{wardrobe.length} Pieces Available</p>
                </div>
                <button onClick={() => setShowSavedOutfits(true)} className="p-3 hover:bg-wine-700/5 rounded-full transition-all text-wine-700/30">
                  <LayoutGrid className="w-5 h-5" />
                </button>
             </div>

             <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pb-4 border-b border-wine-700/5 mb-8">
               {CATEGORIES.map(cat => (
                 <button 
                    key={cat} 
                    onClick={() => setActiveCategory(cat)} 
                    className={`text-[9px] uppercase tracking-[0.2em] whitespace-nowrap transition-all relative pb-2 ${
                        activeCategory === cat ? 'text-wine-900 font-bold' : 'text-wine-700/30 hover:text-wine-900'
                    }`}
                 >
                    {cat}
                    {activeCategory === cat && <motion.div layoutId="catTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-wine-900" />}
                 </button>
               ))}
             </div>

             <div className="flex-1 overflow-y-auto scrollbar-hide pb-12">
                <div className="grid grid-cols-2 gap-6">
                   <AnimatePresence mode="popLayout">
                    {filteredWardrobe.map(item => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={item._id} 
                        onClick={() => addToCanvas(item)}
                        className="group aspect-[3/4] bg-[#fafafa] rounded-[2rem] p-6 flex items-center justify-center border border-wine-700/5 cursor-pointer hover:shadow-2xl transition-all relative overflow-hidden"
                        whileHover={{ y: -6 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-[1.5s]" />
                        <div className="absolute inset-0 bg-wine-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                            <Plus className="w-3 h-3 text-wine-900" />
                        </div>
                      </motion.div>
                    ))}
                   </AnimatePresence>
                </div>
                {filteredWardrobe.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <ImageIcon className="w-6 h-6 mx-auto text-wine-700/10" />
                        <p className="text-[9px] uppercase tracking-widest text-wine-700/30 font-bold">No pieces in this category</p>
                    </div>
                )}
             </div>
        </div>
      </aside>

      {/* SAVED OUTFITS BROWSER */}
      <AnimatePresence>
        {showSavedOutfits && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-12 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSavedOutfits(false)} className="absolute inset-0 bg-wine-900/60 backdrop-blur-xl" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative bg-white w-full max-w-7xl h-full max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
            >
              <button onClick={() => setShowSavedOutfits(false)} className="absolute top-10 right-10 p-4 bg-wine-700/5 hover:bg-wine-700/10 rounded-full transition-all z-20"><X className="w-6 h-6 text-wine-900" /></button>
              
              <div className="p-12 md:p-20 flex-1 overflow-y-auto scrollbar-hide">
                 <div className="mb-16">
                    <p className="text-sm uppercase tracking-[0.6em] text-wine-700/40 font-bold mb-4">Archive Collection</p>
                    <h3 className="text-5xl font-serif text-wine-900 italic tracking-tight">Your Curated Looks</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                    {outfits.map(outfit => (
                      <motion.div 
                        key={outfit._id} 
                        layout
                        className="group space-y-6"
                      >
                         <div 
                          onClick={() => { setSelectedOutfit(outfit); setIsOutfitModalOpen(true); }}
                          className="group/card aspect-[3/4] rounded-[2.5rem] bg-[#fdfaf6] border border-wine-700/5 overflow-hidden relative shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 cursor-pointer"
                         >
                            <OutfitPreview outfit={outfit} className="w-full h-full transition-transform duration-[2s] group-hover/card:scale-110" imageClassName="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-wine-900/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                               <div className="bg-white rounded-full px-8 py-3 text-sm uppercase tracking-[0.2em] font-bold text-wine-900 shadow-xl scale-90 group-hover/card:scale-100 transition-transform">Open Look Card</div>
                               <button 
                                onClick={(e) => { e.stopPropagation(); loadOutfitForEdit(outfit); }}
                                className="text-sm uppercase tracking-[0.3em] font-bold text-white hover:text-cream-500 transition-colors"
                               >
                                 Edit in Studio
                               </button>
                               <button 
                                onClick={(e) => { e.stopPropagation(); deleteOutfit(outfit._id); }}
                                className="text-sm uppercase tracking-[0.3em] font-bold text-red-100 hover:text-red-400 transition-colors"
                               >
                                 Delete Permanent
                               </button>
                            </div>
                         </div>
                         <div className="text-center space-y-1">
                            <p className="text-sm uppercase tracking-[0.3em] font-bold text-wine-900">{outfit.name}</p>
                            <p className="text-[13px] uppercase tracking-widest text-wine-700/30">Created {new Date(outfit.createdAt).toLocaleDateString()}</p>
                         </div>
                      </motion.div>
                    ))}
                 </div>

                 {outfits.length === 0 && (
                    <div className="py-40 text-center space-y-8">
                        <Scissors className="w-12 h-12 mx-auto text-wine-700/10" strokeWidth={0.5} />
                        <div className="space-y-2">
                            <p className="text-xl font-serif italic text-wine-700/40">No looks archived yet</p>
                            <button onClick={() => setShowSavedOutfits(false)} className="text-sm uppercase tracking-[0.4em] font-bold text-wine-900 underline underline-offset-8">Return to Studio</button>
                        </div>
                    </div>
                 )}
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
