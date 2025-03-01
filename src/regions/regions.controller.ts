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
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AddRoutesDto } from './dto/add-routes.dto';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @Get()
  findAll(@Query('active') active?: boolean) {
    return this.regionsService.findAll({ active });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    return this.regionsService.update(id, updateRegionDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.regionsService.remove(id);
  }

  @Post(':id/routes')
  @Roles(Role.ADMIN, Role.LEADER)
  addRoutes(@Param('id') id: string, @Body() addRoutesDto: AddRoutesDto) {
    return this.regionsService.addRoutes(id, addRoutesDto.routeIds);
  }

  @Delete(':id/routes/:routeId')
  @Roles(Role.ADMIN, Role.LEADER)
  removeRoute(@Param('id') id: string, @Param('routeId') routeId: string) {
    return this.regionsService.removeRoute(id, routeId);
  }
}
