
// API service functions - currently using dummy data, can be replaced with real API calls later

import { 
  HeroBanner, 
  AboutUs, 
  CorporateEntity, 
  Certification, 
  ProductCategory, 
  Product, 
  Article, 
  Career, 
  Application, 
  ContactInfo 
} from '@/store/dataStore';
const api_url = import.meta.env.VITE_API_URL;

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic API response type
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Generic CRUD API functions
export class ApiService {
  private static data: { [key: string]: any[] } = {
    heroBanners: [
      { id: '1', image: '/placeholder.svg', tagline: 'Innovation at its Best', title: 'Welcome to Our Platform' }
    ],
    aboutUs: [
      { 
        id: '1', 
        background: '<p>We are a leading company in our industry...</p>',
        vision: '<p>To be the global leader in innovation...</p>',
        mission: '<p>Our mission is to deliver exceptional value...</p>'
      }
    ],
    corporateEntities: [
      { id: '1', name: 'Main Office', logo: '/placeholder.svg', description: 'Our headquarters', location: 'New York, NY', capacity: '500 employees' },
      { id: '2', name: 'Research Lab', logo: '/placeholder.svg', description: 'R&D facility', location: 'Silicon Valley, CA', capacity: '100 employees' }
    ],
    certifications: [
      { id: '1', title: 'ISO 9001', image: '/placeholder.svg' },
      { id: '2', title: 'ISO 14001', image: '/placeholder.svg' }
    ],
    productCategories: [
      { id: '1', name: 'Software', slug: 'software' },
      { id: '2', name: 'Hardware', slug: 'hardware' }
    ],
    products: [
      { id: '1', name: 'Product A', categoryId: '1', image: '/placeholder.svg', pdfDatasheet: '/sample.pdf', description: 'High-quality software solution' },
      { id: '2', name: 'Product B', categoryId: '2', image: '/placeholder.svg', pdfDatasheet: '/sample2.pdf', description: 'Advanced hardware device' }
    ],
    articles: [
      { 
        id: '1', 
        title: 'Latest Industry Trends', 
        category: 'Technology', 
        thumbnail: '/placeholder.svg', 
        content: '<p>This is the article content...</p>',
        publishStatus: 'published',
        createdAt: '2024-01-15'
      }
    ],
    careers: [
      { 
        id: '1', 
        jobTitle: 'Software Engineer', 
        location: 'Remote', 
        type: 'full-time', 
        description: '<p>We are looking for a skilled software engineer...</p>',
        status: 'active'
      }
    ],
    applications: [
      {
        id: '1',
        careerId: '1',
        applicantName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        resume: '/resume.pdf',
        coverLetter: 'I am very interested in this position...',
        appliedAt: '2024-01-20'
      }
    ],
    contactInfo: [
      { id: '1', address: '123 Main St, New York, NY 10001', email: 'contact@company.com', phone: '+1 (555) 123-4567' }
    ]
  };

  static async getAll<T>(endpoint: string): Promise<ApiResponse<T[]>> {
    await delay(300); // Simulate network delay
    console.log(`API: Fetching all ${endpoint}`);
    
    const data = this.data[endpoint] || [];
    return {
      data: data as T[],
      success: true,
      message: `Successfully fetched ${endpoint}`
    };
  }

  static async getById<T>(endpoint: string, id: string): Promise<ApiResponse<T | null>> {
    await delay(200);
    console.log(`API: Fetching ${endpoint} with id ${id}`);
    
    const items = this.data[endpoint] || [];
    const item = items.find((item: any) => item.id === id);
    
    return {
      data: item as T || null,
      success: !!item,
      message: item ? `Successfully fetched ${endpoint}` : `${endpoint} not found`
    };
  }

  static async create<T extends { id?: string }>(endpoint: string, item: Omit<T, 'id'>): Promise<ApiResponse<T>> {
    await delay(400);
    console.log(`API: Creating ${endpoint}`, item);
    
    const newItem = {
      ...item,
      id: Date.now().toString()
    } as T;

    if (!this.data[endpoint]) {
      this.data[endpoint] = [];
    }
    
    this.data[endpoint].push(newItem);
    
    return {
      data: newItem,
      success: true,
      message: `Successfully created ${endpoint}`
    };
  }

  static async update<T extends { id: string }>(endpoint: string, id: string, updates: Partial<Omit<T, 'id'>>): Promise<ApiResponse<T | null>> {
    await delay(350);
    console.log(`API: Updating ${endpoint} with id ${id}`, updates);
    
    const items = this.data[endpoint] || [];
    const itemIndex = items.findIndex((item: any) => item.id === id);
    
    if (itemIndex === -1) {
      return {
        data: null,
        success: false,
        message: `${endpoint} not found`
      };
    }
    
    const updatedItem = { ...items[itemIndex], ...updates };
    this.data[endpoint][itemIndex] = updatedItem;
    
    return {
      data: updatedItem as T,
      success: true,
      message: `Successfully updated ${endpoint}`
    };
  }

  static async delete(endpoint: string, id: string): Promise<ApiResponse<boolean>> {
    await delay(300);
    console.log(`API: Deleting ${endpoint} with id ${id}`);
    
    const items = this.data[endpoint] || [];
    const itemIndex = items.findIndex((item: any) => item.id === id);
    
    if (itemIndex === -1) {
      return {
        data: false,
        success: false,
        message: `${endpoint} not found`
      };
    }
    
    this.data[endpoint].splice(itemIndex, 1);
    
    return {
      data: true,
      success: true,
      message: `Successfully deleted ${endpoint}`
    };
  }
}

// Specific API functions for each entity type
export const heroBannersApi = {
  getAll: () => ApiService.getAll<HeroBanner>('heroBanners'),
  getById: (id: string) => ApiService.getById<HeroBanner>('heroBanners', id),
  create: (data: Omit<HeroBanner, 'id'>) => ApiService.create<HeroBanner>('heroBanners', data),
  update: (id: string, data: Partial<Omit<HeroBanner, 'id'>>) => ApiService.update<HeroBanner>('heroBanners', id, data),
  delete: (id: string) => ApiService.delete('heroBanners', id)
};

export const aboutUsApi = {
  getAll: () => ApiService.getAll<AboutUs>('aboutUs'),
  getById: (id: string) => ApiService.getById<AboutUs>('aboutUs', id),
  create: (data: Omit<AboutUs, 'id'>) => ApiService.create<AboutUs>('aboutUs', data),
  update: (id: string, data: Partial<Omit<AboutUs, 'id'>>) => ApiService.update<AboutUs>('aboutUs', id, data),
  delete: (id: string) => ApiService.delete('aboutUs', id)
};

export const corporateEntitiesApi = {
  getAll: () => ApiService.getAll<CorporateEntity>('corporateEntities'),
  getById: (id: string) => ApiService.getById<CorporateEntity>('corporateEntities', id),
  create: (data: Omit<CorporateEntity, 'id'>) => ApiService.create<CorporateEntity>('corporateEntities', data),
  update: (id: string, data: Partial<Omit<CorporateEntity, 'id'>>) => ApiService.update<CorporateEntity>('corporateEntities', id, data),
  delete: (id: string) => ApiService.delete('corporateEntities', id)
};

export const certificationsApi = {
  getAll: () => ApiService.getAll<Certification>('certifications'),
  getById: (id: string) => ApiService.getById<Certification>('certifications', id),
  create: (data: Omit<Certification, 'id'>) => ApiService.create<Certification>('certifications', data),
  update: (id: string, data: Partial<Omit<Certification, 'id'>>) => ApiService.update<Certification>('certifications', id, data),
  delete: (id: string) => ApiService.delete('certifications', id)
};

export const productCategoriesApi = {
  getAll: () => ApiService.getAll<ProductCategory>('productCategories'),
  getById: (id: string) => ApiService.getById<ProductCategory>('productCategories', id),
  create: (data: Omit<ProductCategory, 'id'>) => ApiService.create<ProductCategory>('productCategories', data),
  update: (id: string, data: Partial<Omit<ProductCategory, 'id'>>) => ApiService.update<ProductCategory>('productCategories', id, data),
  delete: (id: string) => ApiService.delete('productCategories', id)
};

export const productsApi = {
  getAll: () => ApiService.getAll<Product>('products'),
  getById: (id: string) => ApiService.getById<Product>('products', id),
  create: (data: Omit<Product, 'id'>) => ApiService.create<Product>('products', data),
  update: (id: string, data: Partial<Omit<Product, 'id'>>) => ApiService.update<Product>('products', id, data),
  delete: (id: string) => ApiService.delete('products', id)
};

export const articlesApi = {
  getAll: () => ApiService.getAll<Article>('articles'),
  getById: (id: string) => ApiService.getById<Article>('articles', id),
  create: (data: Omit<Article, 'id'>) => ApiService.create<Article>('articles', data),
  update: (id: string, data: Partial<Omit<Article, 'id'>>) => ApiService.update<Article>('articles', id, data),
  delete: (id: string) => ApiService.delete('articles', id)
};

export const careersApi = {
  getAll: () => ApiService.getAll<Career>('careers'),
  getById: (id: string) => ApiService.getById<Career>('careers', id),
  create: (data: Omit<Career, 'id'>) => ApiService.create<Career>('careers', data),
  update: (id: string, data: Partial<Omit<Career, 'id'>>) => ApiService.update<Career>('careers', id, data),
  delete: (id: string) => ApiService.delete('careers', id)
};

export const applicationsApi = {
  getAll: () => ApiService.getAll<Application>('applications'),
  getById: (id: string) => ApiService.getById<Application>('applications', id),
  create: (data: Omit<Application, 'id'>) => ApiService.create<Application>('applications', data),
  update: (id: string, data: Partial<Omit<Application, 'id'>>) => ApiService.update<Application>('applications', id, data),
  delete: (id: string) => ApiService.delete('applications', id)
};

export const contactInfoApi = {
  getAll: () => ApiService.getAll<ContactInfo>('contactInfo'),
  getById: (id: string) => ApiService.getById<ContactInfo>('contactInfo', id),
  create: (data: Omit<ContactInfo, 'id'>) => ApiService.create<ContactInfo>('contactInfo', data),
  update: (id: string, data: Partial<Omit<ContactInfo, 'id'>>) => ApiService.update<ContactInfo>('contactInfo', id, data),
  delete: (id: string) => ApiService.delete('contactInfo', id)
};
