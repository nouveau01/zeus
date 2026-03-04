// Minimal Google Maps Places API type declarations
declare namespace google.maps {
  namespace event {
    function clearInstanceListeners(instance: object): void;
  }

  namespace places {
    interface AutocompleteOptions {
      types?: string[];
      componentRestrictions?: { country: string | string[] };
      fields?: string[];
    }

    interface PlaceResult {
      address_components?: AddressComponent[];
      formatted_address?: string;
    }

    interface AddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    class Autocomplete {
      constructor(input: HTMLInputElement, options?: AutocompleteOptions);
      addListener(event: string, handler: () => void): void;
      getPlace(): PlaceResult;
    }
  }
}

interface Window {
  google?: typeof google;
}
