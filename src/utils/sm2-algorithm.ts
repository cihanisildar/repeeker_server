/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on the original SuperMemo SM-2 algorithm by Piotr Wozniak
 */

export interface SM2Result {
  interval: number;
  easeFactor: number;
  consecutiveCorrect: number;
}

export interface SM2Card {
  interval: number;
  easeFactor: number;
  consecutiveCorrect: number;
}

/**
 * Calculate next review interval using SM-2 algorithm
 * @param card Current card state
 * @param quality Response quality (0-5 scale: 0=total blackout, 5=perfect response)  
 * @returns New interval, ease factor, and consecutive correct count
 */
export function calculateSM2(card: SM2Card, quality: number): SM2Result {
  // Validate quality parameter
  quality = Math.max(0, Math.min(5, Math.round(quality)));
  
  let { interval, easeFactor, consecutiveCorrect } = card;
  
  // If quality < 3, the answer was incorrect
  if (quality < 3) {
    // Reset consecutive correct answers
    consecutiveCorrect = 0;
    // Set interval to 1 day for failed cards
    interval = 1;
    // Decrease ease factor for failed responses
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // Correct answer - increment consecutive correct count
    consecutiveCorrect++;
    
    // Calculate new interval based on consecutive correct answers
    if (consecutiveCorrect === 1) {
      interval = 1;
    } else if (consecutiveCorrect === 2) {
      interval = 6;
    } else {
      // For subsequent reviews, multiply previous interval by ease factor
      interval = Math.round(interval * easeFactor);
    }
    
    // Update ease factor based on response quality
    const qualityFactor = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    easeFactor = Math.max(1.3, easeFactor + qualityFactor);
  }
  
  // Ensure reasonable limits
  interval = Math.max(1, Math.min(interval, 365 * 2)); // Max 2 years
  easeFactor = Math.max(1.3, Math.min(easeFactor, 3.0)); // Reasonable bounds
  
  return {
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    consecutiveCorrect
  };
}

/**
 * Convert boolean success and optional quality to SM-2 quality scale
 * @param isSuccess Whether the answer was correct
 * @param responseQuality Optional quality rating (0-3: Again, Hard, Good, Easy)
 * @returns Quality on 0-5 SM-2 scale
 */
export function convertToSM2Quality(isSuccess: boolean, responseQuality?: number): number {
  if (!isSuccess) {
    return 0; // Total failure
  }
  
  // Map response quality to SM-2 scale
  switch (responseQuality) {
    case 0: return 0; // Again (shouldn't happen with isSuccess=true, but handle it)
    case 1: return 3; // Hard - correct but difficult
    case 2: return 4; // Good - correct with normal difficulty  
    case 3: return 5; // Easy - perfect recall
    default: return 4; // Default to "Good" if not specified
  }
}

/**
 * Get human-readable description of quality levels
 */
export const QUALITY_DESCRIPTIONS = {
  0: 'Complete blackout',
  1: 'Incorrect but remembered when shown answer',
  2: 'Incorrect but seemed easy on reflection',
  3: 'Correct but required significant effort',
  4: 'Correct after some hesitation',
  5: 'Perfect recall - effortless and quick'
} as const;

/**
 * Get recommended quality based on response time and correctness
 * @param isCorrect Whether the answer was correct
 * @param responseTimeMs Response time in milliseconds
 * @param expectedTimeMs Expected response time for this card difficulty
 * @returns Recommended quality level
 */
export function getRecommendedQuality(
  isCorrect: boolean, 
  responseTimeMs: number, 
  expectedTimeMs: number = 3000
): number {
  if (!isCorrect) return 0;
  
  const timeRatio = responseTimeMs / expectedTimeMs;
  
  if (timeRatio <= 0.5) return 5; // Very fast - easy
  if (timeRatio <= 1.0) return 4; // Normal speed - good
  if (timeRatio <= 2.0) return 3; // Slow - hard but correct
  return 2; // Very slow - barely correct
} 