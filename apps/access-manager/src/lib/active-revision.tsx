import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'access-manager:active-revision';

interface ActiveRevisionContextValue {
  revisionId: number | null;
  setRevisionId: (id: number | null) => void;
  clear: () => void;
}

const Ctx = createContext<ActiveRevisionContextValue | null>(null);

function readStored(): number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function ActiveRevisionProvider({ children }: { children: ReactNode }) {
  const [revisionId, setRev] = useState<number | null>(() => readStored());

  useEffect(() => {
    if (revisionId === null) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, String(revisionId));
  }, [revisionId]);

  const setRevisionId = useCallback((id: number | null) => setRev(id), []);
  const clear = useCallback(() => setRev(null), []);

  return (
    <Ctx.Provider value={{ revisionId, setRevisionId, clear }}>{children}</Ctx.Provider>
  );
}

export function useActiveRevision(): ActiveRevisionContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useActiveRevision must be used within ActiveRevisionProvider');
  return v;
}
