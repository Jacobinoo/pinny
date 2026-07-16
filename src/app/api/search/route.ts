import { NextRequest, NextResponse } from 'next/server';
import { searchPinterest } from '@/lib/pinterest';

export async function GET(req: NextRequest) {
  const urlParams = new URL(req.url).searchParams;
  const query = urlParams.get('q') || '';
  const bookmark = urlParams.get('bookmark') || null;
  const csrftoken = urlParams.get('csrftoken') || null;

  if (query.length < 1 || query.length > 64) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }

  try {
    const result = await searchPinterest(query, bookmark, csrftoken);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: 'Fetch Error: ' + error.message }, { status: 500 });
  }
}
