import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Cyber Pidgeon',
        short_name: 'Pidgeon',
        description: 'A lightning-fast, secure messaging platform.',
        start_url: '/',
        display: 'standalone',
        background_color: '#030014', // Deep Space Black
        theme_color: '#030014',
        icons: [
            {
                src: '/logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/logo.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    };
}
