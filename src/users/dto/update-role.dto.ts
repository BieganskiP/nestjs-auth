import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class UpdateRoleDto {
  @IsEnum(Role, { message: 'Invalid role' })
  @IsNotEmpty({ message: 'Role is required' })
  role: Role;
}
