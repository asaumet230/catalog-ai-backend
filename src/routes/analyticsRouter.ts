import { Router } from 'express';
import {
    getDashboardMetrics,
    getProductsPerDay,
    getPlatformDistribution,
    getSuccessRateTrend,
    getCatalogsPerMonth,
    getAllAnalytics,
    getKeyInsights,
    getRecentActivities
} from '../controllers';
import { jwtValidator } from '../middlewares';

export const analyticsRouter = Router();

/**
 * GET /api/dashboard/metrics
 * Get main dashboard metrics
 */
analyticsRouter.get('/dashboard/metrics', [
    jwtValidator,
], getDashboardMetrics);

/**
 * GET /api/analytics/products-per-day
 * Get products processed per day
 * Query params: days (default: 30)
 */
analyticsRouter.get('/analytics/products-per-day', [
    jwtValidator,
], getProductsPerDay);

/**
 * GET /api/analytics/platform-distribution
 * Get platform distribution
 */
analyticsRouter.get('/analytics/platform-distribution', [
    jwtValidator,
], getPlatformDistribution);

/**
 * GET /api/analytics/success-rate-trend
 * Get success rate trend by week
 * Query params: weeks (default: 6)
 */
analyticsRouter.get('/analytics/success-rate-trend', [
    jwtValidator,
], getSuccessRateTrend);

/**
 * GET /api/analytics/catalogs-per-month
 * Get catalogs per month
 * Query params: months (default: 6)
 */
analyticsRouter.get('/analytics/catalogs-per-month', [
    jwtValidator,
], getCatalogsPerMonth);

/**
 * GET /api/analytics/all
 * Get all analytics data in a single request
 */
analyticsRouter.get('/analytics/all', [
    jwtValidator,
], getAllAnalytics);

/**
 * GET /api/analytics/insights
 * Get key insights
 */
analyticsRouter.get('/analytics/insights', [
    jwtValidator,
], getKeyInsights);

/**
 * GET /api/analytics/activities
 * Get recent activities
 */
analyticsRouter.get('/analytics/activities', [
    jwtValidator,
], getRecentActivities);
