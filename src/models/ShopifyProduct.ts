import { Schema, model, Document } from 'mongoose';

export interface IShopifyProduct extends Document {
    catalogId?: Schema.Types.ObjectId;
    'Handle'?: string;
    'Title': string;
    'Body (HTML)'?: string;
    'Vendor'?: string;
    'Product Category'?: string;
    'Type'?: string;
    'Tags'?: string;
    'Published'?: string;
    'Option1 Name'?: string;
    'Option1 Value'?: string;
    'Option1 Linked To'?: string;
    'Option2 Name'?: string;
    'Option2 Value'?: string;
    'Option2 Linked To'?: string;
    'Option3 Name'?: string;
    'Option3 Value'?: string;
    'Option3 Linked To'?: string;
    'Variant SKU'?: string;
    'Variant Grams'?: number;
    'Variant Inventory Tracker'?: string;
    'Variant Inventory Qty'?: number;
    'Variant Inventory Policy'?: string;
    'Variant Fulfillment Service'?: string;
    'Variant Price': number;
    'Variant Compare At Price'?: number;
    'Variant Requires Shipping'?: string;
    'Variant Taxable'?: string;
    'Unit Price Total Measure'?: number;
    'Unit Price Total Measure Unit'?: string;
    'Unit Price Base Measure'?: number;
    'Unit Price Base Measure Unit'?: string;
    'Variant Barcode'?: string;
    'Image Src'?: string;
    'Image Position'?: number;
    'Image Alt Text'?: string;
    'Gift Card'?: string;
    'SEO Title'?: string;
    'SEO Description'?: string;
    'Variant Image'?: string;
    'Variant Weight Unit'?: string;
    'Variant Tax Code'?: string;
    'Cost per item'?: number;
    'Status'?: string;
    aiGenerated?: boolean;
    generatedAt?: Date;
}

const shopifyProductSchema = new Schema<IShopifyProduct>({
    catalogId: {
        type: Schema.Types.ObjectId,
        ref: 'Catalog',
        index: true,
    },
    'Handle': {
        type: String,
        trim: true,
        lowercase: true,
    },
    'Title': {
        type: String,
        required: [true, 'Product title is required'],
        trim: true,
    },
    'Body (HTML)': {
        type: String,
        trim: true,
    },
    'Vendor': {
        type: String,
        trim: true,
    },
    'Product Category': {
        type: String,
        trim: true,
    },
    'Type': {
        type: String,
        trim: true,
    },
    'Tags': {
        type: String,
        trim: true,
    },
    'Published': {
        type: String,
        default: 'TRUE',
    },
    'Option1 Name': {
        type: String,
        trim: true,
    },
    'Option1 Value': {
        type: String,
        trim: true,
    },
    'Option1 Linked To': {
        type: String,
        trim: true,
    },
    'Option2 Name': {
        type: String,
        trim: true,
    },
    'Option2 Value': {
        type: String,
        trim: true,
    },
    'Option2 Linked To': {
        type: String,
        trim: true,
    },
    'Option3 Name': {
        type: String,
        trim: true,
    },
    'Option3 Value': {
        type: String,
        trim: true,
    },
    'Option3 Linked To': {
        type: String,
        trim: true,
    },
    'Variant SKU': {
        type: String,
        trim: true,
        uppercase: true,
    },
    'Variant Grams': {
        type: Number,
        min: [0, 'Weight cannot be negative'],
    },
    'Variant Inventory Tracker': {
        type: String,
        default: 'shopify',
    },
    'Variant Inventory Qty': {
        type: Number,
        min: [0, 'Inventory cannot be negative'],
        default: 0,
    },
    'Variant Inventory Policy': {
        type: String,
        default: 'deny',
    },
    'Variant Fulfillment Service': {
        type: String,
        default: 'manual',
    },
    'Variant Price': {
        type: Number,
        required: [true, 'Variant price is required'],
        min: [0, 'Price cannot be negative'],
    },
    'Variant Compare At Price': {
        type: Number,
        min: [0, 'Compare at price cannot be negative'],
    },
    'Variant Requires Shipping': {
        type: String,
        default: 'TRUE',
    },
    'Variant Taxable': {
        type: String,
        default: 'TRUE',
    },
    'Unit Price Total Measure': {
        type: Number,
        min: [0, 'Unit price total measure cannot be negative'],
    },
    'Unit Price Total Measure Unit': {
        type: String,
        trim: true,
    },
    'Unit Price Base Measure': {
        type: Number,
        min: [0, 'Unit price base measure cannot be negative'],
    },
    'Unit Price Base Measure Unit': {
        type: String,
        trim: true,
    },
    'Variant Barcode': {
        type: String,
        trim: true,
    },
    'Image Src': {
        type: String,
        trim: true,
    },
    'Image Position': {
        type: Number,
        default: 1,
    },
    'Image Alt Text': {
        type: String,
        trim: true,
    },
    'Gift Card': {
        type: String,
        default: 'FALSE',
    },
    'SEO Title': {
        type: String,
        trim: true,
    },
    'SEO Description': {
        type: String,
        trim: true,
    },
    'Variant Image': {
        type: String,
        trim: true,
    },
    'Variant Weight Unit': {
        type: String,
        default: 'g',
    },
    'Variant Tax Code': {
        type: String,
        trim: true,
    },
    'Cost per item': {
        type: Number,
        min: [0, 'Cost per item cannot be negative'],
    },
    'Status': {
        type: String,
        default: 'active',
    },
    aiGenerated: {
        type: Boolean,
        default: true,
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

export const ShopifyProduct = model<IShopifyProduct>('ShopifyProduct', shopifyProductSchema);
