export interface ShippingRate {
  countryCode: string;
  countryName: string;
  price: number;
  method?: string;
  deliveryTime?: string;
}

export interface ProductVariant {
  color: string;
  image: string;
  price: string;
  stock: string;
  size?: string;
  shippingFee?: number;
  cjVid?: string;
  shippingRates?: ShippingRate[];
}
