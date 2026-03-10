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
}

export type CreateProductDto = Omit<Product, 'id'>;
export type UpdateProductDto = Partial<CreateProductDto>;

const AUTH_TOKEN_KEY = 'accessToken';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },
};

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const uploadClient = axios.create({
  baseURL: '/api',
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
  }): Promise<{ id: string; email: string; first_name: string; last_name: string }> => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  me: async (): Promise<{ id: string; email: string; first_name: string; last_name: string }> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
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
    const response = await apiClient.patch(`/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
