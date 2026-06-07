import { useState, useEffect } from 'react';

export function useTimeTelemetry() {
  const [timeStr, setTimeStr] = useState('');
  const [msStr, setMsStr] = useState('');

  useEffect(() => {
    let req: number;
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0').substring(0, 2);
      setTimeStr(`${h}:${m}:${s}`);
      setMsStr(`.${ms}`);
      req = requestAnimationFrame(tick);
    };
    req = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(req);
  }, []);

  return { timeStr, msStr };
}
