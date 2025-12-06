import { Schema, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

import { ICatalog } from '../interfaces';

const catalogSchema = new Schema<ICatalog>({
    name: {
        type      : String,
        required  : [true, 'Catalog name is required'],
        trim      : true,
    },
    description: {
        type      : String,
        trim      : true,
    },
    userId: {
        type      : Schema.Types.ObjectId,
        ref       : 'User',
        required  : [true, 'User ID is required'],
        index     : true,
    },
    products: [{
        type      : Schema.Types.ObjectId,
        refPath   : 'productModel',
    }],
    productModel: {
        type      : String,
        required  : true,
        enum      : ['WooCommerceProduct', 'ShopifyProduct'],
    },
    platform: {
        type      : String,
        required  : [true, 'Platform is required'],
        enum      : ['woocommerce', 'shopify'],
        lowercase : true,
        trim      : true,
    },
    markup: {
        type      : Number,
        required  : [true, 'Markup is required'],
        min       : [0, 'Markup cannot be negative'],
        max       : [100, 'Markup cannot exceed 100%'],
        default   : 0,
    },
    status: {
        type      : String,
        enum      : ['draft', 'processing', 'completed', 'error'],
        default   : 'draft',
    },
    totalProducts: {
        type      : Number,
        default   : 0,
        min       : [0, 'Total products cannot be negative'],
    },
}, {
    timestamps: true,
});


catalogSchema.plugin(mongoosePaginate);

catalogSchema.methods.toJSON = function() {
    const { __v, ...catalog } = this.toObject();
    return catalog;
}

catalogSchema.pre('save', function(next) {
    this.totalProducts = this.products.length;
    next();
});

export const Catalog = model<ICatalog>('Catalog', catalogSchema);
