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

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  id_product!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsString()
  id_variant!: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  id_user_account!: string;


  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  delivery_address?: string;

  @IsOptional()
  @IsString()
  delivery_city?: string;

  @IsOptional()
  @IsString()
  delivery_postal_code?: string;

  @IsOptional()
  @IsString()
  delivery_phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

}
function IsUUID(): (target: CreateOrderDto, propertyKey: "id_variant") => void {
  throw new Error('Function not implemented.');
}

