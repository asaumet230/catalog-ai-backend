import { FilterQuery, Model } from 'mongoose';
import { Catalog, ShopifyProduct, WooCommerceProduct } from '../models';
import { NormalizedProduct, ProductPlatform } from '../interfaces';

type PlatformModel = Model<any>;

const stripHtml = (html?: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '');
};

const firstOrUndefined = (value?: any[] | string): string | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
        return value.length > 0 ? String(value[0]) : undefined;
    }
    if (typeof value === 'string') {
        const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
        return parts[0];
    }
    return undefined;
};

const getUpdatedAt = (product: any): Date | undefined => {
    if (product?.updatedAt) return new Date(product.updatedAt);
    if (product?.createdAt) return new Date(product.createdAt);
    return undefined;
};

const normalizeWooProduct = (product: any, catalogName: string, catalogId: string): NormalizedProduct => {
    return {
        id          : String(product._id || product.ID || product.SKU),
        name        : product['Name'] || 'Untitled product',
        sku         : product['SKU'] || 'N/A',
        price       : Number(product['Regular price'] || product['Sale price'] || 0),
        platform    : 'woocommerce',
        status      : product['Status'] || 'active',
        stock       : product['Stock'],
        image       : firstOrUndefined(product['Images']),
        description : product['Description'] || product['Short description'] || '',
        category    : product['Categories'] || '',
        brand       : product['Brand'] || '',
        catalogId,
        catalogName,
        updatedAt   : getUpdatedAt(product),
        raw         : product,
    };
};

const normalizeShopifyProduct = (product: any, catalogName: string, catalogId: string): NormalizedProduct => {
    const firstVariant = Array.isArray(product?.variants) ? product.variants[0] : null;
    return {
        id          : String(product._id || product.handle),
        name        : product.title || product.Title || product['Title'] || 'Untitled product',
        sku         : firstVariant?.sku || product['Variant SKU'] || product.handle || 'N/A',
        price       : Number(firstVariant?.price || product['Variant Price'] || 0),
        platform    : 'shopify',
        status      : product.status || product['Status'] || 'active',
        stock       : firstVariant?.inventory_quantity || product['Variant Inventory Qty'],
        image       : firstVariant?.image || product['Variant Image'] || firstOrUndefined(product.images?.map((img: any) => img.src) || product['Image Src']),
        description : stripHtml(product.body_html || product['Body (HTML)']) || '',
        category    : product.product_category || product.product_type || product['Product Category'] || product['Type'] || '',
        brand       : product.vendor || product.Vendor || product['Vendor'] || '',
        catalogId,
        catalogName,
        updatedAt   : getUpdatedAt(product),
        raw         : product,
    };
};

export const normalizeProduct = (
    platform: ProductPlatform,
    product: any,
    catalogName: string,
    catalogId: string,
): NormalizedProduct => {
    return platform === 'woocommerce'
        ? normalizeWooProduct(product, catalogName, catalogId)
        : normalizeShopifyProduct(product, catalogName, catalogId);
};

export const getProductModel = (platform: ProductPlatform): PlatformModel => {
    return (platform === 'shopify' ? ShopifyProduct : WooCommerceProduct) as unknown as PlatformModel;
};

export const prepareProductPayload = (platform: ProductPlatform, product: any) => {
    const payload = { ...product };

    if (platform === 'woocommerce') {
        payload['Name'] = payload['Name'] || payload.name;
        payload['SKU'] = payload['SKU'] || payload.sku;
        payload['Regular price'] = payload['Regular price'] || payload.price;
        payload['Status'] = payload['Status'] || payload.status || 'active';
    } else {
        payload['Title'] = payload['Title'] || payload.name || payload.title;
        payload['Variant SKU'] = payload['Variant SKU'] || payload.sku || payload.handle;
        payload['Variant Price'] = payload['Variant Price'] || payload.price;
        payload['Status'] = payload['Status'] || payload.status || 'active';
    }

    return payload;
};

export const findProductById = async (id: string): Promise<{ product: any | null; platform: ProductPlatform | null; model: Model<any> | null; }> => {
    const shopify = await ShopifyProduct.findById(id);
    if (shopify) return { product: shopify, platform: 'shopify', model: ShopifyProduct as unknown as Model<any> };

    const woo = await WooCommerceProduct.findById(id);
    if (woo) return { product: woo, platform: 'woocommerce', model: WooCommerceProduct as unknown as Model<any> };

    return { product: null, platform: null, model: null };
};

export const buildSearchQuery = (platform: ProductPlatform, search?: string): Record<string, any> => {
    if (!search) return {};
    const regex = new RegExp(search, 'i');

    if (platform === 'woocommerce') {
        return {
            $or: [
                { 'Name': regex },
                { 'SKU': regex },
            ],
        };
    }

    return {
        $or: [
            { 'Title': regex },
            { 'Variant SKU': regex },
            { handle: regex },
        ],
    };
};

export const buildStatusQuery = (platform: ProductPlatform, status?: string): Record<string, any> => {
    if (!status) return {};
    if (platform === 'woocommerce') {
        return { 'Status': status };
    }
    return { 'Status': status };
};

export const buildPlatformQueries = (
    platform: ProductPlatform,
    catalogIds: string[],
    status?: string,
    search?: string,
): FilterQuery<any> => {
    return {
        catalogId: { $in: catalogIds },
        ...buildStatusQuery(platform, status),
        ...buildSearchQuery(platform, search),
    };
};

export const mapCatalogAccess = async (
    authenticatedUser: any,
    catalogId?: string,
    platform?: ProductPlatform,
) => {
    const catalogQuery: any = authenticatedUser.role === 'admin_role'
        ? {}
        : { userId: authenticatedUser.id };

    if (catalogId) {
        catalogQuery._id = catalogId;
    }

    if (platform) {
        catalogQuery.platform = platform;
    }

    const catalogs = await Catalog.find(catalogQuery).select('_id name platform productModel');

    const catalogMap = new Map<string, { name: string; platform: ProductPlatform }>();
    catalogs.forEach((catalog) => {
        catalogMap.set(String(catalog._id), { name: catalog.name, platform: catalog.platform as ProductPlatform });
    });

    return catalogMap;
};
