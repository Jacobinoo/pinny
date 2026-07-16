export async function searchPinterest(query: string, bookmark?: string | null, csrftoken?: string | null) {
  const url = "https://www.pinterest.com/resource/BaseSearchResource/get/";

  const dataParamObj: any = {
    options: {
      query: query,
    }
  };

  if (bookmark) {
    dataParamObj.options.bookmarks = [bookmark];
  }

  const dataParam = encodeURIComponent(JSON.stringify(dataParamObj));

  const headers: HeadersInit = {
    "x-pinterest-pws-handler": "www/search/[scope].js",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  };

  let cookieStr = '';
  if (csrftoken) {
    headers["x-csrftoken"] = csrftoken;
    cookieStr += `csrftoken=${csrftoken}; `;
  }
  
  // Inject session cookie if provided in environment variables to bypass datacenter IP blocks
  if (process.env.PINTEREST_SESSION_COOKIE) {
    cookieStr += `_pinterest_sess=${process.env.PINTEREST_SESSION_COOKIE}; `;
  }
  
  if (cookieStr) {
    headers["cookie"] = cookieStr;
  }

  const fetchUrl = bookmark ? url : `${url}?data=${dataParam}`;
  
  const fetchOptions: RequestInit = {
    method: bookmark ? 'POST' : 'GET',
    headers: headers,
    cache: 'no-store'
  };

  if (bookmark) {
    fetchOptions.body = `data=${dataParam}`;
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  try {
    const res = await fetch(fetchUrl, fetchOptions);
    
    if (!res.ok) {
      console.error(`Pinterest Search API returned HTTP ${res.status}: ${res.statusText}`);
    }
    
    const textData = await res.text();
    let data;
    try {
      data = JSON.parse(textData);
      console.error("DEBUG SEARCH JSON RESPONSE:", JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Pinterest Search API returned non-JSON response:", textData.substring(0, 200) + "...");
      throw new Error("Invalid JSON from Pinterest");
    }
    
    const setCookie = res.headers.get('set-cookie');
    let newCsrfToken = csrftoken;
    if (setCookie) {
      const match = setCookie.match(/csrftoken=([^;]+)/i);
      if (match) {
        newCsrfToken = match[1];
      }
    }

    const { images, bookmark: nextBookmark } = parsePinterestResponse(data);

    return {
      images,
      bookmark: nextBookmark || null,
      csrftoken: newCsrfToken
    };

  } catch (error: any) {
    console.error("Pinterest API Fetch Error:", error);
    throw error;
  }
}

export async function getRelatedPins(pinId: string, bookmark?: string | null, csrftoken?: string | null) {
  const url = "https://www.pinterest.com/resource/RelatedPinFeedResource/get/";

  const dataParamObj: any = {
    options: {
      pin: pinId,
    }
  };

  if (bookmark) {
    dataParamObj.options.bookmarks = [bookmark];
  }

  const dataParam = encodeURIComponent(JSON.stringify(dataParamObj));

  const headers: HeadersInit = {
    "x-pinterest-pws-handler": "www/pin/[id].js",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  };

  let cookieStr = '';
  if (csrftoken) {
    headers["x-csrftoken"] = csrftoken;
    cookieStr += `csrftoken=${csrftoken}; `;
  }
  
  // Inject session cookie if provided in environment variables to bypass datacenter IP blocks
  if (process.env.PINTEREST_SESSION_COOKIE) {
    cookieStr += `_pinterest_sess=${process.env.PINTEREST_SESSION_COOKIE}; `;
  }
  
  if (cookieStr) {
    headers["cookie"] = cookieStr;
  }

  const fetchUrl = bookmark ? url : `${url}?data=${dataParam}`;
  
  const fetchOptions: RequestInit = {
    method: bookmark ? 'POST' : 'GET',
    headers: headers,
    cache: 'no-store'
  };

  if (bookmark) {
    fetchOptions.body = `data=${dataParam}`;
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  try {
    const res = await fetch(fetchUrl, fetchOptions);
    
    if (!res.ok) {
      console.error(`Pinterest Related API returned HTTP ${res.status}: ${res.statusText}`);
    }
    
    const textData = await res.text();
    let data;
    try {
      data = JSON.parse(textData);
      console.error("DEBUG RELATED JSON RESPONSE:", JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Pinterest Related API returned non-JSON response:", textData.substring(0, 200) + "...");
      throw new Error("Invalid JSON from Pinterest");
    }
    
    const setCookie = res.headers.get('set-cookie');
    let newCsrfToken = csrftoken;
    if (setCookie) {
      const match = setCookie.match(/csrftoken=([^;]+)/i);
      if (match) {
        newCsrfToken = match[1];
      }
    }

    const { images, bookmark: nextBookmark } = parsePinterestResponse(data);

    return {
      images,
      bookmark: nextBookmark || null,
      csrftoken: newCsrfToken
    };

  } catch (error: any) {
    console.error("Pinterest API Related Pins Error:", error);
    throw error;
  }
}

function parsePinterestResponse(data: any): { images: any[], bookmark?: string } {
  let images: any[] = [];
  let bookmark: string | undefined = undefined;

  let results: any[] = [];
  if (data?.resource_response?.data?.results) {
    results = data.resource_response.data.results;
  } else if (data?.resource_response?.data && Array.isArray(data.resource_response.data)) {
    // RelatedPinFeedResource returns array of pins directly
    results = data.resource_response.data;
  } else {
    // Log if Pinterest returns a valid JSON structure, but without the expected data
    if (data?.resource_response?.error) {
       console.warn("Pinterest API returned an error inside JSON:", data.resource_response.error);
    } else {
       console.warn("Pinterest API returned JSON but no image results were found. Structure:", JSON.stringify(data).substring(0, 150) + "...");
    }
  }

  images = results.map((item: any) => {
    const imgInfo = item.images?.orig || item.images?.['736x'] || item.images?.['474x'];
    if (!imgInfo) return null;

    return {
      id: item.id || '',
      url: imgInfo.url,
      origUrl: item.images?.orig?.url,
      width: imgInfo.width,
      height: imgInfo.height,
      color: item.dominant_color,
      title: item.title,
      description: item.description,
      pinner: item.pinner?.username,
    };
  }).filter(Boolean);

  if (data?.resource?.options?.bookmarks && data.resource.options.bookmarks.length > 0) {
    bookmark = data.resource.options.bookmarks[0];
  } else if (data?.resource_response?.bookmark) {
    bookmark = data.resource_response.bookmark;
  }

  return { images, bookmark };
}

export async function getMixedPins(pinIds: string[], bookmarks?: (string | null)[], csrftoken?: string | null) {
  const promises = pinIds.map(async (id, index) => {
    const bookmark = bookmarks && bookmarks[index] !== 'null' ? bookmarks[index] : null;
    // If we have a 'null' bookmark explicitly passed, it means this feed is exhausted, so we return empty.
    if (bookmarks && bookmarks[index] === 'null') {
       return { images: [], bookmark: null, csrftoken };
    }
    
    // Add staggered delay to prevent rate limits on large batches (e.g. infinite scrolling 10 mixed feeds)
    const delay = Math.random() * 1500;
    await new Promise(r => setTimeout(r, delay));
    
    return getRelatedPins(id, bookmark, csrftoken);
  });

  const results = await Promise.all(promises);

  let allImages: any[] = [];
  const nextBookmarks: (string | null)[] = [];
  let latestCsrfToken = csrftoken;

  results.forEach((res) => {
    if (res.images) allImages = allImages.concat(res.images);
    nextBookmarks.push(res.bookmark || 'null');
    if (res.csrftoken) latestCsrfToken = res.csrftoken;
  });

  // Shuffle images
  for (let i = allImages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allImages[i], allImages[j]] = [allImages[j], allImages[i]];
  }

  // If all bookmarks are 'null', we set the final bookmark array to null to stop infinite scrolling
  const allNull = nextBookmarks.every(b => b === 'null');

  return {
    images: allImages,
    bookmarks: allNull ? null : nextBookmarks,
    csrftoken: latestCsrfToken
  };
}
