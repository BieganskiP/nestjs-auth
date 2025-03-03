import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeliveryManifestDto } from './dto/create-delivery-manifest.dto';
import { UpdateDeliveryManifestDto } from './dto/update-delivery-manifest.dto';
import { DeliveryManifest } from './entities/delivery-manifest.entity';
import { RoutesService } from '../routes/routes.service';

@Injectable()
export class DeliveryManifestsService {
  constructor(
    @InjectRepository(DeliveryManifest)
    private manifestsRepository: Repository<DeliveryManifest>,
    private routesService: RoutesService,
  ) {}

  async create(
    createManifestDto: CreateDeliveryManifestDto,
  ): Promise<DeliveryManifest> {
    const manifest = this.manifestsRepository.create(createManifestDto);

    if (createManifestDto.routeId) {
      await this.routesService.findOne(createManifestDto.routeId);
    }

    return this.manifestsRepository.save(manifest);
  }

  async findAll(
    filters: { routeId?: string; date?: string } = {},
  ): Promise<DeliveryManifest[]> {
    const queryBuilder = this.manifestsRepository
      .createQueryBuilder('manifest')
      .leftJoinAndSelect('manifest.route', 'route')
      .leftJoinAndSelect('manifest.deliveryStops', 'stop');

    if (filters.routeId) {
      queryBuilder.andWhere('manifest.routeId = :routeId', {
        routeId: filters.routeId,
      });
    }

    if (filters.date) {
      queryBuilder.andWhere('DATE(manifest.deliveryDate) = DATE(:date)', {
        date: filters.date,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<DeliveryManifest> {
    const manifest = await this.manifestsRepository.findOne({
      where: { id },
      relations: ['route', 'deliveryStops'],
    });

    if (!manifest) {
      throw new NotFoundException(`Delivery manifest with ID ${id} not found`);
    }

    return manifest;
  }

  async update(
    id: string,
    updateManifestDto: UpdateDeliveryManifestDto,
  ): Promise<DeliveryManifest> {
    const manifest = await this.findOne(id);

    if (
      updateManifestDto.routeId &&
      updateManifestDto.routeId !== manifest.routeId
    ) {
      await this.routesService.findOne(updateManifestDto.routeId);
    }

    Object.assign(manifest, updateManifestDto);

    return this.manifestsRepository.save(manifest);
  }

  async remove(id: string): Promise<void> {
    const result = await this.manifestsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Delivery manifest with ID ${id} not found`);
    }
  }

  async findManifestsForUserRoute(
    userId: string,
    date?: string,
  ): Promise<DeliveryManifest[]> {
    // Find routes where this user is assigned
    const routes = await this.routesService.findByUserId(userId);

    if (!routes || routes.length === 0) {
      throw new NotFoundException(
        'You do not have any routes assigned. Please contact an administrator.',
      );
    }

    // Get route IDs
    const routeIds = routes.map((route) => route.id);

    // Build query to find manifests for these routes
    const queryBuilder = this.manifestsRepository
      .createQueryBuilder('manifest')
      .leftJoinAndSelect('manifest.route', 'route')
      .leftJoinAndSelect('manifest.deliveryStops', 'stop')
      .where('manifest.routeId IN (:...routeIds)', { routeIds });

    if (date) {
      queryBuilder.andWhere('DATE(manifest.deliveryDate) = DATE(:date)', {
        date,
      });
    }

    const manifests = await queryBuilder.getMany();

    return manifests;
  }
}
