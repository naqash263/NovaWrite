export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  posts_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  category_id: number;
  user_id: number;
  published_at?: string;
  is_published: boolean;
  views: number;
  meta_description?: string;
  meta_keywords?: string;
  category?: Category;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: number;
  name: string;
  original_name: string;
  path: string;
  mime_type: string;
  size: number;
  is_public: boolean;
  downloads: number;
  user_id: number;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
