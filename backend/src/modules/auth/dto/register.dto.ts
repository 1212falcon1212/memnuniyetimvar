import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: 'ahmet@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+905551234567' })
  @IsString()
  @Matches(/^\+90\d{10}$/, { message: 'Geçerli bir Türkiye telefon numarası giriniz (+90XXXXXXXXXX)' })
  phone: string;

  @ApiProperty({ example: 'Guclu$ifre123' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}
