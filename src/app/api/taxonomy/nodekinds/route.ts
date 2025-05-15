process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { NextResponse } from 'next/server';

export async function GET() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_DISCOVERY_API_URL || '';
  const token = process.env.NEXT_PUBLIC_DISCOVERY_API_TOKEN || '';

  try {
    const res = await fetch(`${apiBaseUrl}/taxonomy/nodekinds`, {
      headers: token ? { 'Authorization': token } : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Discovery API error:", res.status, text);
      return NextResponse.json({ error: 'Failed to fetch node kinds', details: text }, { status: res.status });
    }
    const data = await res.json();
    console.log(data);
    // Wrap array response in { nodeKinds: [...] }
    if (Array.isArray(data)) {
      return NextResponse.json({ nodeKinds: data });
    }
    if (data.nodeKinds) {
      return NextResponse.json({ nodeKinds: data.nodeKinds });
    }
    return NextResponse.json({ nodeKinds: [] });
  } catch (err) {
    console.error("NodeKinds API error:", err);
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
} 