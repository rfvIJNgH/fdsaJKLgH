import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ChartProps {
  title: string;
  data: DataPoint[];
  type: 'bar' | 'line' | 'pie';
  height?: number;
}

const Chart: React.FC<ChartProps> = ({ title, data, type, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  const renderBarChart = () => (
    <div className="flex items-end space-x-2 h-full">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-primary-500 rounded-t-lg transition-all duration-300 hover:bg-primary-400"
            style={{ 
              height: `${(item.value / maxValue) * 80}%`,
              minHeight: '8px'
            }}
          />
          <span className="text-xs text-gray-400 mt-2 text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => {
    const points = data.map((item, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: 100 - (item.value / maxValue) * 80
    }));

    const pathData = points.reduce((path, point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${path} ${command} ${point.x} ${point.y}`;
    }, '');

    return (
      <div className="relative h-full">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${pathData} L 100 100 L 0 100 Z`}
            fill="url(#lineGradient)"
          />
          <path
            d={pathData}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="rgb(59, 130, 246)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-400">
          {data.map((item, index) => (
            <span key={index}>{item.label}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    return (
      <div className="flex items-center space-x-6">
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {data.map((item, index) => {
              const percentage = item.value / total;
              const angle = percentage * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              
              const startX = 60 + 50 * Math.cos((startAngle - 90) * Math.PI / 180);
              const startY = 60 + 50 * Math.sin((startAngle - 90) * Math.PI / 180);
              const endX = 60 + 50 * Math.cos((endAngle - 90) * Math.PI / 180);
              const endY = 60 + 50 * Math.sin((endAngle - 90) * Math.PI / 180);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              const color = item.color || `hsl(${index * 60}, 70%, 60%)`;
              
              currentAngle += angle;
              
              return (
                <path
                  key={index}
                  d={`M 60 60 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                  fill={color}
                  className="hover:opacity-80 transition-opacity"
                />
              );
            })}
          </svg>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 60%)` }}
              />
              <span className="text-sm text-gray-300">{item.label}</span>
              <span className="text-sm font-semibold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-dark-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div style={{ height: `${height}px` }}>
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
        {type === 'pie' && renderPieChart()}
      </div>
    </div>
  );
};

export default Chart;