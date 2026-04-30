"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BrainCircuit, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ForecastData {
  date: string;
  actual: number;
  predicted?: number;
}

export function AiForecastChart() {
  const [data, setData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ avgActual: 0, avgPredicted: 0, trend: 'stable' as 'rising' | 'falling' | 'stable' });

  const fetchForecast = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/ai/forecast?type=overview&days=60&forecast=14');
      if (!res.ok) {
        console.warn('Forecast unavailable (' + res.status + ')');
        return;
      }
      const json = await res.json();
      const forecastData: ForecastData[] = json.data || [];
      setData(forecastData);

      const actuals = forecastData.filter(d => d.actual > 0).map(d => d.actual);
      const predicted = forecastData.filter(d => d.predicted !== undefined).map(d => d.predicted!);
      const avgActual = actuals.length > 0 ? actuals.reduce((a, b) => a + b, 0) / actuals.length : 0;
      const avgPredicted = predicted.length > 0 ? predicted.reduce((a, b) => a + b, 0) / predicted.length : 0;

      const recent = actuals.slice(-7);
      const prev = actuals.slice(-14, -7);
      const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
      const prevAvg = prev.length > 0 ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
      let trend: 'rising' | 'falling' | 'stable' = 'stable';
      if (prevAvg > 0) {
        const change = ((recentAvg - prevAvg) / prevAvg) * 100;
        if (change > 10) trend = 'rising';
        else if (change < -10) trend = 'falling';
      }

      setStats({ avgActual, avgPredicted, trend });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load AI forecast');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const trendIcon = stats.trend === 'rising' ? <TrendingUp className='h-4 w-4 text-green-600' /> :
                    stats.trend === 'falling' ? <TrendingDown className='h-4 w-4 text-red-600' /> :
                    <Minus className='h-4 w-4 text-muted-foreground' />;

  return (
    <Card className='shadow-lg'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <BrainCircuit className='h-5 w-5 text-purple-600' />
            <div>
              <CardTitle className='text-base'>AI Sales Forecast</CardTitle>
              <CardDescription>Predicted vs actual sales with 14-day outlook</CardDescription>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='text-xs flex items-center gap-1'>
              {trendIcon}
              {stats.trend === 'rising' ? 'Rising Trend' : stats.trend === 'falling' ? 'Falling Trend' : 'Stable'}
            </Badge>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={fetchForecast}
              disabled={refreshing}
            >
              <RefreshCw className={'h-4 w-4 ' + (refreshing ? 'animate-spin' : '')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className='h-[300px] w-full rounded-lg' />
        ) : data.length === 0 ? (
          <div className='text-center py-12 text-muted-foreground'>
            <BrainCircuit className='h-10 w-10 mx-auto mb-2 text-muted-foreground/50' />
            <p>Forecast unavailable (check database)</p>
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='flex gap-4 text-xs'>
              <div className='flex items-center gap-1'>
                <div className='w-3 h-3 rounded-full bg-blue-500' />
                <span>Actual Sales</span>
              </div>
              <div className='flex items-center gap-1'>
                <div className='w-3 h-3 rounded-full bg-purple-500' />
                <span>AI Prediction</span>
              </div>
              <div className='flex items-center gap-1 ml-auto'>
                <span className='text-muted-foreground'>Avg Daily (Actual):</span>
<span className='font-semibold'>{Math.round(stats.avgActual).toLocaleString()}</span>
              </div>
              <div className='flex items-center gap-1'>
                <span className='text-muted-foreground'>Avg Daily (Predicted):</span>
<span className='font-semibold'>{Math.round(stats.avgPredicted).toLocaleString()}</span>
              </div>
            </div>
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
                <XAxis
                  dataKey='date'
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return (d.getMonth() + 1) + '/' + d.getDate();
                  }}
                  tick={{ fontSize: 10 }}
                  minTickGap={30}
                />
                <YAxis
                  tickFormatter={(value) => '₱' + ((value / 1000).toFixed(0)) + 'k'}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    '₱' + Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }),
                    name
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <ReferenceLine x={today} stroke='#888' strokeDasharray='3 3' label={{ value: 'Today', position: 'top', fontSize: 10 }} />
                <Line
                  type='monotone'
                  dataKey='actual'
                  stroke='#3b82f6'
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name='Actual Sales'
                />
                <Line
                  type='monotone'
                  dataKey='predicted'
                  stroke='#a855f7'
                  strokeWidth={2}
                  strokeDasharray='5 5'
                  dot={false}
                  activeDot={{ r: 4 }}
                  name='AI Predicted'
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
