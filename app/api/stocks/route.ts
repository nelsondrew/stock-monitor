import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const headers = {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'priority': 'u=1, i',
      'referer': 'https://groww.in/markets/top-gainers?index=GIDXNIFTY500',
      'x-app-id': 'growwWeb',
      'x-device-type': 'desktop',
      'x-platform': 'web',
    };

    const [gainersResponse, volumeResponse] = await Promise.all([
      fetch('https://groww.in/v1/api/stocks_data/explore/v2/indices/GIDXNIFTY500/market_trends?discovery_filter_types=TOP_GAINERS&size=100', {
        headers: headers,
      }),
      fetch('https://groww.in/v1/api/stocks_data/explore/v2/indices/GIDXNIFTY500/market_trends?discovery_filter_types=TRADED_BY_VOLUME&size=20', {
        headers: headers,
      })
    ]);

    if (!gainersResponse.ok || !volumeResponse.ok) {
      throw new Error('Failed to fetch stocks');
    }

    const [gainersData, volumeData] = await Promise.all([
      gainersResponse.json(),
      volumeResponse.json()
    ]);

    return NextResponse.json({ gainersData, volumeData });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
  }
} 