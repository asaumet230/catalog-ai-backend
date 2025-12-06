import { Worker, Job as BullJob } from 'bullmq';
import Redis from 'ioredis';
import { openaiService, productOptimizerService } from '../services';
import { Job, Catalog, WooCommerceProduct, ShopifyProduct } from '../models';

const BATCH_SIZE = 10;
const PAUSE_BETWEEN_BATCHES = 1000;

// Create Redis connection for Worker
const connection = new Redis({
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || '18245'),
    password: process.env.REDIS_PASSWORD!,
    username: process.env.REDIS_USERNAME || 'default',
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

const worker = new Worker(
    'catalog-generation',
    async (job: BullJob) => {
        const { jobId, products, userId, platform } = job.data;

        try {
            await Job.findByIdAndUpdate(jobId, { status: 'processing' });

            const batches = [];
            for (let i = 0; i < products.length; i += BATCH_SIZE) {
                batches.push(products.slice(i, i + BATCH_SIZE));
            }

            const allProcessedProducts: any[] = [];

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];

                console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} products)`);

                // 🔹 PASO 1: Guardar productos originales completos (51 campos WooCommerce / 43 campos Shopify)
                const originalBatch = [...batch];

                // 🔹 PASO 2: Limpiar productos para OpenAI (8-10 campos)
                const cleanedBatch = productOptimizerService.cleanProductsForAI(batch, platform);

                // 🔹 PASO 3: Calcular ahorro de tokens
                const tokenSavings = productOptimizerService.calculateTokenSavings(batch, cleanedBatch);
                console.log(`💰 Token savings: ${tokenSavings.savedPercentage}% (${tokenSavings.savedTokens} tokens saved)`);
                console.log(`   Original: ~${tokenSavings.originalEstimate} tokens → Optimized: ~${tokenSavings.optimizedEstimate} tokens`);

                // 🔹 PASO 4: Enviar solo productos limpios a OpenAI
                const aiGeneratedContent = await openaiService.generateProductDescriptions(cleanedBatch, platform);

                // 🔹 PASO 5: Fusionar respuesta AI con productos originales (devuelve 51/43 campos completos)
                const mergedBatch = productOptimizerService.mergeAIResponses(
                    originalBatch,
                    aiGeneratedContent,
                    platform
                );

                console.log(`✅ Merged ${mergedBatch.length} products with AI content (all ${platform === 'woocommerce' ? '51' : '43'} fields preserved)`);

                // Store merged products (completos con todos los campos + AI)
                allProcessedProducts.push(...mergedBatch);

                const progress = Math.round(((i + 1) / batches.length) * 100);
                await Job.findByIdAndUpdate(jobId, {
                    progress,
                    processedProducts: allProcessedProducts.length,
                });

                await job.updateProgress(progress);

                if (i < batches.length - 1) {
                    await new Promise((resolve) => setTimeout(resolve, PAUSE_BETWEEN_BATCHES));
                }
            }

            // Create catalog placeholder to obtain ID for product references
            const productModelName = platform === 'woocommerce' ? 'WooCommerceProduct' : 'ShopifyProduct';

            const catalog = await Catalog.create({
                name: `Generated Catalog - ${new Date().toISOString()}`,
                userId,
                platform,
                products: [],
                productModel: productModelName,
                totalProducts: 0,
                status: 'processing',
                markup: 0,
            });

            let productIds: any[] = [];

            if (platform === 'woocommerce') {
                const createdWooProducts = await WooCommerceProduct.insertMany(
                    allProcessedProducts.map((product: any) => ({
                        ...product,
                        catalogId: catalog._id,
                        aiGenerated: true,
                        generatedAt: new Date(),
                    })),
                    { ordered: true }
                );

                productIds = createdWooProducts.map((product) => product._id);
                console.log(`📦 Created ${createdWooProducts.length} WooCommerce products`);
                console.log(`📦 Product IDs sample:`, productIds.slice(0, 3));
            } else {
                const createdShopifyProducts = await ShopifyProduct.insertMany(
                    allProcessedProducts.map((product: any) => ({
                        ...product,
                        catalogId: catalog._id,
                        aiGenerated: true,
                        generatedAt: new Date(),
                    })),
                    { ordered: true }
                );

                productIds = createdShopifyProducts.map((product) => product._id);
                console.log(`📦 Created ${createdShopifyProducts.length} Shopify products`);
                console.log(`📦 Product IDs sample:`, productIds.slice(0, 3));
            }

            console.log(`🔄 Updating catalog ${catalog._id} with ${productIds.length} product IDs`);
            console.log(`🔄 Before update - catalog.products length:`, catalog.products.length);

            // Update catalog with product IDs
            catalog.products = productIds;
            catalog.totalProducts = productIds.length;
            catalog.status = 'completed';

            // Mark products array as modified to ensure Mongoose saves it
            catalog.markModified('products');

            console.log(`🔄 After assignment - catalog.products length:`, catalog.products.length);
            console.log(`🔄 First product ID:`, catalog.products[0]);

            await catalog.save();

            console.log(`✅ Catalog saved. Verifying...`);

            // Verify the save worked
            const verifiedCatalog = await Catalog.findById(catalog._id);
            console.log(`🔍 Verified catalog products count:`, verifiedCatalog?.products.length);
            console.log(`🔍 First product ID in DB:`, verifiedCatalog?.products[0]);

            await Job.findByIdAndUpdate(jobId, {
                status: 'completed',
                progress: 100,
                result: { catalogId: catalog._id },
                completedAt: new Date(),
            });

            console.log(`✅ Job ${jobId} completed. Catalog ${catalog._id} created.`);

            return { success: true, catalogId: catalog._id };

        } catch (error: any) {
            console.error(`❌ Job ${jobId} failed:`, error.message);

            await Job.findByIdAndUpdate(jobId, {
                status: 'failed',
                error: error.message,
            });

            throw error;
        }
    },
    {
        connection,
        concurrency: 1,
    }
);

worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
});

worker.on('active', (job) => {
    console.log(`🔄 Job ${job.id} started processing`);
});

console.log('🚀 Catalog worker started and listening for jobs...');

export default worker;
