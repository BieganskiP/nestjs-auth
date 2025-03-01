import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
