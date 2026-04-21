import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OutfitModal from '../components/OutfitModal';
import OutfitPreview from '../components/OutfitPreview';
import { getAuthToken } from '../utils/auth';

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getBoardTitle(name = '') {
  if (!name.trim()) return ['Today', 'Look'];
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return [words[0], 'Look'];
  return [words.slice(0, -1).join(' '), words[words.length - 1]];
}

function buildDetailCards(outfit) {
  const placements = [
    { id: 'left-top', className: 'left-[-1rem] top-10 rotate-[-5deg]', arrow: 'to-right', crop: 'object-top' },
    { id: 'left-mid', className: 'left-[-2rem] top-[25rem] rotate-[3deg]', arrow: 'to-right', crop: 'object-center' },
    { id: 'right-top', className: 'right-[-1rem] top-12 rotate-[4deg]', arrow: 'to-left', crop: 'object-top' },
    { id: 'right-bottom', className: 'right-[-1.5rem] bottom-16 rotate-[-4deg]', arrow: 'to-left', crop: 'object-bottom' }
  ];

  return (outfit?.items || [])
    .filter((item) => item?.wardrobeId?.image)
    .slice(0, 4)
    .map((item, index) => ({
      id: `${item.wardrobeId?._id || index}-${index}`,
      name: item.wardrobeId?.name || `Detail ${index + 1}`,
      label: `Detail ${index + 1}`,
      category: item.wardrobeId?.category || 'Wardrobe piece',
      image: item.wardrobeId?.image,
      placement: placements[index] || placements[0]
    }));
}

function DoodleArrow({ direction }) {
  if (direction === 'to-left') {
    return (
      <svg viewBox="0 0 140 80" className="h-20 w-36 text-[#6c1b2a]">
        <path
          d="M8 18 C58 20, 82 40, 92 54 S117 67, 128 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M112 50 L128 60 L111 68"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 140 80" className="h-20 w-36 text-[#6c1b2a]">
      <path
        d="M132 16 C80 18, 56 40, 48 52 S23 66, 12 58"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M28 48 L12 58 L30 66"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DetailCard({ detail }) {
  const isLeft = detail.placement.arrow === 'to-right';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute hidden lg:block ${detail.placement.className}`}
    >
      <div className={`absolute top-1/2 ${isLeft ? 'left-[calc(100%+0.5rem)]' : 'right-[calc(100%+0.5rem)]'} -translate-y-1/2`}>
        <DoodleArrow direction={detail.placement.arrow} />
      </div>

      <div className="relative w-[220px] bg-[#fffaf7] p-4 shadow-[0_28px_60px_rgba(108,27,42,0.10)]">
        <div className="absolute left-1/2 top-2 h-8 w-20 -translate-x-1/2 rotate-[-6deg] bg-[#f2e7d3]/85 opacity-90" />
        <div className="rounded-[0.6rem] border-[5px] border-[#6c1b2a] bg-white p-3">
          <div className="aspect-[4/4.6] overflow-hidden bg-[#f5eee8]">
            <img src={detail.image} alt={detail.name} className={`h-full w-full ${detail.placement.crop} object-cover`} />
          </div>
        </div>
        <div className="px-1 pt-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-wine-700/45">{detail.label}</p>
          <p className="mt-1 font-serif text-xl italic text-wine-900">{detail.name}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [todayEntry, setTodayEntry] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [isOutfitModalOpen, setIsOutfitModalOpen] = useState(false);

  const getAuthHeader = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const todayKey = getTodayKey();
      const [savedRes, calendarRes] = await Promise.all([
        fetch('http://localhost:5001/api/outfits', { headers: getAuthHeader() }),
        fetch('http://localhost:5001/api/calendar', { headers: getAuthHeader() })
      ]);

      let saved = [];
      if (savedRes.ok) {
        saved = await savedRes.json();
        setSavedOutfits(saved);
      }

      if (calendarRes.ok) {
        const entries = await calendarRes.json();
        const scheduledForToday = entries.find((entry) => entry.date === todayKey && entry.outfitId);
        setTodayEntry(scheduledForToday || null);
        return;
      }

      if (saved[0]) {
        setTodayEntry({ outfitId: saved[0], date: todayKey, event: 'Today’s selection' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeOutfit = todayEntry?.outfitId || savedOutfits[0] || null;
  const detailCards = useMemo(() => buildDetailCards(activeOutfit), [activeOutfit]);
  const [titleTop, titleBottom] = getBoardTitle(activeOutfit?.name || '');

  const deleteOutfit = async (id) => {
    if (!confirm('Permanently remove this look?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/outfits/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        const next = savedOutfits.filter((outfit) => outfit._id !== id);
        setSavedOutfits(next);
        if (activeOutfit?._id === id) {
          setTodayEntry(next[0] ? { outfitId: next[0], date: getTodayKey(), event: 'Today’s selection' } : null);
        }
        setIsOutfitModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditOutfit = async (id, updates) => {
    if (updates.mode === 'studio') {
      const outfit = savedOutfits.find((entry) => entry._id === id);
      if (!outfit) return;
      localStorage.setItem('edit_outfit', JSON.stringify(outfit));
      navigate('/dressing-room');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/outfits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setSavedOutfits((prev) => prev.map((outfit) => (outfit._id === id ? updated : outfit)));
        setSelectedOutfit(updated);
        if (activeOutfit?._id === id) {
          setTodayEntry((prev) => (prev ? { ...prev, outfitId: updated } : prev));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleScheduleOutfit = async (outfitId, date, event) => {
    try {
      const res = await fetch('http://localhost:5001/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ outfitId, date, event })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostOutfit = async () => {};

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6efe9] pb-16 text-wine-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-5rem] top-24 h-72 w-72 rounded-full bg-[#ead6da] blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-80 w-80 rounded-full bg-[#efe2da] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-10 md:px-8">
        {activeOutfit ? (
          <div className="rounded-[2.4rem] border border-[#d7c7c1] bg-[#ebe5df] p-4 shadow-[0_30px_90px_rgba(108,27,42,0.08)] md:p-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#fcfaf8] px-4 py-8 md:px-10 md:py-10">
              <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(rgba(108,27,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(108,27,42,0.02) 1px, transparent 1px)', backgroundSize: '120px 120px' }} />

              <div className="relative mx-auto max-w-6xl">
                <div className="mb-8 text-center">
                  <p className="text-[10px] uppercase tracking-[0.42em] text-wine-700/35">Today&apos;s selection</p>
                  <h1 className="mt-4 font-serif text-4xl leading-[0.9] text-[#6c1b2a] md:text-7xl">
                    {titleTop}
                    <span className="block italic">{titleBottom}</span>
                  </h1>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-wine-700/55">
                    <CalendarDays className="h-4 w-4" strokeWidth={1.6} />
                    <span>{todayEntry?.event || 'Scheduled from your calendar'}</span>
                  </div>
                </div>

                <div className="relative mx-auto min-h-[48rem] max-w-[860px]">
                  <div className="absolute left-4 top-2 hidden h-10 w-16 rotate-[-10deg] bg-[#f3ead8]/90 lg:block" />
                  <div className="absolute right-4 top-4 hidden h-10 w-16 rotate-[14deg] bg-[#f3ead8]/90 lg:block" />
                  <div className="absolute left-1/2 top-0 hidden h-14 w-6 -translate-x-1/2 rounded-full border-[3px] border-[#a6a1a1] bg-[#f5f2ee] lg:block" />
                  <div className="absolute left-1/2 top-2 hidden h-6 w-6 -translate-x-1/2 rounded-full border-[2px] border-[#a6a1a1] bg-transparent lg:block" />
                  <div className="absolute left-[12%] top-20 hidden text-4xl text-[#9f4d58] lg:block">★</div>
                  <div className="absolute right-[14%] top-44 hidden text-3xl text-[#b7bcc5] lg:block">✦</div>
                  <div className="absolute right-[18%] bottom-28 hidden text-4xl text-[#c7868b] lg:block">★</div>

                  {detailCards.map((detail) => (
                    <DetailCard key={detail.id} detail={detail} />
                  ))}

                  <motion.button
                    whileHover={{ y: -4 }}
                    onClick={() => {
                      setSelectedOutfit(activeOutfit);
                      setIsOutfitModalOpen(true);
                    }}
                    className="relative z-10 mx-auto block w-full max-w-[520px]"
                  >
                    <div className="rounded-[1.8rem] border-[6px] border-[#d7dce2] bg-white p-4 shadow-[0_30px_80px_rgba(108,27,42,0.08)] md:p-5">
                      <div className="relative aspect-[3/4.6] overflow-hidden bg-[#fdfbf9]">
                        <OutfitPreview
                          outfit={activeOutfit}
                          className="h-full w-full"
                          imageClassName="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                  </motion.button>

                  <div className="absolute right-[17%] top-[12rem] hidden text-left lg:block">
                    <p className="font-serif text-4xl italic text-[#6c1b2a]">Clarté</p>
                    <p className="mt-2 max-w-[210px] text-[13px] leading-relaxed text-wine-900/65">
                      A calendar-led outfit story in soft neutrals and burgundy detail, refreshed every day from your schedule.
                    </p>
                  </div>

                  <div className="absolute right-[18%] top-[18.5rem] hidden lg:block">
                    <p className="font-serif text-5xl italic text-[#6c1b2a]">Look 6</p>
                  </div>

                  <div className="absolute right-[8%] top-[25rem] hidden max-w-[220px] text-left lg:block">
                    <DoodleArrow direction="to-left" />
                    <p className="ml-10 -mt-4 font-sans text-[13px] leading-relaxed text-wine-900/75">
                      Styled from today&apos;s scheduled outfit with focus boxes zooming into the main elements.
                    </p>
                  </div>

                  <div className="mt-10 flex justify-center lg:hidden">
                    <div className="max-w-md text-center">
                      <p className="font-serif text-2xl italic text-[#6c1b2a]">Outfit receipt</p>
                      <p className="mt-2 text-sm leading-relaxed text-wine-700/65">
                        The scheduled look updates every day from your calendar, with highlighted wardrobe details around the main outfit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[3rem] border border-wine-700/10 bg-white/70 px-8 py-24 text-center shadow-[0_30px_90px_rgba(108,27,42,0.08)]">
            <p className="text-[11px] uppercase tracking-[0.4em] text-wine-700/35">Today&apos;s selection</p>
            <h1 className="mt-5 font-serif text-4xl italic text-wine-900 md:text-6xl">No outfit scheduled yet</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-wine-700/60 md:text-base">
              Schedule a look in the calendar and this page will automatically switch every day to show today&apos;s outfit in the center.
            </p>
            <button
              onClick={() => navigate('/calendar')}
              className="mt-8 rounded-full bg-wine-900 px-8 py-4 text-sm uppercase tracking-[0.24em] text-white shadow-lg"
            >
              Open calendar
            </button>
          </div>
        )}
      </div>

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
