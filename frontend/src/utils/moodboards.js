export const MOODBOARD_STORAGE_KEY = 'clarte_moodboards_v1';
export const MOODBOARD_OPEN_REQUEST_KEY = 'clarte_open_moodboard_v1';

export const BACKGROUND_PRESETS = [
  {
    id: 'blush-paper',
    name: 'Blush paper',
    value: 'linear-gradient(135deg, #f7efea 0%, #efe4de 100%)'
  },
  {
    id: 'rose-haze',
    name: 'Rose haze',
    value: 'linear-gradient(135deg, #f3e6e8 0%, #e7d7db 45%, #f8f2ef 100%)'
  },
  {
    id: 'berry-fade',
    name: 'Berry fade',
    value: 'linear-gradient(135deg, #f8f3f2 0%, #ead7de 50%, #d9bcc8 100%)'
  },
  {
    id: 'stone-grain',
    name: 'Stone grain',
    value: 'linear-gradient(135deg, #f6f3ee 0%, #ebe4dc 100%)'
  },
  {
    id: 'soft-night',
    name: 'Soft night',
    value: 'linear-gradient(135deg, #f3ecea 0%, #d9cad0 100%)'
  }
];

export const TEXTURE_OVERLAYS = {
  paper:
    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.34), transparent 25%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2), transparent 22%), radial-gradient(circle at 40% 80%, rgba(148,108,120,0.08), transparent 22%)',
  fabric:
    'linear-gradient(0deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08)), repeating-linear-gradient(90deg, rgba(142,107,116,0.04) 0px, rgba(142,107,116,0.04) 1px, transparent 1px, transparent 10px)',
  grain:
    'radial-gradient(circle at 10% 20%, rgba(120,80,90,0.08) 0 1px, transparent 1.4px), radial-gradient(circle at 70% 80%, rgba(120,80,90,0.05) 0 1px, transparent 1.6px), radial-gradient(circle at 35% 65%, rgba(255,255,255,0.28) 0 1px, transparent 1.5px)'
};

export const FONT_STYLES = {
  serif: '"Playfair Display", serif',
  handwritten: '"Brush Script MT", "Lucida Handwriting", cursive',
  sans: 'Inter, sans-serif'
};

export const INSPIRATION_LIBRARY = [
  {
    id: 'inspo-1',
    name: 'Berry tailoring',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=80'
  },
  {
    id: 'inspo-2',
    name: 'Soft neutral editorial',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80'
  },
  {
    id: 'inspo-3',
    name: 'Minimal accessories',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=80'
  },
  {
    id: 'inspo-4',
    name: 'Quiet luxury texture',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80'
  },
  {
    id: 'inspo-5',
    name: 'Brunch light',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80'
  }
];

export function loadMoodboards() {
  try {
    return JSON.parse(localStorage.getItem(MOODBOARD_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveMoodboards(boards) {
  localStorage.setItem(MOODBOARD_STORAGE_KEY, JSON.stringify(boards));
}

export function upsertMoodboard(board) {
  const boards = loadMoodboards();
  const next = [board, ...boards.filter((entry) => entry.id !== board.id)];
  saveMoodboards(next);
  return next;
}

export function createEmptyBoard() {
  return {
    id: `board-${Date.now()}`,
    title: 'Untitled vibe',
    note: 'Create your vibe',
    background: BACKGROUND_PRESETS[0].value,
    texture: 'paper',
    elements: [
      {
        id: `text-${Date.now()}`,
        type: 'text',
        text: 'Your space, your story',
        fontStyle: 'serif',
        color: '#6f3b50',
        x: 9,
        y: 10,
        w: 32,
        h: 12,
        rotation: -3,
        opacity: 1,
        z: 5,
        fontSize: 24
      }
    ],
    thumbnail: '',
    updatedAt: new Date().toISOString()
  };
}

export function buildBoardSnapshot(board) {
  return {
    id: board.id,
    title: board.title,
    note: board.note,
    background: board.background,
    texture: board.texture,
    thumbnail: board.thumbnail || '',
    elements: board.elements,
    updatedAt: board.updatedAt || new Date().toISOString()
  };
}
