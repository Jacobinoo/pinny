import { NextResponse } from 'next/server';
import { getRelatedPins } from '@/lib/pinterest';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const bookmark = searchParams.get('bookmark');
  const csrftoken = searchParams.get('csrftoken');

  if (!id) {
    return NextResponse.json({ error: 'Pin ID is required' }, { status: 400 });
  }

  try {
    const result = await getRelatedPins(id, bookmark, csrftoken);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
