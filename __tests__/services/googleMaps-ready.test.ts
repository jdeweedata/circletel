import { waitForGoogleMapsApi } from '@/services/googleMaps';

describe('waitForGoogleMapsApi', () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).google;
  });

  it('waits until importLibrary has attached the Map constructor', async () => {
    const importLibrary = jest.fn(async (name: string) => {
      if (name === 'maps') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function
        (globalThis as any).google.maps.Map = function Map() {};
      }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).google = { maps: { importLibrary } };

    await waitForGoogleMapsApi(1000);

    expect(importLibrary).toHaveBeenCalledWith('maps');
    expect(typeof (globalThis as unknown as Window).google.maps.Map).toBe('function');
  });
});
