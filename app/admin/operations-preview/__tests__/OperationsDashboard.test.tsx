import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import type { OperationsPreviewData } from "@/lib/admin/operations-preview/types";
import { OperationsDashboard } from "../OperationsDashboard";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const DATA: OperationsPreviewData = {
  generatedAt: "2026-07-13T10:00:00.000Z",
  source: "production",
  timeZone: "Africa/Johannesburg",
  kpis: {
    activeCustomers: 25,
    activeMrrCents: 1_244_600,
    openTickets: 8,
    needsAttention: 8,
    networkIncidents: 0,
    servicesImpacted: 0,
  },
  growth: Array.from({ length: 12 }, (_, index) => ({
    month: new Date(Date.UTC(2025, 7 + index, 1)).toISOString().slice(0, 7),
    label: `M${index + 1}`,
    totalCustomers: index + 1,
    billedCents: (index + 1) * 10_000,
  })),
  operations: {
    scheduledInstalls: 2,
    ordersInProgress: 17,
    priorityTickets: 8,
    availableTechnicians: 1,
  },
  finance: {
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    billedCents: 100_000,
    collectedCents: 75_000,
    outstandingCents: 25_000,
    paidInvoices: 3,
  },
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    <img {...props} />
  ),
}));

jest.mock("recharts", () => {
  const Wrapper = ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  );

  return {
    ResponsiveContainer: Wrapper,
    CartesianGrid: Wrapper,
    Line: Wrapper,
    LineChart: Wrapper,
    XAxis: Wrapper,
    YAxis: Wrapper,
    Tooltip: Wrapper,
  };
});

jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: React.PropsWithChildren) => children,
  Tooltip: ({ children }: React.PropsWithChildren) => children,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => children,
  TooltipContent: ({ children }: React.PropsWithChildren) => (
    <span>{children}</span>
  ),
}));

jest.mock("@/components/ui/sidebar", () => {
  const Div = ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  );
  const List = ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <ul {...props}>{children}</ul>
  );
  const Item = ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <li {...props}>{children}</li>
  );
  const Button = ({
    children,
    asChild,
    isActive: _isActive,
    tooltip: _tooltip,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) =>
    asChild ? children : <button {...props}>{children}</button>;
  const SubButton = ({
    children,
    asChild,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) =>
    asChild && React.isValidElement(children) ? (
      React.cloneElement(children, props)
    ) : (
      <button {...props}>{children}</button>
    );

  return {
    Sidebar: Div,
    SidebarContent: Div,
    SidebarFooter: Div,
    SidebarGroup: Div,
    SidebarGroupContent: Div,
    SidebarGroupLabel: Div,
    SidebarHeader: Div,
    SidebarInset: Div,
    SidebarMenu: List,
    SidebarMenuAction: Button,
    SidebarMenuButton: Button,
    SidebarMenuItem: Item,
    SidebarMenuSub: List,
    SidebarMenuSubButton: SubButton,
    SidebarMenuSubItem: Item,
    SidebarProvider: Div,
    SidebarRail: Button,
    SidebarSeparator: Div,
    SidebarTrigger: Button,
    useSidebar: () => ({
      isMobile: false,
      state: "expanded",
      setOpen: jest.fn(),
      setOpenMobile: jest.fn(),
    }),
  };
});

jest.mock("@/components/ui/collapsible", () => {
  const Context = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>({ open: false, onOpenChange: () => undefined });

  return {
    Collapsible: ({
      children,
      open,
      onOpenChange,
    }: React.PropsWithChildren<{
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }>) => (
      <Context.Provider value={{ open, onOpenChange }}>
        <div data-state={open ? "open" : "closed"}>{children}</div>
      </Context.Provider>
    ),
    CollapsibleTrigger: ({
      children,
      asChild: _asChild,
    }: React.PropsWithChildren<{ asChild?: boolean }>) => {
      const { open, onOpenChange } = React.useContext(Context);

      return React.isValidElement(children)
        ? React.cloneElement(children, {
            onClick: () => onOpenChange(!open),
          } as Record<string, unknown>)
        : children;
    },
    CollapsibleContent: ({ children }: React.PropsWithChildren) => {
      const { open } = React.useContext(Context);
      return open ? <div>{children}</div> : null;
    },
  };
});

jest.mock("@/components/ui/tabs", () => {
  const Context = React.createContext<{
    value: string;
    setValue: (value: string) => void;
  }>({ value: "", setValue: () => undefined });

  return {
    Tabs: ({
      children,
      defaultValue,
      ...props
    }: React.PropsWithChildren<{ defaultValue: string }>) => {
      const [value, setValue] = React.useState(defaultValue);
      return (
        <Context.Provider value={{ value, setValue }}>
          <div {...props}>{children}</div>
        </Context.Provider>
      );
    },
    TabsList: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    TabsTrigger: ({
      children,
      value,
      ...props
    }: React.PropsWithChildren<{ value: string }>) => {
      const context = React.useContext(Context);
      return (
        <button {...props} onClick={() => context.setValue(value)}>
          {children}
        </button>
      );
    },
    TabsContent: ({
      children,
      value,
      ...props
    }: React.PropsWithChildren<{ value: string }>) => {
      const context = React.useContext(Context);
      return context.value === value ? <div {...props}>{children}</div> : null;
    },
  };
});

jest.mock("@/components/ui/toggle-group", () => {
  const Context = React.createContext<{
    onValueChange: (value: string) => void;
  }>({ onValueChange: () => undefined });

  return {
    ToggleGroup: ({
      children,
      onValueChange,
      value: _value,
      type: _type,
      variant: _variant,
      size: _size,
      ...props
    }: React.PropsWithChildren<{
      onValueChange: (value: string) => void;
      value: string;
      type: string;
      variant?: string;
      size?: string;
    }>) => (
      <Context.Provider value={{ onValueChange }}>
        <div {...props}>{children}</div>
      </Context.Provider>
    ),
    ToggleGroupItem: ({
      children,
      value,
      ...props
    }: React.PropsWithChildren<{ value: string }>) => {
      const { onValueChange } = React.useContext(Context);
      return (
        <button {...props} onClick={() => onValueChange(value)}>
          {children}
        </button>
      );
    },
  };
});

function textOf(node: TestRenderer.ReactTestInstance): string {
  return node.children
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : textOf(child),
    )
    .join("");
}

function renderDashboard(overrides?: {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(
      <OperationsDashboard
        data={DATA}
        onRefresh={overrides?.onRefresh ?? jest.fn()}
        isRefreshing={overrides?.isRefreshing ?? false}
      />,
    );
  });

  return renderer;
}

describe("OperationsDashboard", () => {
  it("renders production/read-only labels and disables every workflow action", () => {
    const renderer = renderDashboard();
    const renderedText = textOf(renderer.root);

    expect(renderedText).toContain("Production data");
    expect(renderedText).toContain("Read-only preview");
    expect(renderedText).toContain("Active MRR");
    expect(renderedText).toContain("Total customers");
    expect(renderedText).toContain("Billed revenue");

    const disabledActions = renderer.root.findAll(
      (node) =>
        node.type === "button" && node.props["aria-disabled"] === "true",
    );
    expect(disabledActions).toHaveLength(7);
    expect(disabledActions.every((node) => node.props.disabled === true)).toBe(
      true,
    );
    expect(
      disabledActions.every((node) => textOf(node).includes("Preview only")),
    ).toBe(true);
    expect(
      disabledActions.every((node) => node.props.onClick === undefined),
    ).toBe(true);
  });

  it("keeps refresh as the enabled data action and exposes its busy state", () => {
    const onRefresh = jest.fn();
    const renderer = renderDashboard({ onRefresh });
    const refresh = renderer.root.findByProps({
      "aria-label": "Refresh production data",
    });

    expect(refresh.props.disabled).not.toBe(true);
    act(() => refresh.props.onClick());
    expect(onRefresh).toHaveBeenCalledTimes(1);

    act(() => {
      renderer.update(
        <OperationsDashboard data={DATA} onRefresh={onRefresh} isRefreshing />,
      );
    });
    const refreshing = renderer.root.findByProps({
      "aria-label": "Refresh production data",
    });
    expect(refreshing.props.disabled).toBe(true);
    expect(textOf(refreshing)).toContain("Refreshing");
  });

  it("renders production navigation as contained buttons without hrefs", () => {
    const renderer = renderDashboard();
    const productionButtons = renderer.root.findAll(
      (node) =>
        node.type === "button" &&
        typeof node.props["data-preview-item"] === "string",
    );

    expect(productionButtons.length).toBeGreaterThan(0);
    const customerButton = productionButtons.find(
      (node) => node.props["data-preview-href"] === "/admin/customers",
    );
    const b2bParentButton = productionButtons.find(
      (node) => node.props["data-preview-item"] === "B2B Customers",
    );
    expect(customerButton).toBeDefined();
    expect(b2bParentButton).toBeDefined();
    expect(b2bParentButton!.props["data-preview-href"]).toBeUndefined();
    expect(renderer.root.findAllByType("a")).toHaveLength(0);

    for (const button of productionButtons) {
      expect(button.props.type).toBe("button");
      expect(button.props.draggable).toBe(false);
      expect(button.props.href).toBeUndefined();
      expect(button.props.onClick).toEqual(expect.any(Function));
      expect(button.props.onAuxClick).toEqual(expect.any(Function));
      expect(button.props.onContextMenu).toEqual(expect.any(Function));
      expect(button.props.onDragStart).toEqual(expect.any(Function));
    }

    act(() => customerButton!.props.onClick({ preventDefault: jest.fn() }));
    expect(textOf(renderer.root)).toContain(
      "Customers is available in the production admin and remains contained in this read-only preview.",
    );
  });

  it("expands nested production groups and contains child activation", () => {
    const renderer = renderDashboard();
    const disclosure = renderer.root.findByProps({
      "aria-label": "Expand B2B Customers",
    });

    expect(disclosure.props["aria-expanded"]).toBe(false);
    act(() => disclosure.props.onClick({ preventDefault: jest.fn() }));

    const expandedDisclosure = renderer.root.findByProps({
      "aria-label": "Collapse B2B Customers",
    });
    expect(expandedDisclosure.props["aria-expanded"]).toBe(true);
    const child = renderer.root.findByProps({
      "data-preview-href": "/admin/b2b/vetting",
    });
    expect(child.type).toBe("button");
    expect(child.props.href).toBeUndefined();
    expect(child.props.type).toBe("button");
    expect(child.props.draggable).toBe(false);
    expect(child.props.onClick).toEqual(expect.any(Function));
    expect(child.props.onAuxClick).toEqual(expect.any(Function));
    expect(child.props.onContextMenu).toEqual(expect.any(Function));
    expect(child.props.onDragStart).toEqual(expect.any(Function));
  });

  it("switches the chart between the six and twelve month source series", () => {
    const renderer = renderDashboard();

    expect(
      renderer.root.findByProps({ "data-growth-points": 6 }),
    ).toBeDefined();
    const twelveMonths = renderer.root
      .findAllByProps({ "aria-label": "12 months" })
      .find((node) => node.type === "button");
    expect(twelveMonths).toBeDefined();
    act(() => twelveMonths!.props.onClick());
    expect(
      renderer.root.findByProps({ "data-growth-points": 12 }),
    ).toBeDefined();
  });

  it("switches the command center from operations to finance rows", () => {
    const renderer = renderDashboard();
    expect(textOf(renderer.root)).toContain("Scheduled installs");
    expect(textOf(renderer.root)).not.toContain("Paid invoices");

    const financeTab = renderer.root
      .findAll((node) => node.type === "button" && textOf(node) === "Finance")
      .at(0);
    expect(financeTab).toBeDefined();
    act(() => financeTab!.props.onClick());

    expect(textOf(renderer.root)).toContain("Billed");
    expect(textOf(renderer.root)).toContain("Paid invoices");
    expect(textOf(renderer.root)).not.toContain("Scheduled installs");
  });
});
