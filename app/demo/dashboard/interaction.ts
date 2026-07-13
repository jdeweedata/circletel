export interface PreventableNavigationEvent {
  preventDefault(): void;
}

interface PrototypeNavigationOptions {
  label: string;
  onNavigate: (label: string) => void;
  onMobileClose?: () => void;
}

interface PrototypeNavigationHandlers {
  onClick: (event: PreventableNavigationEvent) => void;
  onAuxClick: (event: PreventableNavigationEvent) => void;
  onContextMenu: (event: PreventableNavigationEvent) => void;
}

export function createPrototypeNavigationHandlers({
  label,
  onNavigate,
  onMobileClose,
}: PrototypeNavigationOptions): PrototypeNavigationHandlers {
  const preventNavigation = (event: PreventableNavigationEvent) => {
    event.preventDefault();
  };

  return {
    onClick: (event) => {
      preventNavigation(event);
      onNavigate(label);
      onMobileClose?.();
    },
    onAuxClick: preventNavigation,
    onContextMenu: preventNavigation,
  };
}
