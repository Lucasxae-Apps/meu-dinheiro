import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard, ListPlus, PiggyBank, Receipt, Gamepad2 } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { MesProvider } from "../lib/mes-context";
import { MesPickerCompact } from "../components/mes-picker";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Essa tela não existe (ou mudou de lugar).
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Essa tela não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo quebrou aqui. Tenta de novo ou volta pro início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar de novo
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Lucas Barros" },
      { name: "color-scheme", content: "light dark" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const tabs = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/lancamentos", label: "Lançamentos", icon: ListPlus },
  { to: "/investimentos", label: "Investimentos", icon: PiggyBank },
  { to: "/contas", label: "Contas fixas", icon: Receipt },
  { to: "/hobby", label: "Hobby", icon: Gamepad2 },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <MesProvider>
        <div className="min-h-screen bg-background md:flex">
          {/* Sidebar — desktop only */}
          <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-56 md:flex-col md:border-r md:bg-card">
            <div className="px-5 py-6">
              <h1 className="text-base font-bold tracking-tight">Meu Dinheiro</h1>
            </div>
            <div className="px-3 pb-3">
              <MesPickerCompact />
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-3">
              {tabs.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 text-[10px] text-muted-foreground">
              Dados salvos na nuvem
            </div>
          </aside>

          {/* Main content */}
          <main className="w-full pb-20 md:pb-0 md:pl-56">
            {/* Mobile month picker */}
            <div className="sticky top-0 z-10 flex items-center justify-center border-b bg-background/95 py-2 backdrop-blur md:hidden">
              <MesPickerCompact />
            </div>
            <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8 xl:max-w-6xl 2xl:max-w-7xl">
              {/* Required: nested routes render here. */}
              <Outlet />
            </div>
          </main>

          {/* Bottom nav — mobile only */}
          <nav className="fixed inset-x-0 bottom-0 border-t bg-card/95 backdrop-blur md:hidden">
            <div className="mx-auto grid max-w-2xl grid-cols-5">
              {tabs.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  className="flex flex-col items-center gap-1 py-3 text-[11px] text-muted-foreground transition-colors"
                  activeProps={{ className: "text-primary font-semibold" }}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </MesProvider>
    </QueryClientProvider>
  );
}
