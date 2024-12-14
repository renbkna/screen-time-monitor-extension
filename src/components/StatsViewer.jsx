import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'recharts';
import { processDailyStats, processWeeklyStats, processCategoryStats, formatTimeForDisplay } from '../statistics/stats-processor';

const StatsViewer = () => {
  const [timeRange, setTimeRange] = useState('daily');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
    // Set up auto-refresh every minute
    const intervalId = setInterval(loadStats, 60000);
    return () => clearInterval(intervalId);
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { dailyStats } = await chrome.storage.local.get('dailyStats');
      if (!dailyStats) {
        setStats(null);
        return;
      }

      const processedStats = timeRange === 'daily' ?
        await processDailyStats(dailyStats) :
        await processWeeklyStats(dailyStats);

      const categoryStats = await processCategoryStats(dailyStats);
      
      setStats({
        ...processedStats,
        categoryData: categoryStats.categoryData
      });
    } catch (err) {
      setError('Error loading statistics');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg">
        <h3 className="text-red-600 font-semibold mb-2">Error Loading Statistics</h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <h3 className="text-gray-600 font-semibold mb-2">No Usage Data Available</h3>
        <p className="text-gray-500">Start browsing to collect usage statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Usage Statistics</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('daily')}
            className={`px-4 py-2 rounded ${timeRange === 'daily' ? 
              'bg-blue-500 text-white' : 
              'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Daily
          </button>
          <button
            onClick={() => setTimeRange('weekly')}
            className={`px-4 py-2 rounded ${timeRange === 'weekly' ? 
              'bg-blue-500 text-white' : 
              'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Total Time</h3>
          <div className="text-2xl font-semibold text-blue-600">
            {formatTimeForDisplay(timeRange === 'daily' ? stats.totalTime : stats.weeklyTotal)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Most Visited Site</h3>
          <div className="text-2xl font-semibold text-blue-600">
            {stats.topSites[0]?.domain || 'No data'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 mb-1">Total Visits</h3>
          <div className="text-2xl font-semibold text-blue-600">
            {stats.topSites.reduce((sum, site) => sum + site.visits, 0)}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Distribution Chart */}
        {timeRange === 'daily' && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Hourly Distribution</h3>
            <div className="h-64">
              <Bar
                data={stats.hourlyDistribution.map((value, hour) => ({
                  hour: `${hour}:00`,
                  value
                }))}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <XAxis dataKey="hour" />
                <YAxis tickFormatter={(value) => formatTimeForDisplay(value)} />
                <Bar dataKey="value" fill="#3B82F6" />
              </Bar>
            </div>
          </div>
        )}

        {/* Top Sites Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Top Sites</h3>
          <div className="h-64">
            <Bar
              data={stats.topSites.slice(0, 5)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <XAxis type="number" tickFormatter={(value) => formatTimeForDisplay(value)} />
              <YAxis type="category" dataKey="domain" width={80} />
              <Bar dataKey="timeSpent" fill="#3B82F6" />
            </Bar>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Category Distribution</h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: stats.categoryData.map(cat => cat.category),
                datasets: [{
                  data: stats.categoryData.map(cat => cat.timeSpent),
                  backgroundColor: [
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                    '#6366F1', '#EC4899', '#8B5CF6', '#6B7280'
                  ]
                }]
              }}
              options={{
                plugins: {
                  legend: {
                    position: 'right'
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${formatTimeForDisplay(value)} (${percentage}%)`;
                      }
                    }
                  }
                },
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>

        {/* Time Trend Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {timeRange === 'daily' ? 'Today\'s Trend' : 'Weekly Trend'}
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: timeRange === 'daily' 
                  ? stats.hourlyDistribution.map((_, i) => `${i}:00`)
                  : stats.days,
                datasets: [{
                  label: 'Time Spent',
                  data: timeRange === 'daily'
                    ? stats.hourlyDistribution
                    : stats.dailyTotals,
                  fill: false,
                  borderColor: '#3B82F6',
                  tension: 0.1
                }]
              }}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: value => formatTimeForDisplay(value)
                    }
                  }
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: (context) => formatTimeForDisplay(context.raw)
                    }
                  }
                },
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Detailed Statistics</h3>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.topSites.map((site, index) => (
              <tr key={site.domain} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.domain}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTimeForDisplay(site.timeSpent)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.visits}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(site.lastVisit).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsViewer;