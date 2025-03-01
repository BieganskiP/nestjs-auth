import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Route } from '../../routes/entities/route.entity';
import { DeliveryStop } from '../../delivery-stops/entities/delivery-stop.entity';

@Entity('delivery_manifests')
export class DeliveryManifest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  stopCount: number;

  @Column()
  packageCount: number;

  @ManyToOne(() => Route, { nullable: true })
  @JoinColumn({ name: 'routeId' })
  route: Route;

  @Column({ nullable: true })
  routeId: string;

  @Column({ type: 'date' })
  deliveryDate: Date;

  @OneToMany(() => DeliveryStop, (stop) => stop.manifest)
  deliveryStops: DeliveryStop[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
