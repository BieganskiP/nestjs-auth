import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryManifestsService } from './delivery-manifests.service';
import { CreateDeliveryManifestDto } from './dto/create-delivery-manifest.dto';
import { UpdateDeliveryManifestDto } from './dto/update-delivery-manifest.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Request } from 'express';

@Controller('delivery-manifests')
export class DeliveryManifestsController {
  constructor(private readonly manifestsService: DeliveryManifestsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LEADER)
  create(@Body() createManifestDto: CreateDeliveryManifestDto) {
    return this.manifestsService.create(createManifestDto);
  }

  @Get()
  findAll(@Query('routeId') routeId?: string, @Query('date') date?: string) {
    return this.manifestsService.findAll({ routeId, date });
  }

  @Get('for-current-user')
  async findForCurrentUser(@Req() req: Request, @Query('date') date?: string) {
    if (!req.user || !req.user['id']) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = req.user['id'];

    try {
      const manifests = await this.manifestsService.findManifestsForUserRoute(
        userId,
        date,
      );
      return {
        success: true,
        data: manifests,
        message:
          manifests.length > 0
            ? `Found ${manifests.length} manifests for your route`
            : 'No manifests found for your route',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          success: false,
          data: [],
          message: error.message,
        };
      }
      throw error; // Re-throw other errors
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.manifestsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.LEADER)
  update(
    @Param('id') id: string,
    @Body() updateManifestDto: UpdateDeliveryManifestDto,
  ) {
    return this.manifestsService.update(id, updateManifestDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.manifestsService.remove(id);
  }
}
