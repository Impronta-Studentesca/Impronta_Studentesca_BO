import {PersonaResponseDTO} from "./persona.model";

export enum TipoDirettivo {
  GENERALE = 'GENERALE',
  DIPARTIMENTALE = 'DIPARTIMENTALE',
}

export const TIPO_DIRETTIVO_LABEL: Record<TipoDirettivo, string> = {
  [TipoDirettivo.GENERALE]: 'Generale',
  [TipoDirettivo.DIPARTIMENTALE]: 'Dipartimentale',
};

export interface DirettivoResponseDTO {
  id: number;
  tipo: TipoDirettivo;
  dipartimentoId?: number | null;
  dipartimentoCodice: string | null;
  annoAccademico?: string | null; // nel tuo costruttore non lo setti, quindi può arrivare null/undefined
  inizioMandato: string;          // 'YYYY-MM-DD'
  fineMandato?: string | null;    // null = in carica
  createdAt?: string;             // ISO datetime
  attivo: boolean;
}

export interface DirettivoRequestDTO {
  id?: number | null;
  tipo: TipoDirettivo;
  dipartimentoId?: number | null;
  inizioMandato: string;          // 'YYYY-MM-DD'
  fineMandato?: string | null;
}

/** DTO per assegnare/modificare persona nel direttivo */
export interface PersonaDirettivoRequestDTO {
  personaId: number;
  direttivoId: number;
  ruoloNelDirettivo: string;
}


/** (FE) risposta membri direttivo - serve un GET dal BE */
export interface PersonaDirettivoResponseDTO {
  personaResponseDTO: PersonaResponseDTO;
  direttivoId: number;
  ruoloNelDirettivo: string;
}

export const RUOLI_DIRETTIVO = [
  { code: 'PRESIDENTE', label: 'Presidente', ordine: 1 },
  { code: 'VICE_PRESIDENTE', label: 'Vicepresidente', ordine: 2 },
  { code: 'SEGRETARIO', label: 'Segretario', ordine: 3 },
  { code: 'VICE_SEGRETARIO', label: 'Vicesegretario', ordine: 4 },
  { code: 'TESORIERE', label: 'Tesoriere', ordine: 5 },
  { code: 'VICE_TESORIERE', label: 'Vice tesoriere', ordine: 6 },

  { code: 'RESPONSABILE_COMUNICAZIONE', label: 'Responsabile comunicazione', ordine: 7 },
  { code: 'VICE_RESPONSABILE_COMUNICAZIONE', label: 'Vice responsabile comunicazione', ordine: 8 },
  { code: 'RESPONSABILE_ORGANIZZAZIONE', label: 'Responsabile organizzazione', ordine: 9 },
  { code: 'VICE_RESPONSABILE_ORGANIZZAZIONE', label: 'Vice responsabile organizzazione', ordine: 10 },

  { code: 'SOCIO_CONSIGLIERE', label: 'Socio Consigliere', ordine: 11 },

  { code: 'PRESIDENTE_Dipartimentale', label: 'Presidente dipartimentale', ordine: 1 },
] as const satisfies readonly { code: string; label: string; ordine: number }[];

export type RuoloDirettivoCode = typeof RUOLI_DIRETTIVO[number]['code'];

export const RUOLO_DIRETTIVO_LABEL_BY_CODE: Record<RuoloDirettivoCode, string> =
  RUOLI_DIRETTIVO.reduce((acc, x) => {
    acc[x.code] = x.label;
    return acc;
  }, {} as Record<RuoloDirettivoCode, string>);

export const RUOLO_DIRETTIVO_CODE_BY_LABEL: Record<string, RuoloDirettivoCode> =
  RUOLI_DIRETTIVO.reduce((acc, x) => {
    acc[x.label] = x.code;
    return acc;
  }, {} as Record<string, RuoloDirettivoCode>);



