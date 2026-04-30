# Separate Staff vs Admin Sales - Progress

## Plan:
1. Update lib/ai/staff-analytics.ts: Add separate OverallSummary for cashiers (`cashierOverall`) and admins (`adminOverall`)
2. Update app/api/ai/staff-performance/route.js: Return both summaries
3. Update components/ai-staff-performance.tsx: Display separate total sales cards, charts filtered by type, tabs for cashier/admin leaderboards
4. Update TODO.md: Mark complete

**Ready to implement?**
