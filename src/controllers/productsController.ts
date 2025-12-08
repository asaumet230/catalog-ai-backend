import { Request, Response } from 'express';
import { Catalog } from '../models';
import { sendError } from '../helpers';
import { NormalizedProduct, ProductPlatform } from '../interfaces';
import {
    buildPlatformQueries,
    findProductById,
    getProductModel,
    mapCatalogAccess,
    normalizeProduct,
    prepareProductPayload,
} from '../services/productService';

const parsePlatform = (value?: string): ProductPlatform | undefined => {
    if (!value) return undefined;
    return value === 'shopify' ? 'shopify' : value === 'woocommerce' ? 'woocommerce' : undefined;
};

//* Get all products (by user catalogs or all for admin)
export const getProducts = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;
    const {
        page = 1,
        limit = 20,
        platform,
        status,
        catalogId,
        search,
    } = req.query;

    try {
        const platformFilter = parsePlatform(platform as string | undefined);
        const catalogMap = await mapCatalogAccess(authenticatedUser, catalogId as string | undefined, platformFilter);

        if (catalogId && catalogMap.size === 0) {
            return res.status(404).json({
                ok      : false,
                message : `Catalog with id: ${catalogId} not found or not accessible`,
            });
        }

        if (catalogMap.size === 0) {
            return res.status(200).json({
                ok          : true,
                message     : 'No products available',
                total       : 0,
                page        : Number(page),
                totalPages  : 0,
                products    : [],
            });
        }

        const platformsToQuery = platformFilter
            ? [platformFilter]
            : Array.from(new Set(Array.from(catalogMap.values()).map((c) => c.platform)));

        const combined: NormalizedProduct[] = [];

        for (const currentPlatform of platformsToQuery) {
            const ids = Array.from(catalogMap.entries())
                .filter(([_, data]) => data.platform === currentPlatform)
                .map(([id]) => id);

            if (ids.length === 0) continue;

            const query = buildPlatformQueries(
                currentPlatform,
                ids,
                status as string | undefined,
                search as string | undefined,
            );

            const model = getProductModel(currentPlatform);
            const products = await model.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();

            products.forEach((product: any) => {
                const catalogInfo = catalogMap.get(String(product.catalogId));
                if (!catalogInfo) return;
                combined.push(
                    normalizeProduct(
                        currentPlatform,
                        product,
                        catalogInfo.name,
                        String(product.catalogId),
                    )
                );
            });
        }

        combined.sort((a, b) => {
            const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bDate - aDate;
        });

        const total = combined.length;
        const safeLimit = Number(limit) > 0 ? Number(limit) : 20;
        const safePage = Number(page) > 0 ? Number(page) : 1;
        const start = (safePage - 1) * safeLimit;
        const end = start + safeLimit;

        const paginated = combined.slice(start, end);

        return res.status(200).json({
            ok          : true,
            message     : 'All products',
            total,
            page        : safePage,
            totalPages  : Math.ceil(total / safeLimit),
            products    : paginated,
        });

    } catch (error) {
        console.error('Get Products Error:', error);
        return sendError(res, error);
    }
};

//* Get single product
export const getProductById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { authenticatedUser } = req.body;

    try {
        const { product, platform } = await findProductById(id);

        if (!product || !platform) {
            return res.status(404).json({
                ok      : false,
                message : `Product with id: ${id} not found`,
            });
        }

        const catalog = await Catalog.findById(product.catalogId);
        if (!catalog) {
            return res.status(404).json({
                ok      : false,
                message : `Catalog for product ${id} not found`,
            });
        }

        if (authenticatedUser.role !== 'admin_role' && catalog.userId.toString() !== authenticatedUser.id) {
            return res.status(403).json({
                ok      : false,
                message : 'You do not have permission to access this product',
            });
        }

        const normalized = normalizeProduct(platform, product, catalog.name, String(catalog._id));

        return res.status(200).json({
            ok      : true,
            message : 'Product found',
            product : normalized,
        });

    } catch (error) {
        console.error('Get Product By ID Error:', error);
        return sendError(res, error);
    }
};

//* Create product
export const createProduct = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser, catalogId, product } = req.body;

    try {
        const catalog = await Catalog.findById(catalogId);

        if (!catalog) {
            return res.status(404).json({
                ok      : false,
                message : `Catalog with id: ${catalogId} not found`,
            });
        }

        if (authenticatedUser.role !== 'admin_role' && catalog.userId.toString() !== authenticatedUser.id) {
            return res.status(403).json({
                ok      : false,
                message : 'You do not have permission to add products to this catalog',
            });
        }

        const platform = catalog.platform as ProductPlatform;
        const model = getProductModel(platform);
        const payload = prepareProductPayload(platform, product);

        const created = await model.create({
            ...payload,
            catalogId: catalog._id,
        });

        catalog.products.push(created._id);
        catalog.totalProducts = catalog.products.length;
        await catalog.save();

        const normalized = normalizeProduct(platform, created, catalog.name, String(catalog._id));

        return res.status(201).json({
            ok      : true,
            message : 'Product created successfully',
            product : normalized,
        });

    } catch (error) {
        console.error('Create Product Error:', error);
        return sendError(res, error);
    }
};

//* Update product
export const updateProduct = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { authenticatedUser, product } = req.body;

    try {
        const found = await findProductById(id);
        if (!found.product || !found.platform || !found.model) {
            return res.status(404).json({
                ok      : false,
                message : `Product with id: ${id} not found`,
            });
        }

        const catalog = await Catalog.findById(found.product.catalogId);
        if (!catalog) {
            return res.status(404).json({
                ok      : false,
                message : `Catalog for product ${id} not found`,
            });
        }

        if (authenticatedUser.role !== 'admin_role' && catalog.userId.toString() !== authenticatedUser.id) {
            return res.status(403).json({
                ok      : false,
                message : 'You do not have permission to update this product',
            });
        }

        const payload = prepareProductPayload(found.platform, product);
        const updated = await found.model.findByIdAndUpdate(
            id,
            payload,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                ok      : false,
                message : `Product with id: ${id} not found after update`,
            });
        }

        const normalized = normalizeProduct(found.platform, updated, catalog.name, String(catalog._id));

        return res.status(200).json({
            ok      : true,
            message : 'Product updated successfully',
            product : normalized,
        });

    } catch (error) {
        console.error('Update Product Error:', error);
        return sendError(res, error);
    }
};

//* Delete product
export const deleteProduct = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { authenticatedUser } = req.body;

    try {
        const found = await findProductById(id);
        if (!found.product || !found.platform || !found.model) {
            return res.status(404).json({
                ok      : false,
                message : `Product with id: ${id} not found`,
            });
        }

        const catalog = await Catalog.findById(found.product.catalogId);
        if (!catalog) {
            return res.status(404).json({
                ok      : false,
                message : `Catalog for product ${id} not found`,
            });
        }

        if (authenticatedUser.role !== 'admin_role' && catalog.userId.toString() !== authenticatedUser.id) {
            return res.status(403).json({
                ok      : false,
                message : 'You do not have permission to delete this product',
            });
        }

        await found.model.deleteOne({ _id: id });

        catalog.products = catalog.products.filter((p: any) => String(p) !== id);
        catalog.totalProducts = catalog.products.length;
        await catalog.save();

        return res.status(200).json({
            ok      : true,
            message : 'Product deleted successfully',
            productId: id,
        });

    } catch (error) {
        console.error('Delete Product Error:', error);
        return sendError(res, error);
    }
};
