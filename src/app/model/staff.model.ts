// src/app/model/staff.model.ts
import { CorsoDiStudiResponseDTO } from './corsi.model';

export interface StaffCardDTO {
  id: number;
  nome: string;
  cognome: string;
  mail: string;

  ruoli: string[];

  corsoDiStudi?: CorsoDiStudiResponseDTO | null;
  annoCorso?: number | null;

  fotoUrl?: string | null;
  fotoThumbnailUrl?: string | null;

  direttivoRuoli?: string[] | null;
  rappresentanze?: string[] | null;
}
