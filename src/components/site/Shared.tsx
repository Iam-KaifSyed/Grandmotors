import { createElement } from 'react';
import { useReveal } from './useReveal';

export function Reveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const { ref } = useReveal<HTMLElement>();
  return createElement(
    as,
    {
      ref,
      className: `gm-reveal ${className}`,
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  align?: 'left' | 'center';
}) {
  const isCenter = align === 'center';
  return (
    <div className={`max-w-2xl ${isCenter ? 'mx-auto text-center' : ''}`}>
      <Reveal className={`flex items-center gap-2.5 mb-5 ${isCenter ? 'justify-center' : ''}`}>
        <span className="w-6 h-px bg-[var(--gm-accent-primary)]" />
        <span className="text-[11px] font-semibold tracking-[0.3em] text-[var(--gm-accent-primary)] uppercase">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal
        as="h2"
        delay={80}
        className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-[var(--gm-text-primary)] leading-[1.03] uppercase"
      >
        {title}
      </Reveal>
      {intro && (
        <Reveal
          as="p"
          delay={160}
          className="mt-5 text-sm md:text-[15px] leading-relaxed text-[var(--gm-text-secondary)]"
        >
          {intro}
        </Reveal>
      )}
    </div>
  );
}
