/**
 * Definicje pól dowodu rejestracyjnego.
 * Centralne źródło prawdy dla widoków oraz konfiguracji kopiowania (33 oficjalne pola + rok produkcji).
 */

export type VehicleSection = 'registration' | 'owner' | 'technical' | 'masses' | 'validity';

export interface VehicleSectionDef {
  id: VehicleSection;
  title: string;
  icon: string;
}

export const VEHICLE_SECTIONS: VehicleSectionDef[] = [
  { id: 'registration', title: 'Identyfikacja i rejestracja', icon: 'badge' },
  { id: 'owner', title: 'Posiadacz i właściciel', icon: 'person' },
  { id: 'technical', title: 'Pojazd i jednostka napędowa', icon: 'directions_car' },
  { id: 'masses', title: 'Masy, osie, przyczepy i miejsca', icon: 'scale' },
  { id: 'validity', title: 'Ważność i adnotacje urzędowe', icon: 'verified' },
];

export interface VehicleFieldDef {
  key: string;
  label: string;
  section: VehicleSection;
  displaySuffix?: string;
  isMono?: boolean;
}

export interface CopyFieldConfig {
  key: string;
  enabled: boolean;
  order: number;
}

export const VEHICLE_FIELD_DEFINITIONS: VehicleFieldDef[] = [
  // 1. Rejestracja i dokument
  { key: 'nr_dowodu_rejestracyjnego', label: 'Seria i nr dowodu (DR_SERIA_NUMER)', section: 'registration', isMono: true },
  { key: 'numer_rejestracyjny', label: 'Numer rejestracyjny (A)', section: 'registration', isMono: true },
  { key: 'data_pierwszej_rejestracji', label: 'Data pierwszej rejestracji (B)', section: 'registration' },
  { key: 'i_data_wydania', label: 'Data wydania dowodu (I)', section: 'registration' },
  { key: 'h_okres_waznosci', label: 'Okres ważności dowodu (H)', section: 'registration' },
  { key: 'kategoria_pojazdu', label: 'Kategoria pojazdu (J)', section: 'registration' },
  { key: 'k_numer_homologacji', label: 'Numer świadectwa homologacji (K)', section: 'registration' },

  // 2. Posiadacz i właściciel
  { key: 'wlasciciel', label: 'Posiadacz dowodu (C.1.1)', section: 'owner' },
  { key: 'c_1_2_pesel_regon', label: 'PESEL / REGON posiadacza (C.1.2)', section: 'owner', isMono: true },
  { key: 'adres_wlasciciela', label: 'Adres posiadacza (C.1.3)', section: 'owner' },
  { key: 'c_2_1_wlasciciel', label: 'Właściciel pojazdu (C.2.1)', section: 'owner' },
  { key: 'c_2_2_pesel_regon', label: 'PESEL / REGON właściciela (C.2.2)', section: 'owner', isMono: true },
  { key: 'c_2_3_adres', label: 'Adres właściciela (C.2.3)', section: 'owner' },

  // 3. Pojazd i parametry techniczne
  { key: 'marka', label: 'Marka pojazdu (D.1)', section: 'technical' },
  { key: 'typ', label: 'Typ pojazdu / wersja (D.2)', section: 'technical' },
  { key: 'model', label: 'Model pojazdu (D.3)', section: 'technical' },
  { key: 'rodzaj_pojazdu', label: 'Rodzaj pojazdu (Rodzaj)', section: 'technical' },
  { key: 'vin', label: 'Numer VIN (E)', section: 'technical', isMono: true },
  { key: 'rok_produkcji', label: 'Rok produkcji', section: 'technical' },
  { key: 'pojemnosc_silnika_cm3', label: 'Pojemność silnika (P.1)', section: 'technical', displaySuffix: ' cm³' },
  { key: 'moc_silnika_kw', label: 'Moc silnika (P.2)', section: 'technical', displaySuffix: ' kW' },
  { key: 'rodzaj_paliwa', label: 'Rodzaj paliwa (P.3)', section: 'technical' },
  { key: 'q_moc_do_masy', label: 'Stosunek mocy do masy (Q)', section: 'technical', displaySuffix: ' kW/kg' },

  // 4. Masy, osie, przyczepy i miejsca
  { key: 'f_1_maksymalna_masa_kg', label: 'Maks. masa całkowita (F.1)', section: 'masses', displaySuffix: ' kg' },
  { key: 'dopuszczalna_masa_calkowita_kg', label: 'Dopuszczalna masa całk. (F.2)', section: 'masses', displaySuffix: ' kg' },
  { key: 'f_3_dopuszczalna_masa_zespolu_kg', label: 'DMC zespołu pojazdów (F.3)', section: 'masses', displaySuffix: ' kg' },
  { key: 'masa_wlasna_kg', label: 'Masa własna (G)', section: 'masses', displaySuffix: ' kg' },
  { key: 'l_liczba_osi', label: 'Liczba osi (L)', section: 'masses' },
  { key: 'o_1_przyczepa_z_hamulcem_kg', label: 'Przyczepa z hamulcem (O.1)', section: 'masses', displaySuffix: ' kg' },
  { key: 'o_2_przyczepa_bez_hamulca_kg', label: 'Przyczepa bez hamulca (O.2)', section: 'masses', displaySuffix: ' kg' },
  { key: 'liczba_miejsc', label: 'Liczba miejsc siedzących (S.1)', section: 'masses' },
  { key: 's_2_liczba_miejsc_stojacych', label: 'Liczba miejsc stojących (S.2)', section: 'masses' },

  // 5. Ważność i adnotacje urzędowe
  { key: 'termin_badania_technicznego', label: 'Termin badania technicznego', section: 'validity' },
  { key: 'adnotacje_urzedowe', label: 'Adnotacje urzędowe', section: 'validity' },
];

export const DEFAULT_COPY_CONFIG: CopyFieldConfig[] = VEHICLE_FIELD_DEFINITIONS.map((f, i) => ({
  key: f.key,
  enabled: true,
  order: i,
}));
