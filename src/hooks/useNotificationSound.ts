import { useCallback, useEffect, useRef } from "react";
import { NotificationType, NotificationCategory } from "@/contexts/NotificationContext";
import { haptic, HapticPattern } from "@/lib/haptics";

/**
 * Platform-wide notification sound system.
 * Each notification category + type gets a unique melodic signature.
 */

type SoundEvent =
  | "booking_success"
  | "booking_warning"
  | "booking_info"
  | "payment_success"
  | "payment_warning"
  | "payment_info"
  | "promotion_success"
  | "promotion_info"
  | "system_success"
  | "system_warning"
  | "system_info"
  | "wallet_credit"
  | "wallet_debit"
  | "gift_card"
  | "message_received"
  | "generic";

interface ToneNote {
  freq: number;
  duration: number; // ms
  type: OscillatorType;
}

// Unique melodic signatures per event
const SOUND_MAP: Record<SoundEvent, ToneNote[]> = {
  // Booking — warm major chords
  booking_success: [
    { freq: 523, duration: 120, type: "sine" },
    { freq: 659, duration: 120, type: "sine" },
    { freq: 784, duration: 200, type: "sine" },
  ],
  booking_warning: [
    { freq: 440, duration: 150, type: "triangle" },
    { freq: 415, duration: 150, type: "triangle" },
    { freq: 440, duration: 200, type: "triangle" },
  ],
  booking_info: [
    { freq: 587, duration: 100, type: "sine" },
    { freq: 659, duration: 160, type: "sine" },
  ],

  // Payment — cash-register style
  payment_success: [
    { freq: 880, duration: 60, type: "square" },
    { freq: 1108, duration: 60, type: "square" },
    { freq: 1318, duration: 100, type: "square" },
    { freq: 1760, duration: 180, type: "sine" },
  ],
  payment_warning: [
    { freq: 330, duration: 200, type: "sawtooth" },
    { freq: 294, duration: 250, type: "sawtooth" },
  ],
  payment_info: [
    { freq: 698, duration: 80, type: "sine" },
    { freq: 784, duration: 120, type: "sine" },
  ],

  // Promotion — playful ascending
  promotion_success: [
    { freq: 392, duration: 80, type: "sine" },
    { freq: 523, duration: 80, type: "sine" },
    { freq: 659, duration: 80, type: "sine" },
    { freq: 784, duration: 160, type: "sine" },
  ],
  promotion_info: [
    { freq: 523, duration: 100, type: "triangle" },
    { freq: 659, duration: 140, type: "triangle" },
  ],

  // System — neutral, clean
  system_success: [
    { freq: 600, duration: 100, type: "sine" },
    { freq: 800, duration: 150, type: "sine" },
  ],
  system_warning: [
    { freq: 400, duration: 180, type: "triangle" },
    { freq: 350, duration: 220, type: "triangle" },
  ],
  system_info: [
    { freq: 500, duration: 120, type: "sine" },
  ],

  // Wallet — coin drop / cha-ching
  wallet_credit: [
    { freq: 1047, duration: 50, type: "square" },
    { freq: 1319, duration: 50, type: "square" },
    { freq: 1568, duration: 80, type: "sine" },
    { freq: 2093, duration: 200, type: "sine" },
  ],
  wallet_debit: [
    { freq: 784, duration: 80, type: "triangle" },
    { freq: 659, duration: 100, type: "triangle" },
    { freq: 523, duration: 140, type: "triangle" },
  ],

  // Gift card — sparkle
  gift_card: [
    { freq: 1047, duration: 60, type: "sine" },
    { freq: 1319, duration: 60, type: "sine" },
    { freq: 1568, duration: 60, type: "sine" },
    { freq: 1319, duration: 60, type: "sine" },
    { freq: 1568, duration: 60, type: "sine" },
    { freq: 2093, duration: 200, type: "sine" },
  ],

  // Chat message — short blip
  message_received: [
    { freq: 800, duration: 60, type: "sine" },
    { freq: 1000, duration: 80, type: "sine" },
  ],

  // Fallback
  generic: [
    { freq: 660, duration: 120, type: "sine" },
  ],
};

const HAPTIC_MAP: Record<SoundEvent, HapticPattern> = {
  booking_success: "success",
  booking_warning: "warning",
  booking_info: "light",
  payment_success: "success",
  payment_warning: "warning",
  payment_info: "light",
  promotion_success: "success",
  promotion_info: "selection",
  system_success: "medium",
  system_warning: "warning",
  system_info: "light",
  wallet_credit: "success",
  wallet_debit: "medium",
  gift_card: "success",
  message_received: "selection",
  generic: "light",
};

function resolveSoundEvent(
  category?: NotificationCategory,
  type?: NotificationType,
  custom?: SoundEvent
): SoundEvent {
  if (custom) return custom;

  const key = `${category || "system"}_${type || "info"}`;
  if (key in SOUND_MAP) return key as SoundEvent;

  // Fallback by category
  const catFallback = `${category || "system"}_info`;
  if (catFallback in SOUND_MAP) return catFallback as SoundEvent;

  return "generic";
}

interface UseNotificationSoundOptions {
  volume?: number;
  enabled?: boolean;
  hapticsEnabled?: boolean;
}

export function useNotificationSound(options: UseNotificationSoundOptions = {}) {
  const { volume = 0.25, enabled = true, hapticsEnabled = true } = options;
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPlayRef = useRef<number>(0);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback(
    (event: SoundEvent) => {
      if (!enabled) return;

      // Debounce: 300ms
      const now = Date.now();
      if (now - lastPlayRef.current < 300) return;
      lastPlayRef.current = now;

      try {
        const ctx = getCtx();
        const notes = SOUND_MAP[event] || SOUND_MAP.generic;

        let offset = 0;
        notes.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = note.type;
          osc.frequency.value = note.freq;

          const start = ctx.currentTime + offset / 1000;
          const end = start + note.duration / 1000;

          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(volume, start + 0.008);
          gain.gain.linearRampToValueAtTime(0, end);

          osc.start(start);
          osc.stop(end + 0.05);
          offset += note.duration;
        });

        // Haptics
        if (hapticsEnabled) {
          haptic(HAPTIC_MAP[event] || "light");
        }
      } catch (e) {
        console.debug("Notification sound failed:", e);
      }
    },
    [enabled, volume, hapticsEnabled, getCtx]
  );

  /** Play by notification category + type */
  const playForNotification = useCallback(
    (category?: NotificationCategory, type?: NotificationType) => {
      playSound(resolveSoundEvent(category, type));
    },
    [playSound]
  );

  /** Play a specific named sound event */
  const play = useCallback(
    (event: SoundEvent) => {
      playSound(event);
    },
    [playSound]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  return { play, playForNotification };
}

export type { SoundEvent };
