import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionsService } from './regions.service';
import { RegionsController } from './regions.controller';
import { Region } from './entities/region.entity';
import { UsersModule } from '../users/users.module';
import { RoutesModule } from '../routes/routes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Region]), UsersModule, RoutesModule],
  controllers: [RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
