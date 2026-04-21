import { useMemo } from 'react';
import { Clock3, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const CURATED_PIECES = [
  {
    id: 'wishlist-1',
    name: 'Soft Structure Blazer',
    brand: 'Clarte Select',
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&q=80',
    price: '$280'
  },
  {
    id: 'wishlist-2',
    name: 'Berry Satin Heel',
    brand: 'Maison Rose',
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1000&q=80',
    price: '$190'
  },
  {
    id: 'wishlist-3',
    name: 'Pearl Drop Earrings',
    brand: 'Atelier No. 3',
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1000&q=80',
    price: '$120'
  },
  {
    id: 'wishlist-4',
    name: 'Second Skin Knit',
    brand: 'Forme',
    category: 'Tops',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&q=80',
    price: '$98'
  },
  {
    id: 'wishlist-5',
    name: 'Cream Column Skirt',
    brand: 'Ligne Studio',
    category: 'Bottoms',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=1000&q=80',
    price: '$160'
  }
];

export default function Shopping() {
  const trendingNow = useMemo(
    () =>
      CURATED_PIECES.map((piece, index) => ({
        ...piece,
        rating: (4.7 + index * 0.05).toFixed(1)
      })),
    []
  );

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f8f1eb] px-6 py-10 md:px-14 md:py-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#dcae96]/30 blur-3xl" />
        <div className="absolute right-[-5rem] top-32 h-80 w-80 rounded-full bg-[#b56a6a]/18 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-[#f2ddcf] blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-10">
        <section className="space-y-6">
          <p className="text-[10px] uppercase tracking-[0.45em] text-wine-700/45">Shopping</p>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <h1 className="max-w-4xl text-6xl font-serif italic leading-[0.92] text-wine-700 md:text-8xl xl:text-[7rem]">
                Feature Coming Soon
              </h1>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2.8rem] border border-white/45 bg-white/35 p-5 shadow-[0_30px_120px_rgba(88,28,28,0.10)] backdrop-blur-2xl md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.56))]" />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 rounded-[2.4rem] bg-white/72 p-6 blur-[1.8px] saturate-[0.94] md:p-7"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-wine-700/45">Trending now</p>
                <h3 className="mt-2 text-3xl font-serif italic text-wine-700">Curated arrivals</h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-wine-700/45">
                <Clock3 className="h-4 w-4" strokeWidth={1.6} />
                Updated daily
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {trendingNow.map((piece) => (
                <article
                  key={piece.id}
                  className="overflow-hidden rounded-[1.8rem] border border-wine-700/8 bg-[#fffaf7]/90"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img src={piece.image} alt={piece.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-wine-700/40">
                      <span>{piece.brand}</span>
                      <span>{piece.category}</span>
                    </div>
                    <h4 className="text-xl font-serif italic leading-tight text-wine-700">{piece.name}</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-wine-700/60">{piece.price}</p>
                      <div className="flex items-center gap-1 text-sm text-wine-700/60">
                        <Star className="h-4 w-4 fill-current" strokeWidth={1.5} />
                        {piece.rating}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
