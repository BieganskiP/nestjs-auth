import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { Region } from './entities/region.entity';
import { RoutesService } from '../routes/routes.service';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private regionsRepository: Repository<Region>,
    private routesService: RoutesService,
  ) {}

  async create(createRegionDto: CreateRegionDto): Promise<Region> {
    const { routeIds, ...regionData } = createRegionDto;

    const region = this.regionsRepository.create(regionData);

    if (routeIds && routeIds.length > 0) {
      const routes = await Promise.all(
        routeIds.map((id) => this.routesService.findOne(id)),
      );
      region.routes = routes;
    }

    return this.regionsRepository.save(region);
  }

  async findAll(filters: { active?: boolean } = {}): Promise<Region[]> {
    const queryBuilder = this.regionsRepository
      .createQueryBuilder('region')
      .leftJoinAndSelect('region.leader', 'leader')
      .leftJoinAndSelect('region.routes', 'route');

    if (filters.active !== undefined) {
      queryBuilder.andWhere('region.active = :active', {
        active: filters.active,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Region> {
    const region = await this.regionsRepository.findOne({
      where: { id },
      relations: ['leader', 'routes'],
    });

    if (!region) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }

    return region;
  }

  async update(id: string, updateRegionDto: UpdateRegionDto): Promise<Region> {
    const { routeIds, ...regionData } = updateRegionDto;

    const region = await this.findOne(id);

    Object.assign(region, regionData);

    if (routeIds) {
      const routes = await Promise.all(
        routeIds.map((id) => this.routesService.findOne(id)),
      );
      region.routes = routes;
    }

    return this.regionsRepository.save(region);
  }

  async remove(id: string): Promise<void> {
    const result = await this.regionsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Region with ID ${id} not found`);
    }
  }

  async addRoutes(id: string, routeIds: string[]): Promise<Region> {
    const region = await this.findOne(id);

    // Get the new routes
    const newRoutes = await Promise.all(
      routeIds.map((routeId) => this.routesService.findOne(routeId)),
    );

    // Get existing route IDs to avoid duplicates
    const existingRouteIds = region.routes.map((route) => route.id);

    // Filter out routes that are already associated with the region
    const uniqueNewRoutes = newRoutes.filter(
      (route) => !existingRouteIds.includes(route.id),
    );

    // Add the new routes to the existing ones
    region.routes = [...region.routes, ...uniqueNewRoutes];

    // Save and return the updated region
    return this.regionsRepository.save(region);
  }

  async removeRoute(id: string, routeId: string): Promise<Region> {
    const region = await this.findOne(id);

    // Check if the route exists in the region
    const routeExists = region.routes.some((route) => route.id === routeId);

    if (!routeExists) {
      throw new NotFoundException(
        `Route with ID ${routeId} not found in region with ID ${id}`,
      );
    }

    // Filter out the route to be removed
    region.routes = region.routes.filter((route) => route.id !== routeId);

    // Save and return the updated region
    return this.regionsRepository.save(region);
  }
}
