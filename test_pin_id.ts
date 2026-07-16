async function test() {
  const url = "https://www.pinterest.com/resource/BaseSearchResource/get/";
  const dataParam = encodeURIComponent(JSON.stringify({ options: { query: "aesthetic" } }));
  const headers = {
    "x-pinterest-pws-handler": "www/search/[scope].js",
    "Accept": "application/json",
  };
  
  const res = await fetch(`${url}?data=${dataParam}`, { headers });
  const data = await res.json();
  const pins = data.resource_response.data.results;
  
  const relatedUrl = "https://www.pinterest.com/resource/RelatedPinFeedResource/get/";
  const relatedData = encodeURIComponent(JSON.stringify({
    options: {
      pin: pins[0].id,
    }
  }));
  
  const relatedRes = await fetch(`${relatedUrl}?data=${relatedData}`, { headers });
  const relatedDataJson = await relatedRes.json();
  console.log("Bookmark in RelatedPinFeedResource:", relatedDataJson.resource?.options?.bookmarks);
}

test();
