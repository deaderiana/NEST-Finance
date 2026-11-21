import { NextResponse } from 'next/server';
import { CLOUD_SYNC_CONFIG } from '@/lib/syncConfig';
import { applyOperations, SyncOperation, ARRAY_FIELDS } from '@/lib/syncJournal';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
const url = `https://api.github.com/gists/${CLOUD_SYNC_CONFIG.GIST_ID}`;
const headers = { Authorization: `token ${CLOUD_SYNC_CONFIG.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
const reply = (data: any, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function readGist() {
  const res = await fetch(url, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error('Penyimpanan cloud tidak dapat dibaca.');
  const gist = await res.json();
  if (gist.truncated) throw new Error('Arsip cloud perlu dipadatkan sebelum melanjutkan. Data lokal tetap disimpan.');
  return gist;
}
async function readFile(file: any) {
  if (!file) throw new Error('Data keluarga belum tersedia di cloud.');
  if (!file.truncated) return JSON.parse(file.content);
  const raw = new URL(file.raw_url);
  if (raw.hostname !== 'gist.githubusercontent.com') throw new Error('Alamat arsip tidak valid.');
  // Raw Gist URLs identify the immutable revision; do not forward the API credential.
  const res = await fetch(raw, { cache: 'no-store' });
  if (!res.ok) throw new Error('Arsip cloud belum terbaca lengkap.');
  return res.json();
}
export async function GET() {
  try {
    const gist = await readGist();
    const base = await readFile(gist.files[CLOUD_SYNC_CONFIG.FILE_NAME]);
    const entries = Object.entries(gist.files).filter(([name]) => /^nest-op-[a-f0-9-]+\.json$/.test(name));
    const ops: SyncOperation[] = [];
    for (const [, file] of entries) ops.push(await readFile(file));
    return reply({ success: true, protocol: 3, data: applyOperations(base, ops) });
  } catch (e: any) { return reply({ success: false, message: e.message }, 502); }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Old browsers must never overwrite the shared baseline after migration.
    if (body.protocol !== 3) return reply({ success: false, message: 'Muat ulang aplikasi untuk memperbarui sinkronisasi. Data lokal tetap tersedia.' }, 409);
    const op: SyncOperation = body.operation;
    if (!op || !/^[a-f0-9-]{36}$/.test(op.id) || !Number.isFinite(Date.parse(op.createdAt)) || !Array.isArray(op.changes) || !op.changes.length) return reply({ success: false, message: 'Perubahan tidak valid.' }, 400);
    for (const c of op.changes) {
      if (![...ARRAY_FIELDS, 'household', 'approvalPolicy', 'security'].includes(c.field) || (ARRAY_FIELDS.includes(c.field) && typeof c.id !== 'string')) return reply({ success: false, message: 'Data perubahan tidak valid.' }, 400);
      if (Object.keys(c.set || {}).some(k => ['__proto__', 'constructor', 'prototype'].includes(k)) || Object.entries(c.add || {}).some(([k,v]) => !['current_balance','current_amount','remaining_principal','spent'].includes(k) || !Number.isFinite(v))) return reply({ success: false }, 400);
    }
    const gist = await readGist();
    const base = await readFile(gist.files[CLOUD_SYNC_CONFIG.FILE_NAME]);
    if (op.householdId !== base.household?.id) return reply({ success: false, message: 'Pembukuan keluarga berbeda; perubahan tetap disimpan di perangkat.' }, 409);
    const filename = `nest-op-${op.id}.json`;
    const content = JSON.stringify(op);
    if (gist.files[filename]) {
      const existing = await readFile(gist.files[filename]);
      if (JSON.stringify(existing) !== content) return reply({ success: false, message: 'Identitas perubahan sudah digunakan.' }, 409);
      return reply({ success: true, operationId: op.id });
    }
    // Each operation gets its own file. Concurrent spouses never replace each other's data.
    const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify({ files: { [filename]: { content } } }) });
    if (!res.ok) throw new Error('Belum tersimpan di cloud; akan dicoba ulang.');
    return reply({ success: true, operationId: op.id });
  } catch (e: any) { return reply({ success: false, message: e.message }, 502); }
}
