import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DeliveryStopsService } from './delivery-stops.service';
import { CreateDeliveryStopDto } from './dto/create-delivery-stop.dto';
import { UpdateDeliveryStopDto } from './dto/update-delivery-stop.dto';
import { BulkUpdateRouteDto } from './dto/bulk-update-route.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('delivery-stops')
export class DeliveryStopsController {
  constructor(private readonly stopsService: DeliveryStopsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LEADER)
  create(@Body() createStopDto: CreateDeliveryStopDto) {
    return this.stopsService.create(createStopDto);
  }

  @Get()
  findAll(
    @Query('manifestId') manifestId?: string,
    @Query('routeId') routeId?: string,
    @Query('date') date?: string,
  ) {
    return this.stopsService.findAll({ manifestId, routeId, date });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.LEADER)
  update(
    @Param('id') id: string,
    @Body() updateStopDto: UpdateDeliveryStopDto,
  ) {
    return this.stopsService.update(id, updateStopDto);
  }

  @Post('bulk-update-route')
  @Roles(Role.ADMIN, Role.LEADER)
  bulkUpdateRoute(@Body() bulkUpdateDto: BulkUpdateRouteDto) {
    return this.stopsService.bulkUpdateRoute(bulkUpdateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.stopsService.remove(id);
  }
}
