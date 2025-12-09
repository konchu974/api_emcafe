// src/dtos/order/CreateOrderDto.ts

import { 
  IsString, 
  IsArray, 
  ValidateNested, 
  IsNumber, 
  Min, 
  IsOptional,
  IsNotEmpty,
  IsEmail 
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  id_product!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  id_user_account!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsString()
  @IsOptional()
  delivery_address?: string;

  @IsString()
  @IsOptional()
  delivery_city?: string;

  @IsString()
  @IsOptional()
  delivery_postal_code?: string;

  @IsString()
  @IsOptional()
  delivery_phone?: string;

  // ✅ Ajout du champ email
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
