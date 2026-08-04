import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyDocumentDto {
  @IsNotEmpty({ message: 'password is required' })
  @IsString({ message: 'password must be a string' })
  password: string;
}
