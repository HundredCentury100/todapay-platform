import { useState, useEffect } from 'react';

export function useThemeDetect() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark' ||
        (localStorage.getItem('theme') === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );

    check();

    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', check);

    return () => {
      obs.disconnect();
      mq.removeEventListener('change', check);
    };
  }, []);

  return isDark;
}
