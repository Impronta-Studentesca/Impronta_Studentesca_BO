export interface PersonaDirettivoRequestDTO {
  personaId: number;
  direttivoId: number;
  ruoloNelDirettivo: string; // oppure enum se ce l’hai
}

export interface PersonaRappresentanzaRequestDTO {
  personaId: number;
  organoRappresentanzaId: number;
  dataInizio?: string | null; // ISO: 'YYYY-MM-DD'
  dataFine?: string | null;   // ISO: 'YYYY-MM-DD'
}
