export interface GeoData {
  ip: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  isp: string;
}

// A collection of real worldwide test IPs to rotate through in local development
// so that charts, lists, and Leaflet maps are filled with gorgeous global markers.
const TEST_IPS = [
  { ip: '8.8.8.8', lat: 22.5726, lon: 88.3639, city: 'Kolkata', country: 'India', isp: 'Alliance Broadband Services' },
  { ip: '103.211.228.1', lat: 19.076, lon: 72.877, city: 'Mumbai', country: 'India', isp: 'Reliance Jio Infocomm' },
  { ip: '185.220.101.4', lat: 52.52, lon: 13.405, city: 'Berlin', country: 'Germany', isp: 'M247 Ltd' },
  { ip: '210.140.10.10', lat: 35.676, lon: 139.65, city: 'Tokyo', country: 'Japan', isp: 'Softbank Corp' },
  { ip: '200.221.2.45', lat: -23.55, lon: -46.633, city: 'Sao Paulo', country: 'Brazil', isp: 'Universo Online S.A.' },
  { ip: '41.72.192.1', lat: -26.204, lon: 28.047, city: 'Johannesburg', country: 'South Africa', isp: 'Vodacom Group' },
  { ip: '101.32.22.44', lat: 22.396, lon: 114.109, city: 'Tsuen Wan', country: 'Hong Kong', isp: 'Tencent Building' }
];

let testIpIndex = 0;

/**
 * Extracts the client IP address from request headers.
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

/**
 * Looks up Geolocation & ISP info for a given IP.
 * Uses ip-api.com as the main engine with custom rotation fallbacks for local/private IPs.
 */
export async function lookupIP(ip: string): Promise<GeoData> {
  const sanitizedIp = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' ? '' : ip;

  // Local development fallback
  if (!sanitizedIp) {
    const mock = TEST_IPS[testIpIndex];
    // Rotate through mock IPs for richer visual maps during local testing
    testIpIndex = (testIpIndex + 1) % TEST_IPS.length;
    return { ...mock };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${sanitizedIp}?fields=status,message,country,city,lat,lon,isp,query`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 } // Cache results for an hour
    });
    const data = await res.json();

    if (data && data.status === 'success') {
      return {
        ip: data.query || sanitizedIp,
        lat: data.lat || 0,
        lon: data.lon || 0,
        city: data.city || 'Unknown City',
        country: data.country || 'Unknown Country',
        isp: data.isp || 'Unknown ISP',
      };
    }
  } catch (error) {
    console.error('IP Geolocation Fetch Error:', error);
  }

  // Backup fallback in case API fails or rate-limits
  return {
    ip: sanitizedIp,
    lat: 22.5726,
    lon: 88.3639,
    city: 'Kolkata',
    country: 'India',
    isp: 'Alliance Broadband Services'
  };
}
