import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone') || '';

    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const serverUrl = `${protocol}://${host}`;

    const pythonScript = `#!/usr/bin/env python3
import subprocess
import json
import time
import urllib.request
import urllib.parse

# Pollstar Android Termux SMS Gateway
# Pre-configured for gateway phone: ${phone}
# Requires Termux, Termux-API app, and termux-api packages installed.
# Install inside Termux: pkg install termux-api python -y

API_URL = "${serverUrl}/api/webhooks/sms"
CREATOR_PHONE = "${phone}"

print("=== Pollstar SMS Gateway Starting ===")
print(f"Monitoring SMS for Creator Phone: {CREATOR_PHONE}")
print(f"Forwarding target: {API_URL}")
print("Waiting for incoming messages... Press Ctrl+C to stop.")

seen_ids = set()

def check_sms():
    try:
        # Run termux-sms-list to get last 10 messages
        res = subprocess.run(["termux-sms-list", "-l", "10"], capture_output=True, text=True)
        if res.returncode != 0:
            # Silently handle if termux-api tool isn't set up yet
            return
        messages = json.loads(res.stdout)
        for msg in messages:
            msg_id = msg.get("_id")
            if not msg_id:
                continue
                
            # If we've seen this message ID, ignore it
            if msg_id in seen_ids:
                continue
                
            msg_body = msg.get("body", "")
            msg_sender = msg.get("number", "")
            
            # Check for standard tokens
            msg_upper = msg_body.upper()
            if any(t in msg_upper for t in ["#VOTE-", "#EXAM-", "#SURVEY-", "#TEST-"]):
                print(f"\\n[SMS RECEIVED] From {msg_sender}: {msg_body.strip()}")
                
                # Forward to Next.js API endpoint
                payload = json.dumps({
                    "sender": msg_sender,
                    "text": msg_body.strip(),
                    "creatorPhone": CREATOR_PHONE
                }).encode('utf-8')
                
                req_obj = urllib.request.Request(
                    API_URL,
                    data=payload,
                    headers={'Content-Type': 'application/json'}
                )
                try:
                    with urllib.request.urlopen(req_obj) as response:
                        res_body = response.read().decode('utf-8')
                        print(f" -> Forwarded. Server says: {res_body}")
                except Exception as e:
                    print(f" -> Failed to send to server: {e}")
            
            seen_ids.add(msg_id)
    except Exception as e:
        pass

# Populate seen_ids with existing messages first to avoid double processing historical SMS
try:
    res = subprocess.run(["termux-sms-list", "-l", "10"], capture_output=True, text=True)
    if res.returncode == 0:
        for m in json.loads(res.stdout):
            if m.get("_id"):
                seen_ids.add(m.get("_id"))
except:
    pass

while True:
    check_sms()
    time.sleep(2)
`;

    // Return python file as download
    return new NextResponse(pythonScript, {
      headers: {
        'Content-Type': 'text/x-python',
        'Content-Disposition': 'attachment; filename="pollstar-gateway.py"',
      },
    });

  } catch (error: any) {
    console.error('Download SMS Gateway Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
