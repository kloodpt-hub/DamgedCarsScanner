import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import {
  NotificationDrawerProvider,
  useNotificationDrawer,
} from "@/components/shared/NotificationDrawer";

const csrfToken = "test-csrf-token";

const recentItem = {
  id: "listing-1",
  title: "Audi A4 2015",
  price: 12500,
  year: 2015,
  mileage: 120000,
  damageStatus: "front damage",
  canonicalUrl: "https://example.com/audi-a4",
  imageUrl: null,
  sourceName: "Mobile.de",
  createdAt: new Date().toISOString(),
  isRead: false,
};

const livePayload = {
  listingId: "listing-9",
  title: "BMW 320i 2018",
  price: 18500,
  year: 2018,
  mileage: 98000,
  sourceName: "AutoScout24",
  imageUrl: null,
  url: "https://example.com/bmw-320i",
};

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  };
}

function mockFetch({
  recent = [recentItem],
  unreadCount = 1,
}: {
  recent?: typeof recentItem[];
  unreadCount?: number;
} = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/notifications/read") && init?.method === "POST") {
      return jsonResponse({ success: true });
    }
    if (url.includes("/api/notifications/unread-count")) {
      return jsonResponse({ unreadCount, recent });
    }
    if (url.includes("/api/auth/csrf")) {
      return jsonResponse({ csrfToken });
    }
    return jsonResponse({});
  });
}

let serviceWorkerHandler: ((event: MessageEvent) => void) | null = null;

function installServiceWorkerMock() {
  const addEventListener = vi.fn(
    (type: string, cb: (event: MessageEvent) => void) => {
      if (type === "message") serviceWorkerHandler = cb;
    }
  );
  const removeEventListener = vi.fn(() => {});
  Object.defineProperty(navigator, "serviceWorker", {
    value: { addEventListener, removeEventListener },
    configurable: true,
  });
}

function dispatchOpenNotification() {
  return act(async () => {
    serviceWorkerHandler?.(
      new MessageEvent("message", {
        data: { type: "OPEN_NOTIFICATION", payload: livePayload },
      })
    );
  });
}

function Harness({ locale = "en" }: { locale?: string }) {
  const { open, close, toggle, unreadCount } = useNotificationDrawer();
  return (
    <div>
      <button onClick={open}>open drawer</button>
      <button onClick={close}>close drawer</button>
      <button onClick={toggle}>toggle drawer</button>
      <span data-testid="unread">{unreadCount}</span>
      <span data-testid="locale">{locale}</span>
    </div>
  );
}

function renderApp(locale = "en") {
  return render(
    <NotificationDrawerProvider locale={locale}>
      <Harness locale={locale} />
    </NotificationDrawerProvider>
  );
}

function getDialog() {
  return screen.getByRole("dialog", { hidden: true });
}

describe("NotificationDrawer", () => {
  beforeEach(() => {
    serviceWorkerHandler = null;
    installServiceWorkerMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("throws when used outside of the provider", () => {
    expect(() => render(<Harness />)).toThrow(/NotificationDrawerProvider/);
  });

  it("opens and closes the drawer from the hook", async () => {
    vi.stubGlobal("fetch", mockFetch());
    renderApp();
    const dialog = getDialog();
    expect(dialog).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(screen.getByText("open drawer"));
    expect(dialog).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close notifications"));
    expect(dialog).toHaveAttribute("aria-hidden", "true");
  });

  it("toggles the drawer open and closed from the hook", async () => {
    vi.stubGlobal("fetch", mockFetch());
    renderApp();
    const dialog = getDialog();
    const toggleButton = screen.getByText("toggle drawer");
    expect(dialog).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(toggleButton);
    expect(dialog).toHaveAttribute("aria-hidden", "false");
    fireEvent.click(toggleButton);
    expect(dialog).toHaveAttribute("aria-hidden", "true");
  });

  it("closes the drawer on Escape when open", async () => {
    vi.stubGlobal("fetch", mockFetch());
    renderApp();
    const dialog = getDialog();
    fireEvent.click(screen.getByText("open drawer"));
    expect(dialog).toHaveAttribute("aria-hidden", "false");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(dialog).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes the unread count from the API", async () => {
    vi.stubGlobal("fetch", mockFetch({ unreadCount: 42 }));
    renderApp();
    await waitFor(() =>
      expect(screen.getByTestId("unread")).toHaveTextContent("42")
    );
  });

  it("opens the drawer with a live item when the service worker posts OPEN_NOTIFICATION", async () => {
    vi.stubGlobal("fetch", mockFetch());
    renderApp();
    await dispatchOpenNotification();
    expect(getDialog()).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText("BMW 320i 2018")).toBeInTheDocument();
    expect(screen.getByText("€18,500")).toBeInTheDocument();
    expect(screen.getByText("2018 · 98,000 km · AutoScout24")).toBeInTheDocument();
  });

  it("opens the listing, marks it read, and closes on View listing", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderApp();
    await dispatchOpenNotification();
    fireEvent.click(screen.getByText("View listing"));
    expect(openSpy).toHaveBeenCalledWith(livePayload.url, "_blank", "noopener");
    await waitFor(() => {
      const readCall = fetchMock.mock.calls.find((call) =>
        String(call[0]).includes("/api/notifications/read")
      );
      expect(readCall).toBeTruthy();
      expect(readCall?.[1]?.method).toBe("POST");
      expect(JSON.parse(readCall?.[1]?.body as string)).toEqual({
        listingId: livePayload.listingId,
      });
    });
    expect(getDialog()).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the empty state when there are no notifications", async () => {
    vi.stubGlobal("fetch", mockFetch({ recent: [], unreadCount: 0 }));
    renderApp();
    fireEvent.click(screen.getByText("open drawer"));
    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
  });

  it("renders recent notification items", async () => {
    vi.stubGlobal("fetch", mockFetch());
    renderApp();
    fireEvent.click(screen.getByText("open drawer"));
    expect(await screen.findByText("Audi A4 2015")).toBeInTheDocument();
    expect(screen.getByText("€12,500 · 2015 · Mobile.de")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View all/ })).toHaveAttribute(
      "href",
      "/en/dashboard/alerts"
    );
  });

  it("marks a recent item as read and opens its listing when clicked", async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal("fetch", fetchMock);
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderApp();
    fireEvent.click(screen.getByText("open drawer"));
    fireEvent.click(await screen.findByText("Audi A4 2015"));
    expect(openSpy).toHaveBeenCalledWith(recentItem.canonicalUrl, "_blank", "noopener");
    await waitFor(() => {
      const readCall = fetchMock.mock.calls.find((call) =>
        String(call[0]).includes("/api/notifications/read")
      );
      expect(readCall).toBeTruthy();
      expect(JSON.parse(readCall?.[1]?.body as string)).toEqual({
        listingId: recentItem.id,
      });
    });
  });
});
