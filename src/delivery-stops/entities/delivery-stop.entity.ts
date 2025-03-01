import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Route } from '../../routes/entities/route.entity';
import { DeliveryManifest } from '../../delivery-manifests/entities/delivery-manifest.entity';

@Entity('delivery_stops')
export class DeliveryStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerName: string;

  @Column()
  city: string;

  @Column()
  postCode: string;

  @Column()
  address: string;

  @Column()
  deliveryTime: string; // Stored as '06:30' format

  @Column({ nullable: true })
  instructions: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  accessCode: string;

  @ManyToOne(() => Route, { nullable: true })
  @JoinColumn({ name: 'routeId' })
  route: Route;

  @Column({ nullable: true })
  routeId: string;

  @Column({ type: 'date' })
  deliveryDate: Date;

  @ManyToOne(() => DeliveryManifest, (manifest) => manifest.deliveryStops, {
    nullable: false,
  })
  @JoinColumn({ name: 'manifestId' })
  manifest: DeliveryManifest;

  @Column()
  manifestId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
