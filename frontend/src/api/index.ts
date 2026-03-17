import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  photo: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export type Role = 'user' | 'seller' | 'admin';

export interface MeResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  blocked?: boolean;
}

export interface User extends MeResponse {}

export type CreateProductDto = Omit<Product, 'id'>;
export type UpdateProductDto = Partial<CreateProductDto>;

const AUTH_ACCESS_KEY = 'accessToken';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(AUTH_ACCESS_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(AUTH_ACCESS_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(AUTH_ACCESS_KEY);
  },
};

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const uploadClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

const attachAuth = (config: InternalAxiosRequestConfig) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

apiClient.interceptors.request.use(attachAuth);
uploadClient.interceptors.request.use(attachAuth);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // If there's no access token at all, we are a "guest" — don't try refresh.
      if (!authStorage.getToken()) {
        return Promise.reject(error);
      }

      if (originalRequest.url?.includes('/auth/refresh')) {
        authStorage.clearToken();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const { accessToken: newAccess } = await refreshTokens();
        authStorage.setToken(newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        authStorage.clearToken();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

async function refreshTokens(): Promise<{ accessToken: string; refreshToken?: string }> {
  const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
    '/api/auth/refresh',
    {},
    {
      baseURL: '',
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    },
  );
  return data;
}

export const api = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: Role;
  }): Promise<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role?: Role;
    blocked?: boolean;
  }> => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  me: async (): Promise<MeResponse> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axios.post(
      '/api/auth/logout',
      {},
      {
        baseURL: '',
        withCredentials: true,
      },
    );
    authStorage.clearToken();
  },

  uploadPhoto: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await uploadClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (product: CreateProductDto): Promise<Product> => {
    const response = await apiClient.post('/products', product);
    return response.data;
  },

  updateProduct: async (
    id: string,
    product: UpdateProductDto,
  ): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  // admin only
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, patch: Partial<User> & { password?: string }): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, patch);
    return response.data;
  },

  blockUser: async (id: string): Promise<User> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};
