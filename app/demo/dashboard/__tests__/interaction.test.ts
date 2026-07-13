import { createPrototypeNavigationHandlers } from '../interaction';

describe('CircleTel operations dashboard navigation interactions', () => {
  const createEvent = () => ({ preventDefault: jest.fn() });

  it('contains ordinary activation and invokes prototype feedback once', () => {
    const event = createEvent();
    const onNavigate = jest.fn();
    const onMobileClose = jest.fn();
    const handlers = createPrototypeNavigationHandlers({
      label: 'Customers',
      onNavigate,
      onMobileClose,
    });

    handlers.onClick(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('Customers');
    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });

  it.each(['onAuxClick', 'onContextMenu'] as const)(
    'contains %s activation without invoking prototype feedback',
    (handlerName) => {
      const event = createEvent();
      const onNavigate = jest.fn();
      const onMobileClose = jest.fn();
      const handlers = createPrototypeNavigationHandlers({
        label: 'Customers',
        onNavigate,
        onMobileClose,
      });

      handlers[handlerName](event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(onNavigate).not.toHaveBeenCalled();
      expect(onMobileClose).not.toHaveBeenCalled();
    }
  );
});
