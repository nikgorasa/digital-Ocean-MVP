export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GoRASA',
    url: 'https://cckr.vercel.app',
    logo: 'https://cckr.vercel.app/logo.svg',
    description: 'Premium travel booking platform for luxury flights, hotels, and curated holiday packages.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-95285-00383',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },
    sameAs: [
      'https://www.instagram.com/gorasatravel',
      'https://www.facebook.com/gorasatravel',
      'https://twitter.com/gorasatravel',
      'https://www.linkedin.com/company/gorasa',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'GoRASA',
    url: 'https://cckr.vercel.app',
    description: 'Premium travel booking platform. Fine airfare, luxury hotels, and curated holiday packages across India and the world.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://cckr.vercel.app/hotels?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
