import React, { useRef, useEffect } from 'react';
import { Heart, Eye } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RequestCommissionButton from './RequestCommissionButton';
import { useAuth } from '../../contexts/AuthContext';
import { goToPage } from '../../utils/navigation';

gsap.registerPlugin(ScrollTrigger);

const ArtworkCard = ({ artwork, index, onClick }) => {
  const { user: currentUser } = useAuth();
  const cardRef = useRef(null);
  const imgRef = useRef(null);

  const handleArtistClick = (e) => {
    e.stopPropagation();
    if (artwork.artist?._id) {
      goToPage('artistProfile', { artistId: artwork.artist._id });
    }
  };

  useEffect(() => {
    const cardEl = cardRef.current;
    const imgEl = imgRef.current;
    if (!cardEl || !imgEl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(cardEl, { opacity: 1, y: 0 });
        gsap.set(imgEl, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 });
        return;
      }

      // The card itself just settles in — the real reveal happens on the
      // image, which starts visibly cropped (clipped in top/bottom, scaled
      // up) and uncrops into its full frame. Same technique as the hero wall.
      gsap.set(cardEl, { opacity: 0, y: 20 });
      gsap.set(imgEl, { clipPath: 'inset(18% 0% 18% 0%)', scale: 1.2 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardEl,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
        delay: (index % 4) * 0.07,
      });

      tl.to(cardEl, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }).to(
        imgEl,
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.9, ease: 'power3.out' },
        '-=0.3'
      );
    }, cardRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork._id]);

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(artwork)}
      className="group bg-[#FDFBF6] rounded-lg overflow-hidden cursor-pointer border border-black/[0.06] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
    >
      <div className="relative h-64 overflow-hidden bg-gray-100">
        <div ref={imgRef} className="w-full h-full overflow-hidden">
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        </div>

        {artwork.isFeatured && (
          <span
            className="absolute top-3 right-3 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide shadow-md"
            style={{ backgroundColor: '#C9A227' }}
          >
            Featured
          </span>
        )}

        {artwork.likes?.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-black/55 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Heart size={12} fill="white" />
            <span>{artwork.likes.length}</span>
          </div>
        )}

        {artwork.views > 0 && (
          <div className="absolute bottom-3 right-3 bg-black/55 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Eye size={12} />
            <span>{artwork.views}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.15em] text-amber-700/70 font-medium mb-1.5">
          {artwork.category}
        </p>
        <h3 className="text-lg font-semibold mb-1.5 text-gray-900 leading-snug">{artwork.title}</h3>
        <p className="text-gray-500 mb-3 line-clamp-2 text-sm leading-relaxed">{artwork.description}</p>

        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleArtistClick}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <img
              src={artwork.artist?.profilePicture || '/default-avatar.png'}
              alt={artwork.artist?.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm text-gray-600 hover:text-amber-700">{artwork.artist?.name || 'Artist'}</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{artwork.medium}</span>
            <span>•</span>
            <span>{artwork.yearCreated}</span>
          </div>
        </div>

        {currentUser && currentUser.role !== 'admin' && currentUser._id !== artwork.artist?._id && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <RequestCommissionButton
              artistId={artwork.artist?._id}
              artistName={artwork.artist?.name || 'Artist'}
              variant="small"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtworkCard;