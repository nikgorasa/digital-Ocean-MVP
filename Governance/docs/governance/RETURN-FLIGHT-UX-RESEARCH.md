# Return Flight UX Research & Implementation Plan

**Version:** 1.0.0  
**Date:** 2026-07-31  
**Status:** Ready for Implementation

---

## 1. Research Findings (Comparison Table)

| Aspect | MakeMyTrip | Goibibo | Booking.com | Skyscanner | Google Flights | Cleartrip |
|--------|------------|---------|-------------|------------|----------------|-----------|
| **Return Flight Selection Pattern** | Horizontal tabs: "Departure" / "Return" at top of results | Horizontal tabs: "Outbound" / "Return" with active state indicator | Single list with expandable return section below each outbound | Tabs at top: "Departure" / "Return" + calendar sync | Tabs: "Departure" / "Return" with price per leg | Horizontal tabs: "Onward" / "Return" |
| **Visual Hierarchy (Outbound vs Inbound)** | Outbound bold, larger; Return slightly muted until selected | Equal weight tabs; selected leg highlighted with accent color | Outbound primary; return nested/indented | Equal visual weight; both legs shown side-by-side on desktop | Outbound first, return second; price per leg shown | Onward primary; return secondary until onward selected |
| **Step Indicators / Progress** | 3-step: Search → Select Flights → Review (top bar) | 3-step: Search → Choose Flights → Payment (top progress) | No explicit stepper; accordion-style selection | Minimal: "Select departure" → "Select return" inline | 2-step inline: "Choose departure" → "Choose return" | 3-step top bar: Search → Select → Pay |
| **Price Per Leg vs Total** | Shows price per leg + total in sticky bottom bar | Shows per-leg price on each card + total in bottom bar | Total price only; per-leg on hover/expand | Per-leg on cards + total in summary bar | Per-leg prominent + total in bottom bar | Per-leg on cards + total in bottom bar |
| **Return Date Change Behavior** | Toast: "Return date changed. Please re-select return flight." Clears inbound selection | Modal: "Changing return date will reset return flight. Continue?" | Auto-reloads return options; preserves outbound | Clears return selection; shows "Select return flight" prompt | Clears return; shows date picker for new return date | Toast + clears inbound; prompts re-selection |
| **Mobile vs Desktop** | Mobile: Bottom sheet for flight selection; tabs at top | Mobile: Full-screen modal for leg selection; tabs persist | Mobile: Accordion stack; desktop: side-by-side | Mobile: Stacked tabs; desktop: side-by-side cards | Mobile: Stacked; desktop: side-by-side with price comparison | Mobile: Bottom sheet; desktop: horizontal cards |
| **Multi-City Handling** | Separate "Multi-city" tab; adds leg selectors vertically | "Multi-city" mode adds + button for additional legs | Multi-city as separate search flow | Multi-city: add/remove legs in search form | Multi-city: "Add flight" in search; results show all legs | Multi-city tab; vertical leg stack |

### Key Patterns for Indian Market (MakeMyTrip/Goibibo)
1. **Horizontal tabs** for leg switching — familiar, thumb-reachable on mobile
2. **Sticky bottom bar** with total price + CTA — always visible, drives conversion
3. **Toast + clear inbound** on date change — explicit, non-destructive to outbound
3. **Step indicator** at top — reduces anxiety, shows progress
4. **Per-leg pricing** on cards + total in bar — transparency builds trust

---

## 2. Recommended Pattern for Our Context

### Design Principles
- **Indian market first** — Follow MakeMyTrip/Goibibo mental models
- **Leverage existing codebase** — `motion/react` for animations, `flightSelections` Map for state
- **Mobile-first** — Bottom sheet on mobile, inline tabs on desktop
- **Minimal changes** — Reuse components, avoid new dependencies

### Architecture Decisions
| Decision | Rationale |
|----------|-----------|
| Tabs for leg switching (`Outbound` / `Return`) | Matches MMT/Goibibo; low cognitive load |
| Sticky bottom bar with leg price preview + total | Conversion-critical; always accessible |
| Disabled inbound tab until outbound selected | Prevents invalid state; guides user flow |
| Toast on return date change + clear inbound | Explicit feedback; preserves outbound selection |
| Step indicator (Search → Select → Review) | Reduces drop-off; shows progress |

---

## 3. Phased Implementation Plan

### P0 — Ship First (4-6 hours)
**Goal:** Functional return flight selection with clear UX

| Task | Description | Files |
|------|-------------|-------|
| **StepIndicator Component** | 3-step horizontal: Search → Select Flights → Review. Highlight current step. | `src/components/flights/StepIndicator.tsx` (new) |
| **Leg Price Preview in Bottom Bar** | Show "Outbound: ₹X,XXX" + "Return: ₹Y,YYY" + "Total: ₹Z,ZZZ" | `src/app/flights/page.tsx` (modify) |
| **Clear Leg Buttons in Bottom Bar** | Two buttons: "Select Outbound" / "Select Return" — active leg highlighted | `src/app/flights/page.tsx` (modify) |
| **Return Date Change → Toast + Clear Inbound** | On `returnDate` change: toast "Return date updated. Please re-select return flight." Clear `flightSelections.get('return')` | `src/app/flights/page.tsx` (modify) |

**Acceptance Criteria:**
- [ ] Step indicator renders and highlights "Select Flights"
- [ ] Bottom bar shows per-leg prices + total when both legs selected
- [ ] Leg buttons toggle flight list view (outbound/return)
- [ ] Changing return date clears inbound selection + shows toast
- [ ] TypeScript compiles, build passes

---

### P1 — Enhance (3-4 hours)
**Goal:** Guided flow, validation, polish

| Task | Description | Files |
|------|-------------|-------|
| **Disabled Inbound State** | Return tab disabled until outbound selected; show tooltip "Select outbound flight first" | `src/app/flights/page.tsx`, `src/components/flights/LegTabs.tsx` (new) |
| **Selection Validation** | Prevent proceeding to checkout if inbound missing (round-trip); show inline error | `src/app/flights/page.tsx` |
| **Micro-interactions** | `motion/react` animations: tab slide, price count-up, button press scale | `src/components/flights/LegTabs.tsx`, `src/app/flights/page.tsx` |

**Acceptance Criteria:**
- [ ] Return tab disabled + tooltip when no outbound selected
- [ ] Checkout CTA disabled with inline message if inbound missing
- [ ] Smooth tab transition (150ms), price count-up (300ms)
- [ ] No regression in P0 functionality

---

### P2 — Mobile / Polish (2-3 hours)
**Goal:** Mobile excellence, accessibility, multi-city ready

| Task | Description | Files |
|------|-------------|-------|
| **Bottom Sheet on Mobile** | Flight selection in bottom sheet (framer-motion); swipe to dismiss | `src/components/flights/FlightBottomSheet.tsx` (new) |
| **Keyboard Navigation** | Tab order: tabs → flight cards → bottom bar; Enter/Space to select | `src/components/flights/LegTabs.tsx`, flight cards |
| **Multi-city Alignment** | Ensure components accept `legKey` prop (outbound/return/leg3/leg4) for future | All new components |

**Acceptance Criteria:**
- [ ] Bottom sheet opens on mobile (< 768px), inline on desktop
- [ ] Full keyboard operability (WCAG 2.1 AA)
- [ ] Components accept `legKey` for multi-city extensibility
- [ ] Visual QA on Chrome, Firefox, Safari mobile

---

## 4. Specific Code Changes

### File: `src/app/flights/page.tsx`

#### State Additions
```typescript
// Add to existing state
const [activeLeg, setActiveLeg] = useState<'outbound' | 'return'>('outbound');
const [step, setStep] = useState<1 | 2 | 3>(2); // 1=Search, 2=Select, 3=Review
const [toast, setToast] = useState<{ message: string; type: 'info' | 'warning' } | null>(null);

// Derived: inbound selection cleared when returnDate changes
useEffect(() => {
  if (flightSelections.has('return')) {
    flightSelections.delete('return');
    setToast({ message: 'Return date updated. Please re-select return flight.', type: 'info' });
    setTimeout(() => setToast(null), 4000);
  }
}, [returnDate]);
```

#### New Components (co-located or in `src/components/flights/`)
```tsx
// StepIndicator.tsx
export function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { label: 'Search', step: 1 },
    { label: 'Select Flights', step: 2 },
    { label: 'Review', step: 3 },
  ];
  return (
    <nav aria-label="Booking progress" className="flex items-center gap-4 px-4 py-3 border-b">
      {steps.map((s, i) => (
        <motion.div
          key={s.step}
          layout
          className="flex flex-col items-center gap-1"
        >
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            currentStep >= s.step
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}>
            {currentStep > s.step ? <Check className="w-4 h-4" /> : s.step}
          </div>
          <span className={cn(
            'text-xs font-medium',
            currentStep >= s.step ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={cn(
              'w-12 h-0.5 -mt-4',
              currentStep > s.step ? 'bg-primary' : 'bg-muted'
            )} />
          )}
        </motion.div>
      ))}
    </nav>
  );
}

// LegTabs.tsx
export function LegTabs({
  activeLeg,
  onChange,
  disabledLegs,
  hasOutboundSelection,
}: {
  activeLeg: 'outbound' | 'return';
  onChange: (leg: 'outbound' | 'return') => void;
  disabledLegs?: ('outbound' | 'return')[];
  hasOutboundSelection: boolean;
}) {
  return (
    <div className="flex border-b" role="tablist">
      {['outbound', 'return'].map((leg) => (
        <button
          key={leg}
          role="tab"
          aria-selected={activeLeg === leg}
          aria-disabled={disabledLegs?.includes(leg)}
          disabled={disabledLegs?.includes(leg)}
          onClick={() => onChange(leg as 'outbound' | 'return')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeLeg === leg
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
            disabledLegs?.includes(leg) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {leg === 'outbound' ? 'Outbound' : 'Return'}
          {leg === 'return' && !hasOutboundSelection && (
            <Tooltip content="Select outbound flight first" />
          )}
        </button>
      ))}
    </div>
  );
}

// LegPricePreview.tsx (renders in bottom bar)
export function LegPricePreview({
  outboundPrice,
  returnPrice,
  totalPrice,
}: {
  outboundPrice: number | null;
  returnPrice: number | null;
  totalPrice: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-background">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Outbound</span>
          <span className="font-medium">{outboundPrice ? `₹${outboundPrice.toLocaleString()}` : '—'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Return</span>
          <span className="font-medium">{returnPrice ? `₹${returnPrice.toLocaleString()}` : '—'}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-muted-foreground text-sm">Total</div>
        <div className="text-lg font-bold text-primary">₹{totalPrice.toLocaleString()}</div>
      </div>
    </div>
  );
}
```

#### Modified Render Logic (in `page.tsx`)
```tsx
// Replace existing flight list render with:
<StepIndicator currentStep={step} />

{toast && (
  <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
)}

<LegTabs
  activeLeg={activeLeg}
  onChange={setActiveLeg}
  disabledLegs={!flightSelections.has('outbound') ? ['return'] : []}
  hasOutboundSelection={flightSelections.has('outbound')}
/>

<FlightList
  flights={activeLeg === 'outbound' ? outboundFlights : returnFlights}
  selectedId={flightSelections.get(activeLeg)?.flightId}
  onSelect={(flight) => {
    flightSelections.set(activeLeg, flight);
    if (activeLeg === 'outbound') setActiveLeg('return'); // auto-advance
  }}
/>

<BottomBar>
  <LegPricePreview
    outboundPrice={flightSelections.get('outbound')?.price ?? null}
    returnPrice={flightSelections.get('return')?.price ?? null}
    totalPrice={
      (flightSelections.get('outbound')?.price ?? 0) +
      (flightSelections.get('return')?.price ?? 0)
    }
  />
  <Button
    disabled={!flightSelections.has('outbound') || (isRoundTrip && !flightSelections.has('return'))}
    onClick={() => setStep(3)}
    className="w-full md:w-auto"
  >
    {isRoundTrip && !flightSelections.has('return')
      ? 'Select Return Flight'
      : 'Continue to Review'}
  </Button>
</BottomBar>
```

---

## 5. Risk Assessment & Testing

### What Could Break

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `flightSelections` Map mutation causes stale renders | Medium | High | Use `useMemo` for derived values; test with React DevTools |
| Return date change effect runs on mount | Low | Medium | Add `returnDate` to deps only; gate with `hasReturnDate` ref |
| Bottom bar layout shift on mobile | Medium | Medium | Fixed height container; test with keyboard open |
| Tab keyboard navigation breaks screen readers | Low | High | Test with NVDA/VoiceOver; ensure `role="tablist"` |
| Multi-city prop drift in future | Low | Low | Type `legKey` as union `'outbound' | 'return' | string` |

### Test Scenarios

#### P0 Smoke Tests
- [ ] Round-trip: select outbound → auto-advances to return → select return → total shows → Continue enabled
- [ ] One-way: no return tab; total = outbound only; Continue enabled after outbound
- [ ] Change return date after both selected → inbound cleared → toast shown → return tab active
- [ ] Refresh page with selections → state restored from URL/search params

#### P1 Regression Tests
- [ ] Return tab disabled until outbound selected; tooltip visible
- [ ] Checkout disabled with inline message when inbound missing
- [ ] Tab switch animates (no layout shift)
- [ ] Price count-up animates on selection

#### P2 Mobile/Accessibility Tests
- [ ] Bottom sheet opens on mobile tap; swipe down dismisses
- [ ] Tab → flight card → bottom bar keyboard flow works
- [ ] Screen reader announces "Outbound selected, Return tab active"
- [ ] Focus trap in bottom sheet; Escape closes

### Ship Criteria Per Phase

| Phase | Criteria |
|-------|----------|
| **P0** | TypeScript clean, build passes, all P0 smoke tests pass, no console errors |
| **P1** | P0 + P1 regression tests pass, Lighthouse accessibility ≥ 95, no motion-reduce violations |
| **P2** | P1 + mobile QA on 3 devices, keyboard audit passes, multi-city prop interface documented |

---

## Appendix: Component Dependency Graph

```
src/app/flights/page.tsx
├── StepIndicator (new)
├── LegTabs (new)
│   └── Tooltip (existing shadcn)
├── LegPricePreview (new)
├── FlightList (existing, reused)
├── Toast (existing shadcn)
└── BottomBar (existing, modified)
    ├── LegPricePreview
    └── Button (existing shadcn)
```

---

**Next Steps:** Begin P0 implementation. Create `src/components/flights/` directory and `StepIndicator.tsx` first.