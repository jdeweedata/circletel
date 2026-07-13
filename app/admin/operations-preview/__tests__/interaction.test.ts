import { createPreviewNavigationHandlers } from "../interaction";

describe("CircleTel read-only preview navigation interactions", () => {
  const createEvent = () => ({ preventDefault: jest.fn() });

  it("contains ordinary activation and invokes preview feedback once", () => {
    const event = createEvent();
    const onNavigate = jest.fn();
    const onMobileClose = jest.fn();
    const handlers = createPreviewNavigationHandlers({
      label: "Customers",
      onNavigate,
      onMobileClose,
    });

    handlers.onClick(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("Customers");
    expect(onMobileClose).toHaveBeenCalledTimes(1);
  });

  it.each(["onAuxClick", "onContextMenu"] as const)(
    "contains %s activation without invoking preview feedback",
    (handlerName) => {
      const event = createEvent();
      const onNavigate = jest.fn();
      const onMobileClose = jest.fn();
      const handlers = createPreviewNavigationHandlers({
        label: "Customers",
        onNavigate,
        onMobileClose,
      });

      handlers[handlerName](event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(onNavigate).not.toHaveBeenCalled();
      expect(onMobileClose).not.toHaveBeenCalled();
    },
  );
});
