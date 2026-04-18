import { NextResponse } from 'next/server';

export async function GET() {
  // Return an empty list for now as we don't have a Client model yet
  return NextResponse.json({ data: [] });
}
