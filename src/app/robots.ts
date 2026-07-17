import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/profile', '/trips', '/payment/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/blog/', '/faq/', '/about', '/destinations/', '/holidays', '/llms.txt', '/llms-full.txt'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/blog/', '/faq/', '/about', '/destinations/', '/holidays', '/llms.txt', '/llms-full.txt'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/blog/', '/faq/', '/about', '/destinations/', '/holidays', '/llms.txt', '/llms-full.txt'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/blog/', '/faq/', '/about', '/destinations/', '/holidays', '/llms.txt', '/llms-full.txt'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/blog/', '/faq/', '/about', '/destinations/', '/holidays', '/llms.txt', '/llms-full.txt'],
      },
      {
        userAgent: 'CCBot',
        allow: ['/blog/', '/faq/', '/about', '/destinations/', '/holidays', '/llms.txt', '/llms-full.txt'],
      },
    ],
    sitemap: 'https://cckr.vercel.app/sitemap.xml',
  };
}
