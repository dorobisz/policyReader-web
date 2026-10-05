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


---

## 5. Refaktoring Modułu Czytnika Dowodów Rejestracyjnych (Feature-Based Architecture)

### ✅ Krok 5.1: Organizacja Pakietów i Czysta Architektura (Feature Modules) — Ukończono
*   **Zadanie:** Rozbicie płaskiej struktury komponentów na moduły domenowe oraz reużywalne klocki UI.
*   **Wykonane:**
    *   Wydzielono pakiet reużywalnych komponentów UI: `src/components/common/` (`ErrorBoundary`, `MetricCard`, `ProgressBar`, `StatusBadge`, `Toast`).
    *   Wydzielono pakiet layoutu: `src/components/layout/` (`AppLayout`, `SideNavBar`).
    *   Utworzono pakiet domenowy `src/features/vehicle-registration/` z podkatalogami `pages/` i `components/` oraz centralnym barrel exportem `index.ts`.
    *   Utworzono pakiet domenowy `src/features/settings/` z `pages/` i `components/` oraz barrel exportem `index.ts`.
    *   Zaktualizowano `src/components/index.ts` pod kątem re-eksportu z nowych lokalizacji.

### ✅ Krok 5.2: Uproszczenie Paska Bocznego (SideNavBar) — Ukończono
*   **Zadanie:** Usunięcie zbędnych zakładek i zmiana nazewnictwa na domenowe.
*   **Wykonane:**
    *   Zastąpiono zakładkę `Dashboard` pozycją **`Dowody rejestracyjne`** (ikona `directions_car`, ścieżka `/`).
    *   **Usunięto zakładkę `Upload`** z paska bocznego (dostęp do wgrywania wyłącznie przez przycisk akcji na ekranie głównym).
    *   Zakładka `Ustawienia` (`/settings`) została zachowana.

### ✅ Krok 5.3: Domenowy Ekran Główny (`VehicleRegBatchesView.tsx`) — Ukończono
*   **Zadanie:** Dostosowanie dawnego DashboardView do dowodów rejestracyjnych.
*   **Wykonane:**
    *   Zastąpiono `DashboardView` nowym komponentem domenowym `VehicleRegBatchesView.tsx`.
    *   Zaktualizowano nagłówki na: *Dowody rejestracyjne* i opis zarządzania paczkami odczytanych dowodów.
    *   Dodano przycisk akcji **„Wgraj dowody”** (`add_photo_alternate`), który kieruje bezpośrednio do `/upload`.
    *   Dopasowano metryki Bento Grid: *Odczytane dowody (30 dni)*, *Skuteczność odczytu*, *Aktywne paczki*.
    *   Zaktualizowano tabelę paczek z odnośnikami do postępu (`/jobs/:batchId`) lub wyników (`/result/:batchId`).

### ✅ Krok 5.4: Wgrywanie Wyłącznie Zdjęć JPG z Instrukcją (`VehicleRegUploadView.tsx`) — Ukończono
*   **Zadanie:** Restrykcja formatu do JPG oraz dodanie wskazówki o skanowaniu 1. strony.
*   **Wykonane:**
    *   Zastąpiono `UploadView` nowym komponentem domenowym `VehicleRegUploadView.tsx`.
    *   Zaktualizowano `APP_CONFIG.allowedExtensions` do ściśle `['.jpg', '.jpeg']` (blokada PDF i PNG).
    *   Dodano baner z instrukcją: *„Wskazówka: Zeskanuj lub sfotografuj wyłącznie pierwszą stronę dowodu rejestracyjnego (wszystkie kluczowe dane znajdują się na 1. stronie)”*.
    *   Dostosowano atrybuty drag & drop oraz inputu do `accept=".jpg,.jpeg,image/jpeg"`.
    *   Przycisk startu: *Rozpocznij odczyt ([liczba_plików])* kierujący do `/jobs/:batchId`.

### ✅ Krok 5.5: Ekran Postępu Odczytu Dowodów (`VehicleRegStatusView.tsx`) — Ukończono
*   **Zadanie:** Dostosowanie ekranu monitorowania do etapów odczytu dowodów rejestracyjnych.
*   **Wykonane:**
    *   Zastąpiono `BatchStatusView` nowym komponentem `VehicleRegStatusView.tsx`.
    *   Zaktualizowano nazewnictwo i tytuły: *Odczyt dowodów rejestracyjnych*, *Trwa odczytywanie danych ze zdjęć...*, *Liczba zdjęć*, *Odczytane*, *Błędy*, *Oczekujące*.
    *   Zachowano fazy OCR specyficzne dla dowodów: orientacja, Aztec 2D, weryfikacja, segmentacja, MRZ, skrzydełka, normalizacja.

### ✅ Krok 5.6: Dedykowany Ekran Wyników bez Zakładek Polis (`VehicleRegResultsView.tsx`) — Ukończono
*   **Zadanie:** Wycięcie elementów polisowych i utworzenie widoku w 100% skupionego na dowodach rejestracyjnych.
*   **Wykonane:**
    *   Całkowicie usunięto komponent `PolicyResultsTab.tsx` oraz system zakładek polisowych.
    *   Stworzono `VehicleRegTable.tsx` jako bezpośrednią tabelę dowodów (nr rej, marka i model, rodzaj, VIN, rok, status).
    *   Stworzono `VehicleRegDetailCard.tsx` z podziałem na 5 sekcji urzędowych PWPW, kopiowaniem do Excela, podglądem JSON i integracją z konfiguratorem pól.
    *   Stworzono `VehicleRegDetailModal.tsx` dla podglądu surowego JSON i metadanych.
    *   Dodano wyszukiwarkę (nr rej, VIN, marka, nazwa) i filtry po marce, rodzaju pojazdu i statusie.
    *   Dostosowano eksport CSV do parametrów dowodu rejestracyjnego (`document_type: 'vehicle_registration'`).

### ✅ Krok 5.7: Routing i Weryfikacja Kompilacji — Ukończono
*   **Wykonane:**
    *   Zaktualizowano `src/main.tsx` z routingiem do nowych komponentów domenowych.
    *   Usunięto stare pliki `src/pages/*` oraz `src/components/results/*`.
    *   Zweryfikowano pomyślną kompilację TypeScript i bundle produkcyjny Vite (`npm run build` — 0 błędów, 47 modułów przetransformowanych).

### ✅ Krok 5.8: Usunięcie Animacji Kręcenia się Ikonki w Statusie — Ukończono
*   **Wykonane:**
    *   W `VehicleRegStatusView.tsx` usunięto klasę `animate-spin-reverse` z ikonki pliku w tabeli statusu paczki.

### ✅ Krok 5.9: Układ Pól Podglądu Dowodu i Zawijanie do Nowej Linii — Ukończono
*   **Wykonane:**
    *   W `VehicleRegDetailCard.tsx` całkowicie wyeliminowano obcinanie tekstu przez wielokropek (`...` / `truncate`).
    *   Wprowadzono zawijanie tekstu do nowej linii (`break-words whitespace-pre-wrap`) dla wszystkich wartości i etykiet rubryk.
    *   Uporządkowano sekcję „Posiadacz i właściciel” z czytelnym podziałem na podsekcje **C.1 (Posiadacz dowodu)** oraz **C.2 (Właściciel pojazdu)**, zapewniając pełną szerokość wiersza (`col-span-full`) dla adresów oraz rozpiętość 3 kolumn dla nazw firm/nazwisk.
    *   Wprowadzono parser kodów rubryk dowodu rejestracyjnego (`parseFieldLabel`) wyróżniający oficjalne oznaczenia urzędowe (np. `A`, `B`, `C.1.1`, `E`, `P.1`) w postaci czytelnych badge'ów.
    *   Wprowadzono stylizację numeru rejestracyjnego nawiązującą do polskiej tablicy rejestracyjnej oraz łatwe kopiowanie każdego pojedynczego pola jednym kliknięciem.
    *   Zaktualizowano `VehicleRegTable.tsx` oraz `VehicleRegDetailModal.tsx` o klasę `break-all` zamiast obcinania nazw plików.

### ✅ Krok 5.10: Kompaktowy Układ Sekcji 2x2 i Usunięcie Nadmiaru Badge'ów — Ukończono
*   **Wykonane:**
    *   Przebudowano układ modala `VehicleRegDetailCard.tsx` na siatkę dwukolumnową (`grid grid-cols-1 lg:grid-cols-2 gap-4 items-start`), w której sekcje 1 i 2 oraz sekcje 3 i 4 leżą obok siebie.
    *   Ostatnia sekcja (Ważność i adnotacje urzędowe) rozciąga się na pełną szerokość obu kolumn (`lg:col-span-2`).
    *   Usunięto nadmiarowe badge'e i dekoracje, przywracając zwarte, czytelne kafelki (`p-2.5 rounded-lg border border-outline-variant/40`), co pozwala zmieścić maksymalnie dużo informacji na ekranie bez przewijania.
    *   Zachowano brak maskowania tekstu wielokropkiem — długie wartości zawijają się płynnie (`break-words whitespace-pre-wrap`), a kluczowe rubryki (adresy, posiadacze, VIN, homologacja, adnotacje) zajmują `col-span-full` w swoich sekcjach.
    *   Zbudowano nowy obraz Docker i zrestartowano kontener `policy_reader_web`.

### ✅ Krok 5.11: Zmniejszenie Odstępu Etykieta-Wartość oraz Równomierny Układ Kafelków — Ukończono
*   **Wykonane:**
    *   Wyeliminowano sztuczne rozciąganie odstępu między etykietą a wartością przez zamianę `flex flex-col justify-between` na `flex flex-col justify-start` z minimalnym marginesem `mt-1` (wartość znajduje się bezpośrednio pod nagłówkiem rubryki).
    *   Ujednolicono siatkę wewnątrz sekcji do równego układu 2-kolumnowego (`grid grid-cols-1 sm:grid-cols-2 gap-2.5`), dzięki czemu wszystkie kafelki w danym wierszu mają dokładnie tę samą szerokość i wysokość.
    *   W przypadku dłuższych tekstów (adresy, nazwy firm, adnotacje) treść płynnie zawija się do nowej linii (`break-words whitespace-pre-wrap leading-snug`), a kafelek w tym samym wierszu automatycznie dopasowuje swoją wysokość bez powstawania pustki między etykietą a wartością.
    *   Zaktualizowano i uruchomiono nowy kontener na Dockerze.

### ✅ Krok 5.12: Zacieśnienie Przerw Pionowych i Redukcja Wysokości Kafelków — Ukończono
*   **Wykonane:**
    *   Zredukowano padding każdego kafelka do `p-2` (8px), a przerwę między etykietą a wartością ustawiono na minimalną (`mt-1 leading-tight` przy `leading-none` etykiety).
    *   Przeniesiono przycisk kopiowania na pozycjonowanie absolutne w prawym górnym rogu (`absolute top-1.5 right-1.5`), dzięki czemu nie rozpycha wiersza etykiety w pionie.
    *   Przeniesiono regułę `.material-symbols-outlined` w `src/index.css` do `@layer components`, umożliwiając pełne działanie klas rozmiarów czcionek takich jak `text-[13px]`.
    *   Zmniejszono marginesy nagłówków sekcji i odstępy w siatce do `gap-2`, co wyraźnie skróciło całkowitą wysokość widoku podglądu.
    *   Przebudowano obraz Docker i pomyślnie zrestartowano kontener `policy_reader_web`.

### ✅ Krok 5.13: Integracja Paska Konfiguracji i Eksportu w Nagłówku Modala — Ukończono
*   **Wykonane:**
    *   Usunięto dolny pasek (footer) z modala `VehicleRegDetailCard.tsx`, co zwolniło dodatkowe miejsce w pionie.
    *   Przeniesiono opcje schowka (checkbox „Dołącz nagłówki kolumn”, przycisk konfiguratora kolejności pól „Dostosuj kolejność pól”, przełącznik „Widok pól / JSON”, przycisk „Kopiuj JSON” oraz „Kopiuj wiersz do Excela”) bezpośrednio do górnego nagłówka modala.
    *   Zbudowano nowy obraz kontenera Docker i pomyślnie zrestartowano `policy_reader_web`.