import { createContext, useContext, useState, type ReactNode } from "react";

const mesAtual = () => new Date().toISOString().slice(0, 7);

type MesContextType = {
  mes: string; // yyyy-mm
  setMes: (mes: string) => void;
  anterior: () => void;
  proximo: () => void;
};

const MesContext = createContext<MesContextType | null>(null);

export function MesProvider({ children }: { children: ReactNode }) {
  const [mes, setMes] = useState(mesAtual);

  function anterior() {
    setMes((m) => {
      const [y, mo] = m.split("-").map(Number) as [number, number];
      const d = new Date(y, mo - 2, 1);
      return d.toISOString().slice(0, 7);
    });
  }

  function proximo() {
    setMes((m) => {
      const [y, mo] = m.split("-").map(Number) as [number, number];
      const d = new Date(y, mo, 1);
      return d.toISOString().slice(0, 7);
    });
  }

  return (
    <MesContext.Provider value={{ mes, setMes, anterior, proximo }}>
      {children}
    </MesContext.Provider>
  );
}

export function useMes() {
  const ctx = useContext(MesContext);
  if (!ctx) throw new Error("useMes precisa estar dentro de MesProvider");
  return ctx;
}
