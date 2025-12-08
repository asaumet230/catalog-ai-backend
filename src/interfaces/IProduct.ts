/**
 * Product Interfaces
 * Normalized shape for API responses and platform-aware metadata
 */

export type ProductPlatform = 'shopify' | 'woocommerce';

export interface NormalizedProduct {
    id          : string;
    name        : string;
    sku         : string;
    price       : number;
    platform    : ProductPlatform;
    status?     : string;
    stock?      : number;
    image?      : string;
    description?: string;
    category?   : string;
    brand?      : string;
    catalogId   : string;
    catalogName : string;
    updatedAt?  : Date;
    raw         : any;
}

export interface ProductListResponse {
    ok          : boolean;
    message     : string;
    total       : number;
    page        : number;
    totalPages  : number;
    products    : NormalizedProduct[];
}
