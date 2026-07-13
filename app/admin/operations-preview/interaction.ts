export interface PreventableNavigationEvent {
  preventDefault(): void;
}

interface PreviewNavigationOptions {
  label: string;
  onNavigate: (label: string) => void;
  onMobileClose?: () => void;
}

/** Spread these props onto a button, never an anchor with a production href. */
export interface PreviewNavigationButtonHandlers {
  type: "button";
  draggable: false;
  onClick: (event: PreventableNavigationEvent) => void;
  onAuxClick: (event: PreventableNavigationEvent) => void;
  onContextMenu: (event: PreventableNavigationEvent) => void;
  onDragStart: (event: PreventableNavigationEvent) => void;
}

export function createPreviewNavigationHandlers({
  label,
  onNavigate,
  onMobileClose,
}: PreviewNavigationOptions): PreviewNavigationButtonHandlers {
  const preventNavigation = (event: PreventableNavigationEvent) => {
    event.preventDefault();
  };

  return {
    type: "button",
    draggable: false,
    onClick: (event) => {
      preventNavigation(event);
      onNavigate(label);
      onMobileClose?.();
    },
    onAuxClick: preventNavigation,
    onContextMenu: preventNavigation,
    onDragStart: preventNavigation,
  };
}
