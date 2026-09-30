import { useQuery } from "@tanstack/react-query";

export type Cotacao = {
  par: string;
  label: string;
  valor: number;
  variacaoPct?: number | undefined;
};

/**
 * Cotações públicas, sem chave: câmbio via exchangerate-api (open.er-api.com)
 * e Bitcoin via CoinGecko. Nenhuma delas exige autenticação.
 */
export function useCotacoes() {
  return useQuery({
    queryKey: ["cotacoes"],
    queryFn: async (): Promise<Cotacao[]> => {
      const [cambioRes, btcRes] = await Promise.all([
        fetch("https://open.er-api.com/v6/latest/USD"),
        fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true",
        ),
      ]);

      const cotacoes: Cotacao[] = [];

      if (cambioRes.ok) {
        const cambio = (await cambioRes.json()) as { rates?: Record<string, number> };
        const usdBrl = cambio.rates?.["BRL"];
        const usdEur = cambio.rates?.["EUR"];
        if (usdBrl) cotacoes.push({ par: "USD-BRL", label: "Dólar", valor: usdBrl });
        if (usdBrl && usdEur) {
          cotacoes.push({ par: "EUR-BRL", label: "Euro", valor: usdBrl / usdEur });
        }
      }

      if (btcRes.ok) {
        const btc = (await btcRes.json()) as {
          bitcoin?: { brl?: number; brl_24h_change?: number };
        };
        if (btc.bitcoin?.brl) {
          cotacoes.push({
            par: "BTC-BRL",
            label: "Bitcoin",
            valor: btc.bitcoin.brl,
            variacaoPct: btc.bitcoin.brl_24h_change,
          });
        }
      }

      return cotacoes;
    },
    staleTime: 5 * 60 * 1000, // 5 min — não precisa ser em tempo real aqui
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
}
