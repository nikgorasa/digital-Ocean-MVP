# Motion/React to Tailwind CSS Transitions

## Goal
Replace `motion/react` (framer-motion) animations with lightweight Tailwind CSS transitions for smaller bundle size on public pages.

## Hero Section

### Before (motion/react)
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  <h1>Hero Title</h1>
</motion.div>
```

### After (Tailwind)
```tsx
<div className="opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
  <h1>Hero Title</h1>
</div>
```

Add to `tailwind.config.js`:
```js
keyframes: {
  fadeIn: {
    '0%': { opacity: '0', transform: 'translateY(20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' }
  }
}
```

## Navbar

### Before
```tsx
<motion.nav whileHover={{ scale: 1.02 }}>
  <Link href="/">Home</Link>
</motion.nav>
```

### After
```tsx
<nav className="transition-transform hover:scale-[1.02] duration-200">
  <Link href="/">Home</Link>
</nav>
```

## Cards

### Before
```tsx
<motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
  <CardContent />
</motion.div>
```

### After
```tsx
<div className="transition-all hover:-translate-y-1 active:scale-[0.98] duration-200">
  <CardContent />
</div>
```

## Notes
- Use `transition-all` + `duration-200` for interactive elements.
- Prefer `hover:` and `active:` variants over JS animations.
- Remove `motion` import and dependency when all public pages converted.
- Test on Chrome/Firefox for click target consistency.