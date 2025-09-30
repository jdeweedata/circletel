import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!googleMapsApiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Call Google Geocoding API
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=za&key=${googleMapsApiKey}`;

    const response = await fetch(geocodingUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'Unable to geocode address' },
        { status: 404 }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Extract address components
    const addressComponents: any = {};
    result.address_components.forEach((component: any) => {
      const types = component.types;
      if (types.includes('street_number')) {
        addressComponents.street_number = component.long_name;
      } else if (types.includes('route')) {
        addressComponents.route = component.long_name;
      } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
        addressComponents.sublocality = component.long_name;
      } else if (types.includes('locality')) {
        addressComponents.locality = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressComponents.province = component.long_name;
      } else if (types.includes('postal_code')) {
        addressComponents.postal_code = component.long_name;
      }
    });

    return NextResponse.json({
      latitude: location.lat,
      longitude: location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      address_components: addressComponents
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}