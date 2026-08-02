export class UserDocumentDto {
  id: string;
  document_type: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  expiry_date: string | null;
  uploaded_at: Date;
  last_verified_at: Date | null;
}
