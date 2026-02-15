export interface DocumentoLinkResponseDTO {
  id: number;
  nome: string;
  mimeType: string;

  webViewLink?: string | null;
  webContentLink?: string | null;
  downloadDirectUrl?: string | null;

  daModificare: boolean;

  createdAt?: string | null;
  updatedAt?: string | null;
}
