export const ARRAY_FIELDS = ['users', 'members', 'invitations', 'accounts', 'categories', 'transactions', 'journals', 'budgets', 'goals', 'debts', 'bills', 'notifications'];
const OBJECT_FIELDS = ['household', 'approvalPolicy'];
const COUNTERS: Record<string, string[]> = { accounts: ['current_balance'], goals: ['current_amount'], debts: ['remaining_principal'], budgets: ['spent'] };
export type Change = { field: string; id?: string; set?: Record<string, any>; add?: Record<string, number>; remove?: boolean };
export type SyncOperation = { id: string; householdId: string; createdAt: string; changes: Change[] };
const same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);
function changedValues(before: any, after: any, counters: string[] = []) {
  const set: Record<string, any> = {}, add: Record<string, number> = {};
  for (const key of Object.keys(after)) {
    if (same(before?.[key], after[key])) continue;
    if (before && counters.includes(key) && Number.isFinite(before[key]) && Number.isFinite(after[key])) add[key] = after[key] - before[key];
    else set[key] = after[key];
  }
  return { set, add };
}
export function diffState(before: any, after: any): Change[] {
  const changes: Change[] = [];
  for (const field of ARRAY_FIELDS) {
    const old = new Map((before[field] || []).map((row: any) => [row.id, row]));
    const next = new Map((after[field] || []).map((row: any) => [row.id, row]));
    for (const [id, row] of Array.from(next)) {
      if (!same(old.get(id), row)) changes.push({ field, id: id as string, ...changedValues(old.get(id), row, COUNTERS[field]) });
    }
    for (const id of Array.from(old.keys())) if (!next.has(id)) changes.push({ field, id: id as string, remove: true });
  }
  for (const field of OBJECT_FIELDS) if (after[field] && !same(before[field], after[field])) changes.push({ field, ...changedValues(before[field], after[field]) });
  if (after.appPassword !== undefined && before.appPassword !== after.appPassword) changes.push({ field: 'security', set: { appPassword: after.appPassword } });
  return changes;
}
export function applyOperations(base: any, operations: SyncOperation[]) {
  const result = JSON.parse(JSON.stringify(base));
  const seen = new Set<string>();
  for (const op of [...operations].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))) {
    if (seen.has(op.id) || op.householdId !== result.household?.id) continue;
    seen.add(op.id);
    for (const change of op.changes) {
      if (ARRAY_FIELDS.includes(change.field)) {
        const rows = result[change.field] ||= [];
        const index = rows.findIndex((r: any) => r.id === change.id);
        if (change.remove) { if (index >= 0) rows.splice(index, 1); continue; }
        const row = { ...(index >= 0 ? rows[index] : { id: change.id }), ...change.set };
        for (const [key, amount] of Object.entries(change.add || {})) row[key] = (row[key] || 0) + amount;
        if (index >= 0) rows[index] = row; else rows.push(row);
      } else if (OBJECT_FIELDS.includes(change.field)) {
        result[change.field] = { ...result[change.field], ...change.set };
      } else if (change.field === 'security') result.appPassword = change.set?.appPassword;
    }
    result.updatedAt = op.createdAt;
  }
  return result;
}
export const OUTBOX_KEY = 'nest_sync_outbox_v3';
export class SyncOutbox {
  constructor(private storage: Pick<Storage, 'getItem' | 'setItem'>, private key = OUTBOX_KEY) {}
  read(): { baseline: any; operations: SyncOperation[] } | null { const raw = this.storage.getItem(this.key); return raw ? JSON.parse(raw) : null; }
  initialize(state: any) { if (!this.read()) this.storage.setItem(this.key, JSON.stringify({ baseline: state, operations: [] })); }
  record(state: any) {
    const saved = this.read();
    if (!saved) { this.initialize(state); return; }
    if (saved.baseline.household?.id !== state.household?.id) throw new Error('Selesaikan sinkronisasi keluarga sebelum beralih pembukuan.');
    const changes = diffState(saved.baseline, state);
    if (!changes.length) return;
    const last = saved.operations[saved.operations.length - 1];
    const time = Math.max(Date.now(), last ? Date.parse(last.createdAt) + 1 : 0);
    saved.operations.push({ id: crypto.randomUUID(), householdId: state.household.id, createdAt: new Date(time).toISOString(), changes });
    saved.baseline = state;
    // One durable write: refresh cannot separate the data from its upload queue.
    this.storage.setItem(this.key, JSON.stringify(saved));
  }
  ack(id: string) { const saved = this.read()!; saved.operations = saved.operations.filter(op => op.id !== id); this.storage.setItem(this.key, JSON.stringify(saved)); }
  accept(state: any) { if (this.read()?.operations.length) throw new Error('Masih ada perubahan yang belum terkirim.'); this.storage.setItem(this.key, JSON.stringify({ baseline: state, operations: [] })); }
}
// Recover only additions from the old full-snapshot queue. Never overwrite newer cloud rows.
export function recoverLegacyPending(cloud: any, local: any) {
  const recovered = JSON.parse(JSON.stringify(cloud));
  if (cloud.household?.id !== local.household?.id) throw new Error('Antrean lama berasal dari keluarga lain.');
  const missingTx = new Set((local.transactions || []).filter((t: any) => !(cloud.transactions || []).some((r: any) => r.id === t.id)).map((t: any) => t.id));
  const newJournals = (local.journals || []).filter((j: any) => missingTx.has(j.transaction_id) && !(cloud.journals || []).some((r: any) => r.id === j.id));
  for (const field of ARRAY_FIELDS) {
    if (field === 'journals') continue;
    recovered[field] ||= [];
    for (const row of local[field] || []) if (!recovered[field].some((r: any) => r.id === row.id)) recovered[field].push(row);
  }
  recovered.journals ||= [];
  for (const journal of newJournals) {
    recovered.journals.push(journal);
    for (const entry of journal.entries || []) {
      const account = recovered.accounts.find((a: any) => a.id === entry.account_id);
      if (account && cloud.accounts.some((a: any) => a.id === account.id)) account.current_balance += entry.side === 'DEBIT' ? entry.amount : -entry.amount;
    }
  }
  return recovered;
}
