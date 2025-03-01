import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryManifestsService } from './delivery-manifests.service';
import { DeliveryManifestsController } from './delivery-manifests.controller';
import { DeliveryManifest } from './entities/delivery-manifest.entity';
import { RoutesModule } from '../routes/routes.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryManifest]), RoutesModule],
  controllers: [DeliveryManifestsController],
  providers: [DeliveryManifestsService],
  exports: [DeliveryManifestsService],
})
export class DeliveryManifestsModule {}
