import { NextRequest, NextResponse } from 'next/server';

// Self-contained merge logic for provider configs
function mergeApiOptions(provider: string) {
  const baseConfig = {
    provider,
    searchEndpoint: provider === 'flight' 
      ? 'https://affiliate.tektravels.com/FlightAPI' 
      : 'https://affiliate.tektravels.com/HotelAPI',
    bookingEndpoint: provider === 'flight'
      ? 'https://flightbe.tektravels.com'
      : 'https://HotelBE.tektravels.com/hotelservice.svc/rest',
    credentials: { username: 'RasaT', password: 'RasaT@123' }
  };

  // Existing merge pattern: override with env if present
  const envOverride = process.env[`${provider.toUpperCase()}_API_OVERRIDE`];
  if (envOverride) {
    return { ...baseConfig, ...JSON.parse(envOverride) };
  }
  return baseConfig;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (!provider || !['flight', 'hotel'].includes(provider)) {
    return NextResponse.json(
      { error: 'Invalid provider. Use ?provider=flight or ?provider=hotel' },
      { status: 400 }
    );
  }

  const mergedConfig = mergeApiOptions(provider);
  return NextResponse.json(mergedConfig);
}
