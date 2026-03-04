"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface AddressSelection {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AddressSelection) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Track script loading globally so we only load once
let scriptLoadPromise: Promise<void> | null = null;
let scriptLoaded = false;
let scriptFailed = false;

function loadGoogleMapsScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptFailed) return Promise.reject(new Error("Script failed to load"));
  if (scriptLoadPromise) return scriptLoadPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    scriptFailed = true;
    return Promise.reject(new Error("No API key"));
  }

  // Check if already loaded by another source
  if (typeof window !== "undefined" && window.google?.maps?.places) {
    scriptLoaded = true;
    return Promise.resolve();
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      scriptFailed = true;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

function parsePlace(place: google.maps.places.PlaceResult): AddressSelection {
  const components = place.address_components || [];
  let streetNumber = "";
  let route = "";
  let city = "";
  let state = "";
  let zipCode = "";
  let country = "";

  for (const comp of components) {
    const types = comp.types;
    if (types.includes("street_number")) {
      streetNumber = comp.long_name;
    } else if (types.includes("route")) {
      route = comp.long_name;
    } else if (types.includes("locality")) {
      city = comp.long_name;
    } else if (types.includes("sublocality_level_1") && !city) {
      city = comp.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      state = comp.short_name;
    } else if (types.includes("postal_code")) {
      zipCode = comp.long_name;
    } else if (types.includes("country")) {
      country = comp.long_name;
    }
  }

  const address = [streetNumber, route].filter(Boolean).join(" ");

  return { address, city, state, zipCode, country };
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  className,
  placeholder,
  disabled,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onAddressSelectRef = useRef(onAddressSelect);
  const onChangeRef = useRef(onChange);
  const [apiReady, setApiReady] = useState(false);

  // Keep refs current without re-running effects
  onAddressSelectRef.current = onAddressSelect;
  onChangeRef.current = onChange;

  // Load Google Maps script
  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript()
      .then(() => {
        if (!cancelled) setApiReady(true);
      })
      .catch(() => {
        // Falls back to plain input — no crash
      });
    return () => { cancelled = true; };
  }, []);

  // Initialize autocomplete once API is ready
  useEffect(() => {
    if (!apiReady || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const parsed = parsePlace(place);

      // Google Places overwrites the input DOM value with the full formatted address.
      // Override it back to just the street address, and sync React state.
      if (inputRef.current) {
        inputRef.current.value = parsed.address;
      }
      onChangeRef.current(parsed.address);
      onAddressSelectRef.current(parsed);
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [apiReady]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
