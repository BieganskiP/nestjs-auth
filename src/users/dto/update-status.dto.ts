import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class UpdateStatusDto {
  @IsEnum(UserStatus, { message: 'Invalid status' })
  @IsNotEmpty({ message: 'Status is required' })
  status: UserStatus;
}
