import { useRef, useState } from "react";

/**
 * Onzichtbaar veld tegen spambots ("honeypot").
 *
 * Een echte bezoeker ziet en vult dit veld nooit in: het staat buiten beeld en
 * is voor schermlezers verborgen. Vult een bot het toch in, dan laat de server
 * de inzending stil vallen — de bot krijgt geen enkele aanwijzing.
 */
export function useHoneypot() {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement | null>(null);

  const field = (
    <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input
          ref={ref}
          type="text"
          name="website_hp"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
    </div>
  );

  return { field, value };
}
