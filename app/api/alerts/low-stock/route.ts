import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendLowStockEmail } from '../../../../lib/alerts/email-notifier';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gmailUser = searchParams.get('gmailUser');
  const gmailPass = searchParams.get('gmailPass');
  const recipient = searchParams.get('recipient');
  const shopName = searchParams.get('shopName') || 'HIPAK Vape Shop';

  if (!gmailUser || !gmailPass || !recipient) {
    return NextResponse.json({ error: 'Missing Gmail credentials or recipient' }, { status: 400 });
  }

  const result = await checkAndSendLowStockEmail(
    gmailUser,
    gmailPass,
    recipient,
    shopName
  );

  return NextResponse.json(result);
}

// Test with curl or fetch:
// GET /api/alerts/low-stock?gmailUser=your@gmail.com&gmailPass=apppass&recipient=store@gmail.com

