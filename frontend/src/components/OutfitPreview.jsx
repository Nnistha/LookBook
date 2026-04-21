import { useEffect, useRef, useState } from 'react';

const ITEM_WIDTH = 288;
const ITEM_HEIGHT = 380;
const ITEM_PADDING = 24;

function getBounds(items) {
  if (!items?.length) return { minX: 0, minY: 0, width: 1, height: 1 };

  const boxes = items.map((item) => {
    const scale = item.scale || 1;
    return {
      left: item.x || 0,
      top: item.y || 0,
      right: (item.x || 0) + (ITEM_WIDTH + ITEM_PADDING * 2) * scale,
      bottom: (item.y || 0) + (ITEM_HEIGHT + ITEM_PADDING * 2) * scale
    };
  });

  const minX = Math.min(...boxes.map((box) => box.left));
  const minY = Math.min(...boxes.map((box) => box.top));
  const maxX = Math.max(...boxes.map((box) => box.right));
  const maxY = Math.max(...boxes.map((box) => box.bottom));

  return {
    minX,
    minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY)
  };
}

export default function OutfitPreview({ outfit, className = '', imageClassName = '' }) {
  const frameRef = useRef(null);
  const [frameSize, setFrameSize] = useState({ width: 1, height: 1 });
  const items = outfit?.items || [];

  useEffect(() => {
    if (!frameRef.current || typeof ResizeObserver === 'undefined') return undefined;

    const updateSize = () => {
      if (!frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      setFrameSize({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height)
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(frameRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  if (!items.length) {
    return outfit?.thumbnail ? (
      <img src={outfit.thumbnail} alt={outfit.name} className={`${className} ${imageClassName}`.trim()} />
    ) : null;
  }

  const { minX, minY, width, height } = getBounds(items);
  const scale = Math.min(
    (frameSize.width * 0.82) / width,
    (frameSize.height * 0.82) / height,
    1
  );

  return (
    <div ref={frameRef} className={`${className} relative overflow-hidden bg-[#f0ede8]`.trim()}>
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          width,
          height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        {items
          .slice()
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
          .map((item, index) => {
            const wardrobe = item.wardrobeId || {};
            if (!wardrobe.image) return null;

            return (
              <div
                key={`${wardrobe._id || 'item'}-${index}`}
                className="absolute"
                style={{
                  left: (item.x || 0) - minX,
                  top: (item.y || 0) - minY,
                  zIndex: item.zIndex || index + 1
                }}
              >
                <div
                  style={{
                    padding: `${ITEM_PADDING}px`,
                    transform: `scale(${item.scale || 1}) rotate(${item.rotation || 0}deg)`,
                    transformOrigin: 'top left'
                  }}
                >
                  <img
                    src={wardrobe.image}
                    alt={wardrobe.name || outfit.name}
                    className={imageClassName}
                    style={{
                      width: `${ITEM_WIDTH}px`,
                      height: 'auto',
                      display: 'block',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.12))'
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
