import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config/index.js';
import { log } from '../utils/logger.js';

export interface Issue {
  id: number;
  summary: string;
  description: string;
  status: {
    id: number;
    name: string;
  };
  project: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    name: string;
  };
  reporter: {
    id: number;
    name: string;
    email: string;
  };
  handler?: {
    id: number;
    name: string;
    email: string;
  };
  priority?: {
    id: number;
    name: string;
  };
  severity?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface IssueSearchParams {
  projectId?: number;
  statusId?: number;
  handlerId?: number;
  reporterId?: number;
  priority?: number;
  severity?: number;
  pageSize?: number;
  page?: number;
  search?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  real_name?: string;
  access_level?: {
    id: number;
    name: string;
  };
  enabled?: boolean;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  status: {
    id: number;
    name: string;
  };
}

export class MantisApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'MantisApiError';
  }
}

export class MantisApi {
  async getUserByUsername(username: string): Promise<User> {
    const cacheKey = `user_${username}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.data;
    }

    try {
      const response = await this.api.get(`/users/username/${encodeURIComponent(username)}`);
      const user = response.data;

      this.cache.set(cacheKey, {
        data: user,
        timestamp: Date.now()
      });

      return user;
    } catch (error) {
      if (error instanceof MantisApiError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new MantisApiError(`獲取用戶資訊失敗: ${error.message}`);
      }
      throw new MantisApiError('獲取用戶資訊失敗');
    }
  }
  private api: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor() {
    if (!config.MANTIS_API_URL) {
      log.error('未設置 Mantis API URL');
      throw new Error('未設置 Mantis API URL');
    }

    this.api = axios.create({
      baseURL: config.MANTIS_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.MANTIS_API_KEY && { 'Authorization': config.MANTIS_API_KEY }),
      },
    });

    log.info('已初始化 Mantis API 客戶端', {
      baseURL: config.MANTIS_API_URL,
      timeout: 10000,
      hasApiKey: !!config.MANTIS_API_KEY
    });

    // 添加請求攔截器用於錯誤處理
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const errorMessage = `API 錯誤: ${error.response.status} ${error.response.statusText}`;
          log.error(errorMessage, {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url
          });
          throw new MantisApiError(
            errorMessage,
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          const errorMessage = '未收到 API 響應';
          log.error(errorMessage, {
            url: error.config?.url,
            method: error.config?.method
          });
          throw new MantisApiError(errorMessage, 0);
        } else {
          const errorMessage = `請求錯誤: ${error.message}`;
          log.error(errorMessage, {
            url: error.config?.url,
            error: error.message
          });
          throw new MantisApiError(errorMessage);
        }
      }
    );
  }

  // 使用緩存包裝 API 調用
  private async cachedRequest<T>(
    key: string,
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<T> {
    if (config.CACHE_ENABLED) {
      const cachedData = this.cache.get(key);
      const now = Date.now();
      
      // 如果緩存有效並且未過期
      if (
        cachedData &&
        now - cachedData.timestamp < config.CACHE_TTL_SECONDS * 1000
      ) {
        log.debug('使用緩存數據', { key, age: (now - cachedData.timestamp) / 1000 });
        return cachedData.data;
      }
    }
    
    // 沒有緩存或緩存過期，執行請求
    log.debug('發送 API 請求', { key });
    const response = await requestFn();
    
    if (config.CACHE_ENABLED) {
      this.cache.set(key, {
        data: response.data,
        timestamp: Date.now(),
      });
      log.debug('更新緩存數據', { key });
    }
    
    return response.data;
  }

  // 獲取問題列表
  async getIssues(params: IssueSearchParams = {}): Promise<Issue[]> {
    log.info('獲取問題列表', { params });
    
    // 構建過濾 URL
    let filter = '';
    if (params.projectId) filter += `&project_id=${params.projectId}`;
    if (params.statusId) filter += `&status_id=${params.statusId}`;
    if (params.handlerId) filter += `&handler_id=${params.handlerId}`;
    if (params.reporterId) filter += `&reporter_id=${params.reporterId}`;
    if (params.priority) filter += `&priority=${params.priority}`;
    if (params.severity) filter += `&severity=${params.severity}`;
    if (params.search) filter += `&search=${encodeURIComponent(params.search)}`;
    
    const pageSize = params.pageSize || 50;
    const page = params.page ||1;
    
    const cacheKey = `issues-${filter}-${page}-${pageSize}`;
    
    const response = await this.cachedRequest<{issues: Issue[]}>(cacheKey, () => {
      return this.api.get(`/issues?page=${page}&pageSize=${pageSize}${filter}`);
    });

    return response.issues;
  }

  // 獲取單個問題詳情
  async getIssueById(issueId: number): Promise<Issue> {
    log.info('獲取問題詳情', { issueId });
    
    const cacheKey = `issue-${issueId}`;
    
    return this.cachedRequest<Issue>(cacheKey, () => {
      return this.api.get(`/issues/${issueId}`);
    });
  }

  // 獲取當前用戶信息
  async getCurrentUser(): Promise<User> {
    log.info('獲取當前用戶信息');
    
    const cacheKey = 'current-user';
    
    return this.cachedRequest<User>(cacheKey, () => {
      return this.api.get('/users/me');
    });
  }

  // 獲取指定用戶信息
  async getUser(userId: number): Promise<User> {
    log.info('獲取用戶信息', { userId });
    
    if (!userId) {
      throw new MantisApiError('必須提供用戶 ID');
    }
    
    const cacheKey = `user-${userId}`;
    
    return this.cachedRequest<User>(cacheKey, () => {
      return this.api.get(`/users/${userId}`);
    });
  }

  // 獲取項目列表
  async getProjects(): Promise<Project[]> {
    log.info('獲取項目列表');
    
    const cacheKey = 'projects';
    
    return this.cachedRequest<Project[]>(cacheKey, () => {
      return this.api.get('/projects');
    });
  }

  // 清除緩存
  clearCache() {
    log.info('清除 API 緩存');
    this.cache.clear();
  }
}

// 創建單例實例
export const mantisApi = new MantisApi();

export default mantisApi; 