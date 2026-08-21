'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

interface BreadcrumbContextValue {
  overrides: Record<string, string>;
  setOverride: (path: string, label: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const setOverride = useCallback((path: string, label: string) => {
    setOverrides((prev) => (prev[path] === label ? prev : { ...prev, [path]: label }));
  }, []);
  const value = useMemo(() => ({ overrides, setOverride }), [overrides, setOverride]);
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumbOverrides() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error('useBreadcrumbOverrides must be used within BreadcrumbProvider');
  return ctx;
}

export function useBreadcrumbLabel(path: string, label: string | undefined) {
  const { setOverride } = useBreadcrumbOverrides();
  useEffect(() => {
    if (label) setOverride(path, label);
  }, [path, label, setOverride]);
}
