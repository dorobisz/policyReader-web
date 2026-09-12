# Zaktualizowany Plan Implementacji Frontendu BrokerEngine (React + TS + Vite)

Poniższy plan precyzuje proces budowy interfejsu, mapując poszczególne ekrany React bezpośrednio na strukturę plików makiet dostarczoną w katalogu `screen_mockups`. Plan zakłada wykorzystanie React, TypeScript, Vite oraz Tailwind CSS skonfigurowanego według dostarczonego Design Systemu.

## 1. Konfiguracja i Fundamenty (Mapowanie Design Systemu)

### ✅ Krok 1.1: Konfiguracja Tailwind CSS — Ukończono
*   **Źródło:** Dane z sekcji `colors`, `typography`, `rounded`, `spacing` w pliku `DESIGN`.
*   **Zadanie:** Aktualizacja `tailwind.config.js` w celu zdefiniowania customowych kolorów (np. `surface-bright`, `primary-container`), mapowania fontów Inter oraz zdefiniowania skal odstępów i zaokrągleń.
*   **Wykonane:**
    *   Stworzono `tailwind.config.js` z pełną paletą kolorów z Design Systemu.
    *   Zmapowano wszystkie skale `fontSize`, `fontFamily`, `borderRadius`, `spacing`.
    *   Skonfigurowano pluginy `@tailwindcss/forms` oraz `@tailwindcss/container-queries`.
    *   Stworzono `postcss.config.js`.
    *   Zainstalowano wszystkie zależności npm (React, Vite, TypeScript, Tailwind, react-router-dom).

### ✅ Krok 1.2: Globalne Style i Ikony — Ukończono
*   **Źródło:** Sekcja `<head>` w dostarczonych plikach HTML.
*   **Zadanie:** Dodanie importu fontu 'Inter' oraz konfiguracji Material Symbols Outlined do globalnego pliku CSS (`index.css`).
*   **Wykonane:**
    *   Stworzono `src/index.css` z dyrektywami `@tailwind base/components/utilities`.
    *   Dodano import `Inter` (warianty 400–900) przez Google Fonts.
    *   Dodano import `Material Symbols Outlined` (zmienna oś wght + FILL).
    *   Zdefiniowano klasę `.material-symbols-outlined` z `font-variation-settings` oraz warianty `.fill` / `.filled` / `[data-weight="fill"]`.
    *   Przeniesiono animację `.progress-pulse` z makiet do globalnego CSS.
    *   Stworzono pliki scaffold Vite: `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `vite.config.ts`, `tsconfig.json`.
    *   Zweryfikowano poprawność buildu (`vite build` — 0 errors, 0 warnings).

### ✅ Krok 1.3: Definicje Typów TS (DTO) — Ukończono
*   **Źródło:** Analiza modeli backendu FastAPI (`src/api/schemas.py`, `src/api/routes.py`) oraz danych prezentowanych na makietach.
*   **Zadanie:** Stworzenie interfejsów TypeScript w `src/types/api.ts` dla obiektów: `Batch`, `PolicyRecord`, `StatsMetrics`.
*   **Wykonane:**
    *   Stworzono `src/types/api.ts` zawierający typy statusów (`BatchStatus`, `PolicyRecordStatus`, `ConfidenceLevel`).
    *   Zmapowano 1:1 modele odpowiedzi API z FastAPI (`BatchUploadResponse`, `BatchErrorDetail`, `BatchStatusResponse`, `PolicyRecordResponse`, `BatchResultsResponse`).
    *   Zdefiniowano modele UI (`StatsMetrics`, `Batch`, `PolicyRecord`, `BatchProcessingLogItem`, `UploadSelectedFile`, `PolicyFilterOptions`, `ApiError`).
    *   Zaktualizowano konfigurację ścieżek w `tsconfig.json` i zweryfikowano bezbłędną kompilację `tsc --noEmit`.

---

## 2. Architektura Komponentów i Układu (Shell)

### ✅ Krok 2.1: Komponent `AppLayout` (Główny Szablon) — Ukończono
*   **Zadanie:** Stworzenie głównego kontenera z fixowanym paskiem bocznym po lewej i scrollowanym obszarem treści po prawej.
*   **Wykonane:**
    *   Stworzono komponent `src/components/AppLayout.tsx` definiujący kompletny shell aplikacji.
    *   Zaimplementowano fixowany panel boczny po lewej stronie (`w-64`, `fixed`, `z-40`) z responsywnym drawerem i tłem z efektem rozmycia (`backdrop-blur-sm`) dla ekranów mobilnych.
    *   Zaimplementowano sticky nagłówek `TopAppBar` (`h-16`, sticky, `z-10`) z przyciskiem hamburgera dla mobile, identyfikatorem tenanta oraz profilem użytkownika.
    *   Zaimplementowano scrollowany obszar roboczy (`main`, `flex-1`, `overflow-y-auto`) obsługujący zarówno routing przez `<Outlet />`, jak i przekazywane `children`.
    *   Wyeksportowano komponent i interfejsy `AppLayoutProps`, `AppLayoutUser` przez `src/components/index.ts`.
    *   Zintegrowano `BrowserRouter` i `AppLayout` w `src/main.tsx`.
    *   Zweryfikowano poprawność kompilacji TypeScript i bundle Vite (`npm run build`).

### ✅ Krok 2.2: Komponent `SideNavBar` (Pasek Boczny) — Ukończono
*   **Makiety źródłowe (HTML):** `dashboard/code.html`, `Upload/code.html`, `Batch_Processing/code.html`.
*   **Zadanie:** Implementacja statycznej części nawigacji.
*   **Integracja:** Użycie `NavLink` z `react-router-dom` do obsługi linków i automatycznego podświetlania aktywnej sekcji (Dashboard / Upload) na podstawie aktualnej ścieżki URL.
*   **Wykonane:**
    *   Stworzono dedykowany komponent `src/components/SideNavBar.tsx` z obsługą `NavLink` z `react-router-dom`.
    *   Zaimplementowano stan aktywny/nieaktywny dla linków (`Dashboard` pod `/` oraz `Upload` pod `/upload`): aktywny z tłem `bg-surface-container-high`, pogrubionym tekstem `text-on-surface` oraz ikoną Material Symbols z `FILL 1`.
    *   Obsłużono animację i interakcję `active:scale-[0.98]` oraz hover `hover:bg-surface-container-low`.
    *   Wbudowano sekcję profilu brokera w stopce paska bocznego z awatarem i danymi użytkownika.
    *   Zintegrowano `SideNavBar` jako domyślny pasek boczny w `AppLayout` z automatycznym zamykaniem drawera na mobile po kliknięciu linku (`onItemClick`) oraz obsługą przycisku zamknięcia (`onClose`).
    *   Zaktualizowano `src/components/index.ts` oraz routing w `src/main.tsx` o ścieżki `/` i `/upload`.
    *   Zweryfikowano kompilację i build produkcyjny (`npm run build`).

---

## 3. Implementacja Ekranów i Integracja z API

Poniższe kroki opisują implementację konkretnych ścieżek (routes) w aplikacji.

### ✅ Krok 3.1: Ścieżka `/` (Dashboard Overview) — Ukończono
*   **Makieta źródłowa (HTML):** `dashboard/code.html`
*   **Backend API (Wymagany):** Endpointy zwracające zagregowane metryki (Total, Success Rate) oraz listę ostatnich paczek.
*   **Zadania React:**
    *   Implementacja kart metryk (Bento Grid).
    *   Implementacja tabeli "Recent Batches".
    *   Zmapowanie statusów z HTML (Processing - sync/spin, Completed - check, Failed - close) na dynamiczne komponenty Badge.
    *   Linki w kolumnie "Batch ID" muszą kierować do ścieżki `/jobs/{batch_id}`.
*   **Wykonane:**
    *   Stworzono dedykowany komponent `StatusBadge.tsx` z dynamicznym mapowaniem statusów paczek (`processing` z obracającą się ikoną `sync`, `completed` z ikoną `check`, `failed` z ikoną `close`, `pending`).
    *   Stworzono komponent `ProgressBar.tsx` z responsywnym wypełnieniem paska, dynamicznym doborem koloru (zielony dla completed, czerwony dla failed, niebieski dla processing) oraz etykietą procentową.
    *   Stworzono komponent `MetricCard.tsx` odpowiadający specyfikacji Bento Grid z obsługą stanów ładowania (skeleton).
    *   Utworzono warstwę integracji API `src/services/api.ts` obsługującą pobieranie metryk (`getDashboardMetrics`) i paczek (`getRecentBatches`), z synchronizacją z `localStorage` oraz mechanizmem bezpiecznego fallbacku demonstracyjnego.
    *   Zaimplementowano pełny widok strony `src/pages/DashboardView.tsx`:
        *   Nagłówek Overview z licznikiem i przyciskiem filtru (All, Processing, Completed, Failed) oraz szybkim skrótem do Uploadu.
        *   Bento Grid z 3 kartami metryk: Total Processed (30d), Success Rate (%), Active Batches.
        *   Kartę "Recent Batches" z tabelą, formatowaniem ID paczek (`formatBatchId`), interaktywnymi linkami do `/jobs/{batch_id}`, badge'ami statusów i paskami postępu.
        *   Obsługę stanów ładowania (szkielety skeleton), pustego stanu tabeli (Empty State z możliwością wyczyszczenia filtrów lub przejścia do uploadu) oraz działającą paginację.
        *   Przełącznik widoku skróconego / pełnego ("View All").
    *   Wyeksportowano nowe komponenty przez `src/components/index.ts`.
    *   Zintegrowano `DashboardView` w `src/main.tsx` pod ścieżką główną `/` oraz przygotowano trasy placeholderów dla `/jobs/:batchId` i `/result/:batchId`.
    *   Zweryfikowano kompilację TypeScript oraz produkcyjny build Vite (`npm run build` — 0 błędów).

### ✅ Krok 3.2: Ścieżka `/upload` (Document Upload) — Ukończono
*   **Makieta źródłowa (HTML):** `Upload/code.html`
*   **Backend API:** `POST /upload` (multipart/form-data).
*   **Zadania React:**
    *   Implementacja strefy "Drag & Drop". Obsługa zdarzeń `onDrop`, `onDragOver` w celu zmiany stylów i przechwycenia plików.
    *   Walidacja frontendu: akceptacja tylko plików `.pdf`.
    *   Implementacja dynamicznej listy "Selected Files" z możliwością usuwania plików przed wysłaniem.
    *   **Integracja:** Obsługa przycisku "Start Processing". Wysłanie plików przez API, odebranie nowego `batch_id` i przekierowanie na stronę ścieżki `/jobs/{batch_id}`.
*   **Wykonane:**
    *   Stworzono komponent `src/pages/UploadView.tsx` w pełni odwzorowujący makietę `Upload/code.html`.
    *   Zaimplementowano strefę Drag & Drop z obsługą zdarzeń (`onDrop`, `onDragOver`, `onDragEnter`, `onDragLeave`) oraz aktywacją systemowego selektora plików (`input type="file" multiple accept=".pdf"`).
    *   Zaimplementowano walidację frontendu: weryfikację rozszerzenia / typu MIME (wyłącznie pliki `.pdf`), limitu rozmiaru (maksymalnie 50MB na plik) oraz deduplikację plików, z estetycznym banerem komunikatów błędów.
    *   Zaimplementowano dynamiczną listę "Selected Files" ze zliczaniem plików, formatowaniem rozmiarów (`formatBytes`), czerwoną ikoną PDF `picture_as_pdf` oraz przyciskami usuwania poszczególnych pozycji i opcją "Clear all".
    *   Zaimplementowano przycisk "Start Processing" ze stanem ładowania (`animate-spin`), blokadą w trakcie wysyłki oraz integracją z `apiService.uploadPolicies` (POST `/upload` multipart/form-data z obsługą fallbacku).
    *   Zintegrowano automatyczne przekierowanie `navigate('/jobs/' + batch_id)` po pomyślnym przyjęciu plików do kolejki.
    *   Podpięto `UploadView` w routingu `src/main.tsx` pod ścieżkę `/upload`.
    *   Zaktualizowano `README.md` oraz zweryfikowano bezbłędny build (`npm run build`).

### ✅ Krok 3.3: Ścieżka `/jobs/{batch_id}` (Batch Processing Status) — Ukończono
*   **Makieta źródłowa (HTML):** `Batch_Processing/code.html`
*   **Backend API:** `GET /jobs/{batch_id}/status` (polling).
*   **Zadania React:**
    *   **Polling danych:** Implementacja mechanizmu (np. `useEffect` z `setInterval` lub React Query) do cyklicznego odpytywania API o status paczki.
    *   Dynamiczna aktualizacja paska postępu (Progress Bar) i animacji pulsowania.
    *   Aktualizacja liczników w Bento Gridzie (Total, Processed, Failed, Remaining).
    *   Implementacja tabeli "Processing Log". Nowe wiersze pojawiają się dynamicznie w miarę przetwarzania.
    *   Implementacja Tooltipa błędu (czarny box z DESIGN) pojawiającego się po najechaniu na ikonę błędu w tabeli.
    *   Przycisk "Batch Results" aktywuje się (zmienia styl z disabled) dopiero, gdy status paczki zmieni się na "completed".
*   **Wykonane:**
    *   Stworzono komponent `src/pages/BatchStatusView.tsx` zgodny z makietą `Batch_Processing/code.html`.
    *   Zaimplementowano mechanizm pollingu (`useEffect` + `setInterval` co 2 sekundy) odpytujący `GET /jobs/{batch_id}/status`, który zatrzymuje się automatycznie po osiągnięciu statusu `completed` lub `failed` albo po odmontowaniu komponentu.
    *   Zaimplementowano animowany komponent paska postępu z klasą `progress-pulse`, dynamicznym kolorem (niebieski podczas przetwarzania, zielony po sukcesie, czerwony przy błędzie) i estymacją pozostałego czasu.
    *   Zaimplementowano 4 karty Bento Grid (Total Files, Processed z tłem watermark, Failed w czerwonym kontenerze błędu, Remaining).
    *   Zaimplementowano tabelę "Processing Log" z indykatorem "Live Updates", obsługą statusów dokumentów oraz tooltipem błędu OCR w formie czarnego boxa (`bg-inverse-surface text-inverse-on-surface`) po najechaniu na ikonę błędu.
    *   Przycisk "Batch Results" jest zablokowany (`disabled`, przezroczystość 60%, kursor `not-allowed`) w trakcie przetwarzania i aktywuje się z pełnym stylem (`bg-secondary hover:bg-secondary/90`) oraz linkiem do `/result/:batchId` dopiero po statusie `completed`.
    *   Zaktualizowano serwis `apiService` o obsługę pollingu i pobierania wpisów logów oraz podpięto widok pod `/jobs/:batchId` w `src/main.tsx`.
    *   Zaktualizowano `README.md` oraz zweryfikowano poprawność kompilacji i buildu Vite.

### ✅ Krok 3.4: Ścieżka `/result/{batch_id}` (Batch Results) — Ukończono
*   **Makieta źródłowa (HTML):** `result/code.html`
*   **Backend API (Wymagany):** Endpoint zwracający listę wyekstrahowanych rekordów polis (`PolicyRecord`) dla danej paczki.
*   **Zadania React:**
    *   Tabela wyników: dynamiczne renderowanie wyekstrahowanych danych (Ubezpieczyciel, Kwota, Data).
    *   Obsługa statusów konfidencyjności (HIGH CONF. / REVIEW) z odpowiednimi kolorami.
    *   Implementacja frontendu filtrów (Dropdowny w górnym pasku).
    *   Implementacja logiki dla przycisków: "Export to CSV" (pobranie pliku), "RESOLVE" (kieruje do edytora - brak makiety edytora).
*   **Wykonane:**
    *   Stworzono komponent `src/pages/BatchResultsView.tsx` zgodny z makietą `result/code.html`.
    *   Zaimplementowano pełną tabelę wyników z kolumnami: Filename, Insurer Name, Premium Amount, Currency, Extraction Date, Status, Action.
    *   Zaimplementowano odznaki konfidencyjności: `HIGH CONF.` (zielona, `bg-[#e6f4ea] text-[#137333]`) dla statusu `success` oraz `REVIEW` (żółta, `bg-[#fef7e0] text-[#b06000]`) dla statusu `failed`. Wiersze `REVIEW` posiadają tło `bg-error-container/20`.
    *   Zaimplementowano funkcjonalne dropdowny filtrów: po towarzystwo (dynamicznie generowany z danych) i po statusie. Dodano licznik aktywnych wyników i przycisk "Clear Filters".
    *   Zaimplementowano sortowanie po dacie ekstrakcji (asc/desc) z przełączaną ikoną strzałki w nagłówku kolumny Filename.
    *   Zaimplementowano paginację po stronie klienta (5 rekordów na stronę) ze smart-generowanymi numerami stron i informacją "Showing X to Y of Z results".
    *   Przycisk "Export to CSV" wywołuje `apiService.downloadBatchCsv()` — próbuje `GET /jobs/{id}/export/csv`, a w trybie fallback generuje CSV (BOM + średnikowy) po stronie klienta ze stanu `filtered`.
    *   Przycisk "RESOLVE" dostępny tylko dla wierszy `REVIEW` — wyświetla alert z komunikatem błędu ekstrakcji.
    *   Skeleton loading (5 wierszy `animate-pulse`) widoczny podczas ładowania danych.
    *   Stan pustego filtra — widok informacyjny z ikoną `search_off` i przyciskiem czyszczenia filtrów.
    *   Nagłówek strony zawiera: liczbę przetworzonych / całkowitych plików, Batch ID oraz obliczony % konfidencji.
    *   Rozszerzono `apiService.getBatchResults()` o bogate dane demonstracyjne (10 rekordów, 2× REVIEW) na wzór makiety.
    *   Dodano metodę `apiService.downloadBatchCsv()` z pełną obsługą API + fallback CSV client-side.
    *   Podpięto widok pod `/result/:batchId` w `src/main.tsx` (zastąpiono placeholder).
    *   Zaktualizowano `README.md` oraz zweryfikowano poprawność kompilacji i buildu Vite (34 moduły, 0 błędów).


---

## ✅ 4. Prace Wykończeniowe i Optymalizacja — Ukończono

*   **Responsywność:** ✅ Sidebar desktopowy (w-64) automatycznie chowa się na mobile jako slide-over drawer wyzwalany hamburger-button w TopAppBar (klasy `-translate-x-full md:translate-x-0` w `AppLayout`). Gridy Bento: `grid-cols-1 md:grid-cols-3`. Tabele wynikowe opakowane w `overflow-x-auto` z `min-w-[640px]`, aby poziome scrollowanie działało na wąskich ekranach.
*   **Stany Ładowania:** ✅ Skeleton Screen zaimplementowany we wszystkich widokach:
    *   `DashboardView` — MetricCard ze stanem `loading` + skeleton wiersze tabeli.
    *   `BatchStatusView` — 4 wiersze `animate-pulse` w tabeli Processing Log podczas pierwszego ładowania.
    *   `BatchResultsView` — 5 wierszy `animate-pulse × 7 kolumn` przed załadowaniem wyników.
    *   Nagłówki dynamiczne (np. "Processed X of Y") wyświetlają `div animate-pulse` do momentu pobrania danych.
*   **Obsługa Błędów:** ✅ Zaimplementowane dwa poziomy:
    *   **`ErrorBoundary`** (`src/components/ErrorBoundary.tsx`) — Class Component wychwytujący błędy renderowania React. Wyświetla widok `Something went wrong` z przyciskiem `Try again` (reset stanu). Owinięty wokół każdego widoku w `main.tsx`.
    *   **`ToastProvider` + `useToast`** (`src/components/Toast.tsx`) — Globalny system powiadomień z 4 typami (`success`/`error`/`warning`/`info`), animacją wejścia/wyjścia (`translate-x` + `opacity`), auto-hide po 4s (6s dla błędów), max 5 jednoczesnych. Podpięty w `main.tsx` jako korzeń drzewa. Zintegrowany we wszystkich widokach:
        *   `DashboardView` → `toast.error()` przy błędzie ładowania metryk
        *   `BatchStatusView` → `toast.error()` przy błędzie pollingu
        *   `UploadView` → `toast.success()` po udanym uploadzie, `toast.error()` przy błędzie
        *   `BatchResultsView` → `toast.error()` przy błędzie ładowania wyników