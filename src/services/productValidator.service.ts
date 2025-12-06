/**
 * Product Validator Service
 * Validates product data before processing with AI
 * Following validation rules from frontend
 */

export interface ValidationError {
    row: number;
    field: string;
    message: string;
    type: 'error';
}

export interface ValidationWarning {
    row: number;
    field: string;
    message: string;
    type: 'warning';
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

// Validation constants
const validTypes = {
    woocommerce: ['simple', 'variable', 'variation', 'grouped', 'external', 'downloadable'],
    shopify: [],
};

const validStatus = {
    shopify: ['active', 'draft', 'archived'],
};

const validTaxClasses = ['standard', 'reduced-rate', 'zero-rate'];
const validBackorders = [0, 1, 2];
const validBooleans = [0, 1];
const validUnitMeasures = ['ml', 'l', 'g', 'kg', 'oz', 'lb', 'fl oz', 'm', 'cm', 'mm', 'in', 'ft', 'yd'];

const barcodePattern = /^\d{8,14}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const metafieldPattern = /^[a-z_]+\.[a-z_]+\.[a-z_]+$/i;

// Required fields by platform
const requiredFields = {
    woocommerce: ['Type', 'SKU', 'Name', 'Regular price'],
    shopify: ['Handle', 'Title'],
};

/**
 * Validate WooCommerce products
 */
export const validateWooCommerceProducts = (products: any[]): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!Array.isArray(products) || products.length === 0) {
        return {
            valid: false,
            errors: [{ row: 0, field: 'products', message: 'Products array is required and cannot be empty', type: 'error' }],
            warnings: [],
        };
    }

    products.forEach((product, index) => {
        const rowNum = index + 2; // +2 because row 1 is header, data starts at 2

        const productType = String(product['Type'] || '').toLowerCase();
        const isVariableParent = productType === 'variable';

        // Validate required fields
        requiredFields.woocommerce.forEach((field) => {
            if (field === 'Regular price' && isVariableParent) {
                return;
            }
            const value = product[field];
            if (value === undefined || value === null || String(value).trim() === '') {
                errors.push({
                    row: rowNum,
                    field,
                    message: `${field} is required`,
                    type: 'error',
                });
            }
        });

        // Skip price validation for variable products (parents)
        if (!isVariableParent) {
            // Validate price
            const price = product['Regular price'];
            if (price === undefined || price === null || price === '') {
                errors.push({
                    row: rowNum,
                    field: 'Regular price',
                    message: 'Price is required',
                    type: 'error',
                });
            } else {
                const priceNum = Number(price);
                if (isNaN(priceNum) || priceNum < 0) {
                    errors.push({
                        row: rowNum,
                        field: 'Regular price',
                        message: 'Price must be a positive number',
                        type: 'error',
                    });
                } else {
                    if (priceNum > 10000) {
                        warnings.push({
                            row: rowNum,
                            field: 'Regular price',
                            message: `Price seems unusually high ($${priceNum})`,
                            type: 'warning',
                        });
                    }
                }
            }
        }

        // Validate Type
        if (product['Type'] && !validTypes.woocommerce.includes(String(product['Type']).toLowerCase())) {
            errors.push({
                row: rowNum,
                field: 'Type',
                message: `Type must be one of: ${validTypes.woocommerce.join(', ')}`,
                type: 'error',
            });
        }

        // Validate GTIN (only if filled)
        if (product['GTIN, UPC, EAN, or ISBN']) {
            const gtin = String(product['GTIN, UPC, EAN, or ISBN']).trim();
            if (!barcodePattern.test(gtin)) {
                errors.push({
                    row: rowNum,
                    field: 'GTIN, UPC, EAN, or ISBN',
                    message: 'GTIN/UPC/EAN must be 8-14 digits only',
                    type: 'error',
                });
            }
        }

        // Validate Weight (only if filled) - supports both kg and g
        if (product['Weight (kg)']) {
            const weight = Number(product['Weight (kg)']);
            if (isNaN(weight) || weight < 0) {
                errors.push({
                    row: rowNum,
                    field: 'Weight (kg)',
                    message: 'Weight must be a positive number (in kilograms)',
                    type: 'error',
                });
            } else if (weight > 50) {
                warnings.push({
                    row: rowNum,
                    field: 'Weight (kg)',
                    message: `Weight seems unusually high (${weight}kg)`,
                    type: 'warning',
                });
            }
        }

        if (product['Weight (g)']) {
            const weight = Number(product['Weight (g)']);
            if (isNaN(weight) || weight < 0) {
                errors.push({
                    row: rowNum,
                    field: 'Weight (g)',
                    message: 'Weight must be a positive number (in grams)',
                    type: 'error',
                });
            } else if (weight > 50000) {
                warnings.push({
                    row: rowNum,
                    field: 'Weight (g)',
                    message: `Weight seems unusually high (${weight}g = ${(weight / 1000).toFixed(2)}kg)`,
                    type: 'warning',
                });
            }
        }

        // Validate Dimensions (only if filled)
        ['Length (cm)', 'Width (cm)', 'Height (cm)'].forEach((field) => {
            if (product[field]) {
                const dim = Number(product[field]);
                if (isNaN(dim) || dim < 0) {
                    errors.push({
                        row: rowNum,
                        field,
                        message: `${field} must be a positive number`,
                        type: 'error',
                    });
                } else if (dim > 500) {
                    warnings.push({
                        row: rowNum,
                        field,
                        message: `${field} seems unusually large (${dim}cm = ${(dim / 100).toFixed(2)}m)`,
                        type: 'warning',
                    });
                }
            }
        });

        // Validate Sale Price (only if filled)
        if (product['Sale price']) {
            const salePrice = Number(product['Sale price']);
            const regularPrice = Number(product['Regular price']);

            if (isNaN(salePrice) || salePrice < 0) {
                errors.push({
                    row: rowNum,
                    field: 'Sale price',
                    message: 'Sale price must be a positive number',
                    type: 'error',
                });
            } else if (!isNaN(regularPrice) && salePrice >= regularPrice) {
                errors.push({
                    row: rowNum,
                    field: 'Sale price',
                    message: 'Sale price must be less than regular price',
                    type: 'error',
                });
            }

            // Check if dates are provided
            if (!product['Date sale price starts'] && !product['Date sale price ends']) {
                warnings.push({
                    row: rowNum,
                    field: 'Sale price',
                    message: 'Sale price set but no sale dates defined',
                    type: 'warning',
                });
            }
        }

        // Validate Sale Dates (only if filled)
        if (product['Date sale price starts'] || product['Date sale price ends']) {
            const startDate = product['Date sale price starts'] ? String(product['Date sale price starts']).trim() : '';
            const endDate = product['Date sale price ends'] ? String(product['Date sale price ends']).trim() : '';

            if (startDate && !datePattern.test(startDate)) {
                errors.push({
                    row: rowNum,
                    field: 'Date sale price starts',
                    message: 'Date sale price starts must be in YYYY-MM-DD format',
                    type: 'error',
                });
            }

            if (endDate && !datePattern.test(endDate)) {
                errors.push({
                    row: rowNum,
                    field: 'Date sale price ends',
                    message: 'Date sale price ends must be in YYYY-MM-DD format',
                    type: 'error',
                });
            }

            if (startDate && endDate && datePattern.test(startDate) && datePattern.test(endDate)) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (end <= start) {
                    errors.push({
                        row: rowNum,
                        field: 'Date sale price ends',
                        message: 'Sale end date must be after start date',
                        type: 'error',
                    });
                }
            }
        }

        // Validate Tax Class (only if filled)
        if (product['Tax class']) {
            const taxClass = String(product['Tax class']).toLowerCase().trim();
            if (!validTaxClasses.includes(taxClass)) {
                errors.push({
                    row: rowNum,
                    field: 'Tax class',
                    message: `Tax class must be one of: ${validTaxClasses.join(', ')}`,
                    type: 'error',
                });
            }
        }

        // Validate Backorders (only if filled)
        if (product['Backorders allowed?'] !== undefined && product['Backorders allowed?'] !== null && product['Backorders allowed?'] !== '') {
            const backorders = Number(product['Backorders allowed?']);
            if (isNaN(backorders) || !validBackorders.includes(backorders)) {
                errors.push({
                    row: rowNum,
                    field: 'Backorders allowed?',
                    message: 'Backorders must be 0 (No), 1 (Notify), or 2 (Yes)',
                    type: 'error',
                });
            }
        }

        // Validate Boolean fields (only if filled)
        ['Is featured?', 'Sold individually?', 'Allow customer reviews?'].forEach((field) => {
            if (product[field] !== undefined && product[field] !== null && product[field] !== '') {
                const value = Number(product[field]);
                if (isNaN(value) || !validBooleans.includes(value)) {
                    errors.push({
                        row: rowNum,
                        field,
                        message: `${field} must be 0 or 1`,
                        type: 'error',
                    });
                }
            }
        });

        // Validate Stock (only if filled)
        if (product['Stock'] !== undefined && product['Stock'] !== null && product['Stock'] !== '') {
            const stock = Number(product['Stock']);
            if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
                errors.push({
                    row: rowNum,
                    field: 'Stock',
                    message: 'Stock must be a whole number >= 0',
                    type: 'error',
                });
            }
        }

        // Category warning (skip for variations)
        if (!product['Categories'] && productType !== 'variation') {
            warnings.push({
                row: rowNum,
                field: 'Categories',
                message: 'Product has no category assigned',
                type: 'warning',
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

/**
 * Validate Shopify products
 */
export const validateShopifyProducts = (products: any[]): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!Array.isArray(products) || products.length === 0) {
        return {
            valid: false,
            errors: [{ row: 0, field: 'products', message: 'Products array is required and cannot be empty', type: 'error' }],
            warnings: [],
        };
    }

    products.forEach((product, index) => {
        const rowNum = index + 2;

        // Validate required fields
        requiredFields.shopify.forEach((field) => {
            const value = product[field];
            if (value === undefined || value === null || String(value).trim() === '') {
                errors.push({
                    row: rowNum,
                    field,
                    message: `${field} is required`,
                    type: 'error',
                });
            }
        });

        // Validate price
        const price = product['Variant Price'];
        if (price === undefined || price === null || price === '') {
            errors.push({
                row: rowNum,
                field: 'Variant Price',
                message: 'Price is required',
                type: 'error',
            });
        } else {
            const priceNum = Number(price);
            if (isNaN(priceNum) || priceNum < 0) {
                errors.push({
                    row: rowNum,
                    field: 'Variant Price',
                    message: 'Price must be a positive number',
                    type: 'error',
                });
            } else if (priceNum > 10000) {
                warnings.push({
                    row: rowNum,
                    field: 'Variant Price',
                    message: `Price seems unusually high ($${priceNum})`,
                    type: 'warning',
                });
            }
        }

        // Validate Status (only if filled)
        if (product['Status']) {
            const status = String(product['Status']).toLowerCase().trim();
            if (!validStatus.shopify.includes(status)) {
                errors.push({
                    row: rowNum,
                    field: 'Status',
                    message: `Status must be one of: ${validStatus.shopify.join(', ')}`,
                    type: 'error',
                });
            }
        }

        // Validate Unit Pricing (all 4 fields together or none)
        const unitPricingFields = [
            product['Unit Price Total Measure'],
            product['Unit Price Total Measure Unit'],
            product['Unit Price Base Measure'],
            product['Unit Price Base Measure Unit'],
        ];

        const filledUnitFields = unitPricingFields.filter((val) => val !== undefined && val !== null && String(val).trim() !== '');

        if (filledUnitFields.length > 0 && filledUnitFields.length !== 4) {
            errors.push({
                row: rowNum,
                field: 'Unit Price Total Measure',
                message: 'All 4 unit price fields must be filled together or left empty',
                type: 'error',
            });
        } else if (filledUnitFields.length === 4) {
            // Validate numeric values
            const totalMeasure = Number(product['Unit Price Total Measure']);
            const baseMeasure = Number(product['Unit Price Base Measure']);

            if (isNaN(totalMeasure) || totalMeasure <= 0) {
                errors.push({
                    row: rowNum,
                    field: 'Unit Price Total Measure',
                    message: 'Unit Price Total Measure must be a positive number',
                    type: 'error',
                });
            }

            if (isNaN(baseMeasure) || baseMeasure <= 0) {
                errors.push({
                    row: rowNum,
                    field: 'Unit Price Base Measure',
                    message: 'Unit Price Base Measure must be a positive number',
                    type: 'error',
                });
            }

            // Validate unit measures
            const totalUnit = String(product['Unit Price Total Measure Unit']).toLowerCase().trim();
            const baseUnit = String(product['Unit Price Base Measure Unit']).toLowerCase().trim();

            if (!validUnitMeasures.includes(totalUnit)) {
                errors.push({
                    row: rowNum,
                    field: 'Unit Price Total Measure Unit',
                    message: `Unit Price Total Measure Unit must be a valid unit: ${validUnitMeasures.join(', ')}`,
                    type: 'error',
                });
            }

            if (!validUnitMeasures.includes(baseUnit)) {
                errors.push({
                    row: rowNum,
                    field: 'Unit Price Base Measure Unit',
                    message: `Unit Price Base Measure Unit must be a valid unit: ${validUnitMeasures.join(', ')}`,
                    type: 'error',
                });
            }

            // Validate logic: total >= base
            if (!isNaN(totalMeasure) && !isNaN(baseMeasure) && totalMeasure < baseMeasure) {
                errors.push({
                    row: rowNum,
                    field: 'Unit Price Total Measure',
                    message: 'Total measure must be greater than or equal to base measure',
                    type: 'error',
                });
            }
        }

        // Validate Metafields (Option Linked To) - only if filled
        ['Option1 Linked To', 'Option2 Linked To', 'Option3 Linked To'].forEach((field) => {
            if (product[field]) {
                const metafield = String(product[field]).trim();
                if (!metafieldPattern.test(metafield)) {
                    errors.push({
                        row: rowNum,
                        field,
                        message: 'Must be in format: namespace.type.key (e.g., product.metafields.custom.color)',
                        type: 'error',
                    });
                }
            }
        });

        // Validate Cost per item (only if filled)
        if (product['Cost per item']) {
            const cost = Number(product['Cost per item']);
            if (isNaN(cost) || cost < 0) {
                errors.push({
                    row: rowNum,
                    field: 'Cost per item',
                    message: 'Cost per item must be a positive number',
                    type: 'error',
                });
            } else {
                const priceNum = Number(product['Variant Price']);
                if (!isNaN(priceNum) && cost > priceNum) {
                    warnings.push({
                        row: rowNum,
                        field: 'Cost per item',
                        message: `Cost ($${cost}) is higher than price ($${priceNum}) - negative margin`,
                        type: 'warning',
                    });
                }
            }
        }

        // Validate Gift Card (only if filled)
        if (product['Gift Card']) {
            const giftCard = String(product['Gift Card']).trim().toUpperCase();
            if (giftCard !== 'TRUE' && giftCard !== 'FALSE') {
                errors.push({
                    row: rowNum,
                    field: 'Gift Card',
                    message: 'Gift Card must be TRUE or FALSE',
                    type: 'error',
                });
            }
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};
