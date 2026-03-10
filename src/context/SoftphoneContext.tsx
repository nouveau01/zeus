"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";

// Twilio Voice SDK types (imported dynamically to avoid SSR)
type TwilioDevice = any;
type TwilioCall = any;

export type CallState = "idle" | "ringing" | "on-call" | "incoming" | "connecting" | "call-failed";
export type ConnectionStatus = "disconnected" | "connecting" | "connected";
export type RegistrationStatus = "unregistered" | "registering" | "registered";

interface SoftphoneConfig {
  enabled: boolean;
  callRecording: boolean;
}

interface SoftphoneContextType {
  // Config
  config: SoftphoneConfig;
  configured: boolean;

  // Connection
  connectionStatus: ConnectionStatus;
  registrationStatus: RegistrationStatus;

  // Call state
  callState: CallState;
  callDuration: number;
  callerDisplay: string;
  isMuted: boolean;
  isOnHold: boolean;

  // Panel
  panelOpen: boolean;
  panelMinimized: boolean;
  dialNumber: string;
  setPanelOpen: (open: boolean) => void;
  setPanelMinimized: (min: boolean) => void;
  setDialNumber: (num: string) => void;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  makeCall: (number: string) => void;
  answerCall: () => void;
  rejectCall: () => void;
  hangup: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDTMF: (digit: string) => void;

  // Recording
  isRecording: boolean;
  toggleRecording: () => void;

  // Call history
  callHistory: CallHistoryEntry[];
  addCallHistory: (entry: CallHistoryEntry) => void;

  // Compat fields (kept for UI components that reference them)
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
  currentSession: any;
}

export interface CallHistoryEntry {
  id: string;
  number: string;
  direction: "inbound" | "outbound";
  duration: number;
  timestamp: string;
  status: "answered" | "missed" | "declined";
}

const defaultConfig: SoftphoneConfig = {
  enabled: false,
  callRecording: false,
};

const SoftphoneContext = createContext<SoftphoneContextType>({
  config: defaultConfig,
  configured: false,
  connectionStatus: "disconnected",
  registrationStatus: "unregistered",
  callState: "idle",
  callDuration: 0,
  callerDisplay: "",
  isMuted: false,
  isOnHold: false,
  panelOpen: false,
  panelMinimized: false,
  dialNumber: "",
  setPanelOpen: () => {},
  setPanelMinimized: () => {},
  setDialNumber: () => {},
  connect: async () => {},
  disconnect: () => {},
  makeCall: () => {},
  answerCall: () => {},
  rejectCall: () => {},
  hangup: () => {},
  toggleMute: () => {},
  toggleHold: () => {},
  sendDTMF: () => {},
  isRecording: false,
  toggleRecording: () => {},
  callHistory: [],
  addCallHistory: () => {},
  remoteAudioRef: { current: null },
  currentSession: null,
});

export function SoftphoneProvider({ children }: { children: ReactNode }) {
  // Config
  const [config, setConfig] = useState<SoftphoneConfig>(defaultConfig);
  const [twilioConfigured, setTwilioConfigured] = useState(false);

  // Connection
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>("unregistered");

  // Call state
  const [callState, setCallState] = useState<CallState>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [callerDisplay, setCallerDisplay] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [dialNumber, setDialNumber] = useState("");

  // Call history
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);

  // Refs
  const deviceRef = useRef<TwilioDevice>(null);
  const callRef = useRef<TwilioCall>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartRef = useRef<number>(0);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callFailedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const identityRef = useRef<string>("zeus-user");

  const configured = config.enabled && twilioConfigured;

  // Load config from system settings
  useEffect(() => {
    console.log("[SoftPhone] Loading system settings...");
    fetch("/api/system-settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          console.log("[SoftPhone] System settings loaded:", { softphoneEnabled: data.softphoneEnabled, twilioConfigured: data.twilioConfigured });
          setConfig({
            enabled: data.softphoneEnabled ?? false,
            callRecording: data.callRecording ?? false,
          });
          setTwilioConfigured(data.twilioConfigured ?? false);
        }
      })
      .catch((e) => console.error("[SoftPhone] Failed to load settings:", e));
  }, []);

  // Load call history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zeus-call-history");
      if (saved) setCallHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Request notification permission when softphone is enabled
  useEffect(() => {
    if (config.enabled && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [config.enabled]);

  // Call duration timer
  useEffect(() => {
    if (callState === "on-call") {
      callStartRef.current = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (callState === "idle") {
        setCallDuration(0);
      }
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callState]);

  const addCallHistory = useCallback((entry: CallHistoryEntry) => {
    setCallHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 50);
      try {
        localStorage.setItem("zeus-call-history", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleCallEnd = useCallback((direction: "inbound" | "outbound", display: string, wasConnected: boolean) => {
    const duration = wasConnected ? Math.floor((Date.now() - callStartRef.current) / 1000) : 0;

    const callStatus = duration > 0 ? "answered" : direction === "inbound" ? "missed" : "declined";

    addCallHistory({
      id: Date.now().toString(),
      number: display,
      direction,
      duration,
      timestamp: new Date().toISOString(),
      status: callStatus,
    });

    // Auto-log call to Activity History
    fetch("/api/activity-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "call",
        direction,
        phoneNumber: display,
        callDuration: duration,
        callStatus,
        source: "twilio",
      }),
    }).catch((err) => console.error("Failed to log call activity:", err));

    callRef.current = null;
    setIsMuted(false);
    setIsOnHold(false);
    setIsRecording(false);

    // If outbound call ended without connecting, show "call-failed" briefly
    if (direction === "outbound" && !wasConnected) {
      setCallState("call-failed");
      setCallerDisplay(display);
      if (callFailedTimerRef.current) clearTimeout(callFailedTimerRef.current);
      callFailedTimerRef.current = setTimeout(() => {
        setCallState("idle");
        setCallerDisplay("");
      }, 3000);
    } else {
      setCallState("idle");
      setCallerDisplay("");
    }
  }, [addCallHistory]);

  // Fetch Twilio token
  const fetchToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/twilio-token");
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.configured || !data.token) return null;
      identityRef.current = data.identity || "zeus-user";
      return data.token;
    } catch (e) {
      console.error("[SoftPhone] Failed to fetch token:", e);
      return null;
    }
  }, []);

  // Connect — create Twilio Device and register
  const connect = useCallback(async () => {
    if (!config.enabled) {
      console.log("[SoftPhone] Softphone not enabled");
      return;
    }

    // Prevent double-connect
    if (deviceRef.current) {
      console.log("[SoftPhone] Device already exists, skipping connect");
      return;
    }

    try {
      setConnectionStatus("connecting");
      setRegistrationStatus("registering");
      console.log("[SoftPhone] Fetching Twilio token...");

      const token = await fetchToken();
      if (!token) {
        console.log("[SoftPhone] No token available (Twilio not configured)");
        setConnectionStatus("disconnected");
        setRegistrationStatus("unregistered");
        return;
      }

      console.log("[SoftPhone] Token received, creating Device...");

      // Dynamic import to avoid SSR crash
      const { Device } = await import("@twilio/voice-sdk");

      const device = new Device(token, {
        logLevel: "warn",
        codecPreferences: ["opus", "pcmu"] as any,
        closeProtection: true,
      });

      // Device events
      device.on("registered", () => {
        console.log("[SoftPhone] Device REGISTERED — ready to make/receive calls");
        setConnectionStatus("connected");
        setRegistrationStatus("registered");
      });

      device.on("unregistered", () => {
        console.log("[SoftPhone] Device UNREGISTERED");
        setRegistrationStatus("unregistered");
      });

      device.on("error", (error: any) => {
        console.error("[SoftPhone] Device error:", error.message || error);
        if (error.code === 20104) {
          // Token expired — refresh
          console.log("[SoftPhone] Token expired, refreshing...");
          fetchToken().then((newToken) => {
            if (newToken && deviceRef.current) {
              deviceRef.current.updateToken(newToken);
            }
          });
        }
      });

      device.on("tokenWillExpire", () => {
        console.log("[SoftPhone] Token will expire soon, refreshing...");
        fetchToken().then((newToken) => {
          if (newToken && deviceRef.current) {
            deviceRef.current.updateToken(newToken);
          }
        });
      });

      // Incoming call handler
      device.on("incoming", (call: any) => {
        console.log("[SoftPhone] Incoming call from:", call.parameters?.From || "Unknown");
        callRef.current = call;

        const fromNumber = call.parameters?.From || "Unknown";
        setCallerDisplay(fromNumber);
        setCallState("incoming");

        // Auto-open the panel
        setPanelOpen(true);
        setPanelMinimized(false);

        // Browser notification if page isn't focused
        if (typeof document !== "undefined" && !document.hasFocus()) {
          try {
            if (Notification.permission === "granted") {
              new Notification("Incoming Call", {
                body: fromNumber,
                icon: "/favicon.ico",
                tag: "zeus-incoming-call",
                requireInteraction: true,
              });
            }
          } catch {}
        }

        // Call events for incoming
        call.on("accept", () => {
          console.log("[SoftPhone] Incoming call ACCEPTED");
          setCallState("on-call");
        });

        call.on("disconnect", () => {
          console.log("[SoftPhone] Incoming call DISCONNECTED");
          handleCallEnd("inbound", fromNumber, callState === "on-call");
        });

        call.on("cancel", () => {
          console.log("[SoftPhone] Incoming call CANCELLED by caller");
          handleCallEnd("inbound", fromNumber, false);
        });

        call.on("reject", () => {
          console.log("[SoftPhone] Incoming call REJECTED");
          handleCallEnd("inbound", fromNumber, false);
        });
      });

      // Register the device
      console.log("[SoftPhone] Registering device...");
      await device.register();
      deviceRef.current = device;

      console.log("[SoftPhone] Device created and registering");
    } catch (error) {
      console.error("[SoftPhone] Connection error:", error);
      setConnectionStatus("disconnected");
      setRegistrationStatus("unregistered");
      deviceRef.current = null;
    }
  }, [config.enabled, fetchToken, handleCallEnd]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
    if (deviceRef.current) {
      deviceRef.current.unregister();
      deviceRef.current.destroy();
    }
    deviceRef.current = null;
    callRef.current = null;
    setConnectionStatus("disconnected");
    setRegistrationStatus("unregistered");
  }, []);

  // Make call
  const makeCall = useCallback(async (number: string) => {
    if (!deviceRef.current || registrationStatus !== "registered") {
      console.log("[SoftPhone] Cannot make call — device not registered");
      return;
    }

    try {
      console.log("[SoftPhone] Making call to:", number);
      setCallerDisplay(number);
      setCallState("ringing");

      // Open panel if not open
      setPanelOpen(true);
      setPanelMinimized(false);

      const call = await deviceRef.current.connect({
        params: { To: number },
      });

      callRef.current = call;
      let wasConnected = false;

      call.on("ringing", () => {
        console.log("[SoftPhone] Remote side RINGING");
        setCallState("connecting");
      });

      call.on("accept", () => {
        console.log("[SoftPhone] Call ACCEPTED / connected");
        wasConnected = true;
        setCallState("on-call");
      });

      call.on("disconnect", () => {
        console.log("[SoftPhone] Call DISCONNECTED");
        handleCallEnd("outbound", number, wasConnected);
      });

      call.on("cancel", () => {
        console.log("[SoftPhone] Call CANCELLED");
        handleCallEnd("outbound", number, false);
      });

      call.on("reject", () => {
        console.log("[SoftPhone] Call REJECTED");
        handleCallEnd("outbound", number, false);
      });

      call.on("error", (error: any) => {
        console.error("[SoftPhone] Call error:", error.message || error);
        handleCallEnd("outbound", number, false);
      });
    } catch (error) {
      console.error("[SoftPhone] makeCall error:", error);
      handleCallEnd("outbound", number, false);
    }
  }, [registrationStatus, handleCallEnd]);

  // Answer incoming call
  const answerCall = useCallback(() => {
    if (!callRef.current || callState !== "incoming") return;
    console.log("[SoftPhone] Answering call...");
    callRef.current.accept();
  }, [callState]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!callRef.current || callState !== "incoming") return;
    console.log("[SoftPhone] Rejecting call...");
    callRef.current.reject();
  }, [callState]);

  // Hangup
  const hangup = useCallback(() => {
    if (!callRef.current) return;
    console.log("[SoftPhone] Hanging up...");
    callRef.current.disconnect();
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!callRef.current) return;
    const newMuted = !isMuted;
    callRef.current.mute(newMuted);
    setIsMuted(newMuted);
    console.log("[SoftPhone] Mute:", newMuted);
  }, [isMuted]);

  // Toggle hold (approximated: mute both directions)
  const toggleHold = useCallback(() => {
    if (!callRef.current) return;
    const newHold = !isOnHold;
    // Mute our mic
    callRef.current.mute(newHold);
    // For true hold, you'd need server-side conference hold.
    // This mutes the mic as an approximation.
    setIsOnHold(newHold);
    if (newHold) setIsMuted(true);
    else setIsMuted(false);
    console.log("[SoftPhone] Hold:", newHold);
  }, [isOnHold]);

  // Send DTMF
  const sendDTMF = useCallback((digit: string) => {
    if (!callRef.current) return;
    callRef.current.sendDigits(digit);
    console.log("[SoftPhone] Sent DTMF:", digit);
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    setIsRecording((prev) => !prev);
  }, []);

  // Auto-connect when configured
  useEffect(() => {
    console.log("[SoftPhone] Auto-connect check:", { configured, connectionStatus });
    if (configured && connectionStatus === "disconnected") {
      console.log("[SoftPhone] Auto-connecting...");
      connect();
    }
    return () => {
      if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
    };
  }, [configured]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <SoftphoneContext.Provider
      value={{
        config,
        configured,
        connectionStatus,
        registrationStatus,
        callState,
        callDuration,
        callerDisplay,
        isMuted,
        isOnHold,
        panelOpen,
        panelMinimized,
        dialNumber,
        setPanelOpen,
        setPanelMinimized,
        setDialNumber,
        connect,
        disconnect,
        makeCall,
        answerCall,
        rejectCall,
        hangup,
        toggleMute,
        toggleHold,
        sendDTMF,
        isRecording,
        toggleRecording,
        callHistory,
        addCallHistory,
        remoteAudioRef,
        currentSession: callRef.current,
      }}
    >
      {children}
    </SoftphoneContext.Provider>
  );
}

export function useSoftphone() {
  return useContext(SoftphoneContext);
}
