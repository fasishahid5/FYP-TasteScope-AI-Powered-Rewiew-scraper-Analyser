import React, { useEffect, useRef, useState } from 'react'

// Simple in-memory cache for fetched image object URLs to avoid re-downloading
const imageCache = new Map(); // src -> { status: 'loaded', url } or { status: 'loading', promise }

async function fetchImageObjectUrl(src) {
  if (!src) return null;
  const cached = imageCache.get(src);
  if (cached) {
    if (cached.status === 'loaded') return cached.url;
    if (cached.status === 'loading') return cached.promise;
  }

  const p = (async () => {
    try {
      const res = await fetch(src, { cache: 'force-cache', mode: 'cors' });
      if (!res.ok) throw new Error('Image fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      imageCache.set(src, { status: 'loaded', url });
      return url;
    } catch (err) {
      imageCache.delete(src);
      return null;
    }
  })();

  imageCache.set(src, { status: 'loading', promise: p });
  return p;
}

function LazyImage({ src, alt, className, style, fallback }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!src) return;
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading; let the <img> handle it and still use cache fetch for blob
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  useEffect(() => {
    let mounted = true;
    if (!visible) return () => { mounted = false };
    setLoading(true);
    fetchImageObjectUrl(src).then((url) => {
      if (!mounted) return;
      setObjectUrl(url);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setObjectUrl(null);
      setLoading(false);
    });
    return () => { mounted = false };
  }, [visible, src]);

  // If browser supports native lazy loading and we didn't fetch blob, render normal img with loading="lazy"
  const useNative = 'loading' in HTMLImageElement.prototype;

  return (
    <div ref={ref} className={className} style={{ position: 'relative', ...style }}>
      {/* Skeleton / blur-up placeholder */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg,#f1f5f9,#eef2ff)',
        display: loading || (!objectUrl && !useNative) ? 'block' : 'none'
      }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 9999, background: '#e6eefc' }} />
        </div>
      </div>

      {objectUrl ? (
        <img
          src={objectUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'filter 400ms ease, opacity 400ms ease', filter: loading ? 'blur(8px)' : 'none', opacity: loading ? 0.9 : 1 }}
        />
      ) : useNative ? (
        <img src={src} alt={alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 300ms ease' }} />
      ) : (
        // final fallback when not yet loaded
        <div style={{ width: '100%', height: '100%', background: fallback || 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }} />
      )}
    </div>
  );
}

export default function RestaurantCard({
  name,
  status = 'Closed',
  image,
  rating = 0,
  category,
  address,
  distance,
  totalReviews,
  sentiment = 'Negative 0%',
  onPrimaryAction,
}) {
  const negativeMatch = /negative\s*(\d+)%/i.exec(sentiment)
  const percent = negativeMatch ? Number(negativeMatch[1]) : 0
  const barColor = percent >= 50 ? 'from-red-500 to-yellow-400' : 'from-emerald-400 to-lime-400'

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
      <div className="relative h-44 w-full">
        <LazyImage src={image} alt={name} style={{ width: '100%', height: '100%' }} className="" fallback={'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'} />
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${status === 'Open' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'}`}>
          {status}
        </span>
      </div>

      <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-2">
          <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-300 mt-0.5 truncate">{category} · {address}</p>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center text-yellow-500">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.174c.969 0 1.371 1.24.588 1.81l-3.378 2.455a1 1 0 00-.364 1.118l1.286 3.965c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.378 2.455c-.784.57-1.84-.197-1.54-1.118l1.286-3.965a1 1 0 00-.364-1.118L2.627 9.392c-.783-.57-.38-1.81.588-1.81h4.174a1 1 0 00.95-.69l1.286-3.965z" />
              </svg>
              <span className="ml-0.5 text-xs font-medium text-gray-900 dark:text-gray-100">{rating}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-300">{distance}</div>
            <div className="text-xs text-gray-500 dark:text-gray-300">{totalReviews}</div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-start">
          <button
            onClick={onPrimaryAction}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-label="action"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-3 py-2">
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Analysis</div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div className={`h-2 rounded-full bg-gradient-to-r ${barColor}`} style={{ width: `${percent}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="text-xs text-gray-600 dark:text-gray-300">{sentiment}</div>
          <div className="text-xs font-medium text-gray-700 dark:text-gray-200">{totalReviews}</div>
        </div>
      </div>
    </div>
  )
}
