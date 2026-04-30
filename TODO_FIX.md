# Fix List

- [x] Fix invalid Tailwind classes in POS page (h-50 → h-[200px], w-100 → w-[400px], ml-15 → ml-14)
- [x] Fix invalid Tailwind classes in cashier page (h-50 → h-[200px])
- [x] Fix invalid Badge variants in inventory page (warning/success not defined → use valid variants with color classes)
- [x] Fix useSmoothCounter to preserve 2 decimal places for currency
- [x] Fix FIFO batch accumulation bug in POS page (merge same batch entries)
- [x] Fix FIFO batch accumulation bug in cashier page (merge same batch entries)
- [x] Fix duplicate SMS alerts in sales API (deduplicate ProductIDs before sending)
- [x] Fix next/image missing sizes prop in AddProductForm
- [x] Create centralized `createLowStockSmsMessage()` helper for professional SMS alerts
- [x] Update `lib/sms.ts` and sales API to use the new SMS message helper

