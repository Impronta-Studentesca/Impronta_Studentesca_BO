// src/app/model/persona.model.ts
export enum Ruolo {
  DIRETTIVO = 'DIRETTIVO',
  DIRETTIVO_DIPARTIMENTALE = 'DIRETTIVO_DIPARTIMENTALE',
  STAFF = 'STAFF',
  RAPPRESENTANTE = 'RAPPRESENTANTE',
  RESPONSABILE_UFFICIO = 'RESPONSABILE_UFFICIO',
  USER = 'USER',
}

export const RUOLO_LABEL: Record<Ruolo, string> = {
  [Ruolo.DIRETTIVO]: 'Direttivo',
  [Ruolo.DIRETTIVO_DIPARTIMENTALE]: 'Direttivo dipartimentale',
  [Ruolo.STAFF]: 'Staff',
  [Ruolo.RAPPRESENTANTE]: 'Rappresentante',
  [Ruolo.RESPONSABILE_UFFICIO]: 'Responsabile ufficio',
  [Ruolo.USER]: 'User',
};

export interface PersonaRequestDTO {
  id?: number;

  nome: string;
  cognome: string;
  email: string;

  corsoDiStudiId?: number | null;
  annoCorso?: number | null;

  ufficioId?: number | null;
  staff?: boolean;

  ruoli?: Ruolo[]; // <-- array di stringhe enum
}

export interface PersonaResponseDTO {
  id: number;
  ruoli: Ruolo[] | string[];

  nome: string;
  cognome: string;

  corsoDiStudi?: any;
  annoCorso?: number | null;
  ufficio?: any;
}
