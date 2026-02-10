export enum TipoCorso {
  TRIENNALE = 'TRIENNALE',
  MAGISTRALE = 'MAGISTRALE',
  CICLO_UNICO = 'CICLO_UNICO',
  ALTRA = 'ALTRA',
}

export interface DipartimentoDTO {
  id: number;
  nome: string;
  codice: string;
}

export interface CorsoDiStudiRequestDTO {
  id?: number;
  nome: string;
  dipartimentoId: number;
  tipoCorso: TipoCorso;
}

export interface CorsoDiStudiResponseDTO {
  id: number;
  nome: string;
  tipoCorso: TipoCorso;
  dipartimento?: DipartimentoDTO; // nel BE può essere null
}

export const TIPO_CORSO_LABEL: Record<TipoCorso, string> = {
  [TipoCorso.TRIENNALE]: 'Triennale',
  [TipoCorso.MAGISTRALE]: 'Magistrale',
  [TipoCorso.CICLO_UNICO]: 'Ciclo unico',
  [TipoCorso.ALTRA]: 'Altra',
};
