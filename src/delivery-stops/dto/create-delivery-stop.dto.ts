import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeliveryStopDto {
  @IsString()
  customerName: string;

  @IsString()
  city: string;

  @IsString()
  @Length(5, 10)
  postCode: string;

  @IsString()
  address: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Delivery time must be in format HH:MM (24-hour format)',
  })
  deliveryTime: string;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  accessCode?: string;

  @IsUUID()
  @IsOptional()
  routeId?: string;

  @IsDate()
  @Type(() => Date)
  deliveryDate: Date;

  @IsUUID()
  manifestId: string;
}
