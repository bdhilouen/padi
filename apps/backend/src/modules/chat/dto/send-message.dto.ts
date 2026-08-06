import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 5000)
  message: string;
}
