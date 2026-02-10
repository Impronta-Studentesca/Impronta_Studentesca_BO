import { TipoCorso } from '../../model/corsi.model';

export const TIPO_CORSO_LABEL: Record<TipoCorso, string> = {
  [TipoCorso.TRIENNALE]: 'Triennale',
  [TipoCorso.MAGISTRALE]: 'Magistrale',
  [TipoCorso.CICLO_UNICO]: 'Ciclo Unico',
  [TipoCorso.ALTRA]: 'Altra',
};
