import { IsArray, IsUUID } from 'class-validator';

export class BulkUpdateRouteDto {
  @IsArray()
  @IsUUID('4', { each: true })
  stopIds: string[];

  @IsUUID()
  routeId: string;
}
