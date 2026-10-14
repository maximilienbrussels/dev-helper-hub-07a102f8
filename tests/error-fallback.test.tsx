// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

const persistClientError = vi.fn(async () => true);
const reportLovableError = vi.fn();
const hardReload = vi.fn(async () => {});

vi.mock("@/lib/lovable-error-reporting", () => ({ persistClientError, reportLovableError }));
vi.mock("@/lib/hard-reload", () => ({
  hardReload,
  collectDeviceInfo: () => ({
    route: "/kapotte-pagina",
    user_agent: "vitest",
    viewport: "384x330 @2.8",
    language: "nl",
  }),
}));

const { AppErrorFallback } = await import("@/components/AppErrorFallback");
const { Component: ErrorBoundary } = await import("./helpers/error-boundary");

beforeEach(() => {
  persistClientError.mockClear();
  reportLovableError.mockClear();
  hardReload.mockClear();
});
afterEach(cleanup);

/** Component die gegarandeerd crasht — simuleert een route- of bundlefout. */
function Boom(): JSX.Element {
  throw new Error("Bundle chunk kon niet geladen worden");
}

describe("fallbackpagina bij een crash", () => {
  it("toont de foutpagina in plaats van een wit scherm", () => {
    render(
      <ErrorBoundary fallback={(error) => <AppErrorFallback error={error} />}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("Deze pagina kon niet laden")).toBeTruthy();
    expect(screen.getByTestId("error-reload")).toBeTruthy();
  });

  it("logt de fout automatisch met stacktrace en route", () => {
    render(<AppErrorFallback error={new Error("Route loader mislukt")} />);
    expect(reportLovableError).toHaveBeenCalledTimes(1);
    expect(reportLovableError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });

  it("triggert een echte hard refresh via de knop", () => {
    render(<AppErrorFallback error={new Error("kapot")} />);
    fireEvent.click(screen.getByTestId("error-reload"));
    expect(hardReload).toHaveBeenCalledTimes(1);
  });

  it("rapporteert de fout met contactinfo en devicegegevens", async () => {
    render(<AppErrorFallback error={new Error("kapot")} />);
    fireEvent.click(screen.getByTestId("error-report-toggle"));
    fireEvent.change(screen.getByPlaceholderText("Je naam (optioneel)"), {
      target: { value: "Jona" },
    });
    fireEvent.change(screen.getByPlaceholderText("Je e-mailadres (optioneel)"), {
      target: { value: "jona@delplanche.com" },
    });
    fireEvent.click(screen.getByTestId("error-report-submit"));

    await waitFor(() => expect(persistClientError).toHaveBeenCalledTimes(1));
    const [, extra] = persistClientError.mock.calls[0] as unknown as [
      Error,
      Record<string, unknown>,
    ];
    expect(extra["reported"]).toBe(true);
    expect(extra["contact_name"]).toBe("Jona");
    expect(extra["contact_email"]).toBe("jona@delplanche.com");
    await screen.findByText("Bedankt, fout gemeld");
  });
});
