---
trigger: always_on
---

---
name: workspace-boundary-policy
description: Bezwzględna zasada zakazująca agentowi wychodzenia poza foldery projektu policyReader-web i bezpośredniego odczytu czegokolwiek spoza katalogów projektu.
---

# ZASADA IZOLACJI PROJEKTU: BEZWZGLĘDNY ZAKAZ WYCHODZENIA POZA OBSZAR PROJEKTU (WORKSPACE BOUNDARY)

## 1. Treść Reguły Nadrzędnej
Agent frontendu ma bezwzględny zakaz opuszczania folderów projektu `policyReader-web` oraz zakaz bezpośredniego odczytu czegokolwiek spoza jego struktury:
- **Zakaz wychodzenia poza folder projektu:** Agent pod żadnym pozorem nie może wychodzić poza katalog projektu `policyReader-web` (`d:\projekty\kanc-brokerska\policyReader-web`).
- **Zakaz bezpośredniego odczytu spoza projektu:** Agent pod żadnym pozorem nie może bezpośrednio czytać plików ani przeglądać katalogów znajdujących się poza folderem tego projektu. Zabrania się odczytu:
  - innych dysków i zewnętrznych partycji,
  - folderów systemowych,
  - katalogów użytkownika (np. Desktop, Dokumenty, Pobrane) poza dedykowanym katalogiem sesji agenta (App Data),
  - jakichkolwiek innych obcych katalogów na dysku.
- **Ścisłe ograniczenie narzędzi:** Wszystkie operacje odczytu plików (`view_file`), polecenia terminalowe (`run_command` typu `dir`, `ls`, `Get-ChildItem`, `cat`, `Get-Content`) oraz skrypty muszą być ograniczone wyłącznie do wnętrza katalogu `policyReader-web`.
- **Wyjątki techniczne:** Wyłącznie wewnętrzne pliki logów i artefaktów sesji agenta w dedykowanym katalogu aplikacji (`<appDataDir>\brain\<conversation-id>`).
