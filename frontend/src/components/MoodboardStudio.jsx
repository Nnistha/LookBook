import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
  CalendarDays,
  Copy,
  Diamond,
  ImagePlus,
  Layers,
  MoveUpRight,
  Palette,
  Plus,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
  Type,
  Upload
} from 'lucide-react';
import MoodboardPreview from './MoodboardPreview';
import {
  BACKGROUND_PRESETS,
  buildBoardSnapshot,
  createEmptyBoard,
  FONT_STYLES,
  INSPIRATION_LIBRARY,
  loadMoodboards,
  MOODBOARD_OPEN_REQUEST_KEY,
  saveMoodboards,
  TEXTURE_OVERLAYS,
  upsertMoodboard
} from '../utils/moodboards';
import { getAuthToken } from '../utils/auth';

const TOOL_SECTIONS = [
  { id: 'wardrobe', label: 'Wardrobe Items', icon: Plus },
  { id: 'images', label: 'Images', icon: ImagePlus },
  { id: 'backgrounds', label: 'Backgrounds', icon: Palette },
  { id: 'stickers', label: 'Stickers', icon: Diamond },
  { id: 'text', label: 'Text / Notes', icon: Type }
];

const STICKERS = [
  { id: 'blob', name: 'Soft blob', stickerKind: 'blob' },
  { id: 'line', name: 'Ribbon line', stickerKind: 'line' },
  { id: 'frame', name: 'Frame', stickerKind: 'frame' },
  { id: 'tape', name: 'Tape', stickerKind: 'tape' },
  { id: 'sparkle', name: 'Sparkle', stickerKind: 'sparkle' },
  { id: 'pin', name: 'Pin', stickerKind: 'pin' }
];

const NOTE_PRESETS = [
  { text: 'Brunch look', fontStyle: 'serif' },
  { text: 'Soft girl vibe', fontStyle: 'handwritten' },
  { text: 'Design your look', fontStyle: 'sans' }
];

function StickerElement({ stickerKind }) {
  if (stickerKind === 'line') {
    return <div className="h-full w-full rounded-full bg-[#a96a7a]/45" />;
  }

  if (stickerKind === 'frame') {
    return <div className="h-full w-full rounded-[1.4rem] border-2 border-[#a96a7a]/45 bg-transparent" />;
  }

  if (stickerKind === 'tape') {
    return <div className="h-full w-full rounded-md bg-[#efe0cf]/78 shadow-sm" />;
  }

  if (stickerKind === 'sparkle') {
    return <div className="flex h-full w-full items-center justify-center text-3xl text-[#a96a7a]/60">✦</div>;
  }

  if (stickerKind === 'pin') {
    return <div className="flex h-full w-full items-center justify-center text-3xl text-[#865163]/60">●</div>;
  }

  return <div className="h-full w-full rounded-full bg-[#d8b9c2]/45" />;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function MoodboardStudio({ items }) {
  const canvasRef = useRef(null);
  const uploadRef = useRef(null);
  const dragStateRef = useRef(null);

  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState(createEmptyBoard);
  const [selectedElementId, setSelectedElementId] = useState('');
  const [activeTool, setActiveTool] = useState('wardrobe');
  const [imageUrl, setImageUrl] = useState('');
  const [inspoQuery, setInspoQuery] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleNote, setScheduleNote] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    const savedBoards = loadMoodboards();
    setBoards(savedBoards);

    const openRequest = localStorage.getItem(MOODBOARD_OPEN_REQUEST_KEY);
    if (openRequest) {
      const matched = savedBoards.find((entry) => entry.id === openRequest);
      if (matched) {
        setBoard(matched);
        setSelectedElementId(matched.elements?.[0]?.id || '');
      }
      localStorage.removeItem(MOODBOARD_OPEN_REQUEST_KEY);
      return;
    }

    if (savedBoards[0]) {
      setBoard(savedBoards[0]);
      setSelectedElementId(savedBoards[0].elements?.[0]?.id || '');
    }
  }, []);

  useEffect(() => {
    const handleMove = (event) => {
      const drag = dragStateRef.current;
      if (!drag || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((event.clientX - drag.startX) / rect.width) * 100;
      const dy = ((event.clientY - drag.startY) / rect.height) * 100;

      setBoard((prev) => ({
        ...prev,
        elements: prev.elements.map((element) =>
          element.id === drag.id
            ? {
                ...element,
                x: clamp(drag.originX + dx, 0, 100 - drag.originW),
                y: clamp(drag.originY + dy, 0, 100 - drag.originH)
              }
            : element
        )
      }));
    };

    const stopMove = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stopMove);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stopMove);
    };
  }, []);

  const selectedElement = board.elements.find((element) => element.id === selectedElementId) || null;

  const filteredInspiration = useMemo(() => {
    if (!inspoQuery.trim()) return INSPIRATION_LIBRARY;
    return INSPIRATION_LIBRARY.filter((entry) =>
      entry.name.toLowerCase().includes(inspoQuery.trim().toLowerCase())
    );
  }, [inspoQuery]);

  const wardrobeItems = items.filter((item) => item.image);

  const updateBoard = (updater) => {
    setBoard((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return { ...next, updatedAt: new Date().toISOString() };
    });
  };

  const updateElement = (elementId, patch) => {
    updateBoard((prev) => ({
      ...prev,
      elements: prev.elements.map((element) =>
        element.id === elementId ? { ...element, ...patch } : element
      )
    }));
  };

  const addElement = (element) => {
    updateBoard((prev) => {
      const topZ = prev.elements.reduce((max, entry) => Math.max(max, entry.z || 0), 0);
      return {
        ...prev,
        elements: [
          ...prev.elements,
          {
            opacity: 1,
            rotation: 0,
            z: topZ + 1,
            ...element
          }
        ]
      };
    });
    setSelectedElementId(element.id);
  };

  const createImageElement = (src, name = 'Image') => ({
    id: `image-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: 'image',
    src,
    name,
    x: 20,
    y: 20,
    w: 28,
    h: 38
  });

  const handlePointerDown = (event, element) => {
    if (!canvasRef.current) return;
    event.preventDefault();
    event.stopPropagation();

    dragStateRef.current = {
      id: element.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: element.x,
      originY: element.y,
      originW: element.w,
      originH: element.h
    };

    setSelectedElementId(element.id);
  };

  const handleUploadImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      addElement(createImageElement(reader.result, file.name));
      setActiveTool('images');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBoard = async (showAlert = true) => {
    setIsSaving(true);
    try {
      let thumbnail = board.thumbnail || '';
      if (canvasRef.current) {
        try {
          thumbnail = await toPng(canvasRef.current, {
            cacheBust: true,
            pixelRatio: 0.9
          });
        } catch (error) {
          console.error('Thumbnail capture failed:', error);
        }
      }

      const nextBoard = {
        ...board,
        thumbnail,
        updatedAt: new Date().toISOString()
      };

      setBoard(nextBoard);
      const updatedBoards = upsertMoodboard(nextBoard);
      setBoards(updatedBoards);
      if (showAlert) alert('Moodboard saved to Moodboard.');
      return nextBoard;
    } finally {
      setIsSaving(false);
    }
  };

  const openBoard = (savedBoard) => {
    setBoard(savedBoard);
    setSelectedElementId(savedBoard.elements?.[0]?.id || '');
  };

  const createNewBoard = () => {
    const fresh = createEmptyBoard();
    setBoard(fresh);
    setSelectedElementId(fresh.elements?.[0]?.id || '');
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;
    const duplicate = {
      ...selectedElement,
      id: `${selectedElement.id}-copy-${Date.now()}`,
      x: clamp((selectedElement.x || 0) + 4, 0, 88),
      y: clamp((selectedElement.y || 0) + 4, 0, 88),
      z: (selectedElement.z || 0) + 1
    };
    addElement(duplicate);
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    updateBoard((prev) => ({
      ...prev,
      elements: prev.elements.filter((element) => element.id !== selectedElement.id)
    }));
    setSelectedElementId('');
  };

  const changeLayer = (direction) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, {
      z: clamp((selectedElement.z || 1) + direction, 1, 50)
    });
  };

  const scheduleBoard = async () => {
    if (!scheduleDate) return;
    setIsScheduling(true);
    try {
      const savedBoard = await handleSaveBoard(false);
      const token = getAuthToken();
      const res = await fetch('https://lookbook-iwfd.onrender.com/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          date: scheduleDate,
          event: scheduleNote,
          moodboard: buildBoardSnapshot(savedBoard)
        })
      });

      if (res.ok) {
        alert(`Moodboard scheduled for ${scheduleDate}.`);
        setIsScheduleOpen(false);
        setScheduleDate('');
        setScheduleNote('');
      }
    } catch (error) {
      console.error('Schedule moodboard error:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="rounded-[2rem] border border-wine-700/8 bg-white/75 p-5 shadow-[0_20px_60px_rgba(93,42,58,0.05)] backdrop-blur-md">
          <div className="space-y-1 border-b border-wine-700/8 pb-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-wine-700/40">Add elements</p>
            <p className="text-sm text-wine-700/60">Your space, your story</p>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {TOOL_SECTIONS.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center gap-3 rounded-[1.2rem] px-4 py-3 text-left transition-all ${
                    isActive ? 'bg-[#f0e1e8] text-wine-900' : 'text-wine-700/60 hover:bg-[#f8efea]'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                  <span className="text-sm">{tool.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            {activeTool === 'wardrobe' && (
              <div className="space-y-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-wine-700/45">From your wardrobe</p>
                <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1 scrollbar-hide">
                  {wardrobeItems.slice(0, 10).map((item) => (
                    <button
                      key={item._id}
                      onClick={() => addElement(createImageElement(item.image, item.name))}
                      className="flex w-full items-center gap-3 rounded-[1.2rem] border border-wine-700/8 bg-[#fcf8f6] p-3 text-left hover:border-wine-700/20"
                    >
                      <div className="h-16 w-16 overflow-hidden rounded-[1rem] bg-white p-2">
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-serif text-lg italic text-wine-900">{item.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-wine-700/40">{item.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTool === 'images' && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <button
                    onClick={() => uploadRef.current?.click()}
                    className="flex items-center justify-center gap-3 rounded-[1.2rem] border border-wine-700/10 bg-[#fcf8f6] px-4 py-4 text-sm text-wine-900"
                  >
                    <Upload className="h-4 w-4" strokeWidth={1.6} />
                    Upload from device
                  </button>
                  <input
                    ref={uploadRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(event) => handleUploadImage(event.target.files?.[0])}
                  />

                  <div className="rounded-[1.2rem] border border-wine-700/10 bg-[#fcf8f6] p-3">
                    <label className="text-[11px] uppercase tracking-[0.22em] text-wine-700/45">Paste image URL</label>
                    <input
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder="https://..."
                      className="mt-3 w-full bg-transparent text-sm text-wine-900 outline-none"
                    />
                    <button
                      onClick={() => {
                        if (!imageUrl.trim()) return;
                        addElement(createImageElement(imageUrl.trim(), 'Reference image'));
                        setImageUrl('');
                      }}
                      className="mt-3 rounded-full bg-wine-900 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white"
                    >
                      Add image
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-wine-700/45">
                    <Search className="h-4 w-4" strokeWidth={1.6} />
                    Search inspiration
                  </div>
                  <input
                    value={inspoQuery}
                    onChange={(event) => setInspoQuery(event.target.value)}
                    placeholder="Soft neutrals, berry..."
                    className="w-full rounded-[1rem] border border-wine-700/10 bg-[#fcf8f6] px-4 py-3 text-sm outline-none"
                  />
                  <div className="grid gap-3">
                    {filteredInspiration.slice(0, 4).map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => addElement(createImageElement(entry.image, entry.name))}
                        className="overflow-hidden rounded-[1.2rem] border border-wine-700/8 bg-white text-left"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <img src={entry.image} alt={entry.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="px-3 py-3 text-sm text-wine-900">{entry.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'backgrounds' && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {BACKGROUND_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => updateBoard((prev) => ({ ...prev, background: preset.value }))}
                      className="flex items-center gap-3 rounded-[1.2rem] border border-wine-700/8 bg-[#fcf8f6] p-3 text-left"
                    >
                      <span
                        className="h-12 w-12 rounded-[0.9rem] shadow-inner"
                        style={{ background: preset.value }}
                      />
                      <span className="text-sm text-wine-900">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-wine-700/45">Texture</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(TEXTURE_OVERLAYS).map((texture) => (
                      <button
                        key={texture}
                        onClick={() => updateBoard((prev) => ({ ...prev, texture }))}
                        className={`rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] ${
                          board.texture === texture
                            ? 'bg-wine-900 text-white'
                            : 'bg-[#fcf8f6] text-wine-700'
                        }`}
                      >
                        {texture}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'stickers' && (
              <div className="grid gap-3">
                {STICKERS.map((sticker, index) => (
                  <button
                    key={sticker.id}
                    onClick={() =>
                      addElement({
                        id: `sticker-${Date.now()}-${sticker.id}`,
                        type: 'sticker',
                        stickerKind: sticker.stickerKind,
                        x: 18 + index * 3,
                        y: 22 + index * 2,
                        w: sticker.stickerKind === 'line' ? 24 : 16,
                        h: sticker.stickerKind === 'line' ? 3 : 16
                      })
                    }
                    className="rounded-[1.2rem] border border-wine-700/8 bg-[#fcf8f6] px-4 py-4 text-left text-sm text-wine-900"
                  >
                    {sticker.name}
                  </button>
                ))}
              </div>
            )}

            {activeTool === 'text' && (
              <div className="space-y-3">
                {NOTE_PRESETS.map((preset) => (
                  <button
                    key={preset.text}
                    onClick={() =>
                      addElement({
                        id: `text-${Date.now()}-${preset.fontStyle}`,
                        type: 'text',
                        text: preset.text,
                        fontStyle: preset.fontStyle,
                        color: '#6f3b50',
                        x: 18,
                        y: 16 + Math.random() * 24,
                        w: 28,
                        h: 10,
                        fontSize: preset.fontStyle === 'handwritten' ? 22 : 20
                      })
                    }
                    className="rounded-[1.2rem] border border-wine-700/8 bg-[#fcf8f6] px-4 py-4 text-left"
                  >
                    <p
                      className="text-xl text-wine-900"
                      style={{ fontFamily: FONT_STYLES[preset.fontStyle] }}
                    >
                      {preset.text}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-wine-700/8 bg-white/70 px-5 py-4 shadow-sm">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.3em] text-wine-700/40">Creative canvas</p>
              <input
                value={board.title}
                onChange={(event) => updateBoard((prev) => ({ ...prev, title: event.target.value }))}
                className="bg-transparent font-serif text-2xl italic text-wine-900 outline-none md:text-3xl"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={createNewBoard}
                className="rounded-full border border-wine-700/12 bg-white/85 px-4 py-2.5 text-[11px] uppercase tracking-[0.22em] text-wine-900 shadow-sm"
              >
                New board
              </button>
              <button
                onClick={() => handleSaveBoard(true)}
                disabled={isSaving}
                className="rounded-full bg-wine-900 px-5 py-2.5 text-[11px] uppercase tracking-[0.22em] text-white shadow-lg disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsScheduleOpen(true)}
                className="rounded-full border border-wine-700/12 bg-[#efe1e6] px-4 py-2.5 text-[11px] uppercase tracking-[0.22em] text-wine-900 shadow-sm"
              >
                Schedule
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.4rem] border border-wine-700/8 bg-white/55 p-4 shadow-[0_25px_80px_rgba(93,42,58,0.06)] backdrop-blur-md">
            <div
              ref={canvasRef}
              className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
              style={{ background: board.background }}
              onClick={() => setSelectedElementId('')}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-75"
                style={{ backgroundImage: TEXTURE_OVERLAYS[board.texture] || TEXTURE_OVERLAYS.paper }}
              />
              <div className="pointer-events-none absolute inset-x-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/35" />
              <div className="pointer-events-none absolute inset-y-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/35" />

              {board.elements
                .slice()
                .sort((a, b) => (a.z || 0) - (b.z || 0))
                .map((element) => {
                  const isSelected = selectedElementId === element.id;
                  return (
                    <motion.div
                      key={element.id}
                      whileHover={{ scale: 1.01 }}
                      onPointerDown={(event) => handlePointerDown(event, element)}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedElementId(element.id);
                      }}
                      className={`absolute cursor-move ${isSelected ? 'ring-1 ring-[#9d6477] ring-offset-2 ring-offset-transparent' : ''}`}
                      style={{
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        width: `${element.w}%`,
                        height: `${element.h}%`,
                        opacity: element.opacity ?? 1,
                        transform: `rotate(${element.rotation || 0}deg)`
                      }}
                    >
                      {element.type === 'text' ? (
                        <div
                          className="h-full w-full whitespace-pre-wrap break-words"
                          style={{
                            fontFamily: FONT_STYLES[element.fontStyle] || FONT_STYLES.serif,
                            color: element.color || '#6f3b50',
                            fontSize: `${element.fontSize || 20}px`,
                            lineHeight: 1.08
                          }}
                        >
                          {element.text}
                        </div>
                      ) : element.type === 'sticker' ? (
                        <StickerElement stickerKind={element.stickerKind} />
                      ) : (
                        <img
                          src={element.src}
                          alt={element.name || 'Moodboard'}
                          className="h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(80,40,50,0.18)]"
                        />
                      )}
                    </motion.div>
                  );
                })}

              <div className="pointer-events-none absolute bottom-5 left-5 rounded-full bg-white/72 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-wine-700/45 backdrop-blur-sm">
                Calm styling canvas
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-wine-700/8 bg-white/75 p-5 shadow-[0_20px_60px_rgba(93,42,58,0.05)] backdrop-blur-md">
          <div className="border-b border-wine-700/8 pb-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-wine-700/40">Editing controls</p>
            <p className="mt-1 text-sm text-wine-700/60">
              {selectedElement ? 'Refine the selected layer.' : 'Select an element to edit it.'}
            </p>
          </div>

          {selectedElement ? (
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={duplicateSelected}
                  className="flex items-center justify-center gap-2 rounded-[1.1rem] border border-wine-700/10 bg-[#fcf8f6] px-3 py-3 text-sm text-wine-900"
                >
                  <Copy className="h-4 w-4" strokeWidth={1.6} />
                  Duplicate
                </button>
                <button
                  onClick={deleteSelected}
                  className="flex items-center justify-center gap-2 rounded-[1.1rem] border border-red-400/12 bg-white px-3 py-3 text-sm text-red-500"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => changeLayer(1)}
                  className="flex items-center justify-center gap-2 rounded-[1.1rem] border border-wine-700/10 bg-[#fcf8f6] px-3 py-3 text-sm text-wine-900"
                >
                  <Layers className="h-4 w-4" strokeWidth={1.6} />
                  Forward
                </button>
                <button
                  onClick={() => changeLayer(-1)}
                  className="flex items-center justify-center gap-2 rounded-[1.1rem] border border-wine-700/10 bg-[#fcf8f6] px-3 py-3 text-sm text-wine-900"
                >
                  <MoveUpRight className="h-4 w-4" strokeWidth={1.6} />
                  Back
                </button>
              </div>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-wine-700/45">Opacity</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={selectedElement.opacity ?? 1}
                  onChange={(event) => updateElement(selectedElement.id, { opacity: Number(event.target.value) })}
                  className="w-full"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-wine-700/45">Rotate</span>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={selectedElement.rotation || 0}
                  onChange={(event) => updateElement(selectedElement.id, { rotation: Number(event.target.value) })}
                  className="w-full"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-wine-700/45">Width</span>
                <input
                  type="range"
                  min="8"
                  max="70"
                  step="1"
                  value={selectedElement.w}
                  onChange={(event) =>
                    updateElement(selectedElement.id, { w: Number(event.target.value) })
                  }
                  className="w-full"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.22em] text-wine-700/45">Height</span>
                <input
                  type="range"
                  min="5"
                  max="70"
                  step="1"
                  value={selectedElement.h}
                  onChange={(event) =>
                    updateElement(selectedElement.id, { h: Number(event.target.value) })
                  }
                  className="w-full"
                />
              </label>

              {selectedElement.type === 'text' && (
                <>
                  <label className="block space-y-2">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-wine-700/45">Text</span>
                    <textarea
                      value={selectedElement.text}
                      onChange={(event) => updateElement(selectedElement.id, { text: event.target.value })}
                      className="min-h-24 w-full rounded-[1rem] border border-wine-700/10 bg-[#fcf8f6] px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-wine-700/45">Font style</span>
                    <select
                      value={selectedElement.fontStyle}
                      onChange={(event) => updateElement(selectedElement.id, { fontStyle: event.target.value })}
                      className="w-full rounded-[1rem] border border-wine-700/10 bg-[#fcf8f6] px-4 py-3 text-sm outline-none"
                    >
                      <option value="serif">Elegant serif</option>
                      <option value="handwritten">Handwritten</option>
                      <option value="sans">Minimal sans</option>
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-wine-700/45">Font size</span>
                    <input
                      type="range"
                      min="14"
                      max="38"
                      step="1"
                      value={selectedElement.fontSize || 20}
                      onChange={(event) =>
                        updateElement(selectedElement.id, { fontSize: Number(event.target.value) })
                      }
                      className="w-full"
                    />
                  </label>
                </>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.4rem] border border-dashed border-wine-700/12 bg-[#fcf8f6] p-5 text-sm leading-relaxed text-wine-700/55">
              Drag wardrobe pieces, inspiration images, text notes, and stickers onto the canvas. Keep it peaceful, layered, and expressive.
            </div>
          )}

          <div className="mt-6 rounded-[1.4rem] bg-[#f4e7ea] p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-wine-700/45">
              <Sparkles className="h-4 w-4" strokeWidth={1.6} />
              Mood
            </div>
            <textarea
              value={board.note}
              onChange={(event) => updateBoard((prev) => ({ ...prev, note: event.target.value }))}
              className="mt-3 min-h-28 w-full bg-transparent text-sm leading-relaxed text-wine-900 outline-none"
              placeholder="Soft tailoring, brunch light, polished but easy..."
            />
          </div>
        </aside>
      </div>

      {isScheduleOpen && (
        <div className="fixed inset-0 z-[380] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-wine-900/45 backdrop-blur-md"
            onClick={() => setIsScheduleOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative w-full max-w-xl rounded-[2rem] border border-wine-700/10 bg-[#fbf7f3] p-8 shadow-[0_30px_90px_rgba(78,31,41,0.18)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-wine-700/40">Calendar integration</p>
                <h3 className="mt-2 text-3xl font-serif italic text-wine-900">Schedule this look</h3>
              </div>
              <CalendarDays className="h-5 w-5 text-wine-700/45" strokeWidth={1.6} />
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[1.4rem] border border-wine-700/10 bg-white p-3">
                <MoodboardPreview board={board} className="aspect-[4/3] w-full" />
              </div>
              <input
                type="date"
                value={scheduleDate}
                onChange={(event) => setScheduleDate(event.target.value)}
                className="w-full rounded-[1.2rem] border border-wine-700/10 bg-white px-4 py-4 text-base outline-none"
              />
              <textarea
                value={scheduleNote}
                onChange={(event) => setScheduleNote(event.target.value)}
                placeholder="Brunch look, gallery day, dinner story..."
                className="min-h-28 w-full rounded-[1.2rem] border border-wine-700/10 bg-white px-4 py-4 text-base outline-none resize-none"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="flex-1 rounded-[1.2rem] border border-wine-700/12 bg-white px-4 py-4 text-sm uppercase tracking-[0.2em] text-wine-900"
              >
                Cancel
              </button>
              <button
                onClick={scheduleBoard}
                disabled={!scheduleDate || isScheduling}
                className="flex-1 rounded-[1.2rem] bg-wine-900 px-4 py-4 text-sm uppercase tracking-[0.2em] text-white disabled:opacity-40"
              >
                {isScheduling ? 'Scheduling...' : 'Save to calendar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
