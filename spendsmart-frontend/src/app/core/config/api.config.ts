import { environment } from '../../../environments/environment';

const baseUrl = environment.apiBaseUrl;

export const apiConfig = {
  baseUrl,
  auth:          `${baseUrl}/auth`,
  categories:    `${baseUrl}/categories`,
  expenses:      `${baseUrl}/expenses`,
  incomes:       `${baseUrl}/incomes`,
  budgets:       `${baseUrl}/budgets`,
  recurring:     `${baseUrl}/recurring`,
  notifications: `${baseUrl}/notifications`,
  analytics:     `${baseUrl}/analytics`,
} as const;