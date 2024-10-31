import { useEffect, useRef, useState } from 'react';

export const AnimatedNumber = ({ value, className }: { value: number; className?: string }) => {
  const elementRef = useRef<HTMLSpanElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [currentNumber, setCurrentNumber] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isIntersecting) return;

    let startTimestamp: number | null = null;
    const duration = 200; // 1秒間

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;

      const progress = timestamp - startTimestamp;
      const rate = Math.min(progress / duration, 1);

      const easeOutRate = 1 - Math.pow(1 - rate, 3);

      const currentNum = Math.round(easeOutRate * value);
      setCurrentNumber(currentNum);

      if (progress < duration) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, isIntersecting]);

  return (
    <span
      ref={elementRef}
      className={`text-[32px] font-bold leading-[120%] tracking-[0.04em] text-[#1ABC9C] ${className}`}
    >
      {currentNumber.toLocaleString()}
    </span>
  );
};
