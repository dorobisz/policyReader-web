# NADRZĘDNE ZASADY BEZPIECZEŃSTWA: POLICYREADER-WEB

## I. BEZWZGLĘDNY ZAKAZ DOSTĘPU DO KATALOGÓW "ZAKAZANE" (*zakazane*)

1. **Wielkość liter i konstrukcja nazwy (Case-Insensitive & Substring Match):**
   Zakaz dotyczy **dowolnej wielkości liter** (`zakazane`, `Zakazane`, `ZAKAZANE`, itp.) oraz **dowolnej konstrukcji nazwy**, w której słowo `zakazane` pojawia się jako pełna nazwa, prefiks, sufiks lub w środku (wzorzec `*zakazane*`, np. `katalog_zakazane`, `zakazane_pliki`, `dane-zakazane-2026`).

2. **Bezwzględny zakaz wchodzenia:**
   Gdy agent (lub podagent/subagent) zobaczy taki katalog, pod żadnym pozorem **NIE MOŻE** do niego wchodzić (zakaz komend `cd`, nawigacji, ustawiania jako katalog roboczy `Cwd`, itp.).

3. **Bezwzględny zakaz odczytu zawartości:**
   Agent pod żadnym pozorem **NIE MOŻE** czytać zawartości tego katalogu ani plików w nim zawartych (zakaz używania `view_file`, `dir`, `ls`, `Get-ChildItem`, wyszukiwania plików `grep`/`findstr`/`ripgrep`, odczytu metadanych czy listingów).

4. **Całkowite pomijanie i ignorowanie:**
   Agent ma wszelkie katalogi pasujące do wzorca `*zakazane*` **CAŁKOWICIE POMIJAĆ**. Wszelkie operacje wyszukiwania, indeksowania, skanowania czy analizy mają je bezwzględnie omijać.

5. **Nieograniczony zasięg (Zasada Globalna):**
   Nieważne, czy katalog znajduje się wewnątrz projektu, w katalogu nadrzędnym (np. `d:\projekty\kanc-brokerska\zakazane`), czy w jakimkolwiek innym miejscu na dysku lub w systemie plików — zakaz obowiązuje **ZAWSZE I WSZĘDZIE**.

---

## II. BEZWZGLĘDNY ZAKAZ WYCHODZENIA POZA OBSZAR PROJEKTU (WORKSPACE BOUNDARY)

1. **Zakaz opuszczania folderu projektu:**
   Agent frontendu pod żadnym pozorem **NIE MOŻE** wychodzić poza katalog projektu `policyReader-web`.

2. **Zakaz bezpośredniego odczytu spoza projektu:**
   Agent pod żadnym pozorem **NIE MOŻE** bezpośrednio czytać plików ani folderów spoza projektu `policyReader-web` (zakaz czytania dysków systemowych, katalogów użytkownika poza App Data oraz katalogów nadrzędnych).

3. **Ścisłe ograniczenie narzędzi:**
   Wszystkie narzędzia odczytu (`view_file`), polecenia terminalowe (`run_command` typu `dir`, `ls`, `Get-ChildItem`, `cat`, itp.) muszą ograniczać swoje działanie wyłącznie do wnętrza katalogu `policyReader-web`.
