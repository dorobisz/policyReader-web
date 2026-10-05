# BrokerEngine / PolicyReader — Frontend (React + TS + Vite)

Interfejs użytkownika systemu **BrokerEngine** ze zorientowaną domenowo architekturą modułową (Feature-based Architecture).
Głównym modułem produkcyjnym jest **Czytnik Dowodów Rejestracyjnych** (ekstrakcja kodów Aztec 2D i danych OCR ze zdjęć dowodów rejestracyjnych pojazdów w formacie JPG).

---

## Tech Stack

| Technologia | Wersja | Rola |
|---|---|---|
| React | ^19 | UI framework |
| TypeScript | ^5.9 | Typowanie w trybie ścisłym (Strict Mode) |
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

## Architektura i Struktura Pakietów (Feature-based Architecture)

Projekt stosuje modularyzację domenową, oddzielając komponenty wspólne UI (`components/`) od pakietów funkcjonalnych (`features/`). Zapewnia to izolację obecnego czytnika dowodów rejestracyjnych oraz bezkolizyjne wpinanie przyszłych modułów (np. analizatora polis).

```
policyReader-web/
├── .agents/
│   └── rules/
│       ├── forbidden-directory.md  # 🛡️ Nadrzędna reguła: zakaz dostępu do katalogu "Zakazane"
│       ├── workspace-boundary.md   # 🛡️ Nadrzędna reguła: zakaz wychodzenia poza projekt
│       └── global_directive.md     # Dyrektywy pracy agenta frontendowego
├── AGENTS.md                       # 🛡️ Nadrzędne dyrektywy bezpieczeństwa agenta
├── index.html                      # Entry HTML (Vite)
├── vite.config.ts                  # Vite config (React plugin, @ alias)
├── tsconfig.json                   # TypeScript strict mode config
├── tailwind.config.js              # Design tokens (kolory, typografia, spacing)
├── postcss.config.js               # PostCSS (Tailwind + Autoprefixer)
├── src/
│   ├── main.tsx                    # Entry point & Routing SPA
│   ├── index.css                   # Globalne style (Tailwind, Inter, Material Symbols)
│   ├── vite-env.d.ts               # Vite client type declarations
│   ├── types/
│   │   └── api.ts                  # Interfejsy TS: Batch, PolicyRecord, VehicleRegistrationData, DTO
│   ├── services/
│   │   └── api.ts                  # Serwis komunikacji z API i fallbacki demonstracyjne
│   ├── config/
│   │   ├── appConfig.ts            # Konfiguracja limitów i rozszerzeń (wyłącznie JPG dla dowodów)
│   │   └── vehicleFields.ts        # Rubryki urzędowe PWPW dowodów rejestracyjnych
│   ├── hooks/
│   │   ├── useAppSettings.ts       # Hook pobierania/zapisu konfiguracji tenanta
│   │   └── useVehicleCopySettings.ts # Hook konfiguracji pól schowka Excela
│   ├── components/                 # Wspólne reużywalne komponenty UI
│   │   ├── index.ts                # Re-eksporty komponentów layoutu i common
│   │   ├── common/
│   │   │   ├── ErrorBoundary.tsx   # React Error Boundary
│   │   │   ├── MetricCard.tsx      # Bento Grid Metric Card
│   │   │   ├── ProgressBar.tsx     # Pasek postępu przetwarzania
│   │   │   ├── StatusBadge.tsx     # Badge statusów paczek i dokumentów
│   │   │   └── Toast.tsx           # System powiadomień Toast (Context + Hook)
│   │   └── layout/
│   │       ├── AppLayout.tsx       # Główny layout (sidebar, TopAppBar, scrollowany main)
│   │       └── SideNavBar.tsx      # Pasek boczny nawigacji (Dowody rejestracyjne, Ustawienia)
│   └── features/                   # Pakiety domenowe
│       ├── vehicle-registration/   # Moduł: Czytnik Dowodów Rejestracyjnych
│       │   ├── pages/
│       │   │   ├── VehicleRegBatchesView.tsx # Ścieżka / (Paczki dowodów, metryki, przycisk Wgraj dowody)
│       │   │   ├── VehicleRegUploadView.tsx  # Ścieżka /upload (Tylko JPG, wskazówka o 1. stronie dowodu)
│       │   │   ├── VehicleRegStatusView.tsx  # Ścieżka /jobs/:batchId (Postęp odczytu Aztec/OCR na żywo)
│       │   │   └── VehicleRegResultsView.tsx # Ścieżka /result/:batchId (Tabela dowodów, modal, eksport CSV)
│       │   ├── components/
│       │   │   ├── VehicleRegTable.tsx       # Tabela wyników dowodów rejestracyjnych
│       │   │   ├── VehicleRegDetailCard.tsx  # Karta szczegółów, 5 sekcji, kopiowanie do Excela/JSON
│       │   │   └── VehicleRegDetailModal.tsx # Szybki podgląd surowego JSON i metadanych
│       │   └── index.ts            # Barrel export modułu dowodów
│       └── settings/               # Moduł: Ustawienia
│           ├── pages/
│           │   └── SettingsView.tsx # Ścieżka /settings (Ustawienia schowka dowodów, retencja danych)
│           ├── components/
│           │   └── VehicleCopyFieldsConfig.tsx # Konfigurator kolejności rubryk schowka (Drag & Drop)
│           └── index.ts            # Barrel export modułu ustawień
└── REACT_IMPLEMENTATION_PLAN.md    # Rejestr postępu prac wdrożeniowych
```

---

## Aktywne Ścieżki i Komponenty Widoków

| Ścieżka URL | Komponent Widoku | Moduł | Opis |
|---|---|---|---|
| `/` | `VehicleRegBatchesView` | `features/vehicle-registration` | Główny pulpit paczek dowodów rejestracyjnych, metryki skuteczności, szybki przycisk „Wgraj dowody” |
| `/upload` | `VehicleRegUploadView` | `features/vehicle-registration` | Wgrywanie zdjęć dowodów rejestracyjnych (wyłącznie format JPG), baner z instrukcją o skanowaniu 1. strony |
| `/jobs/:batchId` | `VehicleRegStatusView` | `features/vehicle-registration` | Monitorowanie postępu odczytu dowodu na żywo (fazy: orientacja, Aztec 2D, MRZ, segmentacja OCR, normalizacja) |
| `/result/:batchId` | `VehicleRegResultsView` | `features/vehicle-registration` | Tabela odczytanych dowodów rejestracyjnych (nr rej, VIN, marka, rok), wyszukiwanie, modal szczegółów, eksport CSV |
| `/settings` | `SettingsView` | `features/settings` | Ustawienia pól kopiowania rubryk dowodów rejestracyjnych do Excela oraz retencji danych w bazie |

---

## Punkty Styku z API Backendowym (`policyReader`)

- `POST /api/v1/policies/upload` — przesyłanie zdjęć JPG dowodów rejestracyjnych (zwraca `batch_id`).
- `GET /api/v1/policies/jobs/{batch_id}/status` — odpytywanie o postęp odczytu paczki w czasie rzeczywistym.
- `GET /api/v1/policies/jobs/{batch_id}/results` — pobieranie odczytanych danych dowodów (rekordy z polami `numer_rejestracyjny`, `vin`, itp.).
- `GET /api/v1/policies/jobs/{batch_id}/export/csv?doc_type=vehicle_registration` — eksport CSV dowodów (UTF-8-SIG).
- `DELETE /api/v1/policies/batches/{batch_id}` — usuwanie paczki dowodów rejestracyjnych.
- `DELETE /api/v1/policies/batches/{batch_id}/records/{record_id}` — usuwanie pojedynczego zdjęcia z paczki.
