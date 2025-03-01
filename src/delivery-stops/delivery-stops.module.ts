import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryStopsService } from './delivery-stops.service';
import { DeliveryStopsController } from './delivery-stops.controller';
import { DeliveryStop } from './entities/delivery-stop.entity';
import { RoutesModule } from '../routes/routes.module';
import { DeliveryManifestsModule } from '../delivery-manifests/delivery-manifests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryStop]),
    RoutesModule,
    DeliveryManifestsModule,
  ],
  controllers: [DeliveryStopsController],
  providers: [DeliveryStopsService],
  exports: [DeliveryStopsService],
})
export class DeliveryStopsModule {}
