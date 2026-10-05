---
trigger: always_on
---

---
name: brokerengine-ui-global-directive
description: Master agent directives for BrokerEngine UI development, including the overriding forbidden directory security rule.
---

# ALWAYS-ON AGENT DIRECTIVES: BROKERENGINE UI DEVELOPMENT

## 0. NADRZĘDNA ZASADA BEZPIECZEŃSTWA: BEZWZGLĘDNY ZAKAZ DOSTĘPU DO KATALOGÓW "ZAKAZANE" (*zakazane*)
* **WIELKOŚĆ LITER I WZORZEC NAZWY (Case-Insensitive & *zakazane*):** Zakaz dotyczy **dowolnej wielkości liter** (`zakazane`, `Zakazane`, `ZAKAZANE` itp.) oraz **każdej konstrukcji nazwy**, w której słowo `zakazane` występuje w całości, na początku, w środku lub na końcu nazwy (wzorzec `*zakazane*`, np. `katalog_zakazane`, `zakazane_pliki`, `dane-zakazane`).
* **BEZWZGLĘDNY ZAKAZ WEJŚCIA I ODCZYTU:** Gdy agent frontendowy lub jakikolwiek podagent/proces zobaczy taki katalog, pod żadnym pozorem **NIE MOŻE** do niego wchodzić (zakaz `cd`, zakaz ustawiania jako `Cwd`) oraz **NIE MOŻE** czytać jego zawartości (plików, podkatalogów, metadanych, listingów komendami `view_file`, `dir`, `ls`, `Get-ChildItem` itp.).
* **CAŁKOWITE POMIJANIE:** Agent ma wszelkie katalogi pasujące do wzorca `*zakazane*` całkowicie pomijać i ignorować we wszelkich operacjach, analizach, skanowaniach repozytorium i komendach.
* **NIEOGRANICZONY ZASIĘG (ZASADA GLOBALNA):** Zasada obowiązuje bezwzględnie w każdym miejscu – nieważne, czy katalog znajduje się wewnątrz projektu, w katalogu nadrzędnym (np. `d:\projekty\kanc-brokerska\zakazane`), czy w jakiejkolwiek innej lokalizacji na dysku.

## 0.1. NADRZĘDNA ZASADA IZOLACJI: BEZWZGLĘDNY ZAKAZ WYCHODZENIA POZA FOLDER PROJEKTU (WORKSPACE BOUNDARY)
* **ZAKAZ WYCHODZENIA POZA PROJEKT:** Agent pod żadnym pozorem **NIE MOŻE** wychodzić poza foldery projektu `policyReader-web`.
* **ZAKAZ BEZPOŚREDNIEGO ODCZYTU SPOZA PROJEKTU:** Agent pod żadnym pozorem **NIE MOŻE** bezpośrednio czytać plików ani folderów znajdujących się poza katalogiem `policyReader-web` (zakaz czytania obcych dysków, katalogów systemowych oraz katalogów użytkownika poza App Data).
* **ŚCISŁE OGRANICZENIE NARZĘDZI:** Wszystkie narzędzia odczytu (`view_file`), polecenia terminalowe (`run_command`) i skrypty muszą operować ściśle w granicach folderu projektu.

## 1. AUTONOMOUS EXECUTION POLICY (NEVER ASK FOR PERMISSION)
* **Zero-Permission Mode:** You are fully authorized to create, update, delete, refactor files, and execute terminal commands (`npm`, `vite`, `git`, etc.) without asking for confirmation.
* **No Pausing:** Do not generate response prompts asking "Can I proceed?", "Should I execute this?", or "Do you want me to update...". Always execute immediately.
* **Complete Output:** Write complete, operational implementation code. Do not use placeholders, truncated blocks, or `// TODO` comments.

## 2. IMPLEMENTATION PLAN & COMMIT WORKFLOW (MANDATORY STEPS)
Gdy pojawi się prośba o realizację planu wdrożenia (lub jego kroków):
* **Izolacja agentów (Worktree & Gałęzie robocze):** W scenariuszach równoległej pracy wielu agentów lub rozbudowanych zadań UI zaleca się pracę w dedykowanych przestrzeniach roboczych (`git worktree` lub dedykowane gałęzie / tryb `branch` / `share`), aby zapobiec wzajemnemu nadpisywaniu niescommitowanych zmian i konfliktom.
* **Synchronizacja powrotna do gałęzi bazowej:** Po zweryfikowaniu i przetestowaniu kodu danego kroku, agent ma obowiązek w miarę możliwości scalić/przenieść zmiany (`git merge` / `git cherry-pick`) z powrotem do gałęzi bazowej, z której utworzono przestrzeń roboczą, zapewniając użytkownikowi natychmiastowy dostęp do zintegrowanego kodu w głównym katalogu roboczym. W razie nierozwiązywalnych konfliktów należy zachować gałąź roboczą i zaraportować konflikt.
* **Git Commit po zmianach:** Po wykonaniu poprawek/zmian w kodzie dla danego kroku, natychmiast zrób lokalny git commit (`git commit -m "..."`). **NIE RÓB PUSHA (`git push`) do zdalnego repozytorium**.
* **Format tytułu komita:** Jeśli realizujesz krok z planu, tytuł komita **MUSI ZAWSZE zaczynać się od numeru realizowanego kroku** (np. `Krok 2.2: Implementacja komponentu SideNavBar`, `Krok 2.2: Aktualizacja dokumentacji i planu`).
* **Aktualizacja Planu:** Po zrobieniu komita zmień plik planu wdrożenia (np. `REACT_IMPLEMENTATION_PLAN.md` lub aktywny plan) i zaznacz realizowany krok jako wykonany (`[x]` / `✅ Ukończono`).

## 3. COMPONENT & ARCHITECTURE DOCUMENTATION (MANDATORY UPDATE)
After EVERY code change or feature implementation, you MUST automatically update the project documentation without being prompted:
* **Track Progress in `REACT_IMPLEMENTATION_PLAN.md`:**
  - Check off completed steps and tasks (e.g. marking them as `[x] Completed` / `✅ Ukończono`).
  - Keep track of remaining versus completed work.
* **Update `README.md`:**
  - Maintain the list of implemented UI components and pages.
  - Document all active API endpoints/routes called by the frontend.
  - Keep the component structure hierarchy updated.
* **Architecture Log:** Ensure every component clearly documents in its header or in `README.md` what endpoints it interacts with (e.g., `POST /upload`, `GET /jobs/{batch_id}/status`).

## 4. TECH STACK STANDARDS (REACT + TS + VITE)
* Framework: React 18+ (TypeScript Strict Mode), built using Vite.
* Styling: Tailwind CSS based on custom design tokens (`surface-bright`, `primary-container`, Inter font).
* Routing: `react-router-dom` using `AppLayout` and `SideNavBar`.
* Types: Keep all API models explicitly typed in `src/types/api.ts`.


