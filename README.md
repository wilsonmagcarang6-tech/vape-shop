# Hipak Vape Shop - Low Stock Alerts Setup

## Manual Test
```
npm run alert:low-stock
```

## Auto Scheduled (Windows Task Scheduler)
1. Win+R → `taskschd.msc`
2. Create Basic Task → "Hipak Low Stock"
3. Trigger: Daily, 9:00 AM
4. Action: Start program
```
Program: C:\Users\wilso\Desktop\Hipak-Vape-Shop\node_modules\.bin\npm.cmd
Arguments: run alert:low-stock
Start in: C:\Users\wilso\Desktop\Hipak-Vape-Shop
```

## Cron (WSL/Git Bash)
```
0 9 * * * cd /c/Users/wilso/Desktop/Hipak-Vape-Shop && npm run alert:low-stock
```

**Emails sent exactly 9AM daily when stock < ReorderPoint (5)!** ✅
