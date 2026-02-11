// ============================================
// DESENROLA - Geo Utilities (Server-Side)
// ============================================

// ============================================
// TIMEZONE → BRAZIL STATE MAP
// ============================================

interface BrazilGeo {
  state: string;
  region: string;
  city: string;
}

const BRAZIL_TIMEZONE_MAP: Record<string, BrazilGeo> = {
  'America/Sao_Paulo': { state: 'SP', region: 'Sudeste', city: 'São Paulo' },
  'America/Rio_Branco': { state: 'AC', region: 'Norte', city: 'Rio Branco' },
  'America/Manaus': { state: 'AM', region: 'Norte', city: 'Manaus' },
  'America/Belem': { state: 'PA', region: 'Norte', city: 'Belém' },
  'America/Fortaleza': { state: 'CE', region: 'Nordeste', city: 'Fortaleza' },
  'America/Recife': { state: 'PE', region: 'Nordeste', city: 'Recife' },
  'America/Bahia': { state: 'BA', region: 'Nordeste', city: 'Salvador' },
  'America/Cuiaba': { state: 'MT', region: 'Centro-Oeste', city: 'Cuiabá' },
  'America/Campo_Grande': { state: 'MS', region: 'Centro-Oeste', city: 'Campo Grande' },
  'America/Porto_Velho': { state: 'RO', region: 'Norte', city: 'Porto Velho' },
  'America/Boa_Vista': { state: 'RR', region: 'Norte', city: 'Boa Vista' },
  'America/Araguaina': { state: 'TO', region: 'Norte', city: 'Palmas' },
  'America/Maceio': { state: 'AL', region: 'Nordeste', city: 'Maceió' },
  'America/Noronha': { state: 'PE', region: 'Nordeste', city: 'Fernando de Noronha' },
  'America/Eirunepe': { state: 'AM', region: 'Norte', city: 'Eirunepé' },
  'America/Santarem': { state: 'PA', region: 'Norte', city: 'Santarém' },
  'America/Porto_Acre': { state: 'AC', region: 'Norte', city: 'Porto Acre' },
  'America/Argentina/Buenos_Aires': { state: 'AR', region: 'Internacional', city: 'Buenos Aires' },
};

// Timezones that start with America/ but are in Brazil
const BRAZIL_TZ_PREFIXES = [
  'America/Sao_Paulo', 'America/Bahia', 'America/Fortaleza', 'America/Recife',
  'America/Maceio', 'America/Belem', 'America/Manaus', 'America/Cuiaba',
  'America/Campo_Grande', 'America/Porto_Velho', 'America/Boa_Vista',
  'America/Rio_Branco', 'America/Araguaina', 'America/Noronha',
  'America/Eirunepe', 'America/Santarem', 'America/Porto_Acre',
];

export function resolveTimezoneGeo(timezone?: string): {
  country: string;
  country_name: string;
  state?: string;
  region?: string;
  city?: string;
} | null {
  if (!timezone) return null;

  const brGeo = BRAZIL_TIMEZONE_MAP[timezone];
  if (brGeo) {
    return {
      country: 'BR',
      country_name: 'Brasil',
      state: brGeo.state,
      region: brGeo.region,
      city: brGeo.city,
    };
  }

  // Check if it's a known Brazil timezone not in our map
  if (BRAZIL_TZ_PREFIXES.some((p) => timezone.startsWith(p))) {
    return {
      country: 'BR',
      country_name: 'Brasil',
    };
  }

  // Infer country from timezone prefix
  const tzCountryMap: Record<string, { country: string; country_name: string }> = {
    'America/': { country: 'US', country_name: 'Americas' },
    'Europe/': { country: 'EU', country_name: 'Europa' },
    'Asia/': { country: 'AS', country_name: 'Ásia' },
    'Africa/': { country: 'AF', country_name: 'África' },
    'Australia/': { country: 'AU', country_name: 'Austrália' },
    'Pacific/': { country: 'OC', country_name: 'Oceania' },
  };

  for (const [prefix, geo] of Object.entries(tzCountryMap)) {
    if (timezone.startsWith(prefix)) return geo;
  }

  return null;
}

// ============================================
// IP GEOLOCATION (with in-memory cache)
// ============================================

interface IPGeoData {
  country: string;
  country_name: string;
  region?: string;
  city?: string;
}

const geoCache = new Map<string, { data: IPGeoData | null; expires: number }>();
const CACHE_TTL = 3600000; // 1 hour

export async function lookupIP(ip: string): Promise<IPGeoData | null> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return null;

  const cached = geoCache.get(ip);
  if (cached && cached.expires > Date.now()) return cached.data;

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=country,countryCode,regionName,city,timezone`,
      { signal: AbortSignal.timeout(2000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (data.countryCode) {
      const result: IPGeoData = {
        country: data.countryCode,
        country_name: data.country,
        region: data.regionName,
        city: data.city,
      };
      geoCache.set(ip, { data: result, expires: Date.now() + CACHE_TTL });
      return result;
    }
    geoCache.set(ip, { data: null, expires: Date.now() + CACHE_TTL });
    return null;
  } catch {
    return null;
  }
}

// ============================================
// EXTRACT IP FROM REQUEST
// ============================================

export function extractIP(headers: Headers): string {
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

export function maskIP(ip: string): string {
  if (ip === 'unknown') return ip;
  const lastDot = ip.lastIndexOf('.');
  if (lastDot === -1) return ip;
  return ip.substring(0, lastDot) + '.x';
}
