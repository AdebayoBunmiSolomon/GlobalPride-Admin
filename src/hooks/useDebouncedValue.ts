import { useEffect, useState } from "react";

/** `value`, updated only once it has stopped changing for `delay` ms (e.g. search typed into an API query). */
export const useDebouncedValue = <T,>(value: T, delay = 350) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
