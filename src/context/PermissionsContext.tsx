"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface ProfilePermission {
  id: string;
  roleId: string;
  pageId: string;
  canAccess: boolean;
  fields: Record<string, boolean>; // { fieldName: true/false }
}

interface PermissionsContextType {
  permissions: ProfilePermission[];
  isUnrestricted: boolean; // GodAdmin
  isLoading: boolean;
  previewProfile: string | null; // Profile name being previewed (GodAdmin only)
  getPagePermission: (pageId: string) => ProfilePermission | undefined;
  canAccessPage: (pageId: string) => boolean;
  isFieldAllowed: (pageId: string, fieldName: string) => boolean;
  getAllowedFields: (pageId: string) => string[] | null; // null = all allowed
  refresh: () => Promise<void>;
  setPreviewProfile: (profileName: string | null) => void;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  isUnrestricted: false,
  isLoading: true,
  previewProfile: null,
  getPagePermission: () => undefined,
  canAccessPage: () => true,
  isFieldAllowed: () => true,
  getAllowedFields: () => null,
  refresh: async () => {},
  setPreviewProfile: () => {},
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<ProfilePermission[]>([]);
  const [isUnrestricted, setIsUnrestricted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Preview mode: GodAdmin can simulate viewing as another profile
  const [previewProfile, setPreviewProfileState] = useState<string | null>(null);
  const [previewPermissions, setPreviewPermissions] = useState<ProfilePermission[]>([]);

  const actualProfile = (session?.user as any)?.profile;

  const fetchPermissions = useCallback(async () => {
    if (status !== "authenticated") return;

    try {
      const res = await fetch("/api/permissions/me");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || []);
        setIsUnrestricted(data.unrestricted === true);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPermissions();
    } else if (status === "unauthenticated") {
      // When auth is disabled, grant full access without requiring login
      setIsUnrestricted(true);
      setIsLoading(false);
    }
  }, [status, fetchPermissions]);

  // Fetch preview profile permissions when preview mode changes
  const setPreviewProfile = useCallback(
    async (profileName: string | null) => {
      // Only GodAdmin can preview
      if (actualProfile !== "GodAdmin") return;

      setPreviewProfileState(profileName);

      if (!profileName) {
        setPreviewPermissions([]);
        return;
      }

      try {
        const res = await fetch(`/api/permissions/preview?role=${encodeURIComponent(profileName)}`);
        if (res.ok) {
          const data = await res.json();
          setPreviewPermissions(data.permissions || []);
        }
      } catch (error) {
        console.error("Error fetching preview permissions:", error);
      }
    },
    [actualProfile]
  );

  // Use preview permissions when in preview mode, otherwise real permissions
  const activePermissions = previewProfile ? previewPermissions : permissions;
  const activeUnrestricted = previewProfile ? false : isUnrestricted; // Preview always applies restrictions

  // Get the permission record for a specific page
  const getPagePermission = useCallback(
    (pageId: string): ProfilePermission | undefined => {
      return activePermissions.find((p) => p.pageId === pageId);
    },
    [activePermissions]
  );

  // Check if user can access a page at all
  const canAccessPage = useCallback(
    (pageId: string): boolean => {
      if (activeUnrestricted) return true;
      const perm = activePermissions.find((p) => p.pageId === pageId);
      if (!perm) return true; // No restriction set = full access
      return perm.canAccess;
    },
    [activePermissions, activeUnrestricted]
  );

  // Check if a specific field is allowed for a page
  const isFieldAllowed = useCallback(
    (pageId: string, fieldName: string): boolean => {
      if (activeUnrestricted) return true;
      const perm = activePermissions.find((p) => p.pageId === pageId);
      if (!perm) return true;
      const fields = perm.fields as Record<string, boolean>;
      if (!fields || Object.keys(fields).length === 0) return true;
      return fields[fieldName] !== false;
    },
    [activePermissions, activeUnrestricted]
  );

  // Get list of allowed field names for a page, or null if all allowed
  const getAllowedFields = useCallback(
    (pageId: string): string[] | null => {
      if (activeUnrestricted) return null;
      const perm = activePermissions.find((p) => p.pageId === pageId);
      if (!perm) return null;
      const fields = perm.fields as Record<string, boolean>;
      if (!fields || Object.keys(fields).length === 0) return null;
      return Object.entries(fields)
        .filter(([, allowed]) => allowed !== false)
        .map(([name]) => name);
    },
    [activePermissions, activeUnrestricted]
  );

  return (
    <PermissionsContext.Provider
      value={{
        permissions: activePermissions,
        isUnrestricted: activeUnrestricted,
        isLoading,
        previewProfile,
        getPagePermission,
        canAccessPage,
        isFieldAllowed,
        getAllowedFields,
        refresh: fetchPermissions,
        setPreviewProfile,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
