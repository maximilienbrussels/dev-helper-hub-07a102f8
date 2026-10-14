import { useEffect, useRef, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/order.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { readCart, clearCart, removeFromCart, updateQuantity, type CartItem } from "@/lib/cart";
import { getProducts, getPaymentDetails, type ProductDTO } from "@/lib/data.functions";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useT, localeFor, formatT, type Lang } from "@/lib/i18n";
import { productTitle } from "@/lib/product-i18n";
import { PickupSlotPicker } from "@/components/PickupSlotPicker";
import {
  CheckoutPackaging,
  packagingFeeCents,
  type PackagingChoice,
} from "@/components/checkout/CheckoutPackaging";
import { CheckoutPayment } from "@/components/checkout/CheckoutPayment";
import { OrderPaymentModal } from "@/components/checkout/OrderPaymentModal";
import { isBankTransfer, isPayOnPickup, type PaymentChoice } from "@/lib/payment-methods";
import { useSiteConfig } from "@/lib/use-site-config";
import { Minus, Plus, Trash2, ShoppingBag, Check, Gift } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { addToCart } from "@/lib/cart";
import { handleImageError } from "@/lib/image-fallback";
import {
  packagingOption,
  detailForId,
  imageForProduct,
  slugForProduct,
  FREE_GIFT_THRESHOLD_CENTS,
} from "@/data/products";

const COPY: Record<
  Lang,
  { name: string; email: string; emailPlaceholder: string; genericError: string }
> = {
  nl: {
    name: "Naam",
    email: "E-mail",
    emailPlaceholder: "jij@voorbeeld.be",
    genericError: "Er ging iets mis.",
  },
  fr: {
    name: "Nom",
    email: "E-mail",
    emailPlaceholder: "vous@exemple.be",
    genericError: "Une erreur est survenue.",
  },
  en: {
    name: "Name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    genericError: "Something went wrong.",
  },
};

function formatEuro(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function CartDrawer() {
  const { t, lang } = useT();
  const c = COPY[lang];
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addedId, setAddedId] = useState<number | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const refresh = () => setCart(readCart());
    const openHandler = (e: Event) => {
      refresh();
      const added = (e as CustomEvent<{ addedProductId?: number }>).detail?.addedProductId;
      setAddedId(typeof added === "number" ? added : null);
      setStep("cart");
      setOpen(true);
    };
    refresh();
    window.addEventListener("scos:cart-updated", refresh);
    window.addEventListener("scos:cart-open", openHandler);
    return () => {
      window.removeEventListener("scos:cart-updated", refresh);
      window.removeEventListener("scos:cart-open", openHandler);
    };
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
    enabled: open,
  });
  const { data: org } = useQuery({
    queryKey: ["payment-details"],
    queryFn: () => getPaymentDetails(),
    enabled: open,
  });

  const lines = cart
    .map((c) => {
      const p = products.find((x) => x.id === c.productId);
      return p ? { ...c, product: p } : null;
    })
    .filter((v): v is CartItem & { product: ProductDTO } => v !== null);

  const total = lines.reduce(
    (s, l) =>
      s +
      (l.product.price_cents + (packagingOption(l.productId, l.packagingId)?.priceOffset ?? 0)) *
        l.quantity,
    0,
  );

  const addedLine = lines.find((l) => l.productId === addedId) ?? null;

  // Slimme cross-sell: producten die vaak samen gekocht worden met wat al in de mand zit.
  const inCart = new Set(cart.map((c) => c.productId));
  const crossSellIds = new Set<number>();
  for (const l of lines) {
    for (const id of detailForId(l.productId)?.frequentlyBoughtTogether ?? []) {
      if (!inCart.has(id)) crossSellIds.add(id);
    }
  }
  const crossSell = products.filter((p) => crossSellIds.has(p.id)).slice(0, 3);

  const remaining = Math.max(0, FREE_GIFT_THRESHOLD_CENTS - total);
  const progressPct = Math.min(100, Math.round((total / FREE_GIFT_THRESHOLD_CENTS) * 100));

  const [step, setStep] = useState<"cart" | "checkout" | "confirm">("cart");
  const [slot, setSlot] = useState("");
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const placeOrder = useServerFn(createOrder);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [packaging, setPackaging] = useState<PackagingChoice>("own_container");
  const [method, setMethod] = useState<PaymentChoice>("bancontact");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [structuredComm, setStructuredComm] = useState("");
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [payError, setPayError] = useState(false);
  const [pickupQr, setPickupQr] = useState<string | null>(null);
  const [pickupPass, setPickupPass] = useState<string | null>(null);
  const payments = useSiteConfig().payments;

  // Verpakkingstoeslag + eindtotaal, live herberekend bij elke keuze.
  const packagingFee = packagingFeeCents(packaging);
  const grandTotal = total + packagingFee;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const navigate = useNavigate();
  const keepShopping = () => {
    setOpen(false);
    if (!/^\/(shop|webshop)/.test(pathname)) {
      void navigate({ to: pathFor("shop", lang) as never });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "flex h-[85vh] flex-col gap-0 rounded-t-3xl p-0"
            : "flex w-full flex-col gap-0 p-0 sm:max-w-md"
        }
      >
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
            <ShoppingBag className="h-4 w-4" />
            {t("cart.title")}{" "}
            {itemCount > 0 && (
              <span className="ml-1 font-mono normal-case tracking-normal text-muted-foreground">
                ({itemCount})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {step === "confirm" ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("cart.placed")}</p>
            <h3 className="text-2xl font-semibold">
              {t("cart.reference")} {orderRef ?? `#${orderId}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("cart.pickupLine")}:{" "}
              <span className="text-foreground">{slot || t("cart.onAppointment")}</span>
            </p>
            {isBankTransfer(method) && org && (
              <div className="rounded-2xl border border-border bg-[color:var(--surface-page)] p-4 text-sm space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("cart.transfer")}
                </p>
                <p>
                  <span className="text-muted-foreground text-xs">IBAN</span>
                  <br />
                  {org.iban}
                </p>
                <p>
                  <span className="text-muted-foreground text-xs">BIC</span>
                  <br />
                  {org.bic}
                </p>
                <p>
                  <span className="text-muted-foreground text-xs">{t("cart.amount")}</span>
                  <br />
                  <span className="font-mono">{formatEuro(grandTotal)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground text-xs">{t("cart.communication")}</span>
                  <br />
                  <span className="font-mono text-primary">{structuredComm}</span>
                </p>
              </div>
            )}

            {isPayOnPickup(method) && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">
                  {lang === "fr"
                    ? "À payer au retrait"
                    : lang === "en"
                      ? "Pay on pickup"
                      : "Te betalen bij afhaling"}
                </p>
                <p className="mt-1 text-xs">{payments.payOnPickupNotice}</p>
              </div>
            )}

            {packaging === "own_container" && (
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm">
                🌱{" "}
                {lang === "fr"
                  ? "N'oubliez pas votre propre sac, seau ou boîte réutilisable lors du retrait à la ferme urbaine !"
                  : lang === "en"
                    ? "Don't forget to bring your own reusable bag, bucket or box when you pick up at the city farm!"
                    : "Vergeet niet je eigen herbruikbare zak, emmer of doos mee te brengen bij het ophalen op de stadsboerderij!"}
              </div>
            )}

            {pickupQr && (
              <div className="rounded-2xl border border-border bg-[color:var(--surface-page)] p-4 text-center">
                <img
                  src={pickupQr}
                  alt={
                    lang === "fr"
                      ? "QR de retrait"
                      : lang === "en"
                        ? "Pickup QR code"
                        : "Afhaal-QR-code"
                  }
                  className="mx-auto h-40 w-40"
                />
                {pickupPass && (
                  <a
                    href={pickupPass}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-primary underline underline-offset-4"
                  >
                    {lang === "fr"
                      ? "Télécharger le pass de retrait (PDF)"
                      : lang === "en"
                        ? "Download pickup pass (PDF)"
                        : "Afhaalpas downloaden (PDF)"}
                  </a>
                )}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full rounded-full min-h-[48px]"
              onClick={() => {
                clearCart();
                setStep("cart");
                setSlot("");
                setPackaging("own_container");
                setOrderId(null);
                setOrderRef(null);
                setStructuredComm("");
                setSlotIso(null);
                setPickupQr(null);
                setPickupPass(null);
                setOpen(false);
              }}
            >
              {t("cart.newOrder")}
            </Button>
          </div>
        ) : (
          <>
            {step === "cart" && (
            <div ref={scrollRef} key="cart-step" className="flex-1 overflow-y-auto px-5 py-4">
              {addedLine && (
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("cart.added.title")}
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {productTitle(addedLine.product, lang)}
                    </p>
                  </div>
                </div>
              )}

              {lines.length > 0 && (
                <div className="mb-4 rounded-2xl border border-border bg-[color:var(--surface-page)] p-3">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Gift className="h-3.5 w-3.5 text-primary" />
                    {remaining === 0
                      ? t("cart.progress.reached")
                      : formatT(t("cart.progress.remaining"), { amount: formatEuro(remaining) })}
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {lines.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-4 text-sm text-muted-foreground">{t("cart.empty")}</p>
                  <LocalLink
                    to={pathFor("shop", lang)}
                    onClick={() => setOpen(false)}
                    className="mt-4 inline-flex min-h-[48px] items-center rounded-full bg-[color:var(--color-terracotta)] px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90"
                  >
                    {t("cart.continue")}
                  </LocalLink>
                </div>
              )}
              {lines.length > 0 && (
                <ul className="space-y-4">
                  {lines.map((l) => (
                    <li
                      key={l.productId}
                      className="rounded-2xl border border-border bg-[color:var(--surface-page)] p-4"
                    >
                      <div className="flex justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold leading-snug">
                            {productTitle(l.product, lang)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatEuro(l.product.price_cents)} {t("cart.perUnit")}
                          </p>
                          {packagingOption(l.productId, l.packagingId) && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {packagingOption(l.productId, l.packagingId)?.label}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-sm">
                          {formatEuro(l.product.price_cents * l.quantity)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={t("cart.less")}
                          onClick={() => updateQuantity(l.productId, l.quantity - 1)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full border border-border bg-[color:var(--surface-page)] hover:border-primary hover:text-primary"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-mono w-8 text-center text-sm">{l.quantity}</span>
                        <button
                          type="button"
                          aria-label={t("cart.more")}
                          onClick={() => updateQuantity(l.productId, l.quantity + 1)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full border border-border bg-[color:var(--surface-page)] hover:border-primary hover:text-primary"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={t("cart.remove")}
                          onClick={() => removeFromCart(l.productId)}
                          className="ml-auto min-h-[36px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {crossSell.length > 0 && (
                <section className="mt-6 border-t border-border pt-4">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t("cart.crossSell")}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {crossSell.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 rounded-2xl border border-border p-2"
                      >
                        <LocalLink
                          to={pathFor("product", lang, slugForProduct(p))}
                          onClick={() => setOpen(false)}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                            {imageForProduct(p) && (
                              <img
                                src={imageForProduct(p) as string}
                                alt={productTitle(p, lang)}
                                loading="lazy"
                                onError={handleImageError}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">
                              {productTitle(p, lang)}
                            </span>
                            <span className="block font-mono text-xs text-muted-foreground">
                              {formatEuro(p.price_cents)}
                            </span>
                          </span>
                        </LocalLink>
                        <button
                          type="button"
                          aria-label={t("shop.addToCart")}
                          onClick={() => addToCart(p.id)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            )}

            {lines.length > 0 && step === "cart" && (
              <div className="border-t border-border p-5 pt-4">
                <div className="flex items-center justify-between pb-4">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {t("cart.subtotal")}
                  </span>
                  <span className="font-mono text-lg font-semibold">{formatEuro(total)}</span>
                </div>
                <button
                  type="button"
                  onClick={keepShopping}
                  className="mb-3 block w-full min-h-[48px] rounded-full border border-border bg-[color:var(--surface-page)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/90 hover:border-primary hover:text-primary"
                >
                  {t("cart.continue")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("checkout")}
                  className="block w-full min-h-[56px] rounded-full bg-primary px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90"
                >
                  {t("cart.checkout")}
                </button>
              </div>
            )}

            {step === "checkout" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!slot || !email.trim() || submitting) return;
                  setSubmitting(true);
                  setOrderError(null);
                  setPayError(false);
                  void placeOrder({
                    data: {
                      email: email.trim(),
                      naam: naam.trim() || undefined,
                      afhaalmoment: slot,
                      pickup_iso: slotIso ?? undefined,
                      method,
                      packaging_choice: packaging,
                      packaging_fee: packagingFee / 100,
                      items: lines.map((l) => ({
                        product_id: l.productId,
                        quantity: l.quantity,
                        packaging_id: l.packagingId,
                      })),
                    },
                  })
                    .then(async (res) => {
                      setOrderId(res.order_id);
                      setOrderRef(res.order_reference);
                      setStructuredComm(res.structured_communication);
                      setPickupQr(res.pickup_qr_url ?? null);
                      setPickupPass(res.pickup_pass_url ?? null);

                      // Betalen bij afhaling of overschrijving: meteen bevestigen.
                      if (isPayOnPickup(method) || isBankTransfer(method)) {
                        setStep("confirm");
                        return;
                      }

                      // Online betaling: ingebed Stripe PaymentElement.
                      const r = await fetch("/api/stripe/create-payment-intent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ order_id: res.order_id, pay_token: res.pay_token, lang }),
                      });
                      const data = (await r.json()) as {
                        clientSecret?: string | null;
                        error?: string;
                      };
                      if (!r.ok || !data.clientSecret) {
                        setPayError(true);
                        return;
                      }
                      setClientSecret(data.clientSecret);
                    })
                    .catch((err: unknown) => {
                      setOrderError(err instanceof Error ? err.message : c.genericError);
                    })
                    .finally(() => setSubmitting(false));

                }}
                key="checkout-step"
                className="flex-1 overflow-y-auto border-t border-border p-5 space-y-4"
              >
                <PickupSlotPicker
                  value={slot}
                  onChange={setSlot}
                  onIsoChange={setSlotIso}
                  locale={localeFor(lang)}
                  labels={{
                    title: t("cart.pickup.title"),
                    day: t("cart.pickup.day"),
                    time: t("cart.pickup.time"),
                    placeholder: t("cart.pickup.placeholder"),
                  }}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {c.name}
                    </span>
                    <input
                      value={naam}
                      onChange={(e) => setNaam(e.target.value)}
                      className="mt-2 w-full min-h-[48px] rounded-2xl border border-border bg-[color:var(--surface-page)] px-4 text-base outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {c.email}
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.emailPlaceholder}
                      className="mt-2 w-full min-h-[48px] rounded-2xl border border-border bg-[color:var(--surface-page)] px-4 text-base outline-none focus:border-primary"
                    />
                  </label>
                </div>
                <CheckoutPackaging value={packaging} onChange={setPackaging} lang={lang} />
                <CheckoutPayment
                  value={method}
                  onChange={setMethod}
                  lang={lang}
                  payOnPickup={{
                    enabled: payments.payOnPickupEnabled,
                    notice: payments.payOnPickupNotice,
                  }}
                />
                <div className="space-y-1 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                    <span className="font-mono">{formatEuro(grandTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {lang === "fr" ? "Emballage" : lang === "en" ? "Packaging" : "Verpakking"}
                    </span>
                    <span className="font-mono">
                      {packagingFee === 0 ? formatEuro(0) : `+ ${formatEuro(packagingFee)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {t("cart.total")}
                    </span>
                    <span className="font-mono text-lg font-semibold">
                      {formatEuro(grandTotal)}
                    </span>
                  </div>
                </div>
                {orderError && (
                  <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                    {orderError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full min-h-[48px] flex-1"
                    onClick={() => setStep("cart")}
                  >
                    {t("cart.back")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={!slot || submitting}
                    className="rounded-full min-h-[48px] flex-1"
                  >
                    {submitting ? "…" : t("cart.confirm")}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </SheetContent>
      <OrderPaymentModal
        isOpen={clientSecret !== null || payError}
        clientSecret={clientSecret}
        amountLabel={formatEuro(grandTotal)}
        returnUrl={typeof window === "undefined" ? "/" : window.location.href}
        lang={lang}
        serverError={payError}
        onClose={() => {
          setClientSecret(null);
          setPayError(false);
        }}
        onPaid={() => {
          setClientSecret(null);
          setPayError(false);
          setStep("confirm");
        }}
      />
    </Sheet>
  );
}
