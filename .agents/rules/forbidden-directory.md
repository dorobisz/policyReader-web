---
trigger: always_on
---

---
name: forbidden-directory-policy
description: Bezwzględna reguła bezpieczeństwa zakazująca wchodzenia i odczytu zawartości katalogów o nazwach pasujących do wzorca "zakazane" (*zakazane*, bez względu na wielkość liter) w dowolnej lokalizacji.
---

# NADRZĘDNA ZASADA BEZPIECZEŃSTWA: BEZWZGLĘDNY ZAKAZ DOSTĘPU DO KATALOGÓW "ZAKAZANE" (*zakazane*)

## 1. Treść Reguły Nadrzędnej
Gdy agent frontendowy, podagent (subagent) lub jakikolwiek proces napotka katalog, którego nazwa lub ścieżka zawiera słowo `zakazane`:
- **CAŁKOWITA NIEWRAŻLIWOŚĆ NA WIELKOŚĆ LITER (Case-Insensitive):** Zakaz obejmuje każdą formę zapisu (`zakazane`, `Zakazane`, `ZAKAZANE`, `ZaKaZaNe`, itp.).
- **DOWOLNA KONSTRUKCJA NAZWY (Wzorzec `*zakazane*` / Substring):** Zakaz dotyczy słowa `zakazane` występującego w dowolnym miejscu nazwy folderu:
  - jako pełna nazwa (np. `zakazane`, `Zakazane`),
  - w środku nazwy (np. `dane_zakazane_2026`, `archiwalne_ZAKAZANE_pliki`),
  - na początku nazwy (np. `zakazane_pliki`, `zakazane-dokumenty`),
  - na końcu nazwy (np. `katalog_zakazane`, `stare-zakazane`),
  - w dowolnym członie ścieżki.
- **BEZWZGLĘDNY ZAKAZ WCHODZENIA:** Agent pod żadnym pozorem **NIE MOŻE** wchodzić do takiego katalogu (zakaz komend `cd`, nawigacji, ustawiania jako katalog roboczy `Cwd`, uruchamiania skryptów).
- **BEZWZGLĘDNY ZAKAZ ODCZYTU:** Agent pod żadnym pozorem **NIE MOŻE** czytać zawartości takiego katalogu ani jakichkolwiek plików w nim zawartych (zakaz `view_file`, `dir`, `ls`, `Get-ChildItem`, wyszukiwania `grep`/`findstr`/`ripgrep`, odczytu metadanych czy listingu).
- **CAŁKOWITE POMIJANIE:** Agent ma takie katalogi **CAŁKOWICIE IGNOROWAĆ i POMIJAĆ** we wszystkich operacjach, skanowaniach repozytorium, drzewach katalogów, testach oraz poleceniach skryptowych.
- **ZASIĘG GLOBALNY:** Zasada obowiązuje **BEZWZGLĘDNIE i ZAWSZE**, niezależnie od tego, czy katalog znajduje się wewnątrz repozytorium/projektu, w katalogu nadrzędnym (np. `d:\projekty\kanc-brokerska\zakazane`), w profilu użytkownika, czy w jakimkolwiek innym miejscu na dysku lub w systemie plików.

## 2. Działanie w Narzędziach i Komendach
- Przy wywołaniach narzędzi do przeszukiwania plików lub poleceń shellowych (np. `Get-ChildItem`, `find`, `rg`), jeśli istnieje ryzyko dotknięcia katalogu zawierającego w nazwie `zakazane`, należy go jawnie wykluczyć lub omijać.
- Żadne narzędzie (`view_file`, `run_command`, itp.) nie może zostać użyte z parametrem wskazującym na ścieżkę wewnątrz takiego katalogu.
