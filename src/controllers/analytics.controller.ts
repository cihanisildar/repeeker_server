import { Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '../types/express';
import { validatePagination } from '../utils/validation';

const analyticsControllerLogger = createModuleLogger('ANALYTICS_CONTROLLER');

export const AnalyticsController = {
  async getLearningVelocity(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { period = 'daily', days = 30 } = req.query;
    analyticsControllerLogger.debug('Get learning velocity request received', { userId, period, days });
    
    try {
      // Validate parameters
      const validPeriods = ['daily', 'weekly', 'monthly'];
      if (typeof period !== 'string' || !validPeriods.includes(period)) {
        return sendResponse(res, null, 'error', 'period must be one of: daily, weekly, monthly', 400);
      }

      const daysNumber = typeof days === 'string' ? parseInt(days, 10) : (typeof days === 'number' ? days : 30);
      if (isNaN(daysNumber) || daysNumber <= 0 || daysNumber > 365) {
        return sendResponse(res, null, 'error', 'days must be a number between 1 and 365', 400);
      }

      const velocity = await analyticsService.getLearningVelocity(
        userId, 
        period as 'daily' | 'weekly' | 'monthly', 
        daysNumber
      );

      analyticsControllerLogger.debug('Learning velocity retrieved successfully', { 
        userId, 
        period,
        days: daysNumber,
        dataPoints: velocity.length
      });
      return sendResponse(res, velocity, 'success', 'Learning velocity retrieved successfully');
    } catch (error) {
      analyticsControllerLogger.error('Failed to get learning velocity', { 
        userId,
        period,
        days,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get learning velocity', 500);
    }
  },

  async getDifficultCards(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { limit } = req.query;
    analyticsControllerLogger.debug('Get difficult cards request received', { userId, limit });
    
    try {
      const { limit: validatedLimit } = validatePagination(limit);

      const difficultCards = await analyticsService.getDifficultCards(userId, validatedLimit);

      analyticsControllerLogger.debug('Difficult cards retrieved successfully', { 
        userId,
        limit: validatedLimit,
        count: difficultCards.length
      });
      return sendResponse(res, difficultCards, 'success', 'Difficult cards retrieved successfully');
    } catch (error) {
      analyticsControllerLogger.error('Failed to get difficult cards', { 
        userId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get difficult cards', 500);
    }
  },

  async getOptimalReviewTimes(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    analyticsControllerLogger.debug('Get optimal review times request received', { userId });
    
    try {
      const optimalTimes = await analyticsService.getOptimalReviewTimes(userId);

      analyticsControllerLogger.debug('Optimal review times retrieved successfully', { 
        userId,
        timesCount: optimalTimes.length
      });
      return sendResponse(res, optimalTimes, 'success', 'Optimal review times retrieved successfully');
    } catch (error) {
      analyticsControllerLogger.error('Failed to get optimal review times', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get optimal review times', 500);
    }
  },

  async getLearningInsights(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    analyticsControllerLogger.debug('Get learning insights request received', { userId });
    
    try {
      const insights = await analyticsService.getLearningInsights(userId);

      analyticsControllerLogger.debug('Learning insights retrieved successfully', { 
        userId,
        insightsCount: insights.length,
        severityBreakdown: {
          high: insights.filter(i => i.severity === 'high').length,
          medium: insights.filter(i => i.severity === 'medium').length,
          low: insights.filter(i => i.severity === 'low').length
        }
      });
      return sendResponse(res, insights, 'success', 'Learning insights retrieved successfully');
    } catch (error) {
      analyticsControllerLogger.error('Failed to get learning insights', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get learning insights', 500);
    }
  },

  async getLearningDashboard(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    analyticsControllerLogger.debug('Get learning dashboard request received', { userId });
    
    try {
      const dashboard = await analyticsService.getLearningDashboard(userId);

      analyticsControllerLogger.debug('Learning dashboard retrieved successfully', { 
        userId,
        componentsLoaded: {
          velocity: dashboard.velocity.length,
          difficultCards: dashboard.difficultCards.length,
          insights: dashboard.insights.length,
          summary: dashboard.summary
        }
      });
      return sendResponse(res, dashboard, 'success', 'Learning dashboard retrieved successfully');
    } catch (error) {
      analyticsControllerLogger.error('Failed to get learning dashboard', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get learning dashboard', 500);
    }
  }
}; 