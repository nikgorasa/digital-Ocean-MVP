# Dynamic Imports for Size Reduction

Use `next/dynamic` to lazy-load heavy components only when needed.

## Admin Panels

```tsx
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), {
  loading: () => <div>Loading admin...</div>,
  ssr: false,
});
```

## RichTextEditor

```tsx
const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  { ssr: false }
);
```

## PDF Generators

```tsx
const PDFGenerator = dynamic(
  () => import('@/lib/pdf/PDFGenerator'),
  { ssr: false }
);
```

## Booking Modals

```tsx
const BookingModal = dynamic(
  () => import('@/components/booking/BookingModal'),
  { loading: () => <Spinner />, ssr: false }
);
```

## Usage

Render conditionally to trigger load only on interaction.
