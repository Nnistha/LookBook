import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import Header from '../components/Header';
import OutfitModal from '../components/OutfitModal';
import { getAuthToken } from '../utils/auth';

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildOutfitPieces(outfit) {
  return (outfit?.items || [])
    .filter((item) => item?.wardrobeId?.image)
    .slice()
    .sort((a, b) => (a.y || 0) - (b.y || 0))
    .slice(0, 3)
    .map((item, index) => ({
      id: `${item.wardrobeId?._id || index}-${index}`,
      name: item.wardrobeId?.name || `Piece ${index + 1}`,
      image: item.wardrobeId?.image
    }));
}

function buildHeroBoxes(pieces) {
  if (!pieces.length) {
    return { left: [], right: [] };
  }

  const top = pieces[0] || pieces[pieces.length - 1];
  const skirt = pieces[1] || top;
  const shoes = pieces[2] || pieces[pieces.length - 1];

  return {
    left: [
      { id: 'top', title: top.name, image: top.image, imagePosition: 'center 18%' },
      { id: 'skirt', title: skirt.name, image: skirt.image, imagePosition: 'center 55%' },
      { id: 'shoes', title: shoes.name, image: shoes.image, imagePosition: 'center 88%' }
    ],
    right: [
      { id: 'fabric', title: 'Fabric Detail', image: top.image, imagePosition: 'center 30%' },
      { id: 'style', title: 'Style Detail', image: skirt.image, imagePosition: 'center 66%' }
    ]
  };
}

function Tape({ className }) {
  return <div className={`absolute h-8 w-20 rounded-sm bg-[#efe4cf]/90 shadow-sm ${className}`} />;
}

function DetailBox({ card }) {
  if (!card) return null;

  return (
    <div className="w-full max-w-[220px] overflow-hidden rounded-[18px] bg-[#fffaf7] shadow-[0_18px_40px_rgba(88,28,28,0.12)]">
      <div className="overflow-hidden rounded-t-[18px] border-[7px] border-b-0 border-[#6c2530] bg-[#f8f2ed]">
        <div className="aspect-[1.08/0.92] overflow-hidden">
          <img
            src={card.image}
            alt={card.title}
            className="h-full w-full scale-[1.16] object-cover"
            style={{ objectPosition: card.imagePosition }}
          />
        </div>
      </div>
      <div className="bg-white px-4 py-4 text-center">
        <p className="font-serif text-xl leading-tight text-[#6c2530]">{card.title}</p>
      </div>
    </div>
  );
}

function ArrowLayer({ rightCount }) {
  return (
    <svg viewBox="0 0 1280 860" className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block">
      <defs>
        <marker id="lookbook-arrow" markerWidth="12" markerHeight="12" refX="8" refY="6" orient="auto">
          <path d="M1 1 L9 6 L1 11" fill="none" stroke="#7a2d38" strokeWidth="1.45" strokeLinecap="round" />
        </marker>
      </defs>

      <path
        d="M286 170 C385 176, 458 190, 540 218"
        fill="none"
        stroke="#7a2d38"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd="url(#lookbook-arrow)"
      />
      <path
        d="M286 420 C386 420, 458 418, 540 418"
        fill="none"
        stroke="#7a2d38"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd="url(#lookbook-arrow)"
      />
      <path
        d="M286 676 C386 670, 458 634, 540 606"
        fill="none"
        stroke="#7a2d38"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd="url(#lookbook-arrow)"
      />
      <path
        d="M992 292 C896 296, 820 282, 742 252"
        fill="none"
        stroke="#7a2d38"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd="url(#lookbook-arrow)"
      />
      {rightCount > 1 ? (
        <path
          d="M992 548 C896 548, 822 532, 742 502"
          fill="none"
          stroke="#7a2d38"
          strokeWidth="2"
          strokeLinecap="round"
          markerEnd="url(#lookbook-arrow)"
        />
      ) : null}
    </svg>
  );
}

function CenterCard({ pieces, onOpen }) {
  return (
    <button onClick={onOpen} className="mx-auto block w-full max-w-[320px]">
      <div className="rounded-[28px] border-[8px] border-[#6c2530] bg-[#fffdfb] p-4 shadow-[0_24px_60px_rgba(88,28,28,0.14)] transition-transform duration-300 hover:-translate-y-1">
        <div className="rounded-[18px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(249,241,237,0.92)_50%,_rgba(245,234,229,0.86)_100%)] px-5 py-7">
          <div className="flex min-h-[520px] flex-col items-center justify-center gap-7">
            {pieces.map((piece, index) => (
              <div key={piece.id} className="flex w-full justify-center">
                <img
                  src={piece.image}
                  alt={piece.name}
                  className={`object-contain drop-shadow-[0_18px_34px_rgba(88,28,28,0.10)] ${
                    index === 0 ? 'h-32' : index === 1 ? 'h-48' : 'h-24'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Landing({ toggleSidebar }) {
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
        fetch('https://lookbook-iwfd.onrender.com/api/outfits', { headers: getAuthHeader() }),
        fetch('https://lookbook-iwfd.onrender.com/api/calendar', { headers: getAuthHeader() })
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
        setTodayEntry({ outfitId: saved[0], date: getTodayKey(), event: 'Today’s selection' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeOutfit = todayEntry?.outfitId || savedOutfits[0] || null;
  const outfitPieces = useMemo(() => buildOutfitPieces(activeOutfit), [activeOutfit]);
  const heroBoxes = useMemo(() => buildHeroBoxes(outfitPieces), [outfitPieces]);

  const deleteOutfit = async (id) => {
    if (!confirm('Permanently remove this look?')) return;
    try {
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/outfits/${id}`, {
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
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/outfits/${id}`, {
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
      const res = await fetch('https://lookbook-iwfd.onrender.com/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ outfitId, date, event })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostOutfit = async () => {};

  return (
    <div className="min-h-screen bg-[#f7f1ee] text-wine-900">
      <Header toggleSidebar={toggleSidebar} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(247,241,238,0.88)_48%,_rgba(241,229,224,0.8)_100%)]" />
        <div className="absolute left-[-5rem] top-24 h-72 w-72 rounded-full bg-[#ead6da] blur-3xl" />
        <div className="absolute right-[-4rem] top-20 h-80 w-80 rounded-full bg-[#efe2da] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[95vw] px-4 pb-16 pt-32 md:px-12">
        {activeOutfit ? (
          <section className="mx-auto w-full rounded-[34px] border border-[#e3d8d3] bg-white/58 p-5 shadow-[0_24px_60px_rgba(88,28,28,0.08)] backdrop-blur-sm md:p-8">
            <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,243,239,0.96))] px-4 py-8 md:px-6 md:py-10">
              <Tape className="left-[8%] top-[10%] rotate-[-10deg]" />
              <Tape className="right-[8%] top-[10%] rotate-[10deg]" />

              <div className="mb-4 text-center">
                <div className="mx-auto mb-6 h-px w-[92%] bg-[linear-gradient(90deg,transparent,rgba(122,45,56,0.18),transparent)]" />
                <h1 className="font-serif text-5xl tracking-[0.06em] text-[#5c1f2a] sm:text-6xl md:text-7xl">LOOKBOOK</h1>
                <p className="mt-4 font-serif text-3xl italic text-[#6c2530] md:text-4xl">Club Fit</p>
              </div>

              <div className="relative mx-auto max-w-[1240px]">
                <ArrowLayer rightCount={heroBoxes.right.length} />

                <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr_1fr]">
                  <div className="hidden lg:flex lg:min-h-[760px] lg:flex-col lg:justify-between">
                    {heroBoxes.left.map((card) => (
                      <DetailBox key={card.id} card={card} />
                    ))}
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <CenterCard
                      pieces={outfitPieces}
                      onOpen={() => {
                        setSelectedOutfit(activeOutfit);
                        setIsOutfitModalOpen(true);
                      }}
                    />

                    <div className="mt-8 flex items-center gap-2 text-sm text-wine-700/55">
                      <CalendarDays className="h-4 w-4" strokeWidth={1.6} />
                      <span>Today&apos;s Outfit</span>
                    </div>
                  </div>

                  <div className="hidden lg:flex lg:min-h-[760px] lg:flex-col lg:items-center lg:justify-center lg:gap-8">
                    {heroBoxes.right.map((card) => (
                      <DetailBox key={card.id} card={card} />
                    ))}
                  </div>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:hidden">
                  {[...heroBoxes.left, ...heroBoxes.right].map((card) => (
                    <DetailBox key={card.id} card={card} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="rounded-[3rem] border border-wine-700/10 bg-white/70 px-8 py-24 text-center shadow-[0_30px_90px_rgba(108,27,42,0.08)]">
            <p className="text-[11px] uppercase tracking-[0.4em] text-wine-700/35">Today&apos;s selection</p>
            <h1 className="mt-5 font-serif text-4xl italic text-wine-900 md:text-6xl">No outfit scheduled yet</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-wine-700/60 md:text-base">
              Schedule a look in the calendar and the landing page will show the outfit you&apos;re wearing here.
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
