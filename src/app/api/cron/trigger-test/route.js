import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    const CRON_SECRET = process.env.CRON_SECRET || 'rkedu_daily_2026';
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized. Invalid secret.' }, { status: 401 });
    }

    const GITHUB_PAT = process.env.GH_PAT || process.env.GITHUB_PAT;
    if (!GITHUB_PAT) {
      return NextResponse.json({
        error: 'Missing GH_PAT in Vercel Environment Variables. Please add a GitHub Personal Access Token.'
      }, { status: 500 });
    }

    const res = await fetch(
      'https://api.github.com/repos/azadnishad627-max/edtechpro-/actions/workflows/daily_auto_test.yml/dispatches',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_PAT}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Vercel-Cron-Dispatcher'
        },
        body: JSON.stringify({ ref: 'main' })
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'GitHub dispatch failed: ' + err }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Daily NMMS test workflow triggered instantly on GitHub Actions!'
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  return GET(req);
}
