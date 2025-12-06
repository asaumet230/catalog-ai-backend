/**
 * Product Optimizer Service
 *
 * Optimizes product payloads for OpenAI API calls by:
 * 1. Extracting only relevant fields for AI generation (8-10 fields vs 51 fields)
 * 2. Reducing token usage by ~90%
 * 3. Merging AI-generated content back with original product data
 */

interface WooCommerceProduct {
    [key: string]: any;
    Type?: string;
    SKU?: string;
    Name?: string;
    'Regular price'?: number;
    'Sale price'?: number | string;
    Categories?: string;
    Tags?: string;
    Images?: string;
    'GTIN, UPC, EAN, or ISBN'?: string;
    'Attribute 1 name'?: string;
    'Attribute 1 value(s)'?: string;
    'Attribute 2 name'?: string;
    'Attribute 2 value(s)'?: string;
    'Attribute 3 name'?: string;
    'Attribute 3 value(s)'?: string;
    Variations?: WooCommerceProduct[];
}

interface ShopifyProduct {
    [key: string]: any;
    'Handle'?: string;
    'Title'?: string;
    'Vendor'?: string;
    'Product Category'?: string;
    'Type'?: string;
    'Tags'?: string;
    'Variant Price'?: number;
    'Variant Compare At Price'?: number | string;
    'Image Src'?: string;
    'Variant Barcode'?: string;
    'Option1 Name'?: string;
    'Option1 Value'?: string;
    'Option2 Name'?: string;
    'Option2 Value'?: string;
    'Option3 Name'?: string;
    'Option3 Value'?: string;
}

interface OptimizedWooCommerceProduct {
    Type?: string;
    SKU?: string;
    Name?: string;
    'Regular price'?: number | string;
    'Sale price'?: number | string;
    Categories?: string;
    Tags?: string;
    Images?: string;
    GTIN?: string;
    'Attribute 1'?: string;
    'Attribute 2'?: string;
    'Attribute 3'?: string;
    Variations?: OptimizedWooCommerceVariation[];
}

interface OptimizedWooCommerceVariation {
    Type: string;
    SKU: string;
    Name: string;
    'Regular price': number | string;
    'Sale price'?: number | string;
    Images?: string;
    Size?: string;
    Color?: string;
    Material?: string;
}

interface OptimizedShopifyProduct {
    Handle: string;
    Title: string;
    Vendor?: string;
    'Product Category'?: string;
    Type?: string;
    Tags?: string;
    Price: number | string;
    'Compare At Price'?: number | string;
    Images?: string;
    Barcode?: string;
    'Option 1'?: string;
    'Option 2'?: string;
    'Option 3'?: string;
}

interface AIGeneratedContent {
    SKU?: string;
    Handle?: string;
    'Short description'?: string;
    Description?: string;
    'Body (HTML)'?: string;
    'SEO Title'?: string;
    'Meta Description'?: string;
    'SEO Description'?: string;
    'Image Alt Text'?: string;
}

class ProductOptimizerService {
    /**
     * Clean WooCommerce product for AI processing
     * Reduces from 51 fields to 8-10 fields (~84% reduction)
     *
     * IMPORTANTE: NO incluye Variations para evitar generar contenido duplicado
     * Solo el producto padre necesita descripción/SEO - las variaciones heredan
     */
    cleanWooCommerceProductForAI(product: WooCommerceProduct): OptimizedWooCommerceProduct {
        const cleaned: OptimizedWooCommerceProduct = {
            Type: product.Type || 'simple',
            SKU: product.SKU || '',
            Name: product.Name || '',
            'Regular price': product['Regular price'] || '',
            'Sale price': product['Sale price'] || '',
            Categories: product.Categories || '',
            Tags: product.Tags || '',
            Images: product.Images || '',
            GTIN: product['GTIN, UPC, EAN, or ISBN'] || '',
        };

        // Add attributes if they exist (for variable products)
        if (product['Attribute 1 name'] && product['Attribute 1 value(s)']) {
            cleaned['Attribute 1'] = `${product['Attribute 1 name']}: ${product['Attribute 1 value(s)']}`;
        }

        if (product['Attribute 2 name'] && product['Attribute 2 value(s)']) {
            cleaned['Attribute 2'] = `${product['Attribute 2 name']}: ${product['Attribute 2 value(s)']}`;
        }

        if (product['Attribute 3 name'] && product['Attribute 3 value(s)']) {
            cleaned['Attribute 3'] = `${product['Attribute 3 name']}: ${product['Attribute 3 value(s)']}`;
        }

        // ❌ NO incluir Variations en el objeto enviado a OpenAI
        // Las variaciones no necesitan contenido AI (heredan del padre)
        // Esto ahorra ~95% de tokens en productos variables

        return cleaned;
    }

    /**
     * Clean Shopify product for AI processing
     * Reduces from 43 fields to 8-10 fields (~81% reduction)
     */
    cleanShopifyProductForAI(product: ShopifyProduct): OptimizedShopifyProduct {
        const cleaned: OptimizedShopifyProduct = {
            Handle: product.Handle || '',
            Title: product.Title || '',
            Vendor: product.Vendor || '',
            'Product Category': product['Product Category'] || '',
            Type: product.Type || '',
            Tags: product.Tags || '',
            Price: product['Variant Price'] || '',
            'Compare At Price': product['Variant Compare At Price'] || '',
            Images: product['Image Src'] || '',
            Barcode: product['Variant Barcode'] || '',
        };

        // Add options if they exist
        if (product['Option1 Name'] && product['Option1 Value']) {
            cleaned['Option 1'] = `${product['Option1 Name']}: ${product['Option1 Value']}`;
        }

        if (product['Option2 Name'] && product['Option2 Value']) {
            cleaned['Option 2'] = `${product['Option2 Name']}: ${product['Option2 Value']}`;
        }

        if (product['Option3 Name'] && product['Option3 Value']) {
            cleaned['Option 3'] = `${product['Option3 Name']}: ${product['Option3 Value']}`;
        }

        return cleaned;
    }

    /**
     * Clean products array for AI based on platform
     *
     * WooCommerce: Filtra variaciones (solo padres y simples) y limpia
     * Shopify: Deduplica por Handle (solo 1 instancia por producto)
     */
    cleanProductsForAI(products: any[], platform: string): any[] {
        if (platform === 'woocommerce') {
            // Filtrar solo productos padre (variable, simple, etc.) - NO variaciones
            const productsForAI = products.filter((product) => {
                const type = String(product.Type || '').toLowerCase();
                return type !== 'variation';
            });

            console.log(`🔹 WooCommerce filter: ${products.length} products → ${productsForAI.length} for AI (${products.length - productsForAI.length} variations skipped)`);

            return productsForAI.map((product) => this.cleanWooCommerceProductForAI(product));
        } else if (platform === 'shopify') {
            // Deduplicar por Handle: solo enviar el primer producto de cada Handle
            const uniqueHandles = new Map<string, any>();

            products.forEach((product) => {
                const handle = product.Handle;

                // Si es la primera vez que vemos este Handle, guardarlo
                if (handle && !uniqueHandles.has(handle)) {
                    uniqueHandles.set(handle, product);
                }
            });

            // Convertir Map a array y limpiar
            const uniqueProducts = Array.from(uniqueHandles.values());
            console.log(`🔹 Shopify deduplication: ${products.length} rows → ${uniqueProducts.length} unique products`);

            return uniqueProducts.map((product) => this.cleanShopifyProductForAI(product));
        }

        throw new Error(`Unsupported platform: ${platform}`);
    }

    /**
     * Merge AI-generated content back with original WooCommerce product data
     * Sobrescribe los campos del objeto original con el contenido generado por IA
     */
    mergeWooCommerceAIResponse(
        originalProduct: WooCommerceProduct,
        aiContent: AIGeneratedContent
    ): WooCommerceProduct {
        // IMPORTANTE: Preservar TODOS los campos originales (51+ campos)
        const merged = { ...originalProduct };

        // SOBRESCRIBIR los campos generados por AI (sobrescribe los valores existentes)
        if (aiContent['Short description']) {
            merged['Short description'] = aiContent['Short description'];
        }

        if (aiContent.Description) {
            merged.Description = aiContent.Description;
        }

        if (aiContent['SEO Title']) {
            merged['SEO Title'] = aiContent['SEO Title'];
        }

        if (aiContent['Meta Description']) {
            merged['Meta Description'] = aiContent['Meta Description'];
        }

        return merged;
    }

    /**
     * Merge AI-generated content back with original Shopify product data
     */
    mergeShopifyAIResponse(
        originalProduct: ShopifyProduct,
        aiContent: AIGeneratedContent
    ): ShopifyProduct {
        // IMPORTANTE: Preservar TODOS los campos originales (43 campos)
        const merged = { ...originalProduct };

        // Agregar SOLO los campos generados por AI
        if (aiContent['Body (HTML)']) {
            merged['Body (HTML)'] = aiContent['Body (HTML)'];
        }

        if (aiContent['SEO Title']) {
            merged['SEO Title'] = aiContent['SEO Title'];
        }

        if (aiContent['SEO Description']) {
            merged['SEO Description'] = aiContent['SEO Description'];
        }

        if (aiContent['Image Alt Text']) {
            merged['Image Alt Text'] = aiContent['Image Alt Text'];
        }

        return merged;
    }

    /**
     * Merge AI responses with original products based on platform
     * Matches products by SKU (WooCommerce) or Handle (Shopify)
     *
     * IMPORTANTE: Esta función devuelve productos COMPLETOS (51/43 campos)
     *
     * WooCommerce: 1:1 match por SKU
     * Shopify: 1:N match por Handle (todas las variantes reciben el mismo contenido AI)
     */
    mergeAIResponses(
        originalProducts: any[],
        aiResponses: AIGeneratedContent[],
        platform: string
    ): any[] {
        if (platform === 'woocommerce') {
            return originalProducts.map((originalProduct) => {
                const productType = String(originalProduct.Type || '').toLowerCase();

                // Si es una variación, NO buscar contenido AI (no se generó para ella)
                if (productType === 'variation') {
                    // Las variaciones se devuelven sin modificar
                    return originalProduct;
                }

                // Find matching AI response by SKU (solo para padres y simples)
                const aiContent = aiResponses.find(
                    (ai) => ai.SKU === originalProduct.SKU
                );

                if (!aiContent) {
                    console.warn(`⚠️ No AI content found for SKU: ${originalProduct.SKU}`);
                    return originalProduct;
                }

                // Merge for parent product (preserva los 51 campos originales)
                const mergedProduct = this.mergeWooCommerceAIResponse(originalProduct, aiContent);

                // If product has variations, keep them as-is (they don't need AI content)
                if (originalProduct.Variations && Array.isArray(originalProduct.Variations)) {
                    mergedProduct.Variations = originalProduct.Variations;
                }

                return mergedProduct;
            });
        } else if (platform === 'shopify') {
            // Para Shopify: Todas las filas con el mismo Handle reciben el mismo contenido AI
            return originalProducts.map((originalProduct) => {
                // Find matching AI response by Handle
                const aiContent = aiResponses.find(
                    (ai) => ai.Handle === originalProduct.Handle
                );

                if (!aiContent) {
                    console.warn(`⚠️ No AI content found for Handle: ${originalProduct.Handle}`);
                    return originalProduct;
                }

                // Aplicar el mismo contenido AI a todas las variantes del producto
                return this.mergeShopifyAIResponse(originalProduct, aiContent);
            });
        }

        throw new Error(`Unsupported platform: ${platform}`);
    }

    /**
     * Calculate token savings from optimization
     */
    calculateTokenSavings(originalProducts: any[], optimizedProducts: any[]): {
        originalEstimate: number;
        optimizedEstimate: number;
        savedTokens: number;
        savedPercentage: number;
    } {
        // Rough estimate: 1 token ≈ 4 characters
        const originalSize = JSON.stringify(originalProducts).length;
        const optimizedSize = JSON.stringify(optimizedProducts).length;

        const originalEstimate = Math.ceil(originalSize / 4);
        const optimizedEstimate = Math.ceil(optimizedSize / 4);
        const savedTokens = originalEstimate - optimizedEstimate;
        const savedPercentage = Math.round((savedTokens / originalEstimate) * 100);

        return {
            originalEstimate,
            optimizedEstimate,
            savedTokens,
            savedPercentage,
        };
    }
}

export default new ProductOptimizerService();
