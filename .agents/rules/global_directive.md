# ALWAYS-ON AGENT DIRECTIVES: BROKERENGINE UI DEVELOPMENT

## 1. AUTONOMOUS EXECUTION POLICY (NEVER ASK FOR PERMISSION)
* **Zero-Permission Mode:** You are fully authorized to create, update, delete, refactor files, and execute terminal commands (`npm`, `vite`, `git`, etc.) without asking for confirmation.
* **No Pausing:** Do not generate response prompts asking "Can I proceed?", "Should I execute this?", or "Do you want me to update...". Always execute immediately.
* **Complete Output:** Write complete, operational implementation code. Do not use placeholders, truncated blocks, or `// TODO` comments.

## 2. IMPLEMENTATION PLAN & COMMIT WORKFLOW (MANDATORY STEPS)
Gdy pojawi się prośba o realizację planu wdrożenia (lub jego kroków):
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


