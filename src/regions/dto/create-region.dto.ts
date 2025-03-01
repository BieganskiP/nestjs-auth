import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class CreateRegionDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  @ValidateIf((o) => o.leaderId !== undefined && o.leaderId !== null)
  leaderId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  routeIds?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
