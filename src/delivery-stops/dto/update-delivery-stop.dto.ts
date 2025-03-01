import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryStopDto } from './create-delivery-stop.dto';

export class UpdateDeliveryStopDto extends PartialType(CreateDeliveryStopDto) {}
