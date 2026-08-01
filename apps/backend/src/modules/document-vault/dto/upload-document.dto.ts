import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UploadDocumentDto {
  @IsNotEmpty({ message: 'document_type is required' })
  @IsString({ message: 'document_type must be a string' })
  document_type: string;

  @IsOptional()
  @IsDateString({}, { message: 'expiry_date must be a valid ISO date' })
  expiry_date?: string;
}
