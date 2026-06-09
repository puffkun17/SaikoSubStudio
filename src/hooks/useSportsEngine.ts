import { useState, useEffect, useCallback } from 'react';
import { fetchSportsMatches, MatchData } from '../utils/espnService';

const CACHE_KEY = 'sports_matches_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

const getRefreshInterval = (matches: MatchData[]): number => {
  const now = Date.now();
  // Live matches present
  const hasLive = matches.some(m => m.status === 'LIVE');
  if (hasLive) return 30 * 1000; // 30 seconds

  const nextMatch = matches.find(m => m.rawDate.getTime() > now);
  if (!nextMatch) return 10 * 60 * 1000; // 10 mins fallback

  const diff = nextMatch.rawDate.getTime() - now;
  if (diff < 0) return 30 * 1000; // 30s
  if (diff < 2 * 60 * 60 * 1000) return 60 * 1000; // 1 min (within 2 hours)
  if (diff < 24 * 60 * 60 * 1000) return 5 * 60 * 1000; // 5 mins (today)
  return 30 * 60 * 1000; // 30 mins (future)
};

export function useSportsEngine() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [liveIndex, setLiveIndex] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async (force = false) => {
    // Read cache first (skip on forced reload)
    if (!force) {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const { data, fetchedAt } = JSON.parse(raw);
          if (Date.now() - fetchedAt < CACHE_TTL) {
            const restored = data.map((m: any) => ({ ...m, rawDate: new Date(m.rawDate) }));
            setMatches(restored);
            const now = new Date();
            let nxt = restored.findIndex((m: any) => m.rawDate > now);
            if (nxt === -1) nxt = restored.length - 1;
            const safeNext = Math.max(0, nxt);
            setLiveIndex(safeNext);
            setFocusedIndex(safeNext);
            setDataReady(true);
            setErrorMsg('');
            return;
          }
        }
      } catch {}
    }

    try {
      const data = await fetchSportsMatches();
      setMatches(data);
      
      // Save cache
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
      } catch {}

      const now = new Date();
      let nxt = data.findIndex(m => m.rawDate > now);
      if (nxt === -1) nxt = data.length - 1;
      const safeNext = Math.max(0, nxt);
      setLiveIndex(safeNext);
      setFocusedIndex(safeNext);
      setDataReady(true);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch sports data');
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling with dynamic interval
  useEffect(() => {
    if (!dataReady || matches.length === 0) return;
    
    const interval = getRefreshInterval(matches);
    const iv = setInterval(() => loadData(true), interval);
    
    return () => clearInterval(iv);
  }, [matches, dataReady, loadData]);

  // Tab visibility focus reload
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  // Safe keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowRight' && focusedIndex < matches.length - 1) {
        setFocusedIndex(i => i + 1);
      }
      if (e.key === 'ArrowLeft' && focusedIndex > 0) {
        setFocusedIndex(i => i - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusedIndex, matches.length]);

  return {
    matches,
    liveIndex,
    focusedIndex,
    setFocusedIndex,
    dataReady,
    errorMsg,
    loadData
  };
}
