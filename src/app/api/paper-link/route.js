import { NextResponse } from 'next/server';

const paperCache = globalThis._paperCache || new Map();
globalThis._paperCache = paperCache;

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { paperData } = body;
    if (!paperData) {
      return NextResponse.json({ error: 'Missing paperData' }, { status: 400 });
    }

    const id = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    paperCache.set(id, {
      ...paperData,
      createdAt: Date.now()
    });

    if (paperCache.size > 300) {
      const now = Date.now();
      for (const [k, v] of paperCache.entries()) {
        if (now - (v.createdAt || 0) > 24 * 60 * 60 * 1000) {
          paperCache.delete(k);
        }
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id || !paperCache.has(id)) {
      return NextResponse.json({ error: 'Paper not found or expired' }, { status: 404 });
    }
    const paper = paperCache.get(id);
    return NextResponse.json({ success: true, paperData: paper });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
