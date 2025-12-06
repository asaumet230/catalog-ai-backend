import { Schema, model, Document } from 'mongoose';

export interface IWooCommerceProduct extends Document {
    catalogId?: Schema.Types.ObjectId;
    'ID'?: string;
    'Type'?: string;
    'SKU'?: string;
    'GTIN, UPC, EAN, or ISBN'?: string;
    'Name': string;
    'Published'?: number;
    'Is featured?'?: number;
    'Visibility in catalog'?: string;
    'Short description'?: string;
    'Description'?: string;
    'Date sale price starts'?: string;
    'Date sale price ends'?: string;
    'Tax status'?: string;
    'Tax class'?: string;
    'In stock?'?: number;
    'Stock'?: number;
    'Low stock amount'?: number;
    'Backorders allowed?'?: number;
    'Sold individually?'?: number;
    'Weight (kg)'?: number;
    'Weight (g)'?: number;
    'Length (cm)'?: number;
    'Width (cm)'?: number;
    'Height (cm)'?: number;
    'Allow customer reviews?'?: number;
    'Purchase note'?: string;
    'Sale price'?: number;
    'Regular price': number;
    'Categories'?: string;
    'Tags'?: string;
    'Shipping class'?: string;
    'Images'?: string;
    'Download limit'?: number;
    'Download expiry days'?: number;
    'Downloadable files'?: string;
    'Virtual'?: number;
    'Parent'?: string;
    'Upsells'?: string;
    'Cross-sells'?: string;
    'Grouped products'?: string;
    'External URL'?: string;
    'Button text'?: string;
    'Position'?: number;
    'variations'?: any[];
    'Attribute 1 name'?: string;
    'Attribute 1 value(s)'?: string;
    'Attribute 1 visible'?: number;
    'Attribute 1 global'?: number;
    'Attribute 2 name'?: string;
    'Attribute 2 value(s)'?: string;
    'Attribute 2 visible'?: number;
    'Attribute 2 global'?: number;
    'Attribute 3 name'?: string;
    'Attribute 3 value(s)'?: string;
    'Attribute 3 visible'?: number;
    'Attribute 3 global'?: number;
    'SEO Title'?: string;
    'Meta Description'?: string;
    aiGenerated?: boolean;
    generatedAt?: Date;
}

const wooCommerceProductSchema = new Schema<IWooCommerceProduct>({
    catalogId: {
        type: Schema.Types.ObjectId,
        ref: 'Catalog',
        index: true,
    },
    'ID': {
        type: String,
        trim: true,
    },
    'Type': {
        type: String,
        trim: true,
    },
    'SKU': {
        type: String,
        trim: true,
        uppercase: true,
    },
    'GTIN, UPC, EAN, or ISBN': {
        type: String,
        trim: true,
    },
    'Name': {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
    },
    'Published': {
        type: Number,
        default: 1,
    },
    'Is featured?': {
        type: Number,
        default: 0,
    },
    'Visibility in catalog': {
        type: String,
        trim: true,
        default: 'visible',
    },
    'Short description': {
        type: String,
        trim: true,
    },
    'Description': {
        type: String,
        trim: true,
    },
    'Date sale price starts': {
        type: String,
        trim: true,
    },
    'Date sale price ends': {
        type: String,
        trim: true,
    },
    'Tax status': {
        type: String,
        trim: true,
        default: 'taxable',
    },
    'Tax class': {
        type: String,
        trim: true,
        default: 'standard',
    },
    'In stock?': {
        type: Number,
        default: 1,
    },
    'Stock': {
        type: Number,
        min: [0, 'Stock cannot be negative'],
        default: 0,
    },
    'Low stock amount': {
        type: Number,
        min: [0, 'Low stock amount cannot be negative'],
    },
    'Backorders allowed?': {
        type: Number,
        default: 0,
    },
    'Sold individually?': {
        type: Number,
        default: 0,
    },
    'Weight (kg)': {
        type: Number,
        min: [0, 'Weight cannot be negative'],
    },
    'Weight (g)': {
        type: Number,
        min: [0, 'Weight cannot be negative'],
    },
    'Length (cm)': {
        type: Number,
        min: [0, 'Length cannot be negative'],
    },
    'Width (cm)': {
        type: Number,
        min: [0, 'Width cannot be negative'],
    },
    'Height (cm)': {
        type: Number,
        min: [0, 'Height cannot be negative'],
    },
    'Allow customer reviews?': {
        type: Number,
        default: 1,
    },
    'Purchase note': {
        type: String,
        trim: true,
    },
    'Sale price': {
        type: Number,
        min: [0, 'Sale price cannot be negative'],
    },
    'Regular price': {
        type: Number,
        min: [0, 'Price cannot be negative'],
    },
    'Categories': {
        type: String,
        trim: true,
    },
    'Tags': {
        type: String,
        trim: true,
    },
    'Shipping class': {
        type: String,
        trim: true,
    },
    'Images': {
        type: String,
        trim: true,
    },
    'Download limit': {
        type: Number,
        default: -1,
    },
    'Download expiry days': {
        type: Number,
        default: -1,
    },
    'Downloadable files': {
        type: String,
        trim: true,
    },
    'Virtual': {
        type: Number,
        default: 0,
    },
    'Parent': {
        type: String,
        trim: true,
    },
    'Upsells': {
        type: String,
        trim: true,
    },
    'Cross-sells': {
        type: String,
        trim: true,
    },
    'Grouped products': {
        type: String,
        trim: true,
    },
    'External URL': {
        type: String,
        trim: true,
    },
    'Button text': {
        type: String,
        trim: true,
    },
    'Position': {
        type: Number,
        default: 0,
    },
    'Attribute 1 name': {
        type: String,
        trim: true,
    },
    'Attribute 1 value(s)': {
        type: String,
        trim: true,
    },
    'Attribute 1 visible': {
        type: Number,
    },
    'Attribute 1 global': {
        type: Number,
    },
    'Attribute 2 name': {
        type: String,
        trim: true,
    },
    'Attribute 2 value(s)': {
        type: String,
        trim: true,
    },
    'Attribute 2 visible': {
        type: Number,
    },
    'Attribute 2 global': {
        type: Number,
    },
    'Attribute 3 name': {
        type: String,
        trim: true,
    },
    'Attribute 3 value(s)': {
        type: String,
        trim: true,
    },
    'Attribute 3 visible': {
        type: Number,
    },
    'Attribute 3 global': {
        type: Number,
    },
    'SEO Title': {
        type: String,
        trim: true,
    },
    'Meta Description': {
        type: String,
        trim: true,
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

export const WooCommerceProduct = model<IWooCommerceProduct>('WooCommerceProduct', wooCommerceProductSchema);
