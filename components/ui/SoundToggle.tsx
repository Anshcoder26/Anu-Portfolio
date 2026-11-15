"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isSoundEnabled, loadSoundPreference, play, setSoundEnabled, subscribeSound } from "@/lib/sound";

/** Speaker button. Sound starts OFF; the choice is remembered. Position it via `className`. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const on = useSyncExternalStore(subscribeSound, isSoundEnabled, () => false);

  useEffect(() => {
    loadSoundPreference();
  }, []);

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      title={on ? "Sound on" : "Sound off"}
      onClick={() => {
        setSoundEnabled(!on);
        if (!on) play("chime");
      }}
      className={`grid size-11 place-items-center rounded-full bg-kraft text-ink shadow-[2px_3px_0_rgb(0_0_0/0.45)] outline-2 outline-dashed -outline-offset-[5px] outline-ink/50 transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-haldi ${className}`}
    >
      {on ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
    </button>
  );
}
