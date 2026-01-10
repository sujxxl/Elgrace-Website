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
  /** When enabled, video only plays while it is in the viewport. */
  playWhenInView?: boolean;
  /** Intersection threshold for in-view playback. */
  inViewThreshold?: number;
  /** If set, unmuting one video mutes the rest in the same group. */
  exclusiveAudioGroup?: string;
};

type ExclusiveAudioEvent = {
  group: string;
  id: string;
};

const EXCLUSIVE_AUDIO_EVENT = 'elgrace:exclusive-audio';

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
  playWhenInView = false,
  inViewThreshold = 0.6,
  exclusiveAudioGroup,
}: ThemedVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const instanceIdRef = useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `v_${Math.random().toString(16).slice(2)}`
  );
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

  // Viewport-based playback
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!playWhenInView) return;

    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const shouldPlay = entry.isIntersecting && entry.intersectionRatio >= inViewThreshold;
        if (shouldPlay) {
          // Keep muted by default; caller controls initial state.
          el.play().catch(() => {
            // ignore policy failures
          });
        } else {
          // Pause when out of view
          if (!el.paused) el.pause();
        }
      },
      { threshold: [0, inViewThreshold] }
    );

    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      void cancelled;
    };
  }, [playWhenInView, inViewThreshold, src]);

  // Exclusive audio (mute others in same group)
  useEffect(() => {
    if (!exclusiveAudioGroup) return;
    const el = videoRef.current;
    if (!el) return;

    const onExclusive = (evt: Event) => {
      const detail = (evt as CustomEvent<ExclusiveAudioEvent>).detail;
      if (!detail) return;
      if (detail.group !== exclusiveAudioGroup) return;
      if (detail.id === instanceIdRef.current) return;
      // Another video in this group was unmuted.
      if (!el.muted) {
        el.muted = true;
      }
    };

    window.addEventListener(EXCLUSIVE_AUDIO_EVENT, onExclusive as EventListener);
    return () => window.removeEventListener(EXCLUSIVE_AUDIO_EVENT, onExclusive as EventListener);
  }, [exclusiveAudioGroup]);

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
    const nextMuted = !el.muted;
    el.muted = nextMuted;
    if (!el.muted && el.volume === 0) el.volume = 1;

    if (!nextMuted && exclusiveAudioGroup) {
      window.dispatchEvent(
        new CustomEvent<ExclusiveAudioEvent>(EXCLUSIVE_AUDIO_EVENT, {
          detail: { group: exclusiveAudioGroup, id: instanceIdRef.current },
        })
      );
    }

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
            className="w-8 h-8 rounded-full bg-[#fdf4e3] border border-[#d8b56a] text-[#111827] hover:border-[#c9a961] shadow-sm flex items-center justify-center"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            <IconPlayPause className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-[#fdf4e3] border border-[#d8b56a] text-[#111827] hover:border-[#c9a961] shadow-sm flex items-center justify-center"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            <IconAudio className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
