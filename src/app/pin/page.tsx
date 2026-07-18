import Link from 'next/link';
import BackButton from '@/components/BackButton';
import ImageGrid from '@/components/ImageGrid';
import { searchPinterest, getRelatedPins } from '@/lib/pinterest';
import { ImageObj } from '@/app/page';
import ThemeToggle from '@/components/ThemeToggle';
import SaveToBoardButton from '@/components/SaveToBoardButton';

export default async function PinPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { id, url, origUrl, title, description, pinner, color, width, height } = await searchParams;

  if (!url) {
    return (
      <div className="pin-page-container">
        <header className="pin-header">
          <BackButton />
        </header>
        <div style={{ padding: '4rem', textAlign: 'center' }}>Invalid Pin Data</div>
      </div>
    );
  }

  let finalOrigUrl = origUrl || url;
  if (finalOrigUrl.startsWith('http')) {
    finalOrigUrl = `/api/image_proxy?url=${encodeURIComponent(finalOrigUrl)}`;
  } else if (finalOrigUrl.startsWith('/api/image_proxy')) {
    // Already proxied
  }

  const pinObj: ImageObj = {
    id: id || finalOrigUrl,
    url: finalOrigUrl,
    title: title || '',
    description: description || '',
    color: color || '',
    pinner: pinner || '',
    width: parseInt(width || '0'),
    height: parseInt(height || '0')
  };

  // Fetch "More Like This" images
  let moreImages: ImageObj[] = [];
  let initialBookmark: string | null = null;
  let initialCsrfToken: string | null = null;
  let searchQuery = '';
  let fetchMode: "search" | "related" = id ? "related" : "search";
  
  try {
    if (id) {
      const data = await getRelatedPins(id);
      if (data.images && data.images.length > 0) {
        moreImages = data.images;
        if (data.bookmark) initialBookmark = data.bookmark;
        if (data.csrftoken) initialCsrfToken = data.csrftoken;
        searchQuery = id;
      }
    }
    
    // Fallback if no ID provided OR if getRelatedPins returned empty (e.g. Vercel IP shadowban)
    if (moreImages.length === 0) {
      let effectiveTitle = title;
      if (!effectiveTitle || effectiveTitle.toLowerCase() === 'untitled') {
        effectiveTitle = '';
      }
      searchQuery = effectiveTitle || description || 'aesthetic wallpapers';
      fetchMode = "search";
      
      const data = await searchPinterest(searchQuery);
      if (data.images) moreImages = data.images;
      if (data.bookmark) initialBookmark = data.bookmark;
      if (data.csrftoken) initialCsrfToken = data.csrftoken;
    }
  } catch (e) {
    console.error("Failed to fetch more like this:", e);
  }

  return (
    <div className="pin-page-container">
      {/* Header */}
      <header className="pin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackButton />
        <ThemeToggle />
      </header>
      
      <main className="pin-main">
        <div className="pin-card-detail">
          {/* Left: Image (Sticky) */}
          <div className="pin-image-section" style={{ backgroundColor: color || '#333' }}>
            <img 
              src={finalOrigUrl} 
              alt={title || "Pin Image"} 
              className="pin-full-image" 
            />
          </div>
          
          {/* Right: Info (Scrollable) */}
          <div className="pin-info-section">
            <div className="pin-info-content">
              <h1>{title || "Untitled"}</h1>
              
              {pinner && (
                <div className="pinner-badge">
                  <div className="pinner-avatar" style={{ backgroundColor: color || 'var(--accent)' }}>
                    {pinner.charAt(0).toUpperCase()}
                  </div>
                  <span>{pinner}</span>
                </div>
              )}
              
              {description && (
                <p className="pin-description">{description}</p>
              )}
              
              <div className="pin-actions">
                <SaveToBoardButton pin={pinObj} />
              </div>

              <hr className="divider" />

              {/* More Like This Section - On the Right */}
              <div className="more-like-this-container" style={{ marginTop: '3rem' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>More like this</h3>
                {moreImages.length > 0 ? (
                  <ImageGrid 
                    key={searchQuery}
                    initialImages={moreImages} 
                    initialBookmark={initialBookmark} 
                    initialCsrfToken={initialCsrfToken} 
                    query={searchQuery} 
                    cachePrefix="pinny_related"
                    mode={fetchMode}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No related images found.</div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
