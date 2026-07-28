import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { title, message, url } = await request.json();

    const appId = "1591c724-f17d-4586-9259-da31b2d47083";
    const apiKey = process.env.ONESIGNAL_API_KEY;

    if (!apiKey) {
      console.warn('ONESIGNAL_API_KEY is not set. Skipping push notification.');
      return NextResponse.json({ success: true, message: 'Skipped (no key)' });
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Subscribed Users'],
        headings: { en: title || 'New Notification' },
        contents: { en: message },
        url: url || 'https://edtechpro.vercel.app',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OneSignal Error:', data);
      return NextResponse.json({ error: 'Failed to send notification' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
