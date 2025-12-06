import { Router } from 'express';
import { check } from 'express-validator';
import {
    createCatalog,
    getAllCatalogs,
    getCatalogById,
    updateCatalog,
    deleteCatalog,
    addProductToCatalog,
    generateWooCommerceCatalog,
    generateShopifyCatalog,
    getJobStatus
} from '../controllers';
import { fieldValidator, jwtValidator } from '../middlewares';
import { catalogExist } from '../helpers';


export const catalogsRouter = Router();

//* Create new catalog
catalogsRouter.post('/', [
    jwtValidator,
    check('name', 'Catalog name is required').notEmpty(),
    check('platform', 'Platform is required').notEmpty(),
    check('markup', 'Markup is required').isNumeric(),
    check('markup', 'Markup must be between 0 and 100').isFloat({ min: 0, max: 100 }),
    fieldValidator,
], createCatalog);

//* Get all catalogs (user's own or all for admin)
catalogsRouter.get('/', [
    jwtValidator,
], getAllCatalogs);

//* Get catalog by ID
catalogsRouter.get('/:id', [
    jwtValidator,
    check('id', 'Invalid ID').isMongoId(),
    check('id').custom(catalogExist),
    fieldValidator,
], getCatalogById);

//* Update catalog
catalogsRouter.put('/:id', [
    jwtValidator,
    check('id', 'Invalid ID').isMongoId(),
    check('id').custom(catalogExist),
    fieldValidator,
], updateCatalog);

//* Delete catalog
catalogsRouter.delete('/:id', [
    jwtValidator,
    check('id', 'Invalid ID').isMongoId(),
    check('id').custom(catalogExist),
    fieldValidator,
], deleteCatalog);

//* Add product to catalog
catalogsRouter.post('/:id/products', [
    jwtValidator,
    check('id', 'Invalid ID').isMongoId(),
    check('id').custom(catalogExist),
    check('product', 'Product data is required').notEmpty(),
    check('product.name', 'Product name is required').notEmpty(),
    check('product.description', 'Product description is required').notEmpty(),
    check('product.price', 'Product price is required').isNumeric(),
    fieldValidator,
], addProductToCatalog);

//* Generate WooCommerce catalog with AI
catalogsRouter.post('/generate/woocommerce', [
    jwtValidator,
    check('products', 'Products array is required').isArray(),
    check('products', 'Products array cannot be empty').notEmpty(),
    fieldValidator,
], generateWooCommerceCatalog);

//* Generate Shopify catalog with AI
catalogsRouter.post('/generate/shopify', [
    jwtValidator,
    check('products', 'Products array is required').isArray(),
    check('products', 'Products array cannot be empty').notEmpty(),
    fieldValidator,
], generateShopifyCatalog);

//* Get job status
catalogsRouter.get('/jobs/:jobId/status', [
    jwtValidator,
    check('jobId', 'Invalid Job ID').isMongoId(),
    fieldValidator,
], getJobStatus);
