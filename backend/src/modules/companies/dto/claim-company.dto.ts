import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, MaxLength } from 'class-validator';

export class ClaimCompanyDto {
  @ApiProperty({ description: 'Talep eden kisi adi', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  claimerName: string;

  @ApiProperty({ description: 'Talep eden kisi e-postasi', maxLength: 255 })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  claimerEmail: string;

  @ApiProperty({ description: 'Talep eden kisi telefonu', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  claimerPhone: string;
}
