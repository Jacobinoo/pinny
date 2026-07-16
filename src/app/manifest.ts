import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pinny',
    short_name: 'Pinny',
    description: 'A beautiful visual discovery engine',
    start_url: '/',
    display: 'standalone',
    background_color: '#111111',
    theme_color: '#e60023',
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}
