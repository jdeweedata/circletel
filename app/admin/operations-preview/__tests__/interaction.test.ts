import { createPreviewNavigationHandlers } from "../interaction";

describe("CircleTel read-only preview navigation interactions", () => {
  const createEvent = (details: Record<string, unknown> = {}) => ({
    preventDefault: jest.fn(),
    ...details,
  });

  it.each([
    ["pointer", { detail: 1 }],
    ["keyboard-style", { detail: 0 }],
    ["modified", { detail: 1, ctrlKey: true }],
  ])(
    "contains %s ordinary activation and invokes preview feedback once",
    (_activationKind, eventDetails) => {
      const event = createEvent(eventDetails);
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
    },
  );

  it("returns props for an inert button rather than a production anchor", () => {
    const handlers = createPreviewNavigationHandlers({
      label: "Customers",
      onNavigate: jest.fn(),
    });

    expect(handlers.type).toBe("button");
    expect(handlers.draggable).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(handlers, "href")).toBe(false);
  });

  it.each(["onAuxClick", "onContextMenu", "onDragStart"] as const)(
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
