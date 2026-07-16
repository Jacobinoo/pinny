import { NextResponse } from 'next/server';
import { getMixedSearches } from '@/lib/pinterest';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queriesParam = searchParams.get('queries');
  const bookmarksParam = searchParams.get('bookmarks');
  const csrftoken = searchParams.get('csrftoken');

  if (!queriesParam) {
    return NextResponse.json({ error: 'Queries are required' }, { status: 400 });
  }

  const queries = queriesParam.split(',');
  const bookmarks = bookmarksParam ? bookmarksParam.split(',') : undefined;

  try {
    const result = await getMixedSearches(queries, bookmarks, csrftoken);
    return NextResponse.json({
      images: result.images,
      bookmark: result.bookmarks ? result.bookmarks.join(',') : null,
      csrftoken: result.csrftoken
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
