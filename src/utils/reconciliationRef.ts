import { format } from "date-fns";

/**
 * Generates a reconciliation reference with the format:
 * YYYYMMDD-TXN###
 * where ### is the 1-based index of the transaction for that day.
 *
 * Records must be sorted by created_at ascending within each day for correct numbering.
 */
export function generateReconRef(createdAt: string, dailyIndex: number): string {
  const date = new Date(createdAt);
  const dateStr = format(date, "yyyyMMdd");
  const txnNum = String(dailyIndex).padStart(3, "0");
  return `${dateStr}-TXN${txnNum}`;
}

/**
 * Assigns reconciliation references to an array of records.
 * Each record gets a `reconRef` field like "20260315-TXN001".
 * Records are numbered per-day based on creation order.
 */
export function assignReconRefs<T extends { created_at: string }>(
  records: T[]
): (T & { reconRef: string })[] {
  // Group by date, track daily counters
  const dailyCounters: Record<string, number> = {};

  // Sort by created_at ascending for correct numbering
  const sorted = [...records].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const withRefs = sorted.map((record) => {
    const dateKey = format(new Date(record.created_at), "yyyyMMdd");
    dailyCounters[dateKey] = (dailyCounters[dateKey] || 0) + 1;
    return {
      ...record,
      reconRef: generateReconRef(record.created_at, dailyCounters[dateKey]),
    };
  });

  // Reverse back to descending (most recent first) for display
  return withRefs.reverse();
}
