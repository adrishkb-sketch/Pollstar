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
import ssl

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
last_err_time = 0

def check_sms():
    global last_err_time
    try:
        # Run termux-sms-list to get last 10 messages
        res = subprocess.run(["termux-sms-list", "-l", "10"], capture_output=True, text=True)
        if res.returncode != 0:
            err_msg = res.stderr.strip() if res.stderr else "Unknown error"
            if time.time() - last_err_time > 10:
                print(f"\n[WARNING] termux-sms-list returned non-zero code: {err_msg}")
                print("Make sure Termux:API app is installed from F-Droid and has SMS permissions.")
                last_err_time = time.time()
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
                print(f"\n[SMS RECEIVED] From {msg_sender}: {msg_body.strip()}")
                
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
                    # Ignore SSL certificate checks to support localhost/ngrok tests
                    ctx = ssl._create_unverified_context()
                    with urllib.request.urlopen(req_obj, context=ctx) as response:
                        res_body = response.read().decode('utf-8')
                        print(f" -> Forwarded. Server says: {res_body}")
                except Exception as e:
                    print(f" -> Failed to send to server: {e}")
            
            seen_ids.add(msg_id)
    except FileNotFoundError:
        if time.time() - last_err_time > 10:
            print("\n[ERROR] 'termux-sms-list' executable not found!")
            print("Please run: pkg install termux-api -y")
            print("Also install 'Termux:API' app from F-Droid: https://f-droid.org/packages/com.termux.api/")
            last_err_time = time.time()
    except Exception as e:
        if time.time() - last_err_time > 10:
            print(f"\n[ERROR] Exception in SMS gateway loop: {e}")
            last_err_time = time.time()

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
