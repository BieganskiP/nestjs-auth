import { Exclude, Expose } from 'class-transformer';

@Exclude() // By default exclude all properties
export class UserResponseDto {
  @Expose() // Only expose these specific properties
  id: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
