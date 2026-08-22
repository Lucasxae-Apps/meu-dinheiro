import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMes } from "@/lib/mes-context";
import { nomeMes } from "@/lib/finance";
import { Button } from "@/components/ui/button";

export function MesPicker() {
  const { mes, setMes, anterior, proximo } = useMes();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={anterior}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <input
        type="month"
        value={mes}
        onChange={(e) => setMes(e.target.value)}
        className="h-8 rounded-md border bg-transparent px-2 text-sm font-medium"
        aria-label="Selecionar mês"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={proximo}
        aria-label="Próximo mês"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

/** Versão compacta com animação de transição ao mudar de mês */
export function MesPickerCompact() {
  const { mes, anterior, proximo } = useMes();
  const [displayMes, setDisplayMes] = useState(mes);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const prevMes = useRef(mes);

  useEffect(() => {
    if (mes === prevMes.current) return;
    // Determina direção baseado na comparação de meses
    setDirection(mes > prevMes.current ? "right" : "left");
    // Após a animação de saída, atualiza o texto e anima entrada
    const timeout = setTimeout(() => {
      setDisplayMes(mes);
      setDirection(null);
    }, 150);
    prevMes.current = mes;
    return () => clearTimeout(timeout);
  }, [mes]);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 active:scale-90 transition-transform"
        onClick={anterior}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="size-3.5" />
      </Button>
      <span
        className={`min-w-[9rem] text-center text-sm font-medium capitalize transition-all duration-150 ${
          direction === "left"
            ? "translate-x-2 opacity-0"
            : direction === "right"
              ? "-translate-x-2 opacity-0"
              : "translate-x-0 opacity-100"
        }`}
      >
        {displayMes ? nomeMes(displayMes) : ""}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 active:scale-90 transition-transform"
        onClick={proximo}
        aria-label="Próximo mês"
      >
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  );
}
