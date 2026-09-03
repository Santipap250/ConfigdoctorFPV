/** Flight Deck Atelier component: measured numeric readout with a restrained, data-first transition. */
import { useEffect, useRef, useState } from "react";

function decimalsFor(value: string) {
  const match = value.match(/\.(\d+)/);
  return Math.min(match?.[1]?.length ?? 0, 2);
}

function formatNumber(value: number, decimals: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
    useGrouping: false,
  }).format(value);
}

export function AnimatedNumber({ value, numericValue }: { value: string; numericValue?: number }) {
  const target = numericValue ?? Number(value.replace(/,/g, ""));
  const decimals = decimalsFor(value);
  const [displayValue, setDisplayValue] = useState(target);
  const [animating, setAnimating] = useState(false);
  const previousValue = useRef(target);
  const initialized = useRef(false);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    if (!initialized.current) {
      previousValue.current = target;
      setDisplayValue(target);
      initialized.current = true;
      return;
    }
    if (Object.is(previousValue.current, target)) return;

    const start = previousValue.current;
    previousValue.current = target;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplayValue(target);
      setAnimating(false);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = 420;
    setAnimating(true);

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + (target - start) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplayValue(target);
        setAnimating(false);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <span className="metric-card__number" data-animating={animating} aria-live="polite">
      {formatNumber(displayValue, decimals)}
    </span>
  );
}
