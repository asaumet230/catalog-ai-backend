import { Request, Response } from 'express';
import { Catalog, Job } from '../models';

import { sendError } from '../helpers';
import { ICatalog } from '../interfaces';
import { catalogQueue, validateWooCommerceProducts, validateShopifyProducts } from '../services';

/**
 * Transform Shopify modern API structure to CSV flat structure
 * Explodes variants into separate rows (1 row per variant)
 */
const transformShopifyToFlat = (modernProducts: any[]): any[] => {
    const flatProducts: any[] = [];

    modernProducts.forEach((product) => {
        const variants = product.variants || [{}];
        const images = product.images || [];
        const options = product.options || [];

        variants.forEach((variant: any, variantIndex: number) => {
            const flatProduct: any = {
                // Basic product info
                'Handle': product.handle || '',
                'Title': product.title || '',
                'Body (HTML)': product.body_html || '',
                'Vendor': product.vendor || '',
                'Product Category': product.product_category || '',
                'Type': product.product_type || '',
                'Tags': Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
                'Status': product.status || 'active',
                'Gift Card': product.gift_card ? 'TRUE' : 'FALSE',

                // SEO
                'SEO Title': product.seo?.title || '',
                'SEO Description': product.seo?.description || '',

                // Options (up to 3)
                'Option1 Name': options[0]?.name || '',
                'Option1 Value': variant.options?.[options[0]?.name] || '',
                'Option2 Name': options[1]?.name || '',
                'Option2 Value': variant.options?.[options[1]?.name] || '',
                'Option3 Name': options[2]?.name || '',
                'Option3 Value': variant.options?.[options[2]?.name] || '',

                // Variant fields
                'Variant SKU': variant.sku || '',
                'Variant Grams': variant.grams || 0,
                'Variant Inventory Tracker': variant.inventory_tracker || '',
                'Variant Inventory Qty': variant.inventory_quantity || 0,
                'Variant Inventory Policy': variant.inventory_policy || 'deny',
                'Variant Fulfillment Service': variant.fulfillment_service || 'manual',
                'Variant Price': variant.price || 0,
                'Variant Compare At Price': variant.compare_at_price || null,
                'Variant Requires Shipping': variant.requires_shipping ? 'TRUE' : 'FALSE',
                'Variant Taxable': variant.taxable ? 'TRUE' : 'FALSE',
                'Variant Barcode': variant.barcode || '',
                'Variant Weight Unit': variant.weight_unit || '',
                'Variant Tax Code': variant.tax_code || '',
                'Cost per item': variant.cost_per_item || 0,

                // Images (first image for first variant, subsequent images for subsequent variants)
                'Image Src': images[variantIndex]?.src || images[0]?.src || '',
                'Image Position': images[variantIndex]?.position || images[0]?.position || (variantIndex + 1),
                'Image Alt Text': images[variantIndex]?.alt || images[0]?.alt || '',
                'Variant Image': variant.image || '',
            };

            flatProducts.push(flatProduct);
        });
    });

    console.log(`🔹 Shopify transform: ${modernProducts.length} modern products → ${flatProducts.length} CSV rows`);
    return flatProducts;
};

/**
 * Transform Shopify CSV flat back to modern API structure
 * Groups rows with same Handle into single product with variants array
 */
const transformShopifyToModern = (flatProducts: any[]): any[] => {
    const productMap = new Map<string, any>();

    flatProducts.forEach((row) => {
        const handle = row.Handle;

        if (!productMap.has(handle)) {
            // First row for this product - create the product structure
            productMap.set(handle, {
                handle: row.Handle,
                title: row.Title,
                body_html: row['Body (HTML)'] || '',
                vendor: row.Vendor || '',
                product_category: row['Product Category'] || '',
                product_type: row.Type || '',
                tags: row.Tags ? row.Tags.split(',').map((t: string) => t.trim()) : [],
                status: row.Status || 'active',
                gift_card: row['Gift Card'] === 'TRUE',
                seo: {
                    title: row['SEO Title'] || '',
                    description: row['SEO Description'] || '',
                },
                options: [],
                variants: [],
                images: [],
            });
        }

        const product = productMap.get(handle);

        // Add variant
        const variant: any = {
            sku: row['Variant SKU'] || '',
            grams: row['Variant Grams'] || 0,
            inventory_tracker: row['Variant Inventory Tracker'] || '',
            inventory_quantity: row['Variant Inventory Qty'] || 0,
            inventory_policy: row['Variant Inventory Policy'] || 'deny',
            fulfillment_service: row['Variant Fulfillment Service'] || 'manual',
            price: row['Variant Price'] || 0,
            compare_at_price: row['Variant Compare At Price'] || null,
            requires_shipping: row['Variant Requires Shipping'] === 'TRUE',
            taxable: row['Variant Taxable'] === 'TRUE',
            barcode: row['Variant Barcode'] || '',
            weight_unit: row['Variant Weight Unit'] || '',
            tax_code: row['Variant Tax Code'] || '',
            cost_per_item: row['Cost per item'] || 0,
            options: {},
            image: row['Variant Image'] || '',
        };

        // Add options to variant
        if (row['Option1 Name'] && row['Option1 Value']) {
            variant.options[row['Option1 Name']] = row['Option1 Value'];
            // Add option to product.options if not already there
            if (!product.options.some((o: any) => o.name === row['Option1 Name'])) {
                product.options.push({ name: row['Option1 Name'], values: [] });
            }
            const opt = product.options.find((o: any) => o.name === row['Option1 Name']);
            if (!opt.values.includes(row['Option1 Value'])) {
                opt.values.push(row['Option1 Value']);
            }
        }
        if (row['Option2 Name'] && row['Option2 Value']) {
            variant.options[row['Option2 Name']] = row['Option2 Value'];
            if (!product.options.some((o: any) => o.name === row['Option2 Name'])) {
                product.options.push({ name: row['Option2 Name'], values: [] });
            }
            const opt = product.options.find((o: any) => o.name === row['Option2 Name']);
            if (!opt.values.includes(row['Option2 Value'])) {
                opt.values.push(row['Option2 Value']);
            }
        }
        if (row['Option3 Name'] && row['Option3 Value']) {
            variant.options[row['Option3 Name']] = row['Option3 Value'];
            if (!product.options.some((o: any) => o.name === row['Option3 Name'])) {
                product.options.push({ name: row['Option3 Name'], values: [] });
            }
            const opt = product.options.find((o: any) => o.name === row['Option3 Name']);
            if (!opt.values.includes(row['Option3 Value'])) {
                opt.values.push(row['Option3 Value']);
            }
        }

        product.variants.push(variant);

        // Add image if exists
        if (row['Image Src']) {
            const existingImage = product.images.find((img: any) => img.src === row['Image Src']);
            if (!existingImage) {
                product.images.push({
                    src: row['Image Src'],
                    position: row['Image Position'] || product.images.length + 1,
                    alt: row['Image Alt Text'] || '',
                });
            }
        }
    });

    console.log(`🔹 Shopify re-group: ${flatProducts.length} CSV rows → ${productMap.size} modern products`);
    return Array.from(productMap.values());
};

/**
 * Helper function to group variations under their parent products
 * Converts flat array to nested structure (variations inside parent)
 */
const groupVariations = (products: any[]): any[] => {
    if (!products || !Array.isArray(products)) {
        return [];
    }

    const productMap = new Map<string, any>();
    const variations: any[] = [];

    // First pass: separate parents and variations
    products.forEach((product) => {
        const productObj = product.toObject ? product.toObject() : product;
        const type = String(productObj.Type || '').toLowerCase();

        if (type === 'variation') {
            variations.push(productObj);
        } else {
            // Initialize variations array for potential parent products
            productObj.variations = [];
            productMap.set(productObj.SKU || productObj._id?.toString(), productObj);
        }
    });

    // Second pass: assign variations to their parents
    variations.forEach((variation) => {
        const parentKey = variation.Parent;

        if (parentKey && productMap.has(parentKey)) {
            const parent = productMap.get(parentKey);
            parent.variations.push(variation);
        } else {
            // Orphan variation (no parent found) - add it as standalone product
            console.warn(`⚠️ Variation ${variation.SKU} has no parent (Parent: ${parentKey})`);
            productMap.set(variation.SKU || variation._id?.toString(), variation);
        }
    });

    // Return all parent products (with nested variations)
    return Array.from(productMap.values());
};

//* Create new catalog
export const createCatalog = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser, ...catalogData } = req.body as ICatalog & { authenticatedUser: any };

    try {


        //* Create new catalog with user ID
        const newCatalog = new Catalog({
            ...catalogData,
            userId: authenticatedUser.id,
        });

        //* Save catalog to database
        await newCatalog.save({ validateBeforeSave: true });

        return res.status(201).json({
            ok: true,
            message: 'Catalog created successfully',
            catalog: newCatalog,
        });

    } catch (error) {
        console.error('Create Catalog Error:', error);
        return sendError(res, error);
    }
}

//* Get all catalogs (user's own catalogs or all for admin)
export const getAllCatalogs = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;
    const { page = 1, limit = 10 } = req.query;

    try {
        //* Build query based on user role
        const query = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        //* Paginate results
        // const options = {
        //     page: Number(page),
        //     limit: Number(limit),
        //     sort: { createdAt: -1 },
        //     populate: 'userId',
        // };

        const catalogs = await Catalog.find(query)
            .populate('userId', 'name email avatar')
            .populate('products')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await Catalog.countDocuments(query);

        // Group variations under their parent products for each catalog
        const catalogsWithGroupedProducts = catalogs.map((catalog) => {
            const catalogObj = catalog.toObject();
            if (catalogObj.products && Array.isArray(catalogObj.products)) {
                // Apply platform-specific grouping
                if (catalogObj.platform === 'woocommerce') {
                    catalogObj.products = groupVariations(catalogObj.products);
                } else if (catalogObj.platform === 'shopify') {
                    catalogObj.products = transformShopifyToModern(catalogObj.products);
                }
                // Update totalProducts to reflect grouped count
                catalogObj.totalProducts = catalogObj.products.length;
            }
            return catalogObj;
        });

        return res.status(200).json({
            ok: true,
            message: 'All catalogs',
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            catalogs: catalogsWithGroupedProducts,
        });

    } catch (error) {
        console.error('Get All Catalogs Error:', error);
        return sendError(res, error);
    }
}

//* Get catalog by ID
export const getCatalogById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { authenticatedUser } = req.body;

    try {
        const catalog = await Catalog.findById({ _id: id })
            .populate('userId', 'name email avatar')
            .populate('products');

        if (!catalog) {
            return res.status(404).json({
                ok: false,
                message: `Catalog with id: ${id} not found`,
            });
        }

        if (authenticatedUser.role !== 'admin_role' && catalog.userId._id.toString() !== authenticatedUser.id) {
            return res.status(403).json({
                ok: false,
                message: 'You do not have permission to access this catalog',
            });
        }

        // Group variations under their parent products
        const catalogObj = catalog.toObject();
        if (catalogObj.products && Array.isArray(catalogObj.products)) {
            // Apply platform-specific grouping
            if (catalogObj.platform === 'woocommerce') {
                catalogObj.products = groupVariations(catalogObj.products);
            } else if (catalogObj.platform === 'shopify') {
                catalogObj.products = transformShopifyToModern(catalogObj.products);
            }
            // Update totalProducts to reflect grouped count
            catalogObj.totalProducts = catalogObj.products.length;
        }

        return res.status(200).json({
            ok: true,
            message: 'Catalog found',
            catalog: catalogObj,
        });

    } catch (error) {
        console.error('Get Catalog By ID Error:', error);
        return sendError(res, error);
    }
}

//* Update catalog
export const updateCatalog = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { authenticatedUser, userId, ...updateData } = req.body;

    try {
        //* Find catalog
        const catalog = await Catalog.findById({ _id: id });

        if (!catalog) {
            return res.status(404).json({
                ok: false,
                message: `Catalog with id: ${id} not found`,
            });
        }

        //* Check ownership (unless admin)
        if (authenticatedUser.role !== 'admin_role' && catalog.userId.toString() !== authenticatedUser.id) {
            return res.status(403).json({
                ok: false,
                message: 'You do not have permission to update this catalog',
            });
        }

        //* Update catalog
        const updatedCatalog = await Catalog.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('userId', 'name email avatar')
            .populate('products');

        return res.status(200).json({
            ok: true,
            message: 'Catalog updated successfully',
            catalog: updatedCatalog,
        });

    } catch (error) {
        console.error('Update Catalog Error:', error);
        return sendError(res, error);
    }
}

//* Delete catalog
export const deleteCatalog = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { authenticatedUser } = req.body;

    try {
        //* Find catalog
        const catalog = await Catalog.findById({ _id: id });

        if (!catalog) {
            return res.status(404).json({
                ok: false,
                message: `Catalog with id: ${id} not found`,
            });
        }

        //* Check ownership (unless admin)
        if (authenticatedUser.role !== 'admin_role' && catalog.userId.toString() !== authenticatedUser.id) {
            return res.status(403).json({
                ok: false,
                message: 'You do not have permission to delete this catalog',
            });
        }

        //* Delete catalog
        await Catalog.findByIdAndDelete(id);

        return res.status(200).json({
            ok: true,
            message: 'Catalog deleted successfully',
            catalog,
        });

    } catch (error) {
        console.error('Delete Catalog Error:', error);
        return sendError(res, error);
    }
}

//* Add product to catalog
export const addProductToCatalog = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { authenticatedUser, product } = req.body;

    try {
        //* Find catalog
        const catalog = await Catalog.findById({ _id: id });

        if (!catalog) {
            return res.status(404).json({
                ok: false,
                message: `Catalog with id: ${id} not found`,
            });
        }

        //* Check ownership (unless admin)
        if (authenticatedUser.role !== 'admin_role' && catalog.userId.toString() !== authenticatedUser.id) {
            return res.status(403).json({
                ok: false,
                message: 'You do not have permission to modify this catalog',
            });
        }

        //* Add product
        catalog.products.push(product);
        await catalog.save();

        return res.status(200).json({
            ok: true,
            message: 'Product added successfully',
            catalog,
        });

    } catch (error) {
        console.error('Add Product Error:', error);
        return sendError(res, error);
    }
}

export const generateWooCommerceCatalog = async (req: Request, res: Response): Promise<Response> => {

    const { authenticatedUser, products } = req.body;
    const platform = 'woocommerce';

    try {
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                ok: false,
                message: 'Products array is required and cannot be empty',
            });
        }

        // 🔹 FLATTEN nested variations (convert variations array to separate products)
        const flattenedProducts = products.flatMap((product: any) => {
            if (product.variations && Array.isArray(product.variations) && product.variations.length > 0) {
                // Extract variations and ensure they have Parent field
                const variations = product.variations.map((variation: any) => ({
                    ...variation,
                    Parent: variation.Parent || product.SKU || product.Name, // Link to parent SKU
                }));

                // Remove variations from parent (clean it)
                const { variations: _, ...parentWithoutVariations } = product;

                // Return parent + all variations as separate products
                return [parentWithoutVariations, ...variations];
            }
            return product;
        });

        console.log(`🔹 Flattened products: ${products.length} → ${flattenedProducts.length} (${flattenedProducts.length - products.length} variations extracted)`);

        // ✅ VALIDATE PRODUCTS BEFORE CREATING JOB
        console.log('🔍 Validating WooCommerce products...');
        const validation = validateWooCommerceProducts(flattenedProducts);

        if (!validation.valid) {
            console.log(`❌ Validation failed: ${validation.errors.length} errors found`);
            return res.status(400).json({
                ok: false,
                message: 'Product validation failed',
                errors: validation.errors,
                warnings: validation.warnings,
            });
        }

        // Log warnings but continue
        if (validation.warnings.length > 0) {
            console.log(`⚠️  ${validation.warnings.length} warnings found (non-blocking)`);
        }

        console.log('✅ Validation passed, creating job...');

        console.log('✅ Validation passed, creating job...');

        const job = await Job.create({
            userId: authenticatedUser.id,
            platform,
            totalProducts: flattenedProducts.length,
            status: 'queued',
            catalogName: req.body.name, // Save requested name
        });

        await catalogQueue.add(
            `catalog-${job._id}`,
            {
                jobId: job._id,
                products: flattenedProducts,
                userId: authenticatedUser.id,
                platform,
                catalogName: req.body.name, // Pass name to worker
            }
        );

        return res.status(202).json({
            ok: true,
            message: 'WooCommerce catalog generation started',
            jobId: job._id,
            platform,
            warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        });

    } catch (error) {
        console.error('Generate WooCommerce Catalog Error:', error);
        return sendError(res, error);
    }
}

export const generateShopifyCatalog = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser, products } = req.body;
    const platform = 'shopify';

    try {
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                ok: false,
                message: 'Products array is required and cannot be empty',
            });
        }

        // 🔹 TRANSFORM modern Shopify structure to CSV flat structure
        // Detects if products use modern structure (has 'variants' array) vs CSV flat (has 'Variant SKU')
        const isModernStructure = products.some(p => p.variants && Array.isArray(p.variants));

        let flatProducts = products;
        if (isModernStructure) {
            console.log('🔹 Detected modern Shopify API structure, transforming to CSV flat...');
            flatProducts = transformShopifyToFlat(products);
        } else {
            console.log('🔹 Detected CSV flat structure, using as-is');
        }

        // ✅ VALIDATE PRODUCTS BEFORE CREATING JOB
        console.log('🔍 Validating Shopify products...');
        const validation = validateShopifyProducts(flatProducts);

        if (!validation.valid) {
            console.log(`❌ Validation failed: ${validation.errors.length} errors found`);
            return res.status(400).json({
                ok: false,
                message: 'Product validation failed',
                errors: validation.errors,
                warnings: validation.warnings,
            });
        }

        // Log warnings but continue
        if (validation.warnings.length > 0) {
            console.log(`⚠️  ${validation.warnings.length} warnings found (non-blocking)`);
        }

        console.log('✅ Validation passed, creating job...');

        console.log('✅ Validation passed, creating job...');

        const job = await Job.create({
            userId: authenticatedUser.id,
            platform,
            totalProducts: flatProducts.length,
            status: 'queued',
            catalogName: req.body.name, // Save requested name
        });

        await catalogQueue.add(
            `catalog-${job._id}`,
            {
                jobId: job._id,
                products: flatProducts,
                userId: authenticatedUser.id,
                platform,
                catalogName: req.body.name, // Pass name to worker
            }
        );

        return res.status(202).json({
            ok: true,
            message: 'Shopify catalog generation started',
            jobId: job._id,
            platform,
            warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        });

    } catch (error) {
        console.error('Generate Shopify Catalog Error:', error);
        return sendError(res, error);
    }
}

export const getJobStatus = async (req: Request, res: Response): Promise<Response> => {
    const { jobId } = req.params;
    const { authenticatedUser } = req.body;

    try {
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                ok: false,
                message: 'Job not found',
            });
        }

        if (authenticatedUser.role !== 'admin_role' && job.userId.toString() !== authenticatedUser.id) {
            return res.status(403).json({
                ok: false,
                message: 'You do not have permission to access this job',
            });
        }

        return res.status(200).json({
            ok: true,
            job: {
                id: job._id,
                status: job.status,
                progress: job.progress,
                totalProducts: job.totalProducts,
                processedProducts: job.processedProducts,
                result: job.result,
                error: job.error,
                createdAt: job.createdAt,
                completedAt: job.completedAt,
            },
        });

    } catch (error) {
        console.error('Get Job Status Error:', error);
        return sendError(res, error);
    }
}
