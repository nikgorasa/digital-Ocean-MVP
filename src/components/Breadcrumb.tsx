interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://cckr.vercel.app${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-xs text-slate-600">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-slate-600/40">/</span>}
            {index === items.length - 1 ? (
              <span className="text-brand-charcoal font-medium">{item.name}</span>
            ) : (
              <a
                href={item.href}
                className="hover:text-brand-antique-gold transition-colors"
              >
                {item.name}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
