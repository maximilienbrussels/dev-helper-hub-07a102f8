import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionFromToken = vi.hoisted(() => vi.fn());
vi.mock("@/lib/local-auth.functions", () => ({
  sessionFromToken, loginWithPassword: vi.fn(), redeemAuthToken: vi.fn(),
  resetPasswordWithToken: vi.fn(), changePassword: vi.fn(), updateOwnProfile: vi.fn(),
}));
vi.mock("@/lib/auth-email.functions", () => ({
  registerAccount: vi.fn(), requestMagicLink: vi.fn(), requestPasswordReset: vi.fn(),
}));
vi.mock("@/lib/neon", () => ({ getNeonClient: vi.fn() }));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  localStorage.clear();
  sessionFromToken.mockReset();
});

describe("session retention", () => {
  it("does not turn a failed session lookup into a signed-out result", async () => {
    localStorage.setItem("maximilien.session", "test-session-token");
    sessionFromToken.mockRejectedValue(new Error("connection unavailable"));
    const { neonAuthCompat } = await import("@/lib/neon-auth-compat");
    await expect(neonAuthCompat.getUser()).rejects.toThrow("connection unavailable");
    expect(localStorage.getItem("maximilien.session")).toBe("test-session-token");
  });
  it("keeps the signed-in session usable when browser storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const { applySession, neonAuthCompat, readSessionToken } = await import("@/lib/neon-auth-compat");
    applySession("in-memory-token", { id: "user-1", email: "test@example.com", name: null, avatarUrl: null, emailVerifiedAt: null });
    expect(readSessionToken()).toBe("in-memory-token");
    expect((await neonAuthCompat.getUser()).data.user?.id).toBe("user-1");
    await neonAuthCompat.signOut();
    expect(readSessionToken()).toBeNull();
  });
});