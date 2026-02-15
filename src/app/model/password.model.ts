export type PasswordAction = 'crea' | 'modifica';

export interface PasswordSetRequest {
  password: string;
  token?: string; // opzionale: quando lo aggiungi lato backend
}
