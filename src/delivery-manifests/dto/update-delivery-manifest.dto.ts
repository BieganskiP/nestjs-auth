import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryManifestDto } from './create-delivery-manifest.dto';

export class UpdateDeliveryManifestDto extends PartialType(
  CreateDeliveryManifestDto,
) {}
