"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

const client = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((m: string) => {
    setMessage(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2600);
  }, []);
  return (
    <ConvexProvider client={client}>
      <ToastContext.Provider value={toast}>
        {children}
        <div className={`toast${message ? " show" : ""}`} role="status" aria-live="polite"><span>{message}</span></div>
      </ToastContext.Provider>
    </ConvexProvider>
  );
}
