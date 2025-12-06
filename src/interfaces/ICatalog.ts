import { Document, Types } from 'mongoose';

export interface ICatalog extends Document {
    name            : string;
    description?    : string;
    userId          : Types.ObjectId;
    products        : Types.ObjectId[];
    productModel    : 'WooCommerceProduct' | 'ShopifyProduct';
    platform        : 'woocommerce' | 'shopify';
    markup          : number;
    status          : 'draft' | 'processing' | 'completed' | 'error';
    totalProducts   : number;
    createdAt       : Date;
    updatedAt       : Date;
}
