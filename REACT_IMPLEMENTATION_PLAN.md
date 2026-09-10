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

### [ ] Krok 2.2: Komponent `SideNavBar` (Pasek Boczny)
*   **Makiety źródłowe (HTML):** `dashboard/code.html`, `Upload/code.html`, `Batch_Processing/code.html`.
*   **Zadanie:** Implementacja statycznej części nawigacji.
*   **Integracja:** Użycie `NavLink` z `react-router-dom` do obsługi linków i automatycznego podświetlania aktywnej sekcji (Dashboard / Upload) na podstawie aktualnej ścieżki URL.

---

## 3. Implementacja Ekranów i Integracja z API

Poniższe kroki opisują implementację konkretnych ścieżek (routes) w aplikacji.

### [ ] Krok 3.1: Ścieżka `/` (Dashboard Overview)
*   **Makieta źródłowa (HTML):** `dashboard/code.html`
*   **Backend API (Wymagany):** Endpointy zwracające zagregowane metryki (Total, Success Rate) oraz listę ostatnich paczek.
*   **Zadania React:**
    *   Implementacja kart metryk (Bento Grid).
    *   Implementacja tabeli "Recent Batches".
    *   Zmapowanie statusów z HTML (Processing - sync/spin, Completed - check, Failed - close) na dynamiczne komponenty Badge.
    *   Linki w kolumnie "Batch ID" muszą kierować do ścieżki `/jobs/{batch_id}`.

### [ ] Krok 3.2: Ścieżka `/upload` (Document Upload)
*   **Makieta źródłowa (HTML):** `Upload/code.html`
*   **Backend API:** `POST /upload` (multipart/form-data).
*   **Zadania React:**
    *   Implementacja strefy "Drag & Drop". Obsługa zdarzeń `onDrop`, `onDragOver` w celu zmiany stylów i przechwycenia plików.
    *   Walidacja frontendu: akceptacja tylko plików `.pdf`.
    *   Implementacja dynamicznej listy "Selected Files" z możliwością usuwania plików przed wysłaniem.
    *   **Integracja:** Obsługa przycisku "Start Processing". Wysłanie plików przez API, odebranie nowego `batch_id` i przekierowanie na stronę ścieżki `/jobs/{batch_id}`.

### [ ] Krok 3.3: Ścieżka `/jobs/{batch_id}` (Batch Processing Status)
*   **Makieta źródłowa (HTML):** `Batch_Processing/code.html`
*   **Backend API:** `GET /jobs/{batch_id}/status` (polling).
*   **Zadania React:**
    *   **Polling danych:** Implementacja mechanizmu (np. `useEffect` z `setInterval` lub React Query) do cyklicznego odpytywania API o status paczki.
    *   Dynamiczna aktualizacja paska postępu (Progress Bar) i animacji pulsowania.
    *   Aktualizacja liczników w Bento Gridzie (Total, Processed, Failed, Remaining).
    *   Implementacja tabeli "Processing Log". Nowe wiersze pojawiają się dynamicznie w miarę przetwarzania.
    *   Implementacja Tooltipa błędu (czarny box z DESIGN) pojawiającego się po najechaniu na ikonę błędu w tabeli.
    *   Przycisk "Batch Results" aktywuje się (zmienia styl z disabled) dopiero, gdy status paczki zmieni się na "completed".

### [ ] Krok 3.4: Ścieżka `/result/{batch_id}` (Batch Results)
*   **Makieta źródłowa (HTML):** `result/code.html`
*   **Backend API (Wymagany):** Endpoint zwracający listę wyekstrahowanych rekordów polis (`PolicyRecord`) dla danej paczki.
*   **Zadania React:**
    *   Tabela wyników: dynamiczne renderowanie wyekstrahowanych danych (Ubezpieczyciel, Kwota, Data).
    *   Obsługa statusów konfidencyjności (HIGH CONF. / REVIEW) z odpowiednimi kolorami.
    *   Implementacja frontendu filtrów (Dropdowny w górnym pasku).
    *   Implementacja logiki dla przycisków: "Export to CSV" (pobranie pliku), "RESOLVE" (kieruje do edytora - brak makiety edytora).

---

## 4. Prace Wykończeniowe i Optymalizacja

*   **Responsywność:** Weryfikacja działania na urządzeniach mobilnych (ukrywanie Sidebaru, zmiana gridów na 1-kolumnowe).
*   **Stany Ładowania:** Dodanie komponentów Skeleton Screen w miejscach tabel i metryk podczas oczekiwania na dane z API.
*   **Obsługa Błędów:** Implementacja Error Boundary dla całych stron oraz globalnego systemu powiadomień (Toast) dla błędów API.