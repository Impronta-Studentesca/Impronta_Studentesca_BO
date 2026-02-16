export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruoli: string[];
  token: string
}
