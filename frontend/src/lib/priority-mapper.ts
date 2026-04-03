/**
 * Priority Mapper
 * Converts between frontend (CRITICAL/MODERATE/STABLE) and backend (RED/YELLOW/GREEN) formats
 */

export type FrontendPriority = 'CRITICAL' | 'MODERATE' | 'STABLE';
export type BackendPriority = 'RED' | 'YELLOW' | 'GREEN';

/**
 * Convert frontend priority to database priority
 */
export function toDBPriority(frontendPriority: FrontendPriority): BackendPriority {
  const mapping: Record<FrontendPriority, BackendPriority> = {
    CRITICAL: 'RED',
    MODERATE: 'YELLOW',
    STABLE: 'GREEN',
  };

  return mapping[frontendPriority];
}

/**
 * Convert database priority to frontend priority
 */
export function toFrontendPriority(dbPriority: BackendPriority): FrontendPriority {
  const mapping: Record<BackendPriority, FrontendPriority> = {
    RED: 'CRITICAL',
    YELLOW: 'MODERATE',
    GREEN: 'STABLE',
  };

  return mapping[dbPriority] ?? 'STABLE';
}

/**
 * Get color class for priority (frontend format)
 */
export function getPriorityColor(priority: FrontendPriority): string {
  const colorMapping: Record<FrontendPriority, string> = {
    CRITICAL: 'red',
    MODERATE: 'yellow',
    STABLE: 'green',
  };

  return colorMapping[priority];
}

/**
 * Get display label for priority (frontend format)
 */
export function getPriorityLabel(priority: FrontendPriority): string {
  const labelMapping: Record<FrontendPriority, string> = {
    CRITICAL: 'Critical',
    MODERATE: 'Moderate',
    STABLE: 'Stable',
  };

  return labelMapping[priority];
}
