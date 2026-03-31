import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyResponseDto {
  @ApiProperty({ description: 'Yanit icerigi', minLength: 10, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: 'Yanit veren kisi adi' })
  @IsOptional()
  @IsString()
  responderName?: string;
}
