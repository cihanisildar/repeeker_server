import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/error.middleware';
import { createModuleLogger } from '../utils/logger';

const streakLogger = createModuleLogger('STREAK');

export const streakService = {
  async getStreak(userId: string) {
    streakLogger.debug('Fetching user streak', { userId });
    
    try {
      const user = await userRepository.findByIdOrGoogleId(userId);
      
      if (!user) {
        streakLogger.warn('User not found for streak lookup', { userId });
        throw new AppError(404, 'User not found');
      }

      const streakData = {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastReviewDate: user.lastReviewDate
      };

      streakLogger.debug('User streak fetched successfully', { userId, ...streakData });
      return streakData;
    } catch (error) {
      streakLogger.error('Failed to fetch user streak', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async updateStreak(userId: string) {
    streakLogger.info('Updating user streak', { userId });
    
    try {
      const user = await userRepository.findByIdOrGoogleId(userId);
      
      if (!user) {
        streakLogger.warn('User not found for streak update', { userId });
        throw new AppError(404, 'User not found');
      }

      const now = new Date();
      const lastReview = user.lastReviewDate;
      let { currentStreak, longestStreak } = user;

      const daysSinceLastReview = lastReview ? daysBetween(lastReview, now) : null;
      
      streakLogger.debug('Calculating streak update', { 
        userId, 
        lastReviewDate: lastReview,
        daysSinceLastReview,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak
      });

      // Check if this is the first review or if the streak is broken
      if (!lastReview || daysBetween(lastReview, now) > 1) {
        currentStreak = 1;
        streakLogger.debug('Streak reset to 1', { userId, reason: !lastReview ? 'first_review' : 'streak_broken' });
      } else if (daysBetween(lastReview, now) === 1) {
        // Increment streak if review is on consecutive day
        currentStreak += 1;
        streakLogger.debug('Streak incremented', { userId, newStreak: currentStreak });
      }
      // If review is on the same day, keep current streak

      // Update longest streak if current streak is longer
      const previousLongest = longestStreak;
      longestStreak = Math.max(currentStreak, longestStreak);
      
      if (longestStreak > previousLongest) {
        streakLogger.info('New longest streak achieved', { userId, newLongestStreak: longestStreak, previousLongest });
      }

      // Update user streak data
      const updatedUser = await userRepository.update(user.id, {
        currentStreak,
        longestStreak,
        lastReviewDate: now,
        streakUpdatedAt: now
      });

      const result = {
        currentStreak: updatedUser.currentStreak,
        longestStreak: updatedUser.longestStreak,
        lastReviewDate: updatedUser.lastReviewDate
      };

      streakLogger.info('User streak updated successfully', { userId, ...result });
      return result;
    } catch (error) {
      streakLogger.error('Failed to update user streak', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
};

// Helper function to calculate days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round(Math.abs((d1.getTime() - d2.getTime()) / oneDay));
} 