import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, PencilLine, Trash2, MoveRight, Check, LayoutTemplate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OutfitPreview from '../components/OutfitPreview';
import MoodboardPreview from '../components/MoodboardPreview';
import { getAuthToken } from '../utils/auth';
import {
  loadMoodboards,
  MOODBOARD_OPEN_REQUEST_KEY,
  saveMoodboards
} from '../utils/moodboards';

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const navigate = useNavigate();
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [scheduledOutfits, setScheduledOutfits] = useState({});
  const [outfits, setOutfits] = useState([]);
  const [savedBoards, setSavedBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth());
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDateKey, setActiveDateKey] = useState('');
  const [selectedOutfitId, setSelectedOutfitId] = useState('');
  const [selectedMoodboardId, setSelectedMoodboardId] = useState('');
  const [selectedMode, setSelectedMode] = useState('outfit');
  const [scheduleNote, setScheduleNote] = useState('');
  const [drawerEntry, setDrawerEntry] = useState(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const monthDate = new Date(displayYear, displayMonth, 1);
  const monthName = monthDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getAuthHeader = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchSchedule();
    fetchOutfits();
    setSavedBoards(loadMoodboards());
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await fetch('https://lookbook-iwfd.onrender.com/api/calendar', {
        headers: getAuthHeader()
      });

      if (res.ok) {
        const data = await res.json();
        const scheduleMap = {};
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedData.forEach((entry) => {
          scheduleMap[entry.date] = entry;
        });

        setScheduledOutfits(scheduleMap);

        if (sortedData.length > 0) {
          const focusDate = new Date(sortedData[0].date);
          setDisplayMonth(focusDate.getMonth());
          setDisplayYear(focusDate.getFullYear());
        }
      }
    } catch (err) {
      console.error('Fetch schedule error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOutfits = async () => {
    try {
      const res = await fetch('https://lookbook-iwfd.onrender.com/api/outfits', {
        headers: getAuthHeader()
      });

      if (res.ok) {
        setOutfits(await res.json());
      }
    } catch (err) {
      console.error('Fetch outfits error:', err);
    }
  };

  const formatDateKey = (day) => {
    const month = String(displayMonth + 1).padStart(2, '0');
    const date = String(day).padStart(2, '0');
    return `${displayYear}-${month}-${date}`;
  };

  const calendarDays = days.map((day) => {
    const key = formatDateKey(day);
    return {
      day,
      key,
      entry: scheduledOutfits[key] || null
    };
  });

  const shiftMonth = (direction) => {
    const nextDate = new Date(displayYear, displayMonth + direction, 1);
    setDisplayMonth(nextDate.getMonth());
    setDisplayYear(nextDate.getFullYear());
  };

  const openScheduleDrawer = (entry, key) => {
    setDrawerEntry(entry || null);
    setActiveDateKey(key);
    setSelectedOutfitId(entry?.outfitId?._id || '');
    setSelectedMoodboardId(entry?.moodboard?.id || '');
    setSelectedMode(entry?.moodboard ? 'moodboard' : 'outfit');
    setScheduleNote(entry?.event || '');
    setIsDrawerOpen(true);
  };

  const openEntry = (entry, key) => {
    openScheduleDrawer(entry, key);
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;

    try {
      const res = await fetch(`https://lookbook-iwfd.onrender.com/api/calendar/${selectedEntry.date}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (res.ok) {
        setScheduledOutfits((prev) => {
          const next = { ...prev };
          delete next[selectedEntry.date];
          return next;
        });
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error('Delete schedule error:', err);
    }
  };

  const handleReschedule = async () => {
    if (!selectedEntry || !rescheduleDate) return;

    try {
      const res = await fetch('https://lookbook-iwfd.onrender.com/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          date: rescheduleDate,
          event: selectedEntry.event || '',
          outfitId: selectedEntry.outfitId?._id || null,
          moodboard: selectedEntry.moodboard || null
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setScheduledOutfits((prev) => {
          const next = { ...prev };
          delete next[selectedEntry.date];
          next[updated.date] = updated;
          return next;
        });
        setSelectedEntry(updated);
        setRescheduleDate(updated.date);
        setIsRescheduling(false);
      }
    } catch (err) {
      console.error('Reschedule error:', err);
    }
  };

  const handleEditOutfit = () => {
    if (!selectedEntry?.outfitId) return;
    localStorage.setItem('edit_outfit', JSON.stringify(selectedEntry.outfitId));
    navigate('/dressing-room');
  };

  const handleOpenMoodboard = () => {
    if (!selectedEntry?.moodboard) return;
    const boards = loadMoodboards();
    const nextBoards = [
      selectedEntry.moodboard,
      ...boards.filter((entry) => entry.id !== selectedEntry.moodboard.id)
    ];
    saveMoodboards(nextBoards);
    localStorage.setItem(MOODBOARD_OPEN_REQUEST_KEY, selectedEntry.moodboard.id);
    navigate('/wardrobe');
  };

  const handleSaveSchedule = async () => {
    if (!activeDateKey) return;
    if (selectedMode === 'outfit' && !selectedOutfitId) return;
    if (selectedMode === 'moodboard' && !selectedMoodboardId) return;

    setIsSavingSchedule(true);
    try {
      const selectedMoodboard =
        selectedMode === 'moodboard'
          ? savedBoards.find((board) => board.id === selectedMoodboardId) || null
          : null;

      const res = await fetch('https://lookbook-iwfd.onrender.com/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          date: activeDateKey,
          event: scheduleNote,
          outfitId: selectedMode === 'outfit' ? selectedOutfitId : null,
          moodboard: selectedMode === 'moodboard' ? selectedMoodboard : null
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setScheduledOutfits((prev) => ({
          ...prev,
          [updated.date]: updated
        }));
        setDrawerEntry(updated);
        setSelectedOutfitId(updated.outfitId?._id || '');
        setSelectedMoodboardId(updated.moodboard?.id || '');
        setScheduleNote(updated.event || '');
        setIsDrawerOpen(false);
      }
    } catch (err) {
      console.error('Save schedule error:', err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const selectedOutfit = outfits.find((outfit) => outfit._id === selectedOutfitId) || null;
  const selectedMoodboard = savedBoards.find((board) => board.id === selectedMoodboardId) || null;

  return (
    <div className="min-h-full bg-[#f8f2ef] px-6 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 md:mb-10 flex items-center justify-between">
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-full border border-wine-700/15 bg-white p-4 text-wine-900 shadow-sm transition-all hover:bg-[#f4ebe7]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <h1 className="text-center font-serif text-4xl italic text-wine-900 md:text-6xl">
            {monthName}
          </h1>

          <button
            onClick={() => shiftMonth(1)}
            className="rounded-full border border-wine-700/15 bg-white p-4 text-wine-900 shadow-sm transition-all hover:bg-[#f4ebe7]"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-7 gap-3 md:gap-4">
          {WEEKDAY_NAMES.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-wine-900 md:text-base"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3 md:gap-4">
          {blanks.map((blank) => (
            <div
              key={`blank-${blank}`}
              className="aspect-[0.95] rounded-[1.5rem] border border-transparent"
            />
          ))}

          {calendarDays.map(({ day, key, entry }) => {
            const hasEntry = Boolean(entry);
            const plannedMoodboard = entry?.moodboard || null;
            const plannedOutfit = entry?.outfitId || null;

            return (
              <motion.button
                key={key}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => openEntry(entry, key)}
                className={`relative aspect-[0.95] overflow-hidden rounded-[1.6rem] border p-3 text-left transition-all md:p-4 ${
                  hasEntry
                    ? 'border-[#b98fa4]/55 bg-[#f4e8ee] shadow-[0_12px_30px_rgba(120,60,80,0.10)]'
                    : 'border-wine-700/10 bg-white/70 hover:border-wine-700/20'
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-base font-semibold text-wine-900 md:text-lg">{day}</span>
                  {hasEntry && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wine-900/70 md:text-[11px]">
                      Planned
                    </span>
                  )}
                </div>

                {hasEntry ? (
                  <div className="flex h-[calc(100%-2rem)] flex-col gap-3">
                    <div className="min-h-0 flex-1 overflow-hidden rounded-[1.1rem] border border-white/70 bg-[#f8f2ef]">
                      {plannedMoodboard ? (
                        <MoodboardPreview board={plannedMoodboard} className="h-full w-full" />
                      ) : (
                        <OutfitPreview
                          outfit={plannedOutfit}
                          className="h-full w-full"
                          imageClassName="h-full w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="line-clamp-2 font-serif text-sm italic leading-tight text-wine-900 md:text-base">
                        {plannedMoodboard?.title || plannedOutfit?.name}
                      </p>
                      {entry?.event && (
                        <p className="line-clamp-1 text-xs text-wine-900/70 md:text-sm">
                          {entry.event}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[calc(100%-2rem)] items-center justify-center rounded-[1.1rem] border border-dashed border-wine-700/12 bg-[#fcf8f6] px-2">
                    <p className="text-center text-xs leading-relaxed text-wine-900/45 md:text-sm">
                      No look planned
                    </p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {!isLoading && Object.keys(scheduledOutfits).length === 0 && (
          <div className="mt-10 rounded-[2rem] border border-wine-700/10 bg-white/75 p-8 text-center">
            <p className="font-serif text-2xl italic text-wine-900">No looks scheduled yet.</p>
            <p className="mt-2 text-sm text-wine-700/60">
              Save an outfit or moodboard to a date and it will appear here.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[390] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-wine-900/30 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="relative h-full w-full max-w-xl overflow-hidden border-l border-wine-700/10 bg-[#fbf7f3] shadow-[0_30px_80px_rgba(78,31,41,0.18)]"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-4 border-b border-wine-700/10 px-6 py-6 md:px-8">
                  <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-wine-900/65">
                      {activeDateKey}
                    </p>
                    <h2 className="text-3xl font-serif italic text-wine-900 md:text-4xl">
                      Plan This Look
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-full border border-wine-700/10 bg-white/80 p-3 text-wine-900"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-6 px-6 py-6 md:px-8">
                  {drawerEntry && (drawerEntry.outfitId || drawerEntry.moodboard) && (
                    <div className="rounded-[1.4rem] border border-wine-700/12 bg-[#f4e8ee] p-4">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wine-900/60">
                            Currently scheduled
                          </p>
                          <p className="text-xl font-serif italic text-wine-900">
                            {drawerEntry.moodboard?.title || drawerEntry.outfitId?.name}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedEntry(drawerEntry);
                            setRescheduleDate(drawerEntry.date);
                            setIsRescheduling(false);
                            setIsDrawerOpen(false);
                          }}
                          className="text-sm font-semibold text-wine-900 underline underline-offset-4"
                        >
                          View
                        </button>
                      </div>
                      <div className="aspect-[4/3] overflow-hidden rounded-[1rem] border border-white/70 bg-[#f8f2ef]">
                        {drawerEntry.moodboard ? (
                          <MoodboardPreview board={drawerEntry.moodboard} className="h-full w-full" />
                        ) : (
                          <OutfitPreview
                            outfit={drawerEntry.outfitId}
                            className="h-full w-full"
                            imageClassName="h-full w-full object-contain"
                          />
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <button
                          onClick={() => {
                            setSelectedEntry(drawerEntry);
                            setRescheduleDate(drawerEntry.date);
                            setIsRescheduling(true);
                            setIsDrawerOpen(false);
                          }}
                          className="flex items-center justify-center gap-2 rounded-[1rem] border border-wine-700/12 bg-white py-3 text-sm font-semibold uppercase tracking-[0.16em] text-wine-900"
                        >
                          <MoveRight className="h-4 w-4" /> Reschedule
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`https://lookbook-iwfd.onrender.com/api/calendar/${drawerEntry.date}`, {
                                method: 'DELETE',
                                headers: getAuthHeader()
                              });

                              if (res.ok) {
                                setScheduledOutfits((prev) => {
                                  const next = { ...prev };
                                  delete next[drawerEntry.date];
                                  return next;
                                });
                                setDrawerEntry(null);
                                setIsDrawerOpen(false);
                              }
                            } catch (err) {
                              console.error('Delete schedule error:', err);
                            }
                          }}
                          className="flex items-center justify-center gap-2 rounded-[1rem] border border-red-400/20 bg-white py-3 text-sm font-semibold uppercase tracking-[0.16em] text-red-500"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedMode('outfit')}
                      className={`rounded-[1rem] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] ${
                        selectedMode === 'outfit'
                          ? 'bg-wine-900 text-white'
                          : 'border border-wine-700/10 bg-white text-wine-900'
                      }`}
                    >
                      Outfits
                    </button>
                    <button
                      onClick={() => setSelectedMode('moodboard')}
                      className={`rounded-[1rem] px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] ${
                        selectedMode === 'moodboard'
                          ? 'bg-wine-900 text-white'
                          : 'border border-wine-700/10 bg-white text-wine-900'
                      }`}
                    >
                      Moodboards
                    </button>
                  </div>

                  {selectedMode === 'outfit' ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-wine-900">Choose an Outfit</p>
                      <div className="grid gap-4">
                        {outfits.map((outfit) => {
                          const isSelected = selectedOutfitId === outfit._id;
                          return (
                            <button
                              key={outfit._id}
                              onClick={() => setSelectedOutfitId(outfit._id)}
                              className={`rounded-[1.4rem] border p-4 text-left transition-all ${
                                isSelected
                                  ? 'border-[#b98fa4] bg-[#f4e8ee] shadow-[0_10px_30px_rgba(120,60,80,0.10)]'
                                  : 'border-wine-700/10 bg-white hover:border-wine-700/20'
                              }`}
                            >
                              <div className="flex gap-4">
                                <div className="h-32 w-28 shrink-0 overflow-hidden rounded-[1rem] border border-white/70 bg-[#f8f2ef]">
                                  <OutfitPreview
                                    outfit={outfit}
                                    className="h-full w-full"
                                    imageClassName="h-full w-full object-contain"
                                  />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between gap-3">
                                      <h3 className="text-xl font-serif italic leading-tight text-wine-900">{outfit.name}</h3>
                                      {isSelected && <Check className="h-5 w-5 shrink-0 text-wine-900" />}
                                    </div>
                                    <p className="mt-2 text-sm text-wine-900/60">
                                      {outfit.items?.length || 0} item{outfit.items?.length === 1 ? '' : 's'}
                                    </p>
                                  </div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-wine-900/55">
                                    {outfit.isPosted ? 'Posted look' : 'Saved look'}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-wine-900">Choose a Moodboard</p>
                      <div className="grid gap-4">
                        {savedBoards.map((board) => {
                          const isSelected = selectedMoodboardId === board.id;
                          return (
                            <button
                              key={board.id}
                              onClick={() => setSelectedMoodboardId(board.id)}
                              className={`rounded-[1.4rem] border p-4 text-left transition-all ${
                                isSelected
                                  ? 'border-[#b98fa4] bg-[#f4e8ee] shadow-[0_10px_30px_rgba(120,60,80,0.10)]'
                                  : 'border-wine-700/10 bg-white hover:border-wine-700/20'
                              }`}
                            >
                              <div className="flex gap-4">
                                <div className="h-32 w-28 shrink-0 overflow-hidden rounded-[1rem] border border-white/70 bg-[#f8f2ef]">
                                  <MoodboardPreview board={board} className="h-full w-full" />
                                </div>
                                <div className="flex min-w-0 flex-1 flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between gap-3">
                                      <h3 className="text-xl font-serif italic leading-tight text-wine-900">{board.title}</h3>
                                      {isSelected && <Check className="h-5 w-5 shrink-0 text-wine-900" />}
                                    </div>
                                    <p className="mt-2 text-sm text-wine-900/60 line-clamp-2">{board.note}</p>
                                  </div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-wine-900/55">
                                    Moodboard
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold uppercase tracking-[0.18em] text-wine-900">
                      Add a Note
                    </label>
                    <textarea
                      value={scheduleNote}
                      onChange={(e) => setScheduleNote(e.target.value)}
                      placeholder="Brunch fit, work look, dinner plan..."
                      className="min-h-28 w-full resize-none rounded-[1.4rem] border border-wine-700/10 bg-white px-4 py-4 text-base text-wine-900 outline-none placeholder:text-wine-900/35"
                    />
                  </div>

                  {(selectedOutfit || selectedMoodboard) && (
                    <div className="rounded-[1.4rem] border border-wine-700/12 bg-white p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-wine-900/60">
                        Selected Preview
                      </p>
                      <div className="aspect-[5/3] overflow-hidden rounded-[1rem] border border-wine-700/8 bg-[#f8f2ef]">
                        {selectedMode === 'moodboard' && selectedMoodboard ? (
                          <MoodboardPreview board={selectedMoodboard} className="h-full w-full" />
                        ) : (
                          <OutfitPreview
                            outfit={selectedOutfit}
                            className="h-full w-full"
                            imageClassName="h-full w-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 border-t border-wine-700/10 bg-[#fbf7f3] px-6 py-5 md:px-8">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 rounded-[1.2rem] border border-wine-700/12 bg-white py-4 text-sm font-semibold uppercase tracking-[0.16em] text-wine-900 md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    disabled={
                      (selectedMode === 'outfit' && !selectedOutfitId) ||
                      (selectedMode === 'moodboard' && !selectedMoodboardId) ||
                      isSavingSchedule
                    }
                    className="flex-1 rounded-[1.2rem] bg-wine-900 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-40 md:text-base"
                  >
                    {isSavingSchedule ? 'Saving...' : 'Save to Date'}
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}

        {selectedEntry && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center px-4 py-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-wine-900/50 backdrop-blur-lg"
              onClick={() => setSelectedEntry(null)}
            />

            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 18 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-wine-700/10 bg-[#fbf7f3] shadow-[0_30px_90px_rgba(78,31,41,0.22)]"
            >
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute right-6 top-6 z-20 rounded-full bg-white/80 p-3 text-wine-900 transition-all hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                <div className="border-b border-wine-700/10 bg-[#f1e7eb] p-8 md:p-10 lg:border-b-0 lg:border-r">
                  <div className="aspect-[4/5] overflow-hidden rounded-[1.8rem] border border-white/70 bg-[#f8f2ef]">
                    {selectedEntry.moodboard ? (
                      <MoodboardPreview board={selectedEntry.moodboard} className="h-full w-full" />
                    ) : (
                      <OutfitPreview
                        outfit={selectedEntry.outfitId}
                        className="h-full w-full"
                        imageClassName="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </div>

                <div className="p-8 md:p-10">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-wine-900/70">
                    {selectedEntry.date}
                  </p>
                  <h2 className="text-3xl font-serif italic leading-tight text-wine-900 md:text-5xl">
                    {selectedEntry.moodboard?.title || selectedEntry.outfitId?.name}
                  </h2>
                  {selectedEntry.event && (
                    <p className="mt-4 text-base text-wine-900/70 md:text-lg">{selectedEntry.event}</p>
                  )}

                  <div className="mt-10 space-y-4">
                    {selectedEntry.moodboard ? (
                      <button
                        onClick={handleOpenMoodboard}
                        className="flex w-full items-center justify-center gap-3 rounded-[1.2rem] bg-wine-900 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white md:text-base"
                      >
                        <LayoutTemplate className="h-4 w-4" /> Open in Moodboard
                      </button>
                    ) : (
                      <button
                        onClick={handleEditOutfit}
                        className="flex w-full items-center justify-center gap-3 rounded-[1.2rem] bg-wine-900 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white md:text-base"
                      >
                        <PencilLine className="h-4 w-4" /> Edit
                      </button>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <button
                        onClick={() => setIsRescheduling((prev) => !prev)}
                        className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-wine-700/12 bg-white py-4 text-sm font-semibold uppercase tracking-[0.16em] text-wine-900 md:text-base"
                      >
                        <MoveRight className="h-4 w-4" /> Reschedule
                      </button>
                      <button
                        onClick={handleDeleteEntry}
                        className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-red-400/20 bg-white py-4 text-sm font-semibold uppercase tracking-[0.16em] text-red-500 md:text-base"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </div>

                    <AnimatePresence>
                      {isRescheduling && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="space-y-4 pt-4"
                        >
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="w-full rounded-[1.2rem] border border-wine-700/12 bg-white px-4 py-4 text-base text-wine-900 outline-none"
                          />
                          <button
                            onClick={handleReschedule}
                            className="w-full rounded-[1.2rem] border border-wine-700/12 bg-[#f4ebe7] py-4 text-sm font-semibold uppercase tracking-[0.16em] text-wine-900 md:text-base"
                          >
                            Save New Date
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
