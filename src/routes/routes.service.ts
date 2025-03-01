import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './entities/route.entity';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private routesRepository: Repository<Route>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    const route = this.routesRepository.create(createRouteDto);
    return this.routesRepository.save(route);
  }

  async findAll(filters: { active?: boolean } = {}): Promise<Route[]> {
    const queryBuilder = this.routesRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.user', 'user')
      .leftJoinAndSelect('route.regions', 'region');

    if (filters.active !== undefined) {
      queryBuilder.andWhere('route.active = :active', {
        active: filters.active,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.routesRepository.findOne({
      where: { id },
      relations: ['user', 'regions'],
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return route;
  }

  async update(id: string, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const route = await this.findOne(id);

    Object.assign(route, updateRouteDto);

    return this.routesRepository.save(route);
  }

  async remove(id: string): Promise<void> {
    const result = await this.routesRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }
  }

  async findByUserId(userId: string): Promise<Route[]> {
    console.log(`Finding routes for user ID: ${userId}`);
    
    const routes = await this.routesRepository.find({
      where: { userId, active: true },
    });
    
    console.log(`Found ${routes.length} routes for user ID: ${userId}`);
    
    return routes;
  }
}
