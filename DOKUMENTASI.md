# Admin Eber - Dokumentasi Proyek

## Overview

Admin Eber adalah aplikasi dashboard administrasi berbasis React yang digunakan untuk mengelola konten website company profile Eber Group. Aplikasi ini terhubung dengan backend API (`company-profile-api`) untuk melakukan operasi CRUD (Create, Read, Update, Delete) pada berbagai entitas data.

---

## Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | React 18.3.1 |
| Build Tool | Vite 5.4.1 |
| Language | TypeScript 5.5.3 |
| Styling | Tailwind CSS 3.4.11 |
| UI Components | Radix UI + shadcn/ui |
| State Management | Zustand 5.0.6 |
| Data Fetching | TanStack Query (React Query) 5.56.2 |
| HTTP Client | Axios 1.10.0 |
| Routing | React Router DOM 6.26.2 |
| Forms | React Hook Form 7.53.0 |
| Validation | Zod 3.23.8 |
| Icons | Lucide React 0.462.0 |
| Toast Notifications | Sonner 1.5.0 |
| Rich Text Editor | React Quill 2.0.0 |

---

## Struktur Folder

```
admin-eber/
├── public/                 # Static assets
├── src/
│   ├── app/               # App-level configurations
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components (52 items)
│   │   ├── AdminLayout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── DataTable.tsx
│   │   ├── MultiLanguageInput.tsx
│   │   ├── WysiwygEditor.tsx
│   │   └── ...
│   ├── config/            # Configuration files
│   ├── containers/        # Container components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   │   ├── use-toast.ts
│   │   ├── useApiData.ts
│   │   ├── useDashboard.ts
│   │   └── ...
│   ├── lib/               # Utility libraries
│   │   └── utils.ts       # cn() helper for Tailwind
│   ├── pages/             # Page components
│   │   ├── Index.tsx      # Landing page
│   │   ├── Login.tsx      # Login page
│   │   ├── NotFound.tsx   # 404 page
│   │   └── admin/         # Admin dashboard pages
│   │       ├── Dashboard.tsx
│   │       ├── Products.tsx
│   │       ├── Articles.tsx
│   │       ├── Careers.tsx
│   │       ├── Certificates.tsx
│   │       ├── CompanyTopProducts.tsx
│   │       ├── FormSubmissions.tsx
│   │       ├── ProductEmailAnalytics.tsx
│   │       └── ...
│   ├── services/          # API services
│   │   ├── api.ts         # Generic API service
│   │   ├── apiClient.ts   # Axios instance
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── articles/
│   │   ├── career/
│   │   ├── certificates/
│   │   ├── topProducts/
│   │   ├── companyTopProducts/
│   │   ├── formSubmissionsApi.ts
│   │   ├── corporateApi.ts
│   │   └── adminCompanyProfileApi.ts
│   ├── store/             # Zustand stores
│   │   ├── authStore.ts   # Authentication state
│   │   └── dataStore.ts   # Data entities state
│   ├── styles/            # Global styles
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global CSS
├── .env                   # Environment variables
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

---

## Konfigurasi Environment

File `.env`:

```env
# Production API
# VITE_API_URL=https://fish.ebergroup.com/api/v1
# VITE_IMAGE_URL=https://fish.ebergroup.com

# Development API
VITE_API_URL=http://localhost:3022/api/v1
VITE_IMAGE_URL=http://localhost:3022

# Feature flags
VITE_ENABLE_DELETE_ALL_PRODUCTS=false
```

**Catatan**: Semua variabel environment untuk Vite harus diawali dengan `VITE_`

---

## Routing

Aplikasi menggunakan React Router DOM dengan struktur routing sebagai berikut:

```
/                    → Index (Landing Page)
/login               → Login Page
/admin               → Dashboard (Protected)
/admin/hero-banners          → Hero Banners Management
/admin/about-us              → About Us Management
/admin/corporate-entities    → Corporate Entities Management
/admin/company-profiles-admin → Company Profiles Management
/admin/certifications        → Certifications Management
/admin/product-categories    → Product Categories Management
/admin/products              → Products Management
/admin/top-products          → Top Products (Legacy)
/admin/company-top-products  → Company Top Products
/admin/articles              → Articles Management
/admin/careers               → Careers Management
/admin/applications          → Job Applications
/admin/form-submissions      → Form Submissions
/admin/product-email-analytics → Product Email Analytics
/admin/certificates          → Certificates Management
/admin/contact-info          → Contact Info Management
/*                   → Not Found (404)
```

---

## State Management

### Auth Store (`src/store/authStore.ts`)

Menggunakan Zustand dengan persist middleware untuk menyimpan data login.

```typescript
interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  getToken: () => string | null;
  isLoggedIn: () => boolean;
}
```

Data disimpan di localStorage dengan key `admin-auth`.

### Data Store (`src/store/dataStore.ts`)

Menyimpan data entitas aplikasi dengan operasi CRUD generic.

**Entities:**
- HeroBanner
- AboutUs
- CorporateEntity
- Certification
- ProductCategory
- Product
- Article
- Career
- Application
- ContactInfo
- FormSubmission

---

## API Services

### Base API Client (`src/services/apiClient.ts`)

Axios instance dengan konfigurasi:
- Base URL dari `VITE_API_URL`
- Content-Type: application/json
- Automatic Bearer token injection via interceptor

### API Service Structure

Setiap modul memiliki struktur standar:

```typescript
// Contoh: productsApi.ts
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

export function listProducts(filter: ProductFilter, page: number, pageSize: number): Promise<ApiResponse<ProductsListData>>
export function createProduct(payload: ProductPayload): Promise<ApiResponse<Product>>
export function updateProduct(id: number, payload: ProductPayload): Promise<ApiResponse<Product>>
export function deleteProduct(id: number, payload: ProductPayload): Promise<ApiResponse<null>>
```

### Available API Modules

| Module | File | Description |
|--------|------|-------------|
| Auth | `login/loginApi.ts` | Login/logout |
| Dashboard | `dashboard/dashboardApi.ts` | Dashboard statistics |
| Products | `products/productsApi.ts` | Product CRUD, bulk upload |
| Articles | `articles/articlesApi.ts` | Article CRUD |
| Careers | `career/careerApi.ts` | Career/job postings CRUD |
| Certificates | `certificates/certificatesApi.ts` | Certificates management |
| Top Products | `topProducts/topProductsApi.ts` | Top products ranking |
| Company Top Products | `companyTopProducts/companyTopProductsApi.ts` | Company-specific top products |
| Form Submissions | `formSubmissionsApi.ts` | Form submission management |
| Corporate | `corporateApi.ts` | Corporate entities |
| Company Profiles | `adminCompanyProfileApi.ts` | Company profiles admin |

---

## Custom Hooks

### useApiData (`src/hooks/useApiData.ts`)

Generic hook untuk operasi CRUD pada data entities.

```typescript
function useApiData<T>(
  endpoint: string,
  apiService: { getAll, create, update, delete }
) => {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createItem: (data) => Promise<T>;
  updateItem: (id, data) => Promise<T>;
  deleteItem: (id) => Promise<boolean>;
}
```

### useDashboard (`src/hooks/useDashboard.ts`)

Hook untuk mengambil data dashboard.

```typescript
function useDashboard() => {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}
```

### useProductEmailAnalytics (`src/hooks/useProductEmailAnalytics.ts`)

Hook untuk analytics email produk.

### useProductEmailExport (`src/hooks/useProductEmailExport.ts`)

Hook untuk export data email produk.

---

## Components

### Layout Components

| Component | File | Description |
|-----------|------|-------------|
| AdminLayout | `AdminLayout.tsx` | Main admin layout with sidebar |
| ProtectedRoute | `ProtectedRoute.tsx` | Route guard for authenticated users |

### UI Components (shadcn/ui)

Tersedia 52+ UI components di `src/components/ui/`:
- Button, Card, Dialog, Dropdown Menu
- Form, Input, Label, Select
- Table, Tabs, Toast, Tooltip
- Dan banyak lagi

### Feature Components

| Component | File | Description |
|-----------|------|-------------|
| DataTable | `DataTable.tsx` | Reusable data table with sorting, filtering |
| MultiLanguageInput | `MultiLanguageInput.tsx` | Input dengan support EN/ID |
| WysiwygEditor | `WysiwygEditor.tsx` | Rich text editor (React Quill) |
| VirtualizedRequestsTable | `VirtualizedRequestsTable.tsx` | Virtualized table for large datasets |
| ProductFilters | `ProductFilters.tsx` | Filter component for products |
| ArticleFilters | `ArticleFilters.tsx` | Filter component for articles |
| CareerFilters | `CareerFilters.tsx` | Filter component for careers |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 8080) |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## Multi-Language Support

Aplikasi mendukung konten bilingual (English & Indonesia). Pattern yang digunakan:

```typescript
// Setiap field yang mendukung multi-language memiliki suffix _en dan _id
interface Product {
  application_en: string;
  application_id: string;
  performanceFeature_en: string;
  performanceFeature_id: string;
}
```

Component `MultiLanguageInput` digunakan untuk mengelola input bilingual.

---

## Authentication Flow

1. User mengakses `/login`
2. Submit username & password ke `/auth/login`
3. Token disimpan di Zustand store + localStorage
4. `apiClient` secara otomatis menambahkan Bearer token ke setiap request
5. `ProtectedRoute` memeriksa auth state untuk mengakses halaman admin
6. Logout menghapus data dari store dan localStorage

---

## Key Features

### 1. Product Management
- CRUD products dengan multi-language
- Bulk upload via CSV
- Filter by type, application, segment, etc.
- Pagination

### 2. Article Management
- CRUD articles dengan multi-language
- Image upload (base64)
- PDF upload
- Publish/draft status

### 3. Career Management
- CRUD job postings
- Multi-language job descriptions
- Active/closed status

### 4. Form Submissions
- View form submissions (Instant Access, Contact Form, Product Email)
- Resend auto-response email
- Send custom response
- Export data

### 5. Company Top Products
- Manage top products per company
- Drag-drop ranking
- Product selection

### 6. Certificates
- Upload certificate images
- Status management

### 7. Dashboard Analytics
- Statistics overview
- Recent articles
- Active careers

---

## Development Guidelines

### Menambah API Service Baru

1. Buat folder baru di `src/services/{module}/`
2. Buat file `{module}Api.ts`
3. Definisikan interface dan API functions
4. Gunakan pattern `handleRequest` untuk error handling

### Menambah Halaman Baru

1. Buat component di `src/pages/admin/{PageName}.tsx`
2. Tambah route di `App.tsx`
3. Tambah menu item di `AdminLayout.tsx` (jika perlu)

### Menggunakan Zustand Store

```typescript
import { useAuthStore } from '@/store/authStore';

const { user, login, logout, getToken } = useAuthStore();
```

### Menggunakan API

```typescript
import { listProducts, createProduct } from '@/services/products/productsApi';

const response = await listProducts(filter, page, pageSize);
if (response.success) {
  // handle success
}
```

---

## Docker Support

Tersedia Dockerfile untuk containerization:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## Troubleshooting

### CORS Issues
Pastikan backend API mengizinkan origin frontend.

### Token Expired
Logout dan login kembali untuk mendapatkan token baru.

### Build Errors
- Hapus `node_modules` dan `package-lock.json`
- Jalankan `npm install` ulang
- Periksa TypeScript errors dengan `npm run lint`

---

## Related Projects

- **EberFE** - Frontend company profile website (Next.js)
- **company-profile-api** - Backend API (Node.js/Express)

---

## License

Private - Eber Group Internal Use
