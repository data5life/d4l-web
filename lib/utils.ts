import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SENSORHUB_BASE_PATH } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveSensorhubUrl(resourcePath: string): string {
  const cleanPath = resourcePath.startsWith('/') ? resourcePath.slice(1) : resourcePath;

  // Server-side environment
  if (typeof window === 'undefined') {
    if (!SENSORHUB_BASE_PATH) {
      throw new Error('Internal Server Error: SENSORHUB_URL environment variable is missing.');
    }
    return `${SENSORHUB_BASE_PATH}/${cleanPath}`;
  }

  // Client-side environment
  return `/api/sensorhub/${cleanPath}`;
}
