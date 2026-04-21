import { FONT_STYLES, TEXTURE_OVERLAYS } from '../utils/moodboards';

function StickerShape({ element }) {
  if (element.stickerKind === 'line') {
    return <div className="h-full w-full rounded-full bg-[#a96a7a]/45" />;
  }

  if (element.stickerKind === 'frame') {
    return <div className="h-full w-full rounded-[1.4rem] border-2 border-[#a96a7a]/45 bg-transparent" />;
  }

  if (element.stickerKind === 'tape') {
    return <div className="h-full w-full rounded-md bg-[#efe0cf]/78 shadow-sm" />;
  }

  if (element.stickerKind === 'sparkle') {
    return (
      <div className="flex h-full w-full items-center justify-center text-[clamp(16px,3vw,28px)] text-[#a96a7a]/60">
        ✦
      </div>
    );
  }

  if (element.stickerKind === 'pin') {
    return (
      <div className="flex h-full w-full items-center justify-center text-[clamp(18px,3vw,30px)] text-[#865163]/60">
        ●
      </div>
    );
  }

  return <div className="h-full w-full rounded-full bg-[#d8b9c2]/45 blur-[0.2px]" />;
}

export default function MoodboardPreview({ board, className = '' }) {
  if (!board) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-[1.6rem] ${className}`}
      style={{ background: board.background }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ backgroundImage: TEXTURE_OVERLAYS[board.texture] || TEXTURE_OVERLAYS.paper }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.15),rgba(255,255,255,0.08))]" />

      {board.elements
        ?.slice()
        .sort((a, b) => (a.z || 0) - (b.z || 0))
        .map((element) => {
          const style = {
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: `${element.w}%`,
            height: `${element.h}%`,
            opacity: element.opacity ?? 1,
            transform: `rotate(${element.rotation || 0}deg)`
          };

          return (
            <div key={element.id} className="absolute" style={style}>
              {element.type === 'text' ? (
                <div
                  className="h-full w-full whitespace-pre-wrap break-words text-[#6f3b50]"
                  style={{
                    fontFamily: FONT_STYLES[element.fontStyle] || FONT_STYLES.serif,
                    color: element.color || '#6f3b50',
                    fontSize: `clamp(10px, ${element.fontSize || 20}px, 32px)`,
                    lineHeight: 1.1
                  }}
                >
                  {element.text}
                </div>
              ) : element.type === 'sticker' ? (
                <StickerShape element={element} />
              ) : (
                <img
                  src={element.src}
                  alt={element.name || 'Moodboard element'}
                  className="h-full w-full object-contain drop-shadow-[0_10px_24px_rgba(80,40,50,0.18)]"
                />
              )}
            </div>
          );
        })}
    </div>
  );
}
