"use client";

import { useEffect, useId, useRef, useState } from "react";
import { suggestAddresses, type AddressSuggestion } from "@/app/address-actions";

/**
 * Champ adresse avec autocomplétion (France). Le choix d'une suggestion renseigne aussi
 * le code postal et la ville ; la saisie manuelle reste toujours possible.
 */
export function AddressInput({
  enabled,
  className,
  onPick,
}: {
  enabled: boolean;
  className: string;
  onPick: (suggestion: AddressSuggestion) => void;
}) {
  const listId = useId();
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  function onInput(value: string) {
    clearTimeout(timer.current);
    if (!enabled || value.trim().length < 4) {
      setItems([]);
      setOpen(false);
      return;
    }
    const ticket = ++latest.current;
    timer.current = setTimeout(async () => {
      const result = await suggestAddresses(value);
      if (ticket !== latest.current) return;
      setItems(result);
      setActive(-1);
      setOpen(result.length > 0);
    }, 300);
  }

  function pick(item: AddressSuggestion) {
    latest.current++;
    onPick(item);
    setOpen(false);
    setItems([]);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      pick(items[active]);
    } else if (event.key === "Escape") {
      event.nativeEvent.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        id="co-address"
        name="address"
        required
        autoComplete="address-line1"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(event) => onInput(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={className}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-1 border border-ivory/25 bg-brown shadow-xl"
        >
          {items.map((item, index) => (
            <li
              key={item.label}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(item);
              }}
              className={`cursor-pointer px-3 py-2.5 text-sm ${
                index === active ? "bg-ivory/10 text-ivory" : "text-ivory/80 hover:bg-ivory/10"
              }`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
