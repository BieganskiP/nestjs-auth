import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateDeliveryStopDto } from './dto/create-delivery-stop.dto';
import { UpdateDeliveryStopDto } from './dto/update-delivery-stop.dto';
import { BulkUpdateRouteDto } from './dto/bulk-update-route.dto';
import { DeliveryStop } from './entities/delivery-stop.entity';
import { RoutesService } from '../routes/routes.service';
import { DeliveryManifestsService } from '../delivery-manifests/delivery-manifests.service';

@Injectable()
export class DeliveryStopsService {
  constructor(
    @InjectRepository(DeliveryStop)
    private stopsRepository: Repository<DeliveryStop>,
    private routesService: RoutesService,
    private manifestsService: DeliveryManifestsService,
  ) {}

  async create(createStopDto: CreateDeliveryStopDto): Promise<DeliveryStop> {
    const stop = this.stopsRepository.create(createStopDto);

    // Verify manifest exists
    await this.manifestsService.findOne(createStopDto.manifestId);

    // Verify route exists if provided
    if (createStopDto.routeId) {
      await this.routesService.findOne(createStopDto.routeId);
    }

    return this.stopsRepository.save(stop);
  }

  async findAll(
    filters: {
      manifestId?: string;
      routeId?: string;
      date?: string;
    } = {},
  ): Promise<DeliveryStop[]> {
    const queryBuilder = this.stopsRepository
      .createQueryBuilder('stop')
      .leftJoinAndSelect('stop.route', 'route')
      .leftJoinAndSelect('stop.manifest', 'manifest');

    if (filters.manifestId) {
      queryBuilder.andWhere('stop.manifestId = :manifestId', {
        manifestId: filters.manifestId,
      });
    }

    if (filters.routeId) {
      queryBuilder.andWhere('stop.routeId = :routeId', {
        routeId: filters.routeId,
      });
    }

    if (filters.date) {
      queryBuilder.andWhere('DATE(stop.deliveryDate) = DATE(:date)', {
        date: filters.date,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<DeliveryStop> {
    const stop = await this.stopsRepository.findOne({
      where: { id },
      relations: ['route', 'manifest'],
    });

    if (!stop) {
      throw new NotFoundException(`Delivery stop with ID ${id} not found`);
    }

    return stop;
  }

  async update(
    id: string,
    updateStopDto: UpdateDeliveryStopDto,
  ): Promise<DeliveryStop> {
    const stop = await this.findOne(id);

    // Verify manifest exists if changing
    if (
      updateStopDto.manifestId &&
      updateStopDto.manifestId !== stop.manifestId
    ) {
      await this.manifestsService.findOne(updateStopDto.manifestId);
    }

    // Verify route exists if changing
    if (updateStopDto.routeId && updateStopDto.routeId !== stop.routeId) {
      await this.routesService.findOne(updateStopDto.routeId);
    }

    Object.assign(stop, updateStopDto);

    return this.stopsRepository.save(stop);
  }

  async remove(id: string): Promise<void> {
    const result = await this.stopsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Delivery stop with ID ${id} not found`);
    }
  }

  // Add the missing method
  async bulkUpdateRoute(bulkUpdateDto: BulkUpdateRouteDto): Promise<DeliveryStop[]> {
    // Verify route exists
    await this.routesService.findOne(bulkUpdateDto.routeId);
    
    // Find all stops to update
    const stops = await this.stopsRepository.find({
      where: { id: In(bulkUpdateDto.stopIds) },
    });
    
    if (stops.length === 0) {
      throw new NotFoundException('No delivery stops found with the provided IDs');
    }
    
    // Update route for all stops
    stops.forEach(stop => {
      stop.routeId = bulkUpdateDto.routeId;
    });
    
    // Save all updates
    return this.stopsRepository.save(stops);
  }
}
