import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, X } from 'lucide-react';

interface RestTimerProps {
  initialSeconds: number;
  onComplete: () => void;
  onClose: () => void;
}

export default function RestTimer({ initialSeconds, onComplete, onClose }: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notification
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((sec) => sec - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed', e));
      }
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, onComplete]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-2xl p-4 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex flex-col">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Rest Timer</span>
        <span className="text-2xl font-mono font-bold text-white">{formatTime(seconds)}</span>
      </div>
      
      <div className="flex items-center gap-2 border-l border-zinc-800 pl-4 ml-2">
        <button 
          onClick={() => setIsActive(!isActive)}
          className="p-2 rounded-full hover:bg-zinc-800 text-white transition-colors"
        >
          {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => {
            setSeconds(0);
            setIsActive(false);
            onComplete();
          }}
          className="p-2 rounded-full hover:bg-zinc-800 text-white transition-colors"
        >
          <SkipForward className="w-5 h-5" />
        </button>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
