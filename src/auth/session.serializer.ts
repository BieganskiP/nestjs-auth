import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(
    user: User,
    done: (err: Error | undefined, user: any) => void,
  ): void {
    done(undefined, user.id);
  }

  async deserializeUser(
    userId: string,
    done: (err: Error | undefined, payload: any) => void,
  ): Promise<void> {
    try {
      const user = await this.usersService.findOne(userId);
      done(undefined, user);
    } catch (error) {
      done(error as Error, undefined);
    }
  }
}
