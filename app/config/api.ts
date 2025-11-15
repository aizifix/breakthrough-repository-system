import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Base URL
const API_BASE_URL = 'http://localhost/repository-api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor (optional - for adding auth tokens, etc.)
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          // Add token if you have one
          // config.headers.Authorization = `Bearer ${userData.token}`;
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (optional - for handling errors globally)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear user data and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  user?: T;
  [key: string]: any;
}

export interface RegisterData {
  user_name: string;
  user_email: string;
  user_pwd: string;
  user_school: string;
  user_department: string;
  user_type?: string;
  user_contact?: string;
  user_address?: string;
  captcha?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  user_id: number;
  user_name: string;
  user_email: string;
  user_school?: string;
  user_department?: string;
  user_role: string;
  user_type?: string;
  user_contact?: string;
  user_address?: string;
  user_unique_id?: string;
}

// ============================================
// AUTH API
// ============================================

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/auth.php', {
    operation: 'register',
    ...data,
  });
  return response.data;
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<ApiResponse<User>> => {
  const response: AxiosResponse<ApiResponse<User>> = await apiClient.post('/auth.php', {
    operation: 'login',
    email: data.email,
    password: data.password,
  });
  return response.data;
};

/**
 * Logout user
 */
export const logout = async (userId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/auth.php', {
    operation: 'logout',
    user_id: userId,
  });
  return response.data;
};

/**
 * Get user profile by user ID
 */
export const getUserProfile = async (userId: number): Promise<ApiResponse<User>> => {
  const response: AxiosResponse<ApiResponse<User>> = await apiClient.post('/auth.php', {
    operation: 'get_user_profile',
    user_id: userId,
  });
  return response.data;
};

// ============================================
// PUBLISHER API
// ============================================

/**
 * Get publisher repositories
 */
export const getPublisherRepositories = async (userId?: number, currentUserId?: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/publisher.php', {
    operation: 'get_repositories',
    user_id: userId,
    current_user_id: currentUserId,
    userId: currentUserId,
  });
  return response.data;
};

/**
 * Create new repository
 */
export const createRepository = async (data: any): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/publisher.php', {
    operation: 'create_repository',
    ...data,
  });
  return response.data;
};

/**
 * Update repository
 */
export const updateRepository = async (repositoryId: number, data: any): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/publisher.php', {
    operation: 'update_repository',
    repository_id: repositoryId,
    ...data,
  });
  return response.data;
};

/**
 * Delete repository
 */
export const deleteRepository = async (repositoryId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/publisher.php', {
    operation: 'delete_repository',
    repository_id: repositoryId,
  });
  return response.data;
};

/**
 * Get saved repositories
 */
export const getSavedRepositories = async (userId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/publisher.php', {
    operation: 'get_saved_repositories',
    user_id: userId,
  });
  return response.data;
};

/**
 * Save repository
 */
export const saveRepository = async (userId: number, repositoryId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/publisher.php', {
    operation: 'save_repository',
    user_id: userId,
    repository_id: repositoryId,
  });
  return response.data;
};

/**
 * Unsave repository
 */
export const unsaveRepository = async (userId: number, repositoryId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/publisher.php', {
    operation: 'unsave_repository',
    user_id: userId,
    repository_id: repositoryId,
  });
  return response.data;
};

// ============================================
// ADMIN API
// ============================================

/**
 * Get all users
 */
export const getUsers = async (): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'get_users',
  });
  return response.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'get_user',
    user_id: userId,
  });
  return response.data;
};

/**
 * Update user
 */
export const updateUser = async (userId: number, data: any): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'update_user',
    user_id: userId,
    ...data,
  });
  return response.data;
};

/**
 * Delete user
 */
export const deleteUser = async (userId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'delete_user',
    user_id: userId,
  });
  return response.data;
};

/**
 * Verify or unverify user
 */
export const verifyUser = async (userId: number, isVerified: boolean): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'verify_user',
    user_id: userId,
    is_verified: isVerified,
  });
  return response.data;
};

/**
 * Get repositories for moderation
 */
export const getRepositoriesForModeration = async (): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'get_repositories_moderation',
  });
  return response.data;
};

/**
 * Approve repository
 */
export const approveRepository = async (repositoryId: number, publishedDate?: string): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'approve_repository',
    repository_id: repositoryId,
    published_date: publishedDate,
  });
  return response.data;
};

/**
 * Reject repository
 */
export const rejectRepository = async (repositoryId: number, reason?: string): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'reject_repository',
    repository_id: repositoryId,
    reason: reason,
  });
  return response.data;
};

/**
 * Unpublish repository
 */
export const unpublishRepository = async (repositoryId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'unpublish_repository',
    repository_id: repositoryId,
  });
  return response.data;
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'get_dashboard_stats',
  });
  return response.data;
};

/**
 * Get all publishers with their repositories
 */
export const getPublishers = async (): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'get_publishers',
  });
  return response.data;
};

// ============================================
// GENERAL API
// ============================================

/**
 * Get all repositories (public)
 */
export const getAllRepositories = async (filters?: any, userId?: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/general.php', {
    operation: 'get_repositories',
    ...filters,
    user_id: userId,
    userId: userId,
  });
  return response.data;
};

/**
 * Get repository by ID
 */
export const getRepositoryById = async (repositoryId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/general.php', {
    operation: 'get_repository',
    repository_id: repositoryId,
  });
  return response.data;
};

/**
 * Search repositories
 */
export const searchRepositories = async (query: string, filters?: any): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/general.php', {
    operation: 'search_repositories',
    query: query,
    ...filters,
  });
  return response.data;
};

// ============================================
// NOTIFICATIONS API
// ============================================

/**
 * Get user notifications
 */
export const getNotifications = async (userId: number, unreadOnly: boolean = false): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/notifications.php', {
    operation: 'get_notifications',
    user_id: userId,
    unread_only: unreadOnly,
  });
  return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/notifications.php', {
    operation: 'get_unread_count',
    user_id: userId,
  });
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: number, userId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/notifications.php', {
    operation: 'mark_as_read',
    notification_id: notificationId,
    user_id: userId,
  });
  return response.data;
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (userId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/notifications.php', {
    operation: 'mark_all_as_read',
    user_id: userId,
  });
  return response.data;
};

// ============================================
// ANNOUNCEMENTS API
// ============================================

/**
 * Get announcements
 * For published announcements (public), use general.php
 * For all announcements (admin), use admin.php
 */
export const getAnnouncements = async (publishedOnly: boolean = false): Promise<ApiResponse> => {
  // Use general.php for public published announcements, admin.php for admin operations
  const endpoint = publishedOnly ? '/general.php' : '/admin.php';
  const response: AxiosResponse<ApiResponse> = await apiClient.post(endpoint, {
    operation: 'get_announcements',
    published_only: publishedOnly,
  });
  return response.data;
};

/**
 * Create announcement
 */
export const createAnnouncement = async (data: {
  title: string;
  content: string;
  published: boolean;
  created_by: number;
}): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'create_announcement',
    ...data,
  });
  return response.data;
};

/**
 * Update announcement
 */
export const updateAnnouncement = async (announcementId: number, data: {
  title: string;
  content: string;
  published: boolean;
}): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'update_announcement',
    announcement_id: announcementId,
    ...data,
  });
  return response.data;
};

/**
 * Delete announcement
 */
export const deleteAnnouncement = async (announcementId: number): Promise<ApiResponse> => {
  const response: AxiosResponse<ApiResponse> = await apiClient.post('/admin.php', {
    operation: 'delete_announcement',
    announcement_id: announcementId,
  });
  return response.data;
};

// Export the axios instance for custom requests
export { apiClient };
export default apiClient;
