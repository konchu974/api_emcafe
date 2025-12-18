// src/dtos/order/CreateOrderDto.ts
import { 
  IsString, 
  IsArray, 
  ValidateNested, 
  IsNumber, 
  Min, 
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsBoolean,
  IsUUID,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID(undefined, { message: 'id_product doit être un UUID valide' })
  @IsNotEmpty({ message: 'id_product est requis' })
  id_product!: string;

  @IsUUID(undefined, { message: 'id_variant doit être un UUID valide' })
  @IsNotEmpty({ message: 'id_variant est requis' })
  id_variant!: string;

  @IsNumber({}, { message: 'quantity doit être un nombre' })
  @Min(1, { message: 'La quantité doit être au minimum 1' })
  quantity!: number;
}

export class CreateOrderDto {
  @IsUUID(undefined, { message: 'id_user_account doit être un UUID valide' })
@IsNotEmpty({ message: 'id_user_account est requis' })
id_user_account!: string;


  @IsArray({ message: 'items doit être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un article est requis' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "L'adresse de livraison est requise" })
  delivery_address!: string;

  @IsString()
  @IsNotEmpty({ message: 'La ville de livraison est requise' })
  delivery_city!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le code postal de livraison est requis' })
  delivery_postal_code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le pays de livraison est requis' })
  delivery_country!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le téléphone de livraison est requis' })
  delivery_phone!: string;

  @IsOptional()
@IsNumber({}, { message: 'delivery_cost doit être un nombre' })
delivery_cost?: number;

  @IsOptional()
  @IsBoolean()
  is_relay_delivery?: boolean;

  @IsOptional()
  @IsString()
  relay_point_id?: string;

  @IsOptional()
  @IsString()
  relay_point_name?: string;

  @IsOptional()
  @IsString()
  relay_carrier?: string;

  @IsOptional()
  @IsString()
  notes?: string;

    // ==================== SENDCLOUD ====================

  @IsOptional()
  @IsNumber({}, { message: 'sendcloud_parcel_id doit être un nombre' })
  sendcloud_parcel_id?: number;

  @IsOptional()
  @IsString()
  sendcloud_order_number?: string;

  @IsOptional()
  @IsString()
  tracking_number?: string;

}



