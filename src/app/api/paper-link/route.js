import { NextResponse } from 'next/server';
import zlib from 'zlib';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { paperData } = body;
    if (!paperData) {
      return NextResponse.json({ error: 'Missing paperData' }, { status: 400 });
    }

    // Compress paper data to a URL-safe base64 string
    const jsonStr = JSON.stringify(paperData);
    const compressed = zlib.deflateSync(Buffer.from(jsonStr, 'utf8'));
    const token = compressed.toString('base64url');

    return NextResponse.json({ success: true, token, id: token });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
