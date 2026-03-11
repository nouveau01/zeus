"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface Office {
  id: string;
  code: string;
  name: string;
}

interface OfficesContextType {
  offices: Office[];
  officeCodes: string[];
  officeIds: string[];
  hasOffice: (codeOrId: string) => boolean;
  allOffices: boolean;
  isLoading: boolean;
  refetch: () => void;
  // Active filter — which offices the user has checked in the dropdown
  selectedOfficeIds: string[];
  setSelectedOfficeIds: (ids: string[]) => void;
  allSelected: boolean;
  // User's primary/home office
  primaryOfficeId: string | null;
  // Query param string to append to API calls (empty string if all selected)
  officeFilterParam: string;
}

const OfficesContext = createContext<OfficesContextType>({
  offices: [],
  officeCodes: [],
  officeIds: [],
  hasOffice: () => false,
  allOffices: false,
  isLoading: true,
  refetch: () => {},
  selectedOfficeIds: [],
  setSelectedOfficeIds: () => {},
  allSelected: true,
  primaryOfficeId: null,
  officeFilterParam: "",
});

export function OfficesProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOfficeIds, setSelectedOfficeIds] = useState<string[]>([]);

  const user = session?.user as any;
  const isGodAdmin = user?.profile === "GodAdmin";
  const primaryOfficeId: string | null = user?.primaryOfficeId || null;

  const fetchOffices = useCallback(async () => {
    if (status !== "authenticated") return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/offices?mine=true");
      if (res.ok) {
        const data = await res.json();
        setOffices(data);
        // Default selection: primary office if set, otherwise all offices
        if (primaryOfficeId && data.some((o: Office) => o.id === primaryOfficeId)) {
          setSelectedOfficeIds([primaryOfficeId]);
        } else {
          setSelectedOfficeIds(data.map((o: Office) => o.id));
        }
      }
    } catch {
      // Silent fail — will retry on next mount
    } finally {
      setIsLoading(false);
    }
  }, [status, primaryOfficeId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchOffices();
    } else if (status === "unauthenticated") {
      setOffices([]);
      setSelectedOfficeIds([]);
      setIsLoading(false);
    }
  }, [status, fetchOffices]);

  const officeCodes = offices.map((o) => o.code);
  const officeIds = offices.map((o) => o.id);

  const hasOffice = useCallback(
    (codeOrId: string) => {
      if (isGodAdmin) return true;
      return offices.some((o) => o.code === codeOrId || o.id === codeOrId);
    },
    [offices, isGodAdmin]
  );

  // Are all offices selected? (no filtering needed)
  const allSelected = offices.length > 0 && selectedOfficeIds.length === offices.length;

  // Build query param for API calls: "&officeIds=id1,id2,id3"
  // Empty string when all are selected (backend uses full scope)
  const officeFilterParam = allSelected || selectedOfficeIds.length === 0
    ? ""
    : `&officeIds=${selectedOfficeIds.join(",")}`;

  return (
    <OfficesContext.Provider
      value={{
        offices,
        officeCodes,
        officeIds,
        hasOffice,
        allOffices: isGodAdmin,
        isLoading,
        refetch: fetchOffices,
        selectedOfficeIds,
        setSelectedOfficeIds,
        allSelected,
        primaryOfficeId,
        officeFilterParam,
      }}
    >
      {children}
    </OfficesContext.Provider>
  );
}

export function useOffices() {
  return useContext(OfficesContext);
}
