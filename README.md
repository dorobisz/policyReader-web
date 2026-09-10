# BrokerEngine — Frontend (React + TS + Vite)

Interfejs użytkownika systemu **BrokerEngine** do ekstrakcji danych z polis ubezpieczeniowych. Zbudowany w React + TypeScript na bazie Vite, stylowany Tailwind CSS według własnego Design Systemu.

---

## Tech Stack

| Technologia | Wersja | Rola |
|---|---|---|
| React | ^19 | UI framework |
| TypeScript | ^7 | Typowanie |
| Vite | ^8 | Bundler / Dev server |
| Tailwind CSS | ^3.4 | Stylowanie (custom design tokens) |
| react-router-dom | ^7 | Routing SPA |
| @tailwindcss/forms | ^0.5 | Plugin — reset formularzy |
| @tailwindcss/container-queries | ^0.1 | Plugin — container queries |

---

## Uruchomienie

```bash
npm install
npm run dev      # Dev server: http://localhost:5173
npm run build    # Build produkcyjny → /dist
npm run preview  # Podgląd buildu
```

---

## Struktura projektu

```
policyReader-web/
├── index.html                 # ✅ Entry HTML (Vite)
├── vite.config.ts             # ✅ Vite config (React plugin, @ alias)
├── tsconfig.json              # ✅ TypeScript strict mode config
├── tailwind.config.js         # ✅ Design tokens (kolory, typografia, spacing)
├── postcss.config.js          # ✅ PostCSS (Tailwind + Autoprefixer)
├── src/
│   ├── main.tsx               # ✅ Entry point (importuje index.css)
│   ├── index.css              # ✅ Globalne style (Tailwind, Inter, Material Symbols)
│   ├── vite-env.d.ts          # ✅ Vite client type declarations
│   ├── types/
│   │   └── api.ts             # ✅ Interfejsy TS: Batch, PolicyRecord, StatsMetrics, DTO
│   ├── services/
│   │   └── api.ts             # ✅ Serwis komunikacji z API i fallback localStorage
│   ├── components/
│   │   ├── index.ts           # ✅ Re-eksporty komponentów i typów
│   │   ├── AppLayout.tsx      # ✅ Główny szablon (fixowany sidebar, TopAppBar, scrollowany main)
│   │   ├── SideNavBar.tsx     # ✅ Pasek boczny nawigacji (NavLink, active states, drawer support)
│   │   ├── StatusBadge.tsx    # ✅ Dynamiczny badge statusów paczek i polis
│   │   ├── ProgressBar.tsx    # ✅ Komponent paska postępu z kolorami statusów
│   │   └── MetricCard.tsx     # ✅ Karta metryki Bento Grid ze stanem ładowania
│   └── pages/
│       ├── DashboardView.tsx  # ✅ Ścieżka / (Overview, Bento Grid, Recent Batches)
│       ├── Upload.tsx         # [TODO] Ścieżka /upload
│       ├── BatchStatus.tsx    # [TODO] Ścieżka /jobs/:batch_id
│       └── BatchResults.tsx   # [TODO] Ścieżka /result/:batch_id
├── screen_mockups/            # Makiety HTML Design Systemu
├── REACT_IMPLEMENTATION_PLAN.md
└── .agents/rules/global_directive.md
```

---

## Zaimplementowane komponenty i strony

| Komponent / Plik | Status | Opis |
|---|---|---|
| `tailwind.config.js` | ✅ Ukończono | Pełny design system: kolory, typografia, spacing, borderRadius |
| `postcss.config.js` | ✅ Ukończono | Integracja PostCSS z Tailwind + Autoprefixer |
| `src/index.css` | ✅ Ukończono | Import Inter, Material Symbols Outlined, dyrektywy Tailwind, animacja pulse |
| `index.html` | ✅ Ukończono | Entry HTML z preconnect do Google Fonts |
| `vite.config.ts` | ✅ Ukończono | Plugin React, alias @ → src/ |
| `tsconfig.json` | ✅ Ukończono | TypeScript strict mode, JSX react-jsx |
| `src/main.tsx` | ✅ Ukończono | Routing aplikacji (`/`, `/upload`, `/jobs/:batchId`, `/result/:batchId`) |
| `src/vite-env.d.ts` | ✅ Ukończono | Deklaracje typów Vite client |
| `src/types/api.ts` | ✅ Ukończono | DTO FastAPI i modele UI: Batch, PolicyRecord, StatsMetrics, Upload |
| `src/services/api.ts` | ✅ Ukończono | Warstwa API klienta z obsługą pobierania metryk i paczek oraz fallbackiem demonstracyjnym |
| `src/components/AppLayout.tsx` | ✅ Ukończono | Główny layout aplikacji: fixowany sidebar (desktop), drawer (mobile), sticky TopAppBar, scrollowany main (`<Outlet />`) |
| `src/components/SideNavBar.tsx` | ✅ Ukończono | Pasek boczny nawigacji: `NavLink` z akcentem wizualnym, profilem brokera i obsługą drawera mobilnego |
| `src/components/StatusBadge.tsx` | ✅ Ukończono | Dynamiczna odznaka statusu paczki/polisy (Processing/Completed/Failed/Pending) z animacją i kolorystyką Design Systemu |
| `src/components/ProgressBar.tsx` | ✅ Ukończono | Pasek postępu przetwarzania paczki z automatyczną kolorystyką na podstawie statusu |
| `src/components/MetricCard.tsx` | ✅ Ukończono | Karta metryki Bento Grid z obsługą wartości, jednostek i stanu szkieletu ładowania |
| `src/components/index.ts` | ✅ Ukończono | Centralny punkt eksportu komponentów UI i ich typów |
| `src/pages/DashboardView.tsx` (`/`) | ✅ Ukończono | Widok Overview: Bento Grid (3 metryki), filtrowalna tabela Recent Batches z paginacją i linkami do `/jobs/{id}` |
| `Upload` (`/upload`) | ⏳ Planowany | Drag & Drop + walidacja PDF |
| `BatchStatus` (`/jobs/:id`) | ⏳ Planowany | Polling statusu, progress bar, logi |
| `BatchResults` (`/result/:id`) | ⏳ Planowany | Tabela wyników, eksport CSV |

---

## Endpointy API (Backend)

| Strona | Metoda | Endpoint | Opis |
|---|---|---|---|
| Upload | `POST` | `/upload` | Wysyłka plików PDF (multipart/form-data), zwraca `batch_id` |
| BatchStatus | `GET` | `/jobs/{batch_id}/status` | Polling: status paczki, progress, błędy plików |
| BatchResults | `GET` | `/jobs/{batch_id}/results` | Komplet wyekstrahowanych rekordów `PolicyRecordResponse` |
| BatchResults | `GET` | `/jobs/{batch_id}/export/csv` | Eksport danych do pliku CSV z BOM UTF-8-SIG |
| Dashboard | `GET` | *(wymagany)* | Zagregowane metryki + lista ostatnich paczek |

---

## Design System

Paleta kolorów, typografia i spacing zdefiniowane w `tailwind.config.js` na podstawie `screen_mockups/DESIGN.md`.  
Font: **Inter** (400–900). Ikony: **Material Symbols Outlined** (variable font, Google Fonts).
