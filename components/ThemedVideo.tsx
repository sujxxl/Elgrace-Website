import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

export type ThemedVideoProps = {
  src: string;
  className?: string;
  containerClassName?: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  onError?: React.ReactEventHandler<HTMLVideoElement>;
  ariaLabel?: string;
};

export function ThemedVideo({
  src,
  className,
  containerClassName,
  poster,
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  preload = 'metadata',
  onError,
  ariaLabel = 'Video',
}: ThemedVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [isMuted, setIsMuted] = useState<boolean>(muted);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolume = () => setIsMuted(el.muted || el.volume === 0);

    el.addEventListener('play', handlePlay);
    el.addEventListener('pause', handlePause);
    el.addEventListener('volumechange', handleVolume);

    setIsPlaying(!el.paused);
    setIsMuted(el.muted || el.volume === 0);

    return () => {
      el.removeEventListener('play', handlePlay);
      el.removeEventListener('pause', handlePause);
      el.removeEventListener('volumechange', handleVolume);
    };
  }, [src]);

  const IconPlayPause = useMemo(() => (isPlaying ? Pause : Play), [isPlaying]);
  const IconAudio = useMemo(() => (isMuted ? VolumeX : Volume2), [isMuted]);

  const togglePlayPause = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (el.paused) {
        await el.play();
      } else {
        el.pause();
      }
    } catch {
      // Ignore autoplay/play failures (browser policy).
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    if (!el.muted && el.volume === 0) el.volume = 1;
    setIsMuted(el.muted || el.volume === 0);
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName ?? ''}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        className={className}
        onError={onError}
        aria-label={ariaLabel}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute bottom-2 right-2 flex gap-2">
          <button
            type="button"
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-full bg-white/90 border border-[#dfcda5] text-gray-900 hover:border-[#c9a961] shadow-sm flex items-center justify-center"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            <IconPlayPause className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-white/90 border border-[#dfcda5] text-gray-900 hover:border-[#c9a961] shadow-sm flex items-center justify-center"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            <IconAudio className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
