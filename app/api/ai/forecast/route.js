import { NextResponse } from 'next/server';
import { generateSalesForecast, generateProductForecasts } from '@/lib/ai/forecast';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview'; // 'overview' or 'products'
    const daysHistory = parseInt(searchParams.get('days') || '60');
    const daysForecast = parseInt(searchParams.get('forecast') || '14');

    if (type === 'products') {
      const forecasts = await generateProductForecasts();
      return NextResponse.json({ data: forecasts });
    }

    const forecast = await generateSalesForecast(daysHistory, daysForecast);
    return NextResponse.json({ data: forecast });
  } catch (error) {
    console.error('Error fetching AI forecast:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

