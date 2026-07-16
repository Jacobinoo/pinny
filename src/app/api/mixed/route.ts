import { NextResponse } from 'next/server';
import { getMixedPins } from '@/lib/pinterest';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');
  const bookmarksParam = searchParams.get('bookmarks');
  const csrftoken = searchParams.get('csrftoken');

  if (!idsParam) {
    return NextResponse.json({ error: 'Pin IDs are required' }, { status: 400 });
  }

  const ids = idsParam.split(',');
  const bookmarks = bookmarksParam ? bookmarksParam.split(',') : undefined;

  try {
    const result = await getMixedPins(ids, bookmarks, csrftoken);
    return NextResponse.json({
      images: result.images,
      bookmark: result.bookmarks ? result.bookmarks.join(',') : null,
      csrftoken: result.csrftoken
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
