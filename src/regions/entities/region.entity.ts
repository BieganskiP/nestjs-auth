import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Route } from '../../routes/entities/route.entity';

@Entity('regions')
export class Region {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'leaderId' })
  leader: User;

  @Column({ nullable: true })
  leaderId: string;

  @ManyToMany(() => Route, (route) => route.regions)
  @JoinTable({
    name: 'region_routes',
    joinColumn: { name: 'regionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'routeId', referencedColumnName: 'id' },
  })
  routes: Route[];

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
