import { IsArray, IsUUID } from 'class-validator';

export class AddRoutesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  routeIds: string[];
}
