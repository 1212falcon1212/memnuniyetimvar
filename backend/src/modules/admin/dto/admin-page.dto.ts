import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminCreatePageDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaDescription?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class AdminUpdatePageDto extends AdminCreatePageDto {
  @IsOptional()
  declare title: string;
}
