import OpenAI from 'openai';
import { cacheService } from './';

// Generic product interface supporting both platforms
interface Product {
    // Common fields
    'Type'?: string;
    'Tags'?: string;
    'Published'?: number | string;

    // WooCommerce specific fields
    'SKU'?: string | number;
    'Name'?: string;
    'Visibility in catalog'?: string;
    'Tax status'?: string;
    'In stock?'?: number;
    'Stock'?: number;
    'Regular price'?: number;
    'Categories'?: string;
    'Images'?: string;

    // Shopify specific fields
    'Handle'?: string;
    'Title'?: string;
    'Body (HTML)'?: string;
    'Vendor'?: string;
    'Option1 Name'?: string;
    'Option1 Value'?: string;
    'Option2 Name'?: string;
    'Option2 Value'?: string;
    'Option3 Name'?: string;
    'Option3 Value'?: string;
    'Variant SKU'?: string | number;
    'Variant Grams'?: number;
    'Variant Inventory Tracker'?: string;
    'Variant Inventory Qty'?: number;
    'Variant Inventory Policy'?: string;
    'Variant Fulfillment Service'?: string;
    'Variant Price'?: number;
    'Variant Compare At Price'?: number;
    'Variant Requires Shipping'?: string;
    'Variant Taxable'?: string;
    'Variant Barcode'?: string;
    'Image Src'?: string;
    'Image Position'?: number;
    'Image Alt Text'?: string;
    'Variant Image'?: string;
    'Variant Weight Unit'?: string;
    'SEO Title'?: string;
    'SEO Description'?: string;
    'Google Shopping / Google Product Category'?: string;

    [key: string]: any;
}

class OpenAIService {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    private getPromptConfig(platform: string): { id: string; version: string } {
        
        const configs: Record<string, { id: string; version: string }> = {
            woocommerce: {
                id: process.env.OPENAI_PROMPT_WOOCOMMERCE_ID || '',
                version: process.env.OPENAI_PROMPT_WOOCOMMERCE_VERSION || '1',
            },
            shopify: {
                id: process.env.OPENAI_PROMPT_SHOPIFY_ID || '',
                version: process.env.OPENAI_PROMPT_SHOPIFY_VERSION || '1',
            },
        };

        const config = configs[platform.toLowerCase()];

        if (!config || !config.id) {
            throw new Error(`Prompt configuration not found for platform: ${platform}`);
        }

        return config;
    }

    async generateProductDescriptions(products: Product[], platform: string): Promise<any[]> {
        const startTime = Date.now();

        try {
            const cacheKey = cacheService.generateHash(JSON.stringify(products));
            const cached = await cacheService.get(`ai:products:${cacheKey}`);

            if (cached) {
                console.log('✅ Cache hit');
                return cached;
            }

            console.log(`🤖 Generating content for ${products.length} products (${platform})...`);

            const promptConfig = this.getPromptConfig(platform);

            const response = await this.client.responses.create({
                prompt: {
                    id: promptConfig.id,
                    version: promptConfig.version,
                    variables: {
                        products: JSON.stringify(products, null, 2)
                    }
                }
            }) as any;

            // Extract JSON from response structure
            let content = response.output?.[0]?.content?.[0]?.text
                         || response.choices?.[0]?.message?.content
                         || response.output_text
                         || '{}';

            // Clean markdown code blocks (```json ... ```)
            content = content.trim();
            if (content.startsWith('```')) {
                // Remove opening ```json or ```
                content = content.replace(/^```(?:json)?\n?/, '');
                // Remove closing ```
                content = content.replace(/\n?```$/, '');
                content = content.trim();
            }

            const result = JSON.parse(content);
            const processingTime = Date.now() - startTime;

            console.log(`✅ Generated in ${processingTime}ms`);

            if (!result.products || !Array.isArray(result.products)) {
                throw new Error('Invalid response format from OpenAI');
            }

            await cacheService.set(`ai:products:${cacheKey}`, result.products);

            return result.products;

        } catch (error: any) {
            console.error('❌ OpenAI error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            const errorMessage = error?.message || error?.error?.message || JSON.stringify(error);
            throw new Error(`Failed to generate descriptions: ${errorMessage}`);
        }
    }
}

export default new OpenAIService();
