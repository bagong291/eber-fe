import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Package, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Loader2
} from 'lucide-react';

// Optimized Statistics Card Component
interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  color?: string;
  isLoading?: boolean;
}

export const StatsCard = memo<StatsCardProps>(({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = 'text-muted-foreground',
  isLoading = false 
}) => (
  <Card className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${color} transition-colors duration-200`} />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-500 animate-pulse">Loading...</span>
        </div>
      ) : (
        <>
          <div className={`text-2xl font-bold transition-all duration-300 ${
            color.includes('red') ? 'text-red-600' : 
            color.includes('green') ? 'text-green-600' : 
            'hover:scale-110'
          }`}>
            {value}
          </div>
          <p className="text-xs text-muted-foreground transition-opacity duration-200">{description}</p>
        </>
      )}
    </CardContent>
  </Card>
));

StatsCard.displayName = 'StatsCard';

// Optimized Top Products Component
interface TopProductsProps {
  products: Array<{ productCode: string; count: number }>;
  isLoading?: boolean;
}

export const TopProducts = memo<TopProductsProps>(({ products, isLoading }) => {
  const topProductsList = useMemo(() => 
    products.map((product, index) => (
      <div 
        key={product.productCode} 
        className="flex items-center justify-between p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 hover:scale-102"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-500">
            {index === 0 && '🥇'}
            {index === 1 && '🥈'}
            {index === 2 && '🥉'}
            {index > 2 && `#${index + 1}`}
          </div>
          <div>
            <p className="font-medium font-mono text-sm" title={product.productCode}>
              {product.productCode}
            </p>
          </div>
        </div>
        <Badge 
          variant="secondary"
          className="transition-all duration-200 hover:scale-110"
        >
          {product.count} requests
        </Badge>
      </div>
    )), [products]);

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          🏆 Top Requested Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }}></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-shimmer" style={{ animationDelay: `${i * 0.1 + 0.05}s` }}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {products.length ? (
              topProductsList
            ) : (
              <p className="text-gray-500 text-center py-4">
                📋 No product requests yet
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TopProducts.displayName = 'TopProducts';

// Optimized Recent Requests Component
interface RecentRequestsProps {
  requests: Array<{
    id: string;
    email: string;
    productCode: string;
    status: 'sent' | 'failed';
    createdAt: string;
  }>;
  isLoading?: boolean;
  formatDate: (dateString: string) => string;
}

export const RecentRequests = memo<RecentRequestsProps>(({ requests, isLoading, formatDate }) => {
  const recentRequestsList = useMemo(() => 
    requests.map((request, index) => (
      <div 
        key={request.id} 
        className="flex items-center justify-between border-b pb-2 p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 hover:border-gray-300"
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <div>
          <p className="font-medium text-sm flex items-center gap-1">
            📧 {request.email}
          </p>
          <p className="text-xs text-gray-500 font-mono flex items-center gap-1">
            <Package className="h-3 w-3" />
            {request.productCode}
          </p>
          <p className="text-xs text-gray-400">
            🕐 {formatDate(request.createdAt)}
          </p>
        </div>
        <Badge 
          variant={request.status === 'sent' ? 'secondary' : 'destructive'}
          className="transition-all duration-200 hover:scale-110"
        >
          {request.status === 'sent' ? '✅ Sent' : '❌ Failed'}
        </Badge>
      </div>
    )), [requests, formatDate]);

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-600" />
          🕐 Recent Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }}></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 animate-shimmer" style={{ animationDelay: `${i * 0.1 + 0.05}s` }}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {requests.length ? (
              recentRequestsList
            ) : (
              <p className="text-gray-500 text-center py-4">
                📋 No recent requests
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

RecentRequests.displayName = 'RecentRequests';

// Optimized Header Component
interface AnalyticsHeaderProps {
  emailServiceConnected?: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const AnalyticsHeader = memo<AnalyticsHeaderProps>(({ 
  emailServiceConnected, 
  onRefresh, 
  isRefreshing = false 
}) => (
  <div className="flex justify-between items-center">
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        📧 Product Email API Analytics
      </h1>
      <p className="text-sm text-gray-600 mt-1">Monitor and manage product email requests</p>
    </div>
    <div className="flex items-center gap-4">
      {emailServiceConnected !== undefined && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 transition-all duration-200 hover:bg-gray-100">
          <div className={`h-3 w-3 rounded-full transition-all duration-300 ${
            emailServiceConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="text-sm font-medium">
            SMTP: {emailServiceConnected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </div>
      )}
      <Button 
        onClick={onRefresh} 
        variant="outline" 
        size="sm" 
        disabled={isRefreshing}
        className="transition-all duration-200 hover:scale-105"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  </div>
));

AnalyticsHeader.displayName = 'AnalyticsHeader';

// Optimized Statistics Grid Component
interface StatisticsGridProps {
  stats: {
    totalRequests: number;
    successfulEmails: number;
    failedEmails: number;
    successRate: number;
  };
  isLoading?: boolean;
}

export const StatisticsGrid = memo<StatisticsGridProps>(({ stats, isLoading }) => {
  const statisticsCards = useMemo(() => [
    {
      title: 'Total Requests',
      value: stats.totalRequests || 0,
      description: 'All product email requests',
      icon: Mail,
      color: 'text-muted-foreground'
    },
    {
      title: 'Successful Emails',
      value: stats.successfulEmails || 0,
      description: 'Successfully sent emails',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Failed Emails',
      value: stats.failedEmails || 0,
      description: 'Failed email deliveries',
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate || 0}%`,
      description: 'Email delivery success rate',
      icon: TrendingUp,
      color: stats.successRate >= 90 ? 'text-green-600' : stats.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'
    }
  ], [stats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statisticsCards.map((card) => (
        <StatsCard
          key={card.title}
          title={card.title}
          value={card.value}
          description={card.description}
          icon={card.icon}
          color={card.color}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
});

StatisticsGrid.displayName = 'StatisticsGrid';

// Optimized API Information Component
export const ApiInformation = memo(() => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        API Information
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-semibold">Product Email Endpoint</h4>
          <p className="text-sm text-gray-600 font-mono">
            POST /api/v1/form-submissions/send-product-email
          </p>
          <p className="text-xs text-gray-500">
            Public endpoint for sending product information emails
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold">Request Format</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded">
{`{
  "email": "user@example.com",
  "product_code": "EBA 1261-70 T 3"
}`}
          </pre>
        </div>
      </div>
    </CardContent>
  </Card>
));

ApiInformation.displayName = 'ApiInformation';