import { IsDate, IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeliveryManifestDto {
  @IsInt()
  @IsPositive()
  stopCount: number;

  @IsInt()
  @IsPositive()
  packageCount: number;

  @IsUUID()
  @IsOptional()
  routeId?: string;

  @IsDate()
  @Type(() => Date)
  deliveryDate: Date;
}
