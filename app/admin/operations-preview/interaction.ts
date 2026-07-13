export interface PreventableNavigationEvent {
  preventDefault(): void;
}

interface PreviewNavigationOptions {
  label: string;
  onNavigate: (label: string) => void;
  onMobileClose?: () => void;
}

interface PreviewNavigationHandlers {
  onClick: (event: PreventableNavigationEvent) => void;
  onAuxClick: (event: PreventableNavigationEvent) => void;
  onContextMenu: (event: PreventableNavigationEvent) => void;
}

export function createPreviewNavigationHandlers({
  label,
  onNavigate,
  onMobileClose,
}: PreviewNavigationOptions): PreviewNavigationHandlers {
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
