import { Router } from 'express';
import { check, query } from 'express-validator';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers';
import { fieldValidator, jwtValidator } from '../middlewares';
import { catalogExist } from '../helpers';

export const productsRouter = Router();

/**
 * GET /api/products
 * List products across user's catalogs (or all for admin)
 */
productsRouter.get('/', [
    jwtValidator,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('platform').optional().isIn(['shopify', 'woocommerce']),
    query('status').optional().isString(),
    query('catalogId').optional().isMongoId(),
    query('search').optional().isString(),
    fieldValidator,
], getProducts);

/**
 * GET /api/products/:id
 * Get single product
 */
productsRouter.get('/:id', [
    jwtValidator,
    check('id', 'Invalid ID').isMongoId(),
    fieldValidator,
], getProductById);

/**
 * POST /api/products
 * Create product inside catalog
 */
productsRouter.post('/', [
    jwtValidator,
    check('catalogId', 'Catalog ID is required').isMongoId(),
    check('catalogId').custom(catalogExist),
    check('product', 'Product data is required').notEmpty(),
    fieldValidator,
], createProduct);

/**
 * PUT /api/products/:id
 * Update product
 */
productsRouter.put('/:id', [
    jwtValidator,
    check('id', 'Invalid ID').isMongoId(),
    check('product', 'Product data is required').notEmpty(),
    fieldValidator,
], updateProduct);

/**
 * DELETE /api/products/:id
 * Delete product
 */
productsRouter.delete('/:id', [
    jwtValidator,
    check('id', 'Invalid ID').isMongoId(),
    fieldValidator,
], deleteProduct);
