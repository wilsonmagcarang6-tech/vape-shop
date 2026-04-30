type LowStockItem = {
  productName: string
  currentStock: number
  reorderLevel?: number | null
}

type LowStockSmsOptions = {
  shopName?: string
  includeHeader?: boolean
  maxItems?: number
}

const SMS_CHAR_LIMIT = 160

function safeText(value: string | undefined | null, fallback: string): string {
  const trimmed = (value ?? '').trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function clampItems(items: LowStockItem[], maxItems: number): LowStockItem[] {
  if (!Array.isArray(items)) return []
  return items.slice(0, Math.max(1, maxItems))
}

function toLine(item: LowStockItem): string {
  const name = safeText(item.productName, 'Unknown item')
  const stock = Number.isFinite(item.currentStock) ? item.currentStock : 0
  const reorder =
    item.reorderLevel === null || item.reorderLevel === undefined
      ? null
      : Number.isFinite(item.reorderLevel)
      ? item.reorderLevel
      : null

  if (reorder === null) return `${name} (${stock} left)`
  return `${name} (${stock} left, RL ${reorder})`
}

function fitSms(text: string, limit = SMS_CHAR_LIMIT): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= limit) return normalized
  return `${normalized.slice(0, Math.max(0, limit - 3)).trim()}...`
}

/**
 * Concise SMS for low stock alerts (single message friendly).
 */
export function createLowStockSmsMessage(
  items: LowStockItem[],
  options: LowStockSmsOptions = {}
): string {
  const shopName = safeText(options.shopName, 'HIPAK Vape Shop')
  const includeHeader = options.includeHeader ?? true
  const maxItems = options.maxItems ?? 3

  const selected = clampItems(items, maxItems)
  if (selected.length === 0) {
    return fitSms(`${shopName}: Low stock alert. Please review inventory.`)
  }

  const lines = selected.map(toLine)
  const remaining = Math.max(0, items.length - selected.length)

  const head = includeHeader ? `${shopName}: Low stock alert - ` : ''
  const body =
    remaining > 0
      ? `${lines.join(', ')} +${remaining} more. Restock soon.`
      : `${lines.join(', ')}. Restock soon.`

  return fitSms(`${head}${body}`)
}

/**
 * Detailed multi-item template (still SMS-safe; may be split by provider if very long).
 */
export function createDetailedLowStockSmsMessage(
  items: LowStockItem[],
  options: LowStockSmsOptions = {}
): string {
  const shopName = safeText(options.shopName, 'HIPAK Vape Shop')
  const selected = clampItems(items, options.maxItems ?? 8)

  if (selected.length === 0) {
    return fitSms(`${shopName}: No low-stock items found.`)
  }

  const header = `${shopName} Inventory Alert:`
  const body = selected.map((item, idx) => `${idx + 1}) ${toLine(item)}`).join('; ')
  return fitSms(`${header} ${body} Restock recommended.`)
}

export type { LowStockItem, LowStockSmsOptions }
