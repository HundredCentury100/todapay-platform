import { useCallback, useEffect, useRef } from "react";

type RideEvent = 
  | 'driver_found'
  | 'driver_approaching'
  | 'driver_arrived'
  | 'ride_started'
  | 'ride_completed'
  | 'new_bid'
  | 'bid_accepted'
  | 'message_received'
  | 'eta_update';

interface AudioHapticsOptions {
  audioEnabled?: boolean;
  hapticsEnabled?: boolean;
  volume?: number;
}

const HAPTIC_PATTERNS: Record<RideEvent, number[]> = {
  driver_found: [100, 50, 100, 50, 200],
  driver_approaching: [50, 30, 50],
  driver_arrived: [200, 100, 200, 100, 300],
  ride_started: [100, 50, 100],
  ride_completed: [100, 50, 100, 50, 100, 50, 300],
  new_bid: [50, 30, 50],
  bid_accepted: [100, 50, 200],
  message_received: [30, 20, 30],
  eta_update: [30],
};

const TONE_FREQUENCIES: Record<RideEvent, number[]> = {
  driver_found: [523, 659, 784],
  driver_approaching: [440, 523],
  driver_arrived: [523, 659, 784, 880],
  ride_started: [392, 523],
  ride_completed: [523, 659, 784, 880, 1047],
  new_bid: [440, 554],
  bid_accepted: [523, 784],
  message_received: [659],
  eta_update: [440],
};

export const useRideAudioHaptics = (options: AudioHapticsOptions = {}) => {
  const { 
    audioEnabled = true, 
    hapticsEnabled = true,
    volume = 0.3 
  } = options;

  const audioContextRef = useRef<AudioContext | null>(null);
  const lastEventRef = useRef<{ event: RideEvent; time: number } | null>(null);

  // Initialize AudioContext lazily
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a sequence of tones
  const playToneSequence = useCallback((frequencies: number[], duration = 150) => {
    if (!audioEnabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = freq;

        const startTime = ctx.currentTime + (index * duration) / 1000;
        const endTime = startTime + duration / 1000;

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, endTime);

        oscillator.start(startTime);
        oscillator.stop(endTime + 0.1);
      });
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [audioEnabled, volume, getAudioContext]);

  // Trigger haptic feedback
  const triggerHaptics = useCallback((pattern: number[]) => {
    if (!hapticsEnabled) return;

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  }, [hapticsEnabled]);

  // Main trigger function
  const trigger = useCallback((event: RideEvent) => {
    // Debounce same events within 500ms
    const now = Date.now();
    if (lastEventRef.current?.event === event && now - lastEventRef.current.time < 500) {
      return;
    }
    lastEventRef.current = { event, time: now };

    // Trigger both audio and haptics
    playToneSequence(TONE_FREQUENCIES[event]);
    triggerHaptics(HAPTIC_PATTERNS[event]);
  }, [playToneSequence, triggerHaptics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Convenience methods for common events
  const onDriverFound = useCallback(() => trigger('driver_found'), [trigger]);
  const onDriverApproaching = useCallback(() => trigger('driver_approaching'), [trigger]);
  const onDriverArrived = useCallback(() => trigger('driver_arrived'), [trigger]);
  const onRideStarted = useCallback(() => trigger('ride_started'), [trigger]);
  const onRideCompleted = useCallback(() => trigger('ride_completed'), [trigger]);
  const onNewBid = useCallback(() => trigger('new_bid'), [trigger]);
  const onBidAccepted = useCallback(() => trigger('bid_accepted'), [trigger]);
  const onMessageReceived = useCallback(() => trigger('message_received'), [trigger]);
  const onEtaUpdate = useCallback(() => trigger('eta_update'), [trigger]);

  return {
    trigger,
    onDriverFound,
    onDriverApproaching,
    onDriverArrived,
    onRideStarted,
    onRideCompleted,
    onNewBid,
    onBidAccepted,
    onMessageReceived,
    onEtaUpdate,
  };
};
