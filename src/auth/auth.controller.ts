import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { Request } from 'express';

class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// This DTO is used in the Swagger documentation
// class LoginDto {
//   email: string;
//   password: string;
// }

class ResetPasswordRequestDto {
  email: string;
}

class ResetPasswordDto {
  token: string;
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  login(@Req() req: Request) {
    // The user is automatically added to the request by Passport
    return {
      message: 'Login successful',
      user: req.user,
    };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request) {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
    });

    return { message: 'Logout successful' };
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    const isVerified = await this.authService.verifyEmail(token);
    if (isVerified) {
      return { message: 'Email verification successful. You can now log in.' };
    } else {
      return { message: 'Invalid or expired verification token.' };
    }
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() resetRequestDto: ResetPasswordRequestDto) {
    await this.authService.requestPasswordReset(resetRequestDto.email);
    return {
      message:
        'If your email is registered, you will receive password reset instructions.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const isReset = await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    if (isReset) {
      return {
        message:
          'Password has been reset successfully. You can now log in with your new password.',
      };
    } else {
      return { message: 'Invalid or expired reset token.' };
    }
  }

  @Get('profile')
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
