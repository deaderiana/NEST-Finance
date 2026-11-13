import { NextResponse } from 'next/server';
import { CLOUD_SYNC_CONFIG } from '@/lib/syncConfig';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/sync
 * Ambil data sinkronisasi keluarga terkini dari Cloud Storage (GitHub Gist terenkripsi/privat).
 */
export async function GET() {
  try {
    const response = await fetch(
      `https://api.github.com/gists/${CLOUD_SYNC_CONFIG.GIST_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `token ${CLOUD_SYNC_CONFIG.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'NEST-Finance-CloudSync',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Sync API] GitHub Gist GET failed:', response.status, errText);
      return NextResponse.json(
        { success: false, message: `Gagal membaca cloud storage: ${response.statusText}` },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const gistData = await response.json();
    const fileObj = gistData.files?.[CLOUD_SYNC_CONFIG.FILE_NAME];

    if (!fileObj || !fileObj.content) {
      return NextResponse.json(
        { success: false, message: 'Belum ada data keluarga di cloud' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    try {
      const parsed = JSON.parse(fileObj.content);
      return NextResponse.json(
        {
          success: true,
          data: parsed,
          updatedAt: parsed.updatedAt || gistData.updated_at,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    } catch (parseErr) {
      console.error('[Sync API] Failed to parse gist content JSON:', parseErr);
      return NextResponse.json(
        { success: false, message: 'Format data cloud tidak valid' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  } catch (error: any) {
    console.error('[Sync API] GET unexpected error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal Server Error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

/**
 * POST /api/sync
 * Simpan / perbarui seluruh data pembukuan keluarga ke Cloud Storage.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Payload harus berupa JSON yang valid' },
        { status: 400 }
      );
    }

    // Pastikan timestamp pembaruan tersemat
    const enrichedPayload = {
      ...payload,
      updatedAt: payload.updatedAt || new Date().toISOString(),
      serverSyncedAt: new Date().toISOString(),
    };

    const response = await fetch(
      `https://api.github.com/gists/${CLOUD_SYNC_CONFIG.GIST_ID}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `token ${CLOUD_SYNC_CONFIG.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'NEST-Finance-CloudSync',
        },
        body: JSON.stringify({
          files: {
            [CLOUD_SYNC_CONFIG.FILE_NAME]: {
              content: JSON.stringify(enrichedPayload, null, 2),
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Sync API] GitHub Gist PATCH failed:', response.status, errText);
      return NextResponse.json(
        { success: false, message: `Gagal menyimpan ke cloud: ${response.statusText}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data keluarga berhasil disinkronkan ke cloud secara real-time!',
      updatedAt: enrichedPayload.updatedAt,
    });
  } catch (error: any) {
    console.error('[Sync API] POST unexpected error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
