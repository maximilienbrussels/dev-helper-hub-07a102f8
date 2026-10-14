import { createServerFn } from "@tanstack/react-start";
import { orderInputSchema } from "./order-schema";

/**
 * Plaatst een afhaalbestelling: server-side prijsberekening, opslag in
 * `orders` + `order_items` en één bevestigingsmail naar het opgegeven adres.
 * Rate-limited per IP zodat de mailer niet als spamrelay kan dienen.
 */
export const createOrder = createServerFn({ method: "POST" })
  .validator((d: unknown) => orderInputSchema.parse(d))
  .handler(async ({ data }) => {
    const { guardRate } = await import("./email-guard.server");
    await guardRate("order", data.email);

    const { persistOrder } = await import("./order.server");
    return persistOrder(data);
  });
