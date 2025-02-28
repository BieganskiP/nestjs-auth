import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordRequestDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
