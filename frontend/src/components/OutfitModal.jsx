import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Edit3, Trash2, Scissors, Check, Share2, MessageSquare, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import OutfitPreview from './OutfitPreview';

export default function OutfitModal({ outfit, isOpen, onClose, onDelete, onEdit, onSchedule, onPost }) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleEvent, setScheduleEvent] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [caption, setCaption] = useState('');

  // Sync tempName with outfit when it changes
  useEffect(() => {
    if (outfit?.name) {
      setTempName(outfit.name);
    }
    if (outfit?.caption) {
      setCaption(outfit.caption);
    }
  }, [outfit]);

  if (!outfit) return null;

  const handleSchedule = () => {
    if (!scheduleDate) return;
    onSchedule(outfit._id, scheduleDate, scheduleEvent);
    setIsScheduling(false);
    setScheduleDate('');
    setScheduleEvent('');
  };

  const handlePost = () => {
    if (onPost) {
      onPost(outfit._id, caption);
      setIsPosting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-12 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-wine-900/60 backdrop-blur-xl" 
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 40 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 40 }} 
            className="relative bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/20"
          >
            {/* Left: Large Preview */}
            <div className="md:w-3/5 bg-[#f0ede8] flex items-center justify-center p-8 md:p-12 relative overflow-hidden group border-r border-wine-700/5">
               <OutfitPreview outfit={outfit} className="w-full h-full relative z-10" imageClassName="w-full h-full object-contain" />
               <button onClick={onClose} className="absolute top-8 left-8 p-3 bg-white/80 backdrop-blur-md rounded-full text-wine-900 shadow-sm hover:scale-110 transition-all z-20">
                 <X className="w-6 h-6" />
               </button>
            </div>

            {/* Right: Details */}
            <div className="md:w-2/5 p-8 md:p-12 flex flex-col bg-white overflow-y-auto scrollbar-hide border-l border-wine-700/5">
              <div className="flex-1 space-y-10">
                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.5em] text-wine-700/40 font-bold">Look Details</p>
                  <div className="flex items-center justify-between group">
                    {isEditingName ? (
                      <input 
                        autoFocus
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => { setIsEditingName(false); onEdit(outfit._id, { name: tempName }); }}
                        className="text-3xl font-serif italic text-wine-900 bg-cream-500/10 rounded-xl px-2 w-full outline-none"
                      />
                    ) : (
                      <h2 className="text-4xl font-serif italic text-wine-900 leading-tight">{outfit.name}</h2>
                    )}
                    <button onClick={() => setIsEditingName(!isEditingName)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-cream-500/20 rounded-full transition-all">
                      <Edit3 className="w-4 h-4 text-wine-700/30" />
                    </button>
                  </div>
                  <p className="text-sm uppercase tracking-widest text-wine-700/30 font-bold">Created {new Date(outfit.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Items List */}
                <div className="space-y-6">
                  <h3 className="text-sm uppercase tracking-[0.5em] text-wine-900 font-bold border-b border-wine-700/5 pb-4">Components</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {outfit.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 group/item">
                        <div className="w-14 h-18 bg-cream-500/10 rounded-2xl flex items-center justify-center p-2 border border-wine-700/5">
                           <img src={item.wardrobeId?.image || 'https://via.placeholder.com/150'} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="text-sm uppercase tracking-widest font-bold text-wine-900">{item.wardrobeId?.name || 'Deleted Item'}</p>
                          <p className="text-[13px] uppercase tracking-widest text-wine-700/40">{item.wardrobeId?.category || 'Unknown'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Posting Section */}
                <div className="space-y-6 pt-6 border-t border-wine-700/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm uppercase tracking-[0.5em] text-wine-900 font-bold">Style Story</h3>
                    {outfit.isPosted && (
                      <span className="flex items-center gap-2 text-[13px] text-green-600 font-bold uppercase tracking-widest">
                        <Check className="w-3 h-3" /> Live on Feed
                      </span>
                    )}
                  </div>
                  
                  {isPosting ? (
                    <div className="space-y-4 bg-[#f0ede8]/30 p-6 rounded-[2rem] border border-wine-700/5">
                      <textarea 
                        autoFocus
                        placeholder="Share the inspiration behind this look..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full bg-transparent border-none text-sm font-light italic text-wine-900 outline-none h-24 resize-none placeholder:text-wine-700/20"
                      />
                      <div className="flex gap-4">
                        <button 
                          onClick={handlePost} 
                          className="flex-1 bg-wine-900 text-white py-4 rounded-2xl hover:scale-[1.02] transition-all text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Send className="w-4 h-4" /> Post Look
                        </button>
                        <button 
                          onClick={() => setIsPosting(false)} 
                          className="px-6 py-4 rounded-2xl border border-wine-700/10 text-wine-700/40 hover:bg-wine-700/5 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsPosting(true)} 
                      className={`w-full py-5 rounded-3xl border shadow-sm ${outfit.isPosted ? 'bg-wine-700 text-white border-wine-700 shadow-wine-900/20' : 'border-wine-700/10 text-wine-700/60 hover:bg-[#f0ede8]/50'} flex items-center justify-center gap-4 transition-all text-sm uppercase tracking-widest font-bold`}
                    >
                      <Share2 className="w-4 h-4" /> {outfit.isPosted ? 'Edit Post Caption' : 'Post to Profile'}
                    </button>
                  )}
                  {outfit.isPosted && !isPosting && outfit.caption && (
                    <div className="p-4 bg-cream-500/5 rounded-2xl border border-wine-700/5">
                      <p className="text-sm uppercase tracking-widest text-wine-700/40 font-bold mb-2 flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Current Caption</p>
                      <p className="text-sm font-light italic text-wine-900/70">"{outfit.caption}"</p>
                    </div>
                  )}
                </div>

                {/* Schedule Box */}
                <div className="space-y-6">
                   <h3 className="text-sm uppercase tracking-[0.5em] text-wine-900 font-bold border-b border-wine-700/5 pb-4">Plan Your Day</h3>
                   {isScheduling ? (
                     <div className="space-y-4">
                        <div className="flex gap-4">
                           <input 
                             type="date" 
                             value={scheduleDate}
                             onChange={(e) => setScheduleDate(e.target.value)}
                             className="flex-1 bg-cream-500/10 border border-wine-700/5 rounded-2xl px-6 py-4 text-sm font-bold uppercase tracking-widest outline-none"
                           />
                           <button onClick={handleSchedule} className="bg-wine-900 text-white p-4 rounded-2xl hover:scale-105 transition-all">
                             <Check className="w-5 h-5" />
                           </button>
                           <button onClick={() => setIsScheduling(false)} className="p-4 rounded-2xl border border-wine-700/10 text-wine-700/40">
                             <X className="w-5 h-5" />
                           </button>
                        </div>
                        <input 
                           type="text"
                           placeholder="EVENT NAME (E.G. GALA, BRUNCH...)"
                           value={scheduleEvent}
                           onChange={(e) => setScheduleEvent(e.target.value)}
                           className="w-full bg-cream-500/10 border border-wine-700/5 rounded-2xl px-6 py-4 text-sm font-light italic text-wine-900 outline-none"
                        />
                     </div>
                   ) : (
                     <button onClick={() => setIsScheduling(true)} className="w-full py-5 rounded-3xl border border-wine-700/10 text-wine-700/60 flex items-center justify-center gap-4 hover:bg-cream-500/10 transition-all text-sm uppercase tracking-widest font-bold">
                       <Calendar className="w-4 h-4" /> Schedule This Look
                     </button>
                   )}
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-wine-700/5 flex gap-4">
                 <button 
                  onClick={() => onEdit(outfit._id, { mode: 'studio' })}
                  className="flex-1 bg-wine-900 text-white py-5 rounded-3xl flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em] font-bold shadow-xl hover:scale-[1.02] transition-all"
                 >
                   <Scissors className="w-4 h-4" /> Edit in Studio
                 </button>
                 <button 
                  onClick={() => onDelete(outfit._id)}
                  className="w-16 h-16 rounded-3xl border border-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-50 transition-all"
                 >
                   <Trash2 className="w-5 h-5" />
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
