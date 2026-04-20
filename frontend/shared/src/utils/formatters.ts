export function formatDateTime(value?: string | number | Date): string {
  if (!value) {
    return 'n/a'
  }

  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncateText(text: string, length = 120): string {
  if (text.length <= length) {
    return text
  }

  return `${text.slice(0, length - 1)}…`
}
