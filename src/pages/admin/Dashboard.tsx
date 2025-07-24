
import { useDashboard } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Image, 
  Building, 
  Award, 
  Package, 
  FileText, 
  Briefcase,
  Users,
  Phone,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const { dashboardData, loading, error, refreshData } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome to your admin dashboard</p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome to your admin dashboard</p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to your admin dashboard</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">No dashboard data available</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Hero Banners', count: dashboardData.stats.heroBanners.total, icon: Image, color: 'bg-blue-500' },
    { label: 'Corporate Entities', count: dashboardData.stats.corporateEntities.total, icon: Building, color: 'bg-green-500' },
    { label: 'Articles', count: dashboardData.stats.articles.total, icon: FileText, color: 'bg-red-500' },
    { label: 'Products', count: dashboardData.stats.products.total, icon: Package, color: 'bg-purple-500' },
    { label: 'Total Careers', count: dashboardData.stats.careers.total, icon: Users, color: 'bg-pink-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your admin dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.label}
              </CardTitle>
              <div className={`${stat.color} p-2 rounded-md`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>


    </div>
  );
};

export default Dashboard;
