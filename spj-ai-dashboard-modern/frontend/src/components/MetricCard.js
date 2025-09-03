import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  format = 'number',
  className = '' 
}) => {
  const formatValue = (val) => {
    if (format === 'percentage') {
      return `${val}%`;
    }
    if (format === 'currency') {
      return `₹${val.toLocaleString()}`;
    }
    if (format === 'decimal') {
      return val.toFixed(2);
    }
    return val.toLocaleString();
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return <TrendingUp className="h-4 w-4" />;
    if (changeType === 'negative') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success-600';
    if (changeType === 'negative') return 'text-error-600';
    return 'text-gray-500';
  };

  return (
    <div className={`metric-card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="metric-label">{title}</p>
          <p className="metric-value">{formatValue(value)}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="ml-1 text-sm font-medium">
                {change > 0 ? '+' : ''}{formatValue(change)}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
