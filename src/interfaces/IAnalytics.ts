/**
 * Analytics and Dashboard Metrics Interfaces
 */

export interface DashboardMetrics {
    totalCatalogs: number;
    catalogsThisMonth: number;
    totalProducts: number;
    productsThisMonth: number;
    activeJobs: number;
    completedJobs: number;
    successRate: number;
    successRateChange: number;
    apiCreditsUsed: number;
    apiCreditsRemaining: number;
}

export interface ProductsPerDayData {
    date: string;
    products: number;
}

export interface PlatformDistributionData {
    platform: 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce';
    count: number;
    percentage: number;
}

export interface SuccessRateData {
    date: string;
    successRate: number;
}

export interface CatalogsPerMonthData {
    month: string;
    catalogs: number;
}

export interface AnalyticsData {
    productsPerDay: ProductsPerDayData[];
    platformDistribution: PlatformDistributionData[];
    successRateTrend: SuccessRateData[];
    catalogsPerMonth: CatalogsPerMonthData[];
}

export interface KeyInsights {
    mostActivePlatform: {
        platform: string;
        percentage: number;
        count: number;
    };
    peakProcessingDay: {
        date: string;
        products: number;
    };
    bestSuccessWeek: {
        week: string;
        successRate: number;
    };
}

export interface ActivityTimelineItem {
    id: string;
    type: 'catalog_created' | 'catalog_completed' | 'catalog_exported' | 'pdf_generated' | 'products_processed' | 'catalog_error' | 'catalog_deleted';
    message: string;
    timestamp: Date | string;
    relativeTime?: string;
}
