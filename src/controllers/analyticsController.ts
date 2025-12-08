import { Request, Response } from 'express';
import { Catalog, Job } from '../models';
import { sendError } from '../helpers';
import {
    DashboardMetrics,
    ProductsPerDayData,
    PlatformDistributionData,
    SuccessRateData,
    CatalogsPerMonthData,
    AnalyticsData,
    KeyInsights,
    ActivityTimelineItem
} from '../interfaces';

/**
 * Get Dashboard Metrics
 * Returns main metrics for the dashboard
 */
export const getDashboardMetrics = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;

    try {
        const query = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        // Get current date and first day of current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Total catalogs
        const totalCatalogs = await Catalog.countDocuments(query);

        // Catalogs this month
        const catalogsThisMonth = await Catalog.countDocuments({
            ...query,
            createdAt: { $gte: firstDayOfMonth }
        });

        // Total products (sum of totalProducts in all catalogs)
        const totalProductsAgg = await Catalog.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$totalProducts' } } }
        ]);
        const totalProducts = totalProductsAgg.length > 0 ? totalProductsAgg[0].total : 0;

        // Products this month
        const productsThisMonthAgg = await Catalog.aggregate([
            {
                $match: {
                    ...query,
                    createdAt: { $gte: firstDayOfMonth }
                }
            },
            { $group: { _id: null, total: { $sum: '$totalProducts' } } }
        ]);
        const productsThisMonth = productsThisMonthAgg.length > 0 ? productsThisMonthAgg[0].total : 0;

        // Jobs metrics
        const jobQuery = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        const activeJobs = await Job.countDocuments({
            ...jobQuery,
            status: { $in: ['queued', 'processing'] }
        });

        const completedJobs = await Job.countDocuments({
            ...jobQuery,
            status: 'completed'
        });

        const failedJobs = await Job.countDocuments({
            ...jobQuery,
            status: 'failed'
        });

        // Calculate success rate
        const totalJobs = completedJobs + failedJobs;
        const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

        // Calculate success rate for last month
        const completedJobsLastMonth = await Job.countDocuments({
            ...jobQuery,
            status: 'completed',
            createdAt: {
                $gte: firstDayOfLastMonth,
                $lt: firstDayOfMonth
            }
        });

        const failedJobsLastMonth = await Job.countDocuments({
            ...jobQuery,
            status: 'failed',
            createdAt: {
                $gte: firstDayOfLastMonth,
                $lt: firstDayOfMonth
            }
        });

        const totalJobsLastMonth = completedJobsLastMonth + failedJobsLastMonth;
        const successRateLastMonth = totalJobsLastMonth > 0 ? (completedJobsLastMonth / totalJobsLastMonth) * 100 : 0;
        const successRateChange = successRate - successRateLastMonth;

        // API Credits (placeholder - implement based on your credits system)
        const apiCreditsUsed = 0;
        const apiCreditsRemaining = 50000;

        const metrics: DashboardMetrics = {
            totalCatalogs,
            catalogsThisMonth,
            totalProducts,
            productsThisMonth,
            activeJobs,
            completedJobs,
            successRate: Math.round(successRate * 10) / 10,
            successRateChange: Math.round(successRateChange * 10) / 10,
            apiCreditsUsed,
            apiCreditsRemaining
        };

        return res.status(200).json({
            ok: true,
            metrics
        });

    } catch (error) {
        console.error('Get Dashboard Metrics Error:', error);
        return sendError(res, error);
    }
};

/**
 * Get Products Per Day
 * Returns products processed per day for the last N days
 */
export const getProductsPerDay = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;
    const { days = 30 } = req.query;

    try {
        const query = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        const productsPerDayData = await getProductsPerDayData(query, Number(days));

        return res.status(200).json({
            ok: true,
            data: productsPerDayData
        });

    } catch (error) {
        console.error('Get Products Per Day Error:', error);
        return sendError(res, error);
    }
};

/**
 * Get Platform Distribution
 * Returns distribution of catalogs by platform
 */
export const getPlatformDistribution = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;

    try {
        const query = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        const formattedData = await getPlatformDistributionData(query);

        return res.status(200).json({
            ok: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Get Platform Distribution Error:', error);
        return sendError(res, error);
    }
};

/**
 * Get Success Rate Trend
 * Returns success rate trend by week for the last N weeks
 */
export const getSuccessRateTrend = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;
    const { weeks = 6 } = req.query;

    try {
        const query = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        const formattedData = await getSuccessRateTrendData(query, Number(weeks));

        return res.status(200).json({
            ok: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Get Success Rate Trend Error:', error);
        return sendError(res, error);
    }
};

/**
 * Get Catalogs Per Month
 * Returns catalogs created per month for the last N months
 */
export const getCatalogsPerMonth = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;
    const { months = 6 } = req.query;

    try {
        const query = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        const formattedData = await getCatalogsPerMonthData(query, Number(months));

        return res.status(200).json({
            ok: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Get Catalogs Per Month Error:', error);
        return sendError(res, error);
    }
};

/**
 * Get All Analytics Data
 * Returns all analytics data in a single response
 */
export const getAllAnalytics = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;

    try {
        const query = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        // Get all data in parallel
        const [
            productsPerDayData,
            platformDistributionData,
            successRateTrendData,
            catalogsPerMonthData
        ] = await Promise.all([
            getProductsPerDayData(query, 30),
            getPlatformDistributionData(query),
            getSuccessRateTrendData(authenticatedUser.role === 'admin_role' ? {} : { userId: authenticatedUser.id }, 6),
            getCatalogsPerMonthData(query, 6)
        ]);

        const analytics: AnalyticsData = {
            productsPerDay: productsPerDayData,
            platformDistribution: platformDistributionData,
            successRateTrend: successRateTrendData,
            catalogsPerMonth: catalogsPerMonthData
        };

        return res.status(200).json({
            ok: true,
            analytics
        });

    } catch (error) {
        console.error('Get All Analytics Error:', error);
        return sendError(res, error);
    }
};

/**
 * Get Key Insights
 * Returns key insights about the data
 */
export const getKeyInsights = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;

    try {
        const query = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        // Get platform distribution
        const platformDist = await getPlatformDistributionData(query);
        const mostActivePlatform = platformDist.reduce((max, p) => p.count > max.count ? p : max, platformDist[0]);

        // Get peak processing day
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - 30);

        const peakDay = await Catalog.aggregate([
            {
                $match: {
                    ...query,
                    createdAt: { $gte: daysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    products: { $sum: '$totalProducts' }
                }
            },
            { $sort: { products: -1 } },
            { $limit: 1 }
        ]);

        // Get best success week
        const weeksAgo = new Date();
        weeksAgo.setDate(weeksAgo.getDate() - 42);

        const jobQuery = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        const bestWeek = await Job.aggregate([
            {
                $match: {
                    ...jobQuery,
                    createdAt: { $gte: weeksAgo },
                    status: { $in: ['completed', 'failed'] }
                }
            },
            {
                $group: {
                    _id: {
                        week: { $week: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    total: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    successRate: {
                        $multiply: [
                            { $divide: ['$completed', '$total'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { successRate: -1 } },
            { $limit: 1 }
        ]);

        const insights: KeyInsights = {
            mostActivePlatform: {
                platform: mostActivePlatform?.platform || 'N/A',
                percentage: mostActivePlatform?.percentage || 0,
                count: mostActivePlatform?.count || 0
            },
            peakProcessingDay: {
                date: peakDay.length > 0
                    ? new Date(peakDay[0]._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'N/A',
                products: peakDay.length > 0 ? peakDay[0].products : 0
            },
            bestSuccessWeek: {
                week: bestWeek.length > 0 ? `Week ${bestWeek[0]._id.week}` : 'N/A',
                successRate: bestWeek.length > 0 ? Math.round(bestWeek[0].successRate * 10) / 10 : 0
            }
        };

        return res.status(200).json({
            ok: true,
            insights
        });

    } catch (error) {
        console.error('Get Key Insights Error:', error);
        return sendError(res, error);
    }
};

/**
 * Get Recent Activities
 * Returns recent activities (timeline)
 */
export const getRecentActivities = async (req: Request, res: Response): Promise<Response> => {
    const { authenticatedUser } = req.body;

    try {
        const query = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        const jobQuery = authenticatedUser.role === 'admin_role'
            ? {}
            : { userId: authenticatedUser.id };

        // 1. Get recent catalogs (created)
        const recentCatalogs = await Catalog.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .select('_id name createdAt platform');

        // 2. Get recent jobs (completed / failed)
        const recentJobs = await Job.find({
            ...jobQuery,
            status: { $in: ['completed', 'failed'] }
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('_id catalogName status completedAt createdAt error');

        // 3. Map to activities
        const activities: ActivityTimelineItem[] = [];

        recentCatalogs.forEach(catalog => {
            activities.push({
                id: (catalog as any)._id.toString(),
                type: 'catalog_created',
                message: `New catalog "${catalog.name}" was created`,
                timestamp: catalog.createdAt
            });
        });

        recentJobs.forEach(job => {
            if (job.status === 'completed') {
                activities.push({
                    id: (job as any)._id.toString(),
                    type: 'catalog_completed',
                    message: `Catalog "${job.catalogName}" was successfully completed`,
                    timestamp: job.completedAt || job.createdAt
                });
            } else if (job.status === 'failed') {
                activities.push({
                    id: (job as any)._id.toString(),
                    type: 'catalog_error',
                    message: `Error processing "${job.catalogName}" - ${job.error || 'Unknown error'}`,
                    timestamp: job.completedAt || job.createdAt
                });
            }
        });

        // 4. Sort by timestamp desc and take top 10
        activities.sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());
        const recentActivities = activities.slice(0, 10);

        return res.status(200).json({
            ok: true,
            activities: recentActivities
        });

    } catch (error) {
        console.error('Get Recent Activities Error:', error);
        return sendError(res, error);
    }
};

// Helper functions for data retrieval
async function getProductsPerDayData(query: any, days: number): Promise<ProductsPerDayData[]> {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const productsPerDay = await Catalog.aggregate([
        {
            $match: {
                ...query,
                createdAt: { $gte: daysAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                products: { $sum: '$totalProducts' }
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id',
                products: 1
            }
        }
    ]);

    return productsPerDay.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        products: item.products
    }));
}

async function getPlatformDistributionData(query: any): Promise<PlatformDistributionData[]> {
    const distribution = await Catalog.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$platform',
                count: { $sum: 1 }
            }
        }
    ]);

    const total = distribution.reduce((sum, item) => sum + item.count, 0);

    return distribution.map(item => ({
        platform: item._id as 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce',
        count: item.count,
        percentage: Math.round((item.count / total) * 100)
    }));
}

async function getSuccessRateTrendData(query: any, weeks: number): Promise<SuccessRateData[]> {
    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7));

    const jobs = await Job.aggregate([
        {
            $match: {
                ...query,
                createdAt: { $gte: weeksAgo },
                status: { $in: ['completed', 'failed'] }
            }
        },
        {
            $group: {
                _id: {
                    week: { $week: '$createdAt' },
                    year: { $year: '$createdAt' }
                },
                total: { $sum: 1 },
                completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                }
            }
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    return jobs.map((item, index) => ({
        date: `Week ${index + 1}`,
        successRate: Math.round((item.completed / item.total) * 1000) / 10
    }));
}

async function getCatalogsPerMonthData(query: any, months: number): Promise<CatalogsPerMonthData[]> {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);

    const catalogsPerMonth = await Catalog.aggregate([
        {
            $match: {
                ...query,
                createdAt: { $gte: monthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' }
                },
                catalogs: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
            $project: {
                _id: 0,
                month: '$_id.month',
                year: '$_id.year',
                catalogs: 1
            }
        }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return catalogsPerMonth.map(item => ({
        month: monthNames[item.month - 1],
        catalogs: item.catalogs
    }));
}
