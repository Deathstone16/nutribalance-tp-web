'use client';

import type { MouseEvent, ReactNode } from 'react';

export default function SmoothAnchor({
  href,
  children,
}: {
  href: `#${string}`;
  children: ReactNode;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const target = document.getElementById(decodeURIComponent(href.slice(1)));
    if (!target) return;

    event.preventDefault();
    window.history.pushState(null, '', href);
    const mobileMenu = event.currentTarget.closest('details.mobile-nav');
    if (mobileMenu) mobileMenu.removeAttribute('open');
    const scroll = () => {
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 32);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo(0, top);
      } else {
        window.scrollTo({ top, behavior: 'smooth' });
      }
    };
    if (mobileMenu) window.requestAnimationFrame(scroll);
    else scroll();
  }

  return (
    <a href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
