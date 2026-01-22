"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import {
  FileText,
  Save,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  Building,
  Wrench,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";

interface Ticket {
  id: string;
  ticketNumber: string;
  woNumber: string;
  type: "Maintenance" | "Violation" | "Other" | "NEW REPAIR";
  accountId: string;
  accountTag: string;
  address: string;
  unit: string;
  unitId: string;
  description: string;
  status: "Open" | "Assigned" | "En Route" | "On Site" | "Completed" | "Closed";
  callDate: string;
  callTime: string;
  scheduled: string;
  worker: string;
  city: string;
  state: string;
  customerId: string;
  customerName: string;
  jobId: string;
  jobNumber: string;
}

interface TicketDetail {
  // Ticket Info
  ticketNumber: string;
  woNumber: string;
  date: string;
  time: string;
  caller: string;
  phoneNumber: string;
  takenBy: string;
  source: string;
  // Account Info
  accountId: string;
  accountTag: string;
  accountAddress: string;
  accountCity: string;
  accountState: string;
  accountZip: string;
  accountCountry: string;
  accountPhone: string;
  accountMobile: string;
  accountContact: string;
  accountEmail: string;
  // Ticket Details
  category: string;
  level: string;
  unitId: string;
  unitNumber: string;
  nature: string;
  jobId: string;
  jobNumber: string;
  testMech: string;
  calledIn: boolean;
  highPriority: boolean;
  updateMechLocation: boolean;
  onServiceExp: string;
  // Scope & Schedule
  scopeOfWork: string;
  maintenanceNotes: string;
  followUpNotes: string;
  codes: string;
  followUpNeeded: boolean;
  notes: string;
  schedDate: string;
  schedTime: string;
  schedMech: string;
  enRouteTime: string;
  onSiteTime: string;
  completedTime: string;
  witness: string;
  // Customer Info
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  customerCountry: string;
  customerPhone: string;
  customerFax: string;
  customerMobile: string;
  customerContact: string;
  customerEmail: string;
  customerSince: string;
  customerType: string;
  accountType: string;
  zone: string;
  route: string;
  territory: string;
  locsUnits: string;
  acctBalance: string;
  currBalance: string;
  accountRemarks: string;
  customerRemarks: string;
  billingRemarks: string;
}

interface OtherWorker {
  ticketNumber: string;
  worker: string;
  scheduled: string;
}

interface CallHistoryItem {
  date: string;
  callId: string;
  type: string;
  category: string;
  location: string;
  description: string;
  resolution: string;
  worker: string;
  status: string;
  est: string;
  unit: string;
}

interface LedgerItem {
  date: string;
  ref: string;
  location: string;
  desc: string;
  amount: number;
  balance: number;
  days: number;
}

export default function DispatchPage() {
  const { openTab } = useTabs();
  const [viewMode, setViewMode] = useState<"grid" | "schedule">("grid");

  // Filters
  const [scheme, setScheme] = useState("None");
  const [statusFilter, setStatusFilter] = useState("All");
  const [workerFilter, setWorkerFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [printOnSave, setPrintOnSave] = useState(false);

  // Date range
  const [startDate, setStartDate] = useState("1/22/2026");
  const [endDate, setEndDate] = useState("1/22/2026");
  const [dateMode, setDateMode] = useState<"All" | "Day" | "Week" | "Month" | "Quarter" | "Year">("Year");
  const [superMode, setSuperMode] = useState(false);

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Detail tabs
  const [activeTab, setActiveTab] = useState<"ticketInfo" | "scopeSched" | "customerInfo" | "customFields" | "callHistory" | "ledger">("ticketInfo");

  // Detail data
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [otherWorkers, setOtherWorkers] = useState<OtherWorker[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([]);

  // Call History filters
  const [showTicketsFilter, setShowTicketsFilter] = useState("Pending");
  const [excludeTimeCard, setExcludeTimeCard] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);

  // Custom fields
  const [ticketCustom, setTicketCustom] = useState({
    nhJobb: "", pms: "", collector: "COLLECTOR 4", type: "", violationAp: "",
    comm300: "", bid: "", route: "", preTest: "", custom12: "",
    custom3: "", cancelledV: "", grouping: "", resident: "", custom13: "",
    custom4: "", rateChange: "", acctRep: "JL", grouping2: "", custom14: "",
    custom5: "", custom10: "", dws: "", proposal: "", supervisor: "",
  });
  const [tfmCustom, setTfmCustom] = useState({
    signature1: "", pt: false,
    signature2: "", lsd: false,
    custom3: "",
  });

  // Mock data
  useEffect(() => {
    const mockTickets: Ticket[] = [
      { id: "1", ticketNumber: "3996351", woNumber: "3995364", type: "Maintenance", accountId: "125FIFTHAVE", accountTag: "125FIFTHAVE~ - 125 SOUTH FIFTH AVENUE", address: "125 SOUTH FIFTH AVENUE", unit: "P1", unitId: "1", description: "BLDG - NEED TO CONNECT PHONE LINES", status: "Open", callDate: "9/17/2025 12:26:00 PM", callTime: "12:26 PM", scheduled: "", worker: "", city: "MOUNT VERNON", state: "NY", customerId: "1", customerName: "COMMUNITY HOUSING MANAGEMENT CORP", jobId: "189762", jobNumber: "189762" },
      { id: "2", ticketNumber: "4000108", woNumber: "4000188", type: "Maintenance", accountId: "MTAESCNYC", accountTag: "MTAESCNYC~ - MTA LIRR ESCALATORS", address: "333 WEST 34TH STREET", unit: "E1 ROCKNYC", description: "Fault: Power Loss Mode", status: "Open", callDate: "9/24/2025 1:42:00 PM", callTime: "1:42 PM", scheduled: "", worker: "", city: "NEW YORK", state: "NY", customerId: "2", customerName: "MTA", jobId: "", jobNumber: "" },
      { id: "3", ticketNumber: "4001081", woNumber: "4001801", type: "Maintenance", accountId: "GRACELINETM", accountTag: "GRACELINETM~ - GRAND CENTRAL TERMINAL - ESC", address: "89 E 42nd St", unit: "ESC1", description: "GCT - escalators are currently down following a power outage and need to be...", status: "Open", callDate: "9/26/2025 9:42:00 PM", callTime: "9:42 PM", scheduled: "", worker: "", city: "NEW YORK", state: "NY", customerId: "3", customerName: "GRACE LINE", jobId: "", jobNumber: "" },
      { id: "4", ticketNumber: "4004275", woNumber: "4004735", type: "Maintenance", accountId: "AMTRAKNYP", accountTag: "AMTRAKNYP~ - AM TRAKN - ALSTOM", address: "402 PAN AM ROAD", unit: "TIES-1", description: "H/P~~NEED ADVNOLS WALK WAY DOS", status: "Open", callDate: "10/17/2025 12:28:00 AM", callTime: "12:28 AM", scheduled: "", worker: "", city: "JAMAICA", state: "NY", customerId: "4", customerName: "AMTRAK", jobId: "", jobNumber: "" },
      { id: "5", ticketNumber: "4013808", woNumber: "4004172", type: "Maintenance", accountId: "1995RCPS", accountTag: "1995RCPS~ - 1995 ROCKAWAY PKWAY", address: "1995 Rockaway Pkwy", unit: "P#", description: "LSD / DRIVE FAULTS (OPEN PROPOSAL)", status: "Open", callDate: "10/6/2025 1:09:00 PM", callTime: "1:09 PM", scheduled: "", worker: "", city: "BROOKLYN", state: "NY", customerId: "5", customerName: "1995 ROCKAWAY PKWY", jobId: "", jobNumber: "" },
      { id: "6", ticketNumber: "4013811", woNumber: "4027343", type: "Maintenance", accountId: "3950GRACEHOLLIS", accountTag: "3950GRACEHOLLIS - 3195 GRACE HOLLISTER WHIT", address: "2603 NORTH 24TH STREET", unit: "", description: "LSD - REPAIR", status: "Open", callDate: "10/6/2025 3:59:00 PM", callTime: "3:59 PM", scheduled: "", worker: "", city: "QUINCY", state: "NY", customerId: "6", customerName: "GRACE HOLLISTER", jobId: "", jobNumber: "" },
      { id: "7", ticketNumber: "4017561", woNumber: "4017582", type: "Maintenance", accountId: "TERMINALNYC7JFK", accountTag: "TERMINALNYC7JFK~ - TERMINAL 7 - JFK AIRPORT - JC#", address: "TERMINAL 7", unit: "ESC 13 - KON", description: "H~MON. ESC 13 DOS", status: "Open", callDate: "10/18/2025 5:41:00 PM", callTime: "5:41 PM", scheduled: "", worker: "", city: "JAMAICA", state: "NY", customerId: "7", customerName: "JFK TERMINAL 7", jobId: "", jobNumber: "" },
      { id: "8", ticketNumber: "4024237", woNumber: "4022786", type: "Maintenance", accountId: "118FIFTHAVE", accountTag: "118FIFTHAVE~ - 114 FIFTH AVENUE", address: "", unit: "P2", description: "ENG Follow up on Ticket #4022778", status: "Open", callDate: "10/22/2025 12:41:00 PM", callTime: "12:41 PM", scheduled: "", worker: "", city: "NEW YORK", state: "NY", customerId: "8", customerName: "118 FIFTH AVE", jobId: "", jobNumber: "" },
      { id: "9", ticketNumber: "4030088", woNumber: "4030098", type: "Maintenance", accountId: "80PARKPLAZA", accountTag: "80PARKPLAZA~ - 80 PARK PLAZA - OPEN", address: "80 PARK PLAZA", unit: "P7", description: "LSD - MKE A. AWAITING INFO TO GENERATE PROPOSAL", status: "Open", callDate: "10/31/2025 11:26:00 AI", callTime: "11:26 AM", scheduled: "", worker: "", city: "NEWARK", state: "NJ", customerId: "9", customerName: "80 PARK PLAZA", jobId: "", jobNumber: "" },
      { id: "10", ticketNumber: "4030478", woNumber: "4030298", type: "Maintenance", accountId: "2545UNIVERSITY", accountTag: "2545UNIVERSITY~ - 2545 UNIVERSITY GREENWALL", address: "2545 UNIVERSITY GREENWALL", unit: "PE3", description: "LSD water damage - NEED PROPOSAL - wAITING FOR M/R REPORT JOB", status: "Open", callDate: "10/31/2025 11:06:00 AI", callTime: "11:06 AM", scheduled: "", worker: "", city: "BRONX", state: "NY", customerId: "10", customerName: "2545 UNIVERSITY", jobId: "", jobNumber: "" },
      { id: "11", ticketNumber: "4030884", woNumber: "4030270", type: "Maintenance", accountId: "152MARKETST", accountTag: "152MARKETST~ - 152 MARKET STREET", address: "", unit: "P1", description: "LSD - PROPOSAL4ER638- OPEN / Wate damage on door operator door motor", status: "Open", callDate: "10/31/2025 8:54:00 PM", callTime: "8:54 PM", scheduled: "", worker: "", city: "PATERSON", state: "NJ", customerId: "11", customerName: "152 MARKET ST", jobId: "", jobNumber: "" },
      { id: "12", ticketNumber: "4039384", woNumber: "4038733", type: "Maintenance", accountId: "ONEJERICHO", accountTag: "ONEJERICHO~ - ONE JERICHO PLAZA", address: "ONE JERICHO PLAZA", unit: "P3", description: "LSD / BAD PISTON SEAL", status: "Open", callDate: "11/5/2025 9:42:00 PM", callTime: "9:42 PM", scheduled: "", worker: "", city: "JERICHO", state: "NY", customerId: "12", customerName: "ONE JERICHO PLAZA", jobId: "", jobNumber: "" },
      { id: "13", ticketNumber: "4039241", woNumber: "4039421", type: "Maintenance", accountId: "TERMINALONE", accountTag: "TERMINALONE~ - TERMINAL ONE, BLDG 55", address: "17 JFK Airport", unit: "E6", description: "CAR 6 DOS", status: "Open", callDate: "11/6/2025 11:00:00 PM", callTime: "11:00 PM", scheduled: "", worker: "", city: "JAMAICA", state: "NY", customerId: "13", customerName: "TERMINAL ONE", jobId: "", jobNumber: "" },
      { id: "14", ticketNumber: "4040605", woNumber: "4039949", type: "Maintenance", accountId: "720FIFTHAVE", accountTag: "720FIFTHAVE~ - 720 FIFTH AVE", address: "720 Fifth Ave", unit: "E6", description: "LSD Follow up on Ticket #4039949", status: "Open", callDate: "11/7/2025 4:41:00 AM", callTime: "4:41 AM", scheduled: "", worker: "", city: "NEW YORK", state: "NY", customerId: "14", customerName: "720 FIFTH AVE", jobId: "", jobNumber: "" },
      { id: "15", ticketNumber: "4041031", woNumber: "4048362", type: "Maintenance", accountId: "5CITYPLACE", accountTag: "5CITYPLACE~ - 5 CITY PLACE", address: "5 CITY PLACE", unit: "H-3348-P", description: "PROPOSAL SENT AND IN THE WORKS LSD - PISTON LEAKING OIL", status: "Open", callDate: "11/7/2025 1:30:00 PM", callTime: "1:30 PM", scheduled: "", worker: "", city: "WHITE PLAINS", state: "NY", customerId: "15", customerName: "5 CITY PLACE", jobId: "", jobNumber: "" },
      { id: "16", ticketNumber: "4041223", woNumber: "4039734", type: "Violation", accountId: "3000OCEANAVE", accountTag: "3000OCEANAVE~ - 3000 OCEAN AVENUE", address: "3000 OCEAN AVENUE", unit: "P#", description: "LSD Poisoon", status: "Open", callDate: "11/7/2025 2:52:00 PM", callTime: "2:52 PM", scheduled: "", worker: "", city: "BROOKLYN", state: "NY", customerId: "16", customerName: "3000 OCEAN AVE", jobId: "", jobNumber: "" },
      { id: "17", ticketNumber: "4044381", woNumber: "4044308", type: "Maintenance", accountId: "TERMINALNYC7JFK", accountTag: "TERMINALNYC7JFK~ - TERMINAL 7 - JFK AIRPORT - JC#", address: "TERMINAL 7", unit: "ESC 13 - KON", description: "H/O FOR FRI AS PER CALLER ESC 131S DOS", status: "Open", callDate: "11/13/2025 9:05:00 PM", callTime: "9:05 PM", scheduled: "", worker: "", city: "JAMAICA", state: "NY", customerId: "7", customerName: "JFK TERMINAL 7", jobId: "", jobNumber: "" },
      { id: "18", ticketNumber: "4045143", woNumber: "4046553", type: "Maintenance", accountId: "TERMINALNYC7JFK", accountTag: "TERMINALNYC7JFK~ - TERMINAL 7 - JFK AIRPORT - JC#", address: "TERMINAL 7", unit: "H#", description: "LSD Follow up on Ticket BA#4053", status: "Open", callDate: "11/15/2025 6:13:00 AM", callTime: "6:13 AM", scheduled: "", worker: "", city: "JAMAICA", state: "NY", customerId: "7", customerName: "JFK TERMINAL 7", jobId: "", jobNumber: "" },
      { id: "19", ticketNumber: "4046107", woNumber: "4036010", type: "Maintenance", accountId: "72MAD", accountTag: "72MAD~ - 72 MADISON AVENUE", address: "72 Madison Ave", unit: "FRT", description: "MJR. LSD / WATER DAMAGE", status: "Open", callDate: "11/17/2025 8:12:00 PM", callTime: "8:12 PM", scheduled: "", worker: "", city: "NEW YORK", state: "NY", customerId: "17", customerName: "72 MADISON AVE", jobId: "", jobNumber: "" },
      { id: "20", ticketNumber: "4046250", woNumber: "4046247", type: "Maintenance", accountId: "630FIFTHAVEDALE", accountTag: "630FIFTHAVEDALE~ - 630 RIVERDALE AVENUE - BRO", address: "630 RIVERDALE AVENUE", unit: "SPELLMAN", description: "PROPOSAL SENT 11/17/REPORT OF CABLE ISSUE", status: "Open", callDate: "11/18/2025 7:01:00 AM", callTime: "7:01 AM", scheduled: "", worker: "", city: "BRONX", state: "NY", customerId: "18", customerName: "630 RIVERDALE", jobId: "", jobNumber: "" },
      { id: "21", ticketNumber: "4046759", woNumber: "4046019", type: "Maintenance", accountId: "44BEACONWAY", accountTag: "44BEACONWAY~ - 44 BEACON WAY", address: "44 BEACON WAY", unit: "P1", description: "The building needs to call phone company", status: "Open", callDate: "11/18/2025 2:54:00 PM", callTime: "2:54 PM", scheduled: "", worker: "", city: "JERSEY CITY", state: "NJ", customerId: "19", customerName: "44 BEACON WAY", jobId: "", jobNumber: "" },
      { id: "22", ticketNumber: "4046584", woNumber: "4045995", type: "Other", accountId: "480VERMONT", accountTag: "480VERMONT~ - 480 VERMONT STREET", address: "480 Vermont St", unit: "W/C", description: "480 VERMONT STREET", status: "Open", callDate: "11/17/2025 11:35:35 PM", callTime: "11:35 PM", scheduled: "", worker: "", city: "BROOKLYN", state: "NY", customerId: "20", customerName: "480 VERMONT", jobId: "", jobNumber: "" },
      { id: "23", ticketNumber: "4047797", woNumber: "4006910", type: "Maintenance", accountId: "65W11TH", accountTag: "65W11TH~ - 65 WEST 11TH STREET", address: "65 W 11th St", unit: "SW", description: "PROPOSAL - LSD Follow up on Ticket #4005810", status: "Open", callDate: "11/20/2025 5:15:00 AM", callTime: "5:15 AM", scheduled: "", worker: "", city: "NEW YORK", state: "NY", customerId: "21", customerName: "65 WEST 11TH", jobId: "", jobNumber: "" },
      { id: "24", ticketNumber: "4048414", woNumber: "3229595/8", type: "Maintenance", accountId: "648EASTTREM", accountTag: "648EASTREM~ - 648 EAST TREMONT AVE", address: "648 EAST TREMONT AVE", unit: "2P988722", description: "FAU - REPLACE BULBS IN CAR", status: "Open", callDate: "11/20/2025 2:30:00 PM", callTime: "2:30 PM", scheduled: "", worker: "", city: "BRONX", state: "NY", customerId: "22", customerName: "648 EAST TREMONT", jobId: "", jobNumber: "" },
      { id: "25", ticketNumber: "4048485", woNumber: "4025105", type: "Maintenance", accountId: "1851PALISADEAVE", accountTag: "1851PALISADEAVE~ - 15 ST. PAULS PLACE", address: "15 ST. PAULS PLACE", unit: "P#", description: "FAU ON BOARD", status: "Open", callDate: "11/20/2025 3:12:00 PM", callTime: "3:12 PM", scheduled: "", worker: "", city: "GREAT NECK", state: "NY", customerId: "23", customerName: "1851 PALISADE", jobId: "", jobNumber: "" },
      { id: "26", ticketNumber: "4048950", woNumber: "4046397", type: "NEW REPAIR", accountId: "270PARKAVE", accountTag: "270PARKAVE~ - 270 PARK AVENUE", address: "270 Park Avenue", unit: "O2", description: "FAU BOARD", status: "Open", callDate: "11/20/2025 11:16:00 AI", callTime: "11:16 AM", scheduled: "", worker: "", city: "HUNTINGTON", state: "NY", customerId: "24", customerName: "270 PARK AVE", jobId: "", jobNumber: "" },
      { id: "27", ticketNumber: "4051154", woNumber: "4027182", type: "Maintenance", accountId: "1143RAYMONDB", accountTag: "1143RAYMONDB~ - 11 43 RAYMOND PLAZA - ONE G", address: "11 43 RAYMOND PLAZA", unit: "PRE2", description: "LSD - open to investigate comp (heave noise and vibration", status: "Open", callDate: "11/24/2025 1:46:00 PM", callTime: "1:46 PM", scheduled: "", worker: "", city: "NEWARK", state: "NJ", customerId: "25", customerName: "1143 RAYMOND PLAZA", jobId: "", jobNumber: "" },
      { id: "28", ticketNumber: "4052764", woNumber: "4030298", type: "Maintenance", accountId: "2545UNIVERSITY", accountTag: "2545UNIVERSITY~ - 2545 UNIVERSITY GREENWALL", address: "2545 UNIVERSITY GREENWALL", unit: "PE1", description: "LSD - MJR JOB 206890 FOR CAR 1 ONLY", status: "Open", callDate: "10/31/2025 2:37:00 PM", callTime: "2:37 PM", scheduled: "", worker: "", city: "BRONX", state: "NY", customerId: "10", customerName: "2545 UNIVERSITY", jobId: "", jobNumber: "" },
      { id: "29", ticketNumber: "4054088", woNumber: "4052512", type: "Maintenance", accountId: "357STHCOMM", accountTag: "357STHCOMM~ - 357 9TH ST", address: "357 9TH STREET", unit: "RESIDENT L", description: "FAU SHEAVE, REGROOVE", status: "Open", callDate: "11/26/2025 2:29:00 PM", callTime: "2:29 PM", scheduled: "", worker: "", city: "BROOKLYN", state: "NY", customerId: "26", customerName: "357 9TH ST", jobId: "", jobNumber: "" },
    ];

    setTickets(mockTickets);
    setFilteredTickets(mockTickets);
    if (mockTickets.length > 0) {
      setSelectedTicket(mockTickets[0]);
      loadTicketDetail(mockTickets[0]);
    }
  }, []);

  const loadTicketDetail = (ticket: Ticket) => {
    // Mock detail data
    const detail: TicketDetail = {
      ticketNumber: ticket.ticketNumber,
      woNumber: ticket.woNumber,
      date: "9/17/2025",
      time: "12:28 PM",
      caller: "Who",
      phoneNumber: "",
      takenBy: "NGONZALEZ",
      source: "GENERAL",
      accountId: ticket.accountId,
      accountTag: ticket.accountTag.split("~")[0],
      accountAddress: ticket.address,
      accountCity: ticket.city,
      accountState: ticket.state,
      accountZip: "10550",
      accountCountry: "United States",
      accountPhone: "(914) 552-5434",
      accountMobile: "(914) 592-2938",
      accountContact: "CINDY MAURO",
      accountEmail: "cindy@chrnc1.com",
      category: "None",
      level: "1-Service Call",
      unitId: ticket.unitId,
      unitNumber: ticket.unit,
      nature: "Existing Job",
      jobId: ticket.jobId,
      jobNumber: ticket.jobNumber,
      testMech: "Mechanic",
      calledIn: true,
      highPriority: false,
      updateMechLocation: false,
      onServiceExp: "05/31/2029",
      scopeOfWork: `BLDG - NEED TO CONNECT PHONE LINES
WANT - NEED EMERG LIGHT BULBS`,
      maintenanceNotes: `MAINTENANCE
Follow-up on Ticket #3995365
Scheduled for at    Phone: (914) 552-5434
Rescheduled to Sep 16, 2025 at 07:37 AM
F/U ** Emergency lines
[1] - Repair inoperative Emergency lighting - Emergency light - FOR MAINTENANCE
[2] - Repair Insufficient Communication - Must call nouveau - FOR MAINTENANCE`,
      followUpNotes: "",
      codes: "",
      followUpNeeded: true,
      notes: "Phone line disconnected/no dial tonel.",
      schedDate: "",
      schedTime: "",
      schedMech: "",
      enRouteTime: "",
      onSiteTime: "",
      completedTime: "08:51 PM",
      witness: "",
      customerName: ticket.customerName,
      customerAddress: "5 WEST MAIN STREET, SUITE 214",
      customerCity: "ELMSFORD",
      customerState: ticket.state,
      customerZip: "10523",
      customerCountry: "United States",
      customerPhone: "(914) 552-5434",
      customerFax: "(914) 592-2938",
      customerMobile: "(718) 000-0000",
      customerContact: "CINDY MAURO",
      customerEmail: "cindy@chrnc1.com",
      customerSince: "3/22/2024",
      customerType: "General",
      accountType: "S",
      zone: "DIVISION #5",
      route: "507",
      territory: "RS",
      locsUnits: "4",
      acctBalance: "$15,170.65",
      currBalance: "$18,603.97",
      accountRemarks: "",
      customerRemarks: "",
      billingRemarks: "",
    };
    setTicketDetail(detail);

    // Mock other workers
    setOtherWorkers([
      { ticketNumber: "3995364", worker: "MORRISON S", scheduled: "C-9/16/2025 3:23:00 P" },
      { ticketNumber: "3995365", worker: "ALMONTE E", scheduled: "C-9/17/2025 10:52:00..." },
    ]);

    // Mock call history
    setCallHistory([
      { date: "11/26/2025", callId: "4052539", type: "Maintenance", category: "None", location: "125 SOUTH FIFTH AVENUE\nCITY ID:", description: "", resolution: "", worker: "", status: "Assigned", est: "0.00", unit: "P2" },
      { date: "11/26/2025", callId: "4052537", type: "Maintenance", category: "None", location: "125 SOUTH FIFTH AVENUE\nCITY ID:", description: "", resolution: "", worker: "", status: "Assigned", est: "0.00", unit: "P1" },
      { date: "11/11/2025", callId: "4027698", type: "Annual", category: "Annual Test", location: "", description: "Perform OUTSIDE NYC ANNUAL on unit P1 at 125 SOUTH FIFTH AVENUE. This test is performed every 12 months and was last run on 12/26/2024.", resolution: "", worker: "", status: "Testing", est: "1.00", unit: "P1" },
      { date: "11/11/2025", callId: "4027900", type: "Annual", category: "Annual Test", location: "", description: "Perform OUTSIDE NYC ANNUAL on unit P2 at 125 SOUTH FIFTH AVENUE. This test is performed every 12 months and was last run on 12/26/2024.", resolution: "", worker: "", status: "Testing", est: "1.00", unit: "P2" },
      { date: "1/13/2025", callId: "3774029", type: "Other", category: "None", location: "125 SOUTH FIFTH AVENUE\nCITY ID: P1", description: "", resolution: "", worker: "CANZONA C", status: "Assigned", est: "0.00", unit: "P1" },
    ]);

    // Mock ledger
    setLedgerItems([
      { date: "6/7/2025", ref: "IR59189", location: "125FIFTHAVE~", desc: "Preventative maintenance ro for the period of June, 2", amount: 5354.29, balance: 5354.29, days: 235 },
      { date: "9/11/2025", ref: "B67172", location: "125FIFTHAVE~", desc: "AS PER PROPOSAL #16482 08.06.2025", amount: 7477.88, balance: 7477.88, days: 133 },
      { date: "10/3/2025", ref: "B68438", location: "125FIFTHAVE~", desc: "INVOICE BILLING FOR THE PRICING ADJUSTMENTS T", amount: 1937.19, balance: 1937.19, days: 111 },
      { date: "12/1/2025", ref: "B79489", location: "125FIFTHAVE~", desc: "SERVICE CALL 11 12 2025", amount: 254.88, balance: 254.88, days: 45 },
      { date: "12/31/2025", ref: "D76518", location: "125FIFTHAVE~", desc: "SERVICE CALL 11.03, 11.04 (ELECTION DAY), & 11 07 2...", amount: 636.70, balance: 636.70, days: 22 },
    ]);
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    loadTicketDetail(ticket);
  };

  // Navigation handlers
  const handleNavigateToAccount = () => {
    if (ticketDetail) {
      openTab(ticketDetail.accountTag, `/accounts/${ticketDetail.accountId}`);
    }
  };

  const handleNavigateToUnit = () => {
    if (ticketDetail && ticketDetail.unitId) {
      openTab(`Unit ${ticketDetail.unitNumber}`, `/units/${ticketDetail.unitId}`);
    }
  };

  const handleNavigateToJob = () => {
    if (ticketDetail && ticketDetail.jobId) {
      openTab(`Job ${ticketDetail.jobNumber}`, `/job-maintenance/${ticketDetail.jobId}`);
    }
  };

  const handleNavigateToCustomer = () => {
    if (selectedTicket) {
      openTab(selectedTicket.customerName, `/customers/${selectedTicket.customerId}`);
    }
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // Date quick buttons
  const handleDateMode = (mode: "All" | "Day" | "Week" | "Month" | "Quarter" | "Year") => {
    setDateMode(mode);
    // Would adjust date range based on mode
  };

  const workers = ["All", "MORRISON S", "ALMONTE E", "CANZONA C", "NGONZALEZ"];
  const types = ["All", "Maintenance", "Violation", "Other", "NEW REPAIR"];
  const statuses = ["All", "Open", "Assigned", "En Route", "On Site", "Completed", "Closed"];
  const zones = ["All", "DIVISION #1", "DIVISION #2", "DIVISION #3", "DIVISION #4", "DIVISION #5"];
  const schemes = ["None", "Priority", "Zone", "Worker", "Type"];
  const sources = ["GENERAL", "PHONE", "EMAIL", "WALK-IN", "WEB"];
  const levels = ["1-Service Call", "2-Emergency", "3-PM", "4-Annual Test", "5-Violation"];
  const natures = ["Existing Job", "New Job", "Callback", "Warranty"];
  const categories = ["None", "Maintenance", "Repair", "Installation", "Inspection"];

  return (
    <div className="h-full flex flex-col bg-[#c0c0c0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <span className="font-bold text-[13px]">Call Manager - Editing Existing Call</span>
        <div className="flex items-center gap-1">
          <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">_</button>
          <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">□</button>
          <button className="hover:bg-[#ff0000] px-1 rounded text-[11px]">×</button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-1 py-0.5 border-b border-[#808080]">
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">File</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Records</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Tools</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Options</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">View</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#808080] gap-0.5 flex-wrap">
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Save className="w-4 h-4" style={{ color: "#4a90d9" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <RotateCcw className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Search className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px] font-bold" style={{ color: "#e74c3c" }}>✓</span>
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px] font-bold" style={{ color: "#27ae60" }}>✓</span>
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Plus className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Trash2 className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Filter className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Printer className="w-4 h-4" style={{ color: "#34495e" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronsLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronsRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#808080] gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Scheme</label>
          <select value={scheme} onChange={(e) => setScheme(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[70px]">
            {schemes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[60px]">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Worker:</label>
          <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[60px]">
            {workers.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Type:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[60px]">
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Zone:</label>
          <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[60px]">
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-1 text-[11px]">
            <input type="checkbox" checked={printOnSave} onChange={(e) => setPrintOnSave(e.target.checked)} />
            Print On Save
          </label>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "schedule" : "grid")}
          className="px-2 py-0.5 border border-[#808080] bg-white text-[11px] hover:bg-[#e0e0e0]"
        >
          {viewMode === "grid" ? "Schedule View" : "Grid View"}
        </button>
      </div>

      {/* Date Range Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#808080] gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Start</label>
          <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">End</label>
          <input type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
        </div>
        <div className="flex items-center gap-0.5">
          {(["All", "Day", "Week", "Month", "Quarter", "Year"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => handleDateMode(mode)}
              className={`px-2 py-0.5 border text-[11px] ${dateMode === mode ? "bg-[#316ac5] text-white border-[#316ac5]" : "bg-white border-[#808080] hover:bg-[#e0e0e0]"}`}
            >
              {mode}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-[11px]">
          <input type="checkbox" checked={superMode} onChange={(e) => setSuperMode(e.target.checked)} />
          Super
        </label>
        <select className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
          <option>All</option>
        </select>
      </div>

      {/* Main Content - Grid + Detail Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Ticket Grid */}
        <div className="flex-1 overflow-auto bg-white border border-[#808080] m-1" style={{ minHeight: "200px", maxHeight: "45%" }}>
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-[#f0f0f0] sticky top-0">
              <tr>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]" style={{ width: "20px" }}></th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Ticket #</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">W/O #</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Type</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Account</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Address</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Unit</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Description</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Status</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Call Date</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Scheduled</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Worker</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">City</th>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">State</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => handleTicketSelect(ticket)}
                  className={`cursor-pointer ${selectedTicket?.id === ticket.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"}`}
                >
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{selectedTicket?.id === ticket.id && "▶"}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.ticketNumber}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.woNumber}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.type}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.accountTag}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.address}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.unit}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0] max-w-[200px] truncate">{ticket.description}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.status}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.callDate}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.scheduled}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.worker}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.city}</td>
                  <td className="px-1 py-0.5 border border-[#e0e0e0]">{ticket.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div className="bg-[#f5f5f5] border border-[#808080] m-1 flex flex-col" style={{ minHeight: "250px" }}>
          {/* Detail Tabs */}
          <div className="flex border-b border-[#808080]">
            <button onClick={() => setActiveTab("ticketInfo")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "ticketInfo" ? "bg-[#f5f5f5] font-medium" : "bg-[#d4d0c8]"}`}>
              1 Ticket Info
            </button>
            <button onClick={() => setActiveTab("scopeSched")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "scopeSched" ? "bg-[#f5f5f5] font-medium" : "bg-[#d4d0c8]"}`}>
              2 Scope & Sched
            </button>
            <button onClick={() => setActiveTab("customerInfo")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "customerInfo" ? "bg-[#f5f5f5] font-medium" : "bg-[#d4d0c8]"}`}>
              3 Customer Info
            </button>
            <button onClick={() => setActiveTab("customFields")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "customFields" ? "bg-[#f5f5f5] font-medium" : "bg-[#d4d0c8]"}`}>
              4 Custom Fields
            </button>
            <button onClick={() => setActiveTab("callHistory")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "callHistory" ? "bg-[#f5f5f5] font-medium" : "bg-[#d4d0c8]"}`}>
              5 Call History
            </button>
            <button onClick={() => setActiveTab("ledger")} className={`px-3 py-1 text-[11px] ${activeTab === "ledger" ? "bg-[#f5f5f5] font-medium text-[#e74c3c]" : "bg-[#d4d0c8] text-[#e74c3c]"}`}>
              6 Ledger
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-2">
            {/* Tab 1 - Ticket Info */}
            {activeTab === "ticketInfo" && ticketDetail && (
              <div className="flex gap-4">
                {/* Left Column */}
                <div className="flex flex-col gap-1 min-w-[180px]">
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Ticket #</label>
                    <input type="text" value={ticketDetail.ticketNumber} readOnly className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-[#f0f0f0] w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">W/O #</label>
                    <input type="text" value={ticketDetail.woNumber} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-[#ffffe1] w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Date</label>
                    <input type="text" value={ticketDetail.date} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Time</label>
                    <input type="text" value={ticketDetail.time} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Caller</label>
                    <select value={ticketDetail.caller} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]">
                      <option>New</option>
                      <option>Who</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Phone #</label>
                    <input type="text" value={ticketDetail.phoneNumber} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Taken By</label>
                    <input type="text" value={ticketDetail.takenBy} readOnly className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-[#f0f0f0] w-[80px]" />
                  </div>
                  <button className="px-2 py-0.5 border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[11px] mt-1">
                    Called Again
                  </button>
                  <div className="flex items-center gap-1 mt-1">
                    <label className="w-14 text-[11px]">Source</label>
                    <select value={ticketDetail.source} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]">
                      {sources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Middle Column - Account Info */}
                <div className="flex flex-col gap-1 min-w-[220px]">
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px] text-[#ffcc00] bg-[#000080] px-1">Account</label>
                    <input
                      type="text"
                      value={ticketDetail.accountTag}
                      readOnly
                      onClick={handleNavigateToAccount}
                      className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white text-[#0000ff] cursor-pointer hover:underline"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">ID</label>
                    <input type="text" value={ticketDetail.accountId} readOnly className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-[#f0f0f0]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Address</label>
                    <input type="text" value={ticketDetail.accountAddress} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">City</label>
                    <input type="text" value={ticketDetail.accountCity} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">State</label>
                    <select value={ticketDetail.accountState} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[50px]">
                      <option>NY</option>
                      <option>NJ</option>
                      <option>CT</option>
                    </select>
                    <label className="text-[11px] ml-1">Zip</label>
                    <input type="text" value={ticketDetail.accountZip} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Country</label>
                    <input type="text" value={ticketDetail.accountCountry} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Phone</label>
                    <input type="text" value={ticketDetail.accountPhone} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                    <label className="text-[11px]">Mobile</label>
                    <input type="text" value={ticketDetail.accountMobile} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Contact</label>
                    <input type="text" value={ticketDetail.accountContact} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                    <label className="text-[11px]">E-Mail</label>
                    <span
                      onClick={() => handleEmailClick(ticketDetail.accountEmail)}
                      className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
                    >
                      {ticketDetail.accountEmail}
                    </span>
                  </div>
                </div>

                {/* Right Column - Ticket Details */}
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Category</label>
                    <select value={ticketDetail.category} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Level</label>
                    <select value={ticketDetail.level} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {levels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px] text-[#0000ff]">Unit</label>
                    <span
                      onClick={handleNavigateToUnit}
                      className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
                    >
                      {ticketDetail.unitNumber}
                    </span>
                    <span className="text-[11px] ml-2">Route: 507, ALMONTE E</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Nature</label>
                    <select value={ticketDetail.nature} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {natures.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px] text-[#0000ff]">Job</label>
                    <span
                      onClick={handleNavigateToJob}
                      className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
                    >
                      {ticketDetail.jobNumber}
                    </span>
                    <button className="px-1 border border-[#808080] bg-white text-[11px] ml-1">...</button>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" />
                      Test
                    </label>
                    <label className="text-[11px] ml-2">Mech</label>
                    <select value={ticketDetail.testMech} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>Mechanic</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.calledIn} onChange={() => {}} />
                      Called In
                    </label>
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.highPriority} onChange={() => {}} />
                      High Priority
                    </label>
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.updateMechLocation} onChange={() => {}} />
                      Update Mechanic Location
                    </label>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[11px] text-[#27ae60] font-bold">On Service</span>
                    <label className="text-[11px] ml-2">Exp</label>
                    <input type="text" value={ticketDetail.onServiceExp} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2 - Scope & Schedule */}
            {activeTab === "scopeSched" && ticketDetail && (
              <div className="flex gap-4">
                {/* Left - Scope of Work */}
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-bold">SCOPE OF WORK</label>
                  <textarea
                    value={ticketDetail.scopeOfWork}
                    className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[60px]"
                  />
                  <label className="text-[11px] font-bold mt-2">MAINTENANCE</label>
                  <textarea
                    value={ticketDetail.maintenanceNotes}
                    className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[80px]"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.followUpNeeded} onChange={() => {}} />
                      F/U - Follow Up Needed
                    </label>
                  </div>
                  <label className="text-[11px]">- Notes -</label>
                  <input type="text" value={ticketDetail.notes} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                </div>

                {/* Right - Scheduling */}
                <div className="min-w-[250px] flex flex-col gap-1 border border-[#808080] p-2 bg-white">
                  <label className="text-[11px] font-bold">SCHEDULING</label>
                  <div className="flex items-center gap-1">
                    <label className="w-12 text-[11px]">Date</label>
                    <input type="text" value={ticketDetail.schedDate} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="radio" name="timeType" />
                      S
                    </label>
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="radio" name="timeType" />
                      E
                    </label>
                    <label className="text-[11px]">Est Time</label>
                    <input type="text" value="0:0" className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[40px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-12 text-[11px]">Time</label>
                    <select className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>En Route</option>
                      <option>On Site</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-12 text-[11px]">Mech</label>
                    <select value={ticketDetail.schedMech} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {workers.filter(w => w !== "All").map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <label className="text-[11px]">Completed</label>
                    <input type="text" value={ticketDetail.completedTime} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]" />
                  </div>
                  <div className="mt-2">
                    <label className="text-[11px] font-bold">WITNESS</label>
                    <input type="text" value={ticketDetail.witness} className="w-full px-1 py-0.5 border border-[#808080] text-[11px] bg-white mt-1" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold">OTHER WORKERS</label>
                      <label className="flex items-center gap-1 text-[11px]">
                        <input type="checkbox" />
                        On Hold
                      </label>
                    </div>
                    <table className="w-full border-collapse text-[11px] mt-1">
                      <thead className="bg-[#f0f0f0]">
                        <tr>
                          <th className="px-1 py-0.5 text-left border border-[#c0c0c0]">Ticket #</th>
                          <th className="px-1 py-0.5 text-left border border-[#c0c0c0]">Worker</th>
                          <th className="px-1 py-0.5 text-left border border-[#c0c0c0]">Scheduled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherWorkers.map((w, i) => (
                          <tr key={i}>
                            <td className="px-1 py-0.5 border border-[#e0e0e0]">{w.ticketNumber}</td>
                            <td className="px-1 py-0.5 border border-[#e0e0e0]">{w.worker}</td>
                            <td className="px-1 py-0.5 border border-[#e0e0e0]">{w.scheduled}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3 - Customer Info */}
            {activeTab === "customerInfo" && ticketDetail && (
              <div className="flex gap-4">
                {/* Left - Customer Details */}
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Name</label>
                    <input
                      type="text"
                      value={ticketDetail.customerName}
                      onClick={handleNavigateToCustomer}
                      className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white text-[#0000ff] cursor-pointer hover:underline"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Address</label>
                    <input type="text" value={ticketDetail.customerAddress} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">City</label>
                    <input type="text" value={ticketDetail.customerCity} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">State</label>
                    <select value={ticketDetail.customerState} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[50px]">
                      <option>NY</option>
                      <option>NJ</option>
                    </select>
                    <label className="text-[11px]">Zip</label>
                    <input type="text" value={ticketDetail.customerZip} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Country</label>
                    <input type="text" value={ticketDetail.customerCountry} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Phone</label>
                    <input type="text" value={ticketDetail.customerPhone} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                    <label className="text-[11px]">Fax</label>
                    <input type="text" value={ticketDetail.customerFax} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Mobile</label>
                    <input type="text" value={ticketDetail.customerMobile} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                    <label className="text-[11px]">Contact</label>
                    <input type="text" value={ticketDetail.customerContact} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">E-Mail</label>
                    <span onClick={() => handleEmailClick(ticketDetail.customerEmail)} className="text-[11px] text-[#0000ff] cursor-pointer hover:underline">
                      {ticketDetail.customerEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Since</label>
                    <input type="text" value={ticketDetail.customerSince} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                </div>

                {/* Middle - Account Type Info */}
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Customer Type</label>
                    <select value={ticketDetail.customerType} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>General</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Account Type</label>
                    <select value={ticketDetail.accountType} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>S</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Zone</label>
                    <select value={ticketDetail.zone} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {zones.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Route</label>
                    <input type="text" value={ticketDetail.route} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Territory</label>
                    <select value={ticketDetail.territory} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>RS</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]"># Locs/Units</label>
                    <input type="text" value={ticketDetail.locsUnits} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[40px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Acct Balance</label>
                    <input type="text" value={ticketDetail.acctBalance} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Curr Balance</label>
                    <input type="text" value={ticketDetail.currBalance} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                </div>

                {/* Right - Remarks */}
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px]">Account Remarks</label>
                  <textarea value={ticketDetail.accountRemarks} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[40px]" />
                  <label className="text-[11px]">Customer Remarks</label>
                  <textarea value={ticketDetail.customerRemarks} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[40px]" />
                  <label className="text-[11px]">Billing Remarks</label>
                  <textarea value={ticketDetail.billingRemarks} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[40px]" />
                </div>
              </div>
            )}

            {/* Tab 4 - Custom Fields */}
            {activeTab === "customFields" && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-8">
                  {/* Ticket Custom */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold">Ticket Custom</label>
                    <div className="grid grid-cols-5 gap-1 text-[11px]">
                      <div className="flex items-center gap-1"><label className="w-16">NH JOBB</label><input type="text" value={ticketCustom.nhJobb} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">PMS</label><input type="text" value={ticketCustom.pms} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">COLLECTOR</label><input type="text" value={ticketCustom.collector} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Type</label><input type="text" value={ticketCustom.type} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">ViolationAp</label><input type="text" value={ticketCustom.violationAp} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>

                      <div className="flex items-center gap-1"><label className="w-16">300 COMM #</label><input type="text" value={ticketCustom.comm300} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">BID</label><input type="text" value={ticketCustom.bid} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">ROUTE</label><input type="text" value={ticketCustom.route} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Pre Test</label><input type="text" value={ticketCustom.preTest} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Custom 12</label><input type="text" value={ticketCustom.custom12} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>

                      <div className="flex items-center gap-1"><label className="w-16">Custom3</label><input type="text" value={ticketCustom.custom3} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Cancelled V</label><input type="text" value={ticketCustom.cancelledV} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">GROUPING</label><input type="text" value={ticketCustom.grouping} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Resident</label><input type="text" value={ticketCustom.resident} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Custom 13</label><input type="text" value={ticketCustom.custom13} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>

                      <div className="flex items-center gap-1"><label className="w-16">Custom4</label><input type="text" value={ticketCustom.custom4} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Rate Change</label><input type="text" value={ticketCustom.rateChange} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Acct Rep</label><input type="text" value={ticketCustom.acctRep} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Grouping 2</label><input type="text" value={ticketCustom.grouping2} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Custom 14</label><input type="text" value={ticketCustom.custom14} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>

                      <div className="flex items-center gap-1"><label className="w-16">Custom5</label><input type="text" value={ticketCustom.custom5} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Custom10</label><input type="text" value={ticketCustom.custom10} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">DWS</label><input type="text" value={ticketCustom.dws} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Proposal</label><input type="text" value={ticketCustom.proposal} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Supervisor</label><input type="text" value={ticketCustom.supervisor} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                    </div>
                  </div>

                  {/* Account Custom */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold">Account Custom</label>
                    {/* Would add account custom fields here */}
                  </div>
                </div>

                {/* TFM Ticket Custom */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold">TFM Ticket Custom</label>
                  <div className="flex gap-4 text-[11px]">
                    <div className="flex items-center gap-1"><label className="w-16">Signature</label><input type="text" value={tfmCustom.signature1} className="w-[100px] px-1 py-0.5 border border-[#808080] bg-white" /><label className="flex items-center gap-1"><input type="checkbox" checked={tfmCustom.pt} onChange={() => {}} />P/T</label></div>
                    <div className="flex items-center gap-1"><label className="w-16">Signature</label><input type="text" value={tfmCustom.signature2} className="w-[100px] px-1 py-0.5 border border-[#808080] bg-white" /><label className="flex items-center gap-1"><input type="checkbox" checked={tfmCustom.lsd} onChange={() => {}} />LSD</label></div>
                    <div className="flex items-center gap-1"><label className="w-16">Custom3</label><input type="text" value={tfmCustom.custom3} className="w-[100px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5 - Call History */}
            {activeTab === "callHistory" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-auto bg-white border border-[#808080]">
                  <table className="w-full border-collapse text-[11px]">
                    <thead className="bg-[#f0f0f0] sticky top-0">
                      <tr>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Date</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Call ID</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Type</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Category</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Location</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Description</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Resolution</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Worker</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Status</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Est</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callHistory.map((item, i) => (
                        <tr key={i} className="hover:bg-[#f0f8ff]">
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.date}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.callId}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.type}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.category}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] whitespace-pre-line">{item.location}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] max-w-[200px] truncate">{item.description}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.resolution}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.worker}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.status}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.est}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px]">{callHistory.length} call(s)</span>
                  <div className="flex items-center gap-1">
                    <label className="text-[11px]">Show Tickets</label>
                    <select value={showTicketsFilter} onChange={(e) => setShowTicketsFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>Pending</option>
                      <option>All</option>
                      <option>Completed</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-1 text-[11px]">
                    <input type="checkbox" checked={excludeTimeCard} onChange={(e) => setExcludeTimeCard(e.target.checked)} />
                    Exclude Time Card Tickets
                  </label>
                  <label className="flex items-center gap-1 text-[11px]">
                    <input type="checkbox" checked={showAllUnits} onChange={(e) => setShowAllUnits(e.target.checked)} />
                    Show Tickets for all Units
                  </label>
                </div>
              </div>
            )}

            {/* Tab 6 - Ledger */}
            {activeTab === "ledger" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-auto bg-white border border-[#808080]">
                  <table className="w-full border-collapse text-[11px]">
                    <thead className="bg-[#f0f0f0] sticky top-0">
                      <tr>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Date</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Ref</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Location</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Desc</th>
                        <th className="px-1 py-0.5 text-right font-medium border border-[#c0c0c0]">Amount</th>
                        <th className="px-1 py-0.5 text-right font-medium border border-[#c0c0c0]">Balance</th>
                        <th className="px-1 py-0.5 text-right font-medium border border-[#c0c0c0]">Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerItems.map((item, i) => (
                        <tr key={i} className="hover:bg-[#f0f8ff]">
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.date}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.ref}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.location}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] max-w-[200px] truncate">{item.desc}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] text-right">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] text-right">${item.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] text-right">{item.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-2 border-t border-[#808080] pt-1">
                  <span className="text-[11px]">{ledgerItems.length} item(s)</span>
                  <span className="text-[11px] font-bold">
                    ${ledgerItems.reduce((sum, item) => sum + item.balance, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
