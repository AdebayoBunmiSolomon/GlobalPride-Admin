import { useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

/** Calls `onIdle` once after `timeoutMs` with no mouse, keyboard, scroll or touch activity. */
export const useIdleTimeout = (timeoutMs: number, onIdle: () => void) => {
  // Keep the latest callback without restarting the timer when it changes.
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    let timer = window.setTimeout(() => onIdleRef.current(), timeoutMs);
    let lastReset = Date.now();

    const reset = () => {
      // mousemove fires constantly; restarting the timer once a second is plenty.
      if (Date.now() - lastReset < 1000) return;
      lastReset = Date.now();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => onIdleRef.current(), timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset, { passive: true, capture: true }));
    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset, { capture: true }));
    };
  }, [timeoutMs]);
};
