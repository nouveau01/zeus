import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Hash default password
  const hashedPassword = await bcrypt.hash("admin123", 12);

  // Create Admin User
  const user = await prisma.user.upsert({
    where: { email: "zach.schwartz@nouveauelevator.com" },
    update: {
      password: hashedPassword,
      profile: "Admin",
    },
    create: {
      email: "zach.schwartz@nouveauelevator.com",
      name: "Zach Schwartz",
      password: hashedPassword,
      profile: "Admin",
    },
  });
  console.log("Created admin user:", user.name, "(password: admin123)");

  // ============================================================
  // OFFICES — upsert all 10 offices with real addresses
  // ============================================================
  const officesData = [
    { code: "NEI", name: "New York (HQ)", address: "45-18 Court Square", city: "Long Island City", state: "NY", zipCode: "11101", phone: "(718) 361-4747" },
    { code: "N-CT", name: "Connecticut", address: "600 West Avenue", city: "Norwalk", state: "CT", zipCode: "06850", phone: "(203) 299-0700" },
    { code: "N-CA", name: "California", address: "555 West 5th Street", city: "Los Angeles", state: "CA", zipCode: "90013", phone: "(213) 555-0100" },
    { code: "N-TX", name: "Texas", address: "1700 Pacific Avenue", city: "Dallas", state: "TX", zipCode: "75201", phone: "(214) 555-0200" },
    { code: "N-GA", name: "Georgia", address: "191 Peachtree Street NE", city: "Atlanta", state: "GA", zipCode: "30303", phone: "(404) 555-0300" },
    { code: "N-MA", name: "Massachusetts", address: "100 Federal Street", city: "Boston", state: "MA", zipCode: "02110", phone: "(617) 555-0400" },
    { code: "N-DC", name: "Washington D.C.", address: "1100 New York Avenue NW", city: "Washington", state: "DC", zipCode: "20005", phone: "(202) 555-0500" },
    { code: "N-MO", name: "Missouri", address: "800 Market Street", city: "St. Louis", state: "MO", zipCode: "63101", phone: "(314) 555-0600" },
    { code: "N-IL", name: "Illinois", address: "233 South Wacker Drive", city: "Chicago", state: "IL", zipCode: "60606", phone: "(312) 555-0700" },
    { code: "N-FL", name: "Florida", address: "200 South Biscayne Boulevard", city: "Miami", state: "FL", zipCode: "33131", phone: "(305) 555-0800" },
  ];

  const officeMap: Record<string, string> = {};
  for (const o of officesData) {
    const office = await prisma.office.upsert({
      where: { code: o.code },
      update: { name: o.name, address: o.address, city: o.city, state: o.state, zipCode: o.zipCode, phone: o.phone },
      create: o,
    });
    officeMap[o.code] = office.id;
  }
  console.log(`Upserted ${officesData.length} offices`);

  // ============================================================
  // CUSTOMER DATA — Real data from Total Service
  // ============================================================
  const customersData = [
    { name: "022042 EPIC CANDLER LLC", type: "General", isActive: false, balance: 0, phone: "(212) 555-3001", fax: "(212) 555-3002", email: "billing@epiccandler.com", contact: "Michael Torres", cellular: "(646) 555-3003", address: "220 WEST 42ND STREET", city: "NEW YORK", state: "NY", zipCode: "10036", website: "www.epiccandler.com" },
    { name: "1 HORSE HOLLOW ROAD", type: "General", isActive: true, balance: 0, phone: "(914) 555-4001", fax: "(914) 555-4002", email: "billing@horsehollow.com", contact: "Sandra Lee", cellular: "(914) 555-4003", address: "1 HORSE HOLLOW ROAD", city: "LOCUST VALLEY", state: "NY", zipCode: "11560" },
    { name: "1 HOTEL BROOKLYN BRIDGE", type: "General", isActive: true, balance: 18750.00, phone: "(718) 555-5001", fax: "(718) 555-5002", email: "maintenance@1hotelbb.com", contact: "Robert Chen", cellular: "(917) 555-5003", address: "60 FURMAN STREET", city: "BROOKLYN", state: "NY", zipCode: "11201", website: "www.1hotels.com" },
    { name: "1 LARKIN", type: "General", isActive: true, balance: 0, phone: "(718) 555-6001", fax: "(718) 555-6002", email: "info@1larkin.com", contact: "Jennifer Park", cellular: "(646) 555-6003", address: "1 LARKIN PLACE", city: "YONKERS", state: "NY", zipCode: "10701" },
    { name: "1-5 BOND STREET", type: "Commercial", isActive: true, balance: 0, phone: "(212) 555-7001", fax: "(212) 555-7002", email: "pm@bondstreetllc.com", contact: "David Kim", cellular: "(917) 555-7003", address: "1-5 BOND STREET", city: "NEW YORK", state: "NY", zipCode: "10012", website: "www.bondstreetnyc.com" },
    { name: "10 BK STREET OF WHITE PLAINS, LLC", type: "General", isActive: true, balance: 9850.00, phone: "(914) 555-8001", fax: "(914) 555-8002", email: "ap@10bkstreet.com", contact: "Lisa Nguyen", cellular: "(914) 555-8003", address: "10 BANK STREET", city: "WHITE PLAINS", state: "NY", zipCode: "10606" },
    { name: "10 EAST 29TH STREET ASSOCIATES LLC", type: "General", isActive: true, balance: 0, phone: "(212) 555-9001", fax: "(212) 555-9002", email: "property@10e29th.com", contact: "James Wilson", cellular: "(646) 555-9003", address: "10 EAST 29TH STREET", city: "NEW YORK", state: "NY", zipCode: "10016" },
    { name: "10 EAST 53RD STREET - EQUINOX", type: "General", isActive: true, balance: 0, phone: "(212) 555-1101", fax: "(212) 555-1102", email: "facilities@equinox53rd.com", contact: "Amy Richardson", cellular: "(917) 555-1103", address: "10 EAST 53RD STREET", city: "NEW YORK", state: "NY", zipCode: "10022", website: "www.equinox.com" },
    { name: "10 MONTAGUE TERRACE OWNERS CORP.", type: "General", isActive: true, balance: 0, phone: "(718) 555-1201", fax: "(718) 555-1202", email: "board@10montague.com", contact: "Thomas Burke", cellular: "(917) 555-1203", address: "10 MONTAGUE TERRACE", city: "BROOKLYN", state: "NY", zipCode: "11201" },
    { name: "10 W 18TH OWNER LLC", type: "General", isActive: true, balance: 14200.00, phone: "(212) 555-1301", fax: "(212) 555-1302", email: "billing@10w18th.com", contact: "Karen Mitchell", cellular: "(917) 555-1303", address: "10 WEST 18TH STREET", city: "NEW YORK", state: "NY", zipCode: "10011", website: "www.10w18th.com" },
    { name: "10 WEST 55th STREET, LLC", type: "Commercial", isActive: true, balance: 0, phone: "(212) 555-1401", fax: "(212) 555-1402", email: "mgmt@10w55th.com", contact: "Steven Garcia", cellular: "(646) 555-1403", address: "10 WEST 55TH STREET", city: "NEW YORK", state: "NY", zipCode: "10019" },
    { name: "10 WEST 56TH STREET LLC", type: "General", isActive: true, balance: 3400.00, phone: "(212) 555-1501", fax: "(212) 555-1502", email: "management@10w56th.com", contact: "Patricia Wong", cellular: "(917) 555-1503", address: "10 WEST 56TH STREET", city: "NEW YORK", state: "NY", zipCode: "10019" },
    { name: "100 CLINTON STREET LLC", type: "General", isActive: true, balance: 0, phone: "(718) 555-1601", fax: "(718) 555-1602", email: "info@100clinton.com", contact: "Mark Anderson", cellular: "(646) 555-1603", address: "100 CLINTON STREET", city: "BROOKLYN", state: "NY", zipCode: "11201" },
    { name: "100 JOHN", type: "General", isActive: true, balance: 0, phone: "(212) 555-1701", fax: "(212) 555-1702", email: "contact@100john.com", contact: "Laura Perez", cellular: "(917) 555-1703", address: "100 JOHN STREET", city: "NEW YORK", state: "NY", zipCode: "10038" },
    { name: "100 MERRICK TT, LLC", type: "General", isActive: true, balance: 0, phone: "(516) 555-1801", fax: "(516) 555-1802", email: "billing@100merrick.com", contact: "Daniel Rodriguez", cellular: "(516) 555-1803", address: "100 MERRICK ROAD", city: "ROCKVILLE CENTRE", state: "NY", zipCode: "11570" },
    { name: "100 WALL STREET INVESTMENT", type: "General", isActive: true, balance: 0, phone: "(212) 555-1901", fax: "(212) 555-1902", email: "property@100wallst.com", contact: "Rachel Green", cellular: "(917) 555-1903", address: "100 WALL STREET", city: "NEW YORK", state: "NY", zipCode: "10005", website: "www.100wallst.com" },
    { name: "1000 LLC", type: "Commercial", isActive: true, balance: 0, phone: "(212) 555-2001", fax: "(212) 555-2002", email: "info@1000llc.com", contact: "Brian Thompson", cellular: "(646) 555-2003", address: "1000 AVENUE OF THE AMERICAS", city: "NEW YORK", state: "NY", zipCode: "10018" },
    { name: "1000 PELHAM PKWY S", type: "General", isActive: true, balance: 0, phone: "(718) 555-2101", fax: "(718) 555-2102", email: "super@1000pelham.com", contact: "Nancy Davis", cellular: "(917) 555-2103", address: "1000 PELHAM PARKWAY SOUTH", city: "BRONX", state: "NY", zipCode: "10461" },
    { name: "1001 GAMES LLC", type: "General", isActive: true, balance: 0, phone: "(212) 555-2201", fax: "(212) 555-2202", email: "info@1001games.com", contact: "Kevin O'Brien", cellular: "(646) 555-2203", address: "1001 AVENUE OF THE AMERICAS", city: "NEW YORK", state: "NY", zipCode: "10018", website: "www.1001games.com" },
    { name: "101 7TH AVENUE / REGENCY CENTERS", type: "General", isActive: true, balance: 0, phone: "(212) 555-2301", fax: "(212) 555-2302", email: "operations@regencycenters.com", contact: "Michelle Foster", cellular: "(917) 555-2303", address: "101 SEVENTH AVENUE", city: "NEW YORK", state: "NY", zipCode: "10011", website: "www.regencycenters.com" },
    { name: "101 WEST 57th STREET HOTEL CORP.", type: "General", isActive: true, balance: 0, phone: "(212) 555-2401", fax: "(212) 555-2402", email: "facilities@101w57hotel.com", contact: "George Hamilton", cellular: "(917) 555-2403", address: "101 WEST 57TH STREET", city: "NEW YORK", state: "NY", zipCode: "10019", website: "www.101w57hotel.com" },
    { name: "1010 EXECUTIVE CENTER LLC", type: "General", isActive: true, balance: 0, phone: "(516) 555-2501", fax: "(516) 555-2502", email: "mgmt@1010executive.com", contact: "Julie Martin", cellular: "(516) 555-2503", address: "1010 NORTHERN BOULEVARD", city: "GREAT NECK", state: "NY", zipCode: "11021" },
    { name: "10101 AVENUE D", type: "General", isActive: true, balance: 0, phone: "(718) 555-2601", fax: "(718) 555-2602", email: "super@10101aved.com", contact: "Anthony Russo", cellular: "(917) 555-2603", address: "10101 AVENUE D", city: "BROOKLYN", state: "NY", zipCode: "11236" },
    { name: "1025 FIFTH AVENUE, INC.", type: "Property Manage", isActive: true, balance: 0, phone: "(212) 555-2701", fax: "(212) 555-2702", email: "mgmt@1025fifth.com", contact: "Susan Coleman", cellular: "(917) 555-2703", address: "1025 FIFTH AVENUE", city: "NEW YORK", state: "NY", zipCode: "10028", website: "www.1025fifth.com" },
    { name: "104 WEST 29TH STREET LLC", type: "General", isActive: true, balance: 0, phone: "(212) 555-2801", fax: "(212) 555-2802", email: "property@104w29th.com", contact: "Paul Bennett", cellular: "(646) 555-2803", address: "104 WEST 29TH STREET", city: "NEW YORK", state: "NY", zipCode: "10001" },
    { name: "1058 CORPORATION", type: "General", isActive: false, balance: 0, phone: "(212) 555-2901", fax: "(212) 555-2902", email: "info@1058corp.com", contact: "Angela Morris", cellular: "(646) 555-2903", address: "1058 BROADWAY", city: "NEW YORK", state: "NY", zipCode: "10010" },
    { name: "106 FERRIS STREET, LLC", type: "General", isActive: true, balance: 0, phone: "(718) 555-3001", fax: "(718) 555-3002", email: "info@106ferris.com", contact: "Frank DeLuca", cellular: "(917) 555-3003", address: "106 FERRIS STREET", city: "BROOKLYN", state: "NY", zipCode: "11231" },
    { name: "106 FULTON OWNER LLC", type: "General", isActive: true, balance: 7600.00, phone: "(212) 555-3101", fax: "(212) 555-3102", email: "billing@106fulton.com", contact: "Christine Taylor", cellular: "(917) 555-3103", address: "106 FULTON STREET", city: "NEW YORK", state: "NY", zipCode: "10038", website: "www.106fulton.com" },
    { name: "106 WEST 56TH STREET PROPERTY INVESTORS III, LLC", type: "General", isActive: true, balance: 2100.00, phone: "(212) 555-3201", fax: "(212) 555-3202", email: "ap@106w56property.com", contact: "Donald Price", cellular: "(646) 555-3203", address: "106 WEST 56TH STREET", city: "NEW YORK", state: "NY", zipCode: "10019" },
    { name: "107 NORTHERN BOULEVARD REALTY INC.", type: "Commercial", isActive: true, balance: 0, phone: "(516) 555-3301", fax: "(516) 555-3302", email: "info@107northern.com", contact: "Maria Santos", cellular: "(516) 555-3303", address: "107 NORTHERN BOULEVARD", city: "MANHASSET", state: "NY", zipCode: "11030" },
    { name: "109-01LIBERTY", type: "General", isActive: true, balance: 0, phone: "(718) 555-3401", fax: "(718) 555-3402", email: "info@109liberty.com", contact: "Joseph Quinn", cellular: "(917) 555-3403", address: "109-01 LIBERTY AVENUE", city: "RICHMOND HILL", state: "NY", zipCode: "11419" },
    { name: "11 EAST 44TH STREET, LLC", type: "General", isActive: true, balance: 0, phone: "(212) 555-3501", fax: "(212) 555-3502", email: "property@11e44th.com", contact: "Catherine Walsh", cellular: "(646) 555-3503", address: "11 EAST 44TH STREET", city: "NEW YORK", state: "NY", zipCode: "10017" },
    { name: "110 EAST 64TH OWNER LLC", type: "General", isActive: true, balance: 11500.00, phone: "(212) 555-3601", fax: "(212) 555-3602", email: "management@110e64th.com", contact: "William Drake", cellular: "(917) 555-3603", address: "110 EAST 64TH STREET", city: "NEW YORK", state: "NY", zipCode: "10065", website: "www.110e64th.com" },
    { name: "110 WALL STREET L.P.", type: "General", isActive: true, balance: 0, phone: "(212) 555-3701", fax: "(212) 555-3702", email: "info@110wallst.com", contact: "Diane Chambers", cellular: "(646) 555-3703", address: "110 WALL STREET", city: "NEW YORK", state: "NY", zipCode: "10005" },
    { name: "110-39 71ST AVE OWNERS, LLC", type: "General", isActive: true, balance: 900.00, phone: "(718) 555-3801", fax: "(718) 555-3802", email: "board@11039-71stave.com", contact: "Raymond Lopez", cellular: "(917) 555-3803", address: "110-39 71ST AVENUE", city: "FOREST HILLS", state: "NY", zipCode: "11375" },
    { name: "111 LIVINGSTON LLC", type: "General", isActive: true, balance: 0, phone: "(718) 555-3901", fax: "(718) 555-3902", email: "mgmt@111livingston.com", contact: "Betty Harper", cellular: "(646) 555-3903", address: "111 LIVINGSTON STREET", city: "BROOKLYN", state: "NY", zipCode: "11201" },
    { name: "111 SYLVAN AVENUE", type: "General", isActive: true, balance: 0, phone: "(201) 555-4001", fax: "(201) 555-4002", email: "info@111sylvan.com", contact: "Gary Russell", cellular: "(201) 555-4003", address: "111 SYLVAN AVENUE", city: "ENGLEWOOD CLIFFS", state: "NJ", zipCode: "07632" },
    { name: "111 WALL STREET", type: "General", isActive: true, balance: 0, phone: "(212) 555-4101", fax: "(212) 555-4102", email: "facilities@111wallst.com", contact: "Helen Crawford", cellular: "(917) 555-4103", address: "111 WALL STREET", city: "NEW YORK", state: "NY", zipCode: "10005", website: "www.111wallst.com" },
  ];

  // Customers for OTHER offices (demo data for permissions testing)
  const outOfStateCustomers = [
    // Texas
    { name: "DALLAS GALLERIA MANAGEMENT LLC", type: "Commercial", isActive: true, balance: 8400.00, phone: "(214) 555-1001", fax: "(214) 555-1002", email: "facilities@dallasgalleria.com", contact: "Carlos Reyes", cellular: "(214) 555-1003", address: "13350 DALLAS PARKWAY SUITE 1200", city: "DALLAS", state: "TX", zipCode: "75240", website: "www.dallasgalleria.com", officeCode: "N-TX" },
    { name: "REUNION TOWER ASSOCIATES", type: "General", isActive: true, balance: 3200.00, phone: "(214) 555-2001", fax: "(214) 555-2002", email: "ops@reuniontower.com", contact: "Martha Jenkins", cellular: "(214) 555-2003", address: "300 REUNION BOULEVARD EAST", city: "DALLAS", state: "TX", zipCode: "75207", website: "www.reuniontower.com", officeCode: "N-TX" },
    // Georgia
    { name: "PEACHTREE CENTER DEVELOPMENT", type: "Commercial", isActive: true, balance: 14750.00, phone: "(404) 555-1001", fax: "(404) 555-1002", email: "pm@peachtreecenter.com", contact: "Terrence Washington", cellular: "(404) 555-1003", address: "225 PEACHTREE STREET NE SUITE 400", city: "ATLANTA", state: "GA", zipCode: "30303", website: "www.peachtreecenter.com", officeCode: "N-GA" },
    { name: "BUCKHEAD TOWER OWNERS CORP", type: "General", isActive: true, balance: 1800.00, phone: "(404) 555-2001", fax: "(404) 555-2002", email: "board@buckheadtower.com", contact: "Deborah Hayes", cellular: "(404) 555-2003", address: "3340 PEACHTREE ROAD NE", city: "ATLANTA", state: "GA", zipCode: "30326", officeCode: "N-GA" },
    // California
    { name: "WILSHIRE GRAND CENTER LLC", type: "Commercial", isActive: true, balance: 22500.00, phone: "(213) 555-1001", fax: "(213) 555-1002", email: "facilities@wilshiregrand.com", contact: "Jason Park", cellular: "(213) 555-1003", address: "900 WILSHIRE BOULEVARD SUITE 100", city: "LOS ANGELES", state: "CA", zipCode: "90017", website: "www.wilshiregrandcenter.com", officeCode: "N-CA" },
    { name: "THE CENTURY PLAZA RESIDENCES", type: "General", isActive: true, balance: 0, phone: "(310) 555-2001", fax: "(310) 555-2002", email: "management@centuryplaza.com", contact: "Sarah Nakamura", cellular: "(310) 555-2003", address: "2025 AVENUE OF THE STARS", city: "LOS ANGELES", state: "CA", zipCode: "90067", website: "www.centuryplazaresidences.com", officeCode: "N-CA" },
    // Massachusetts
    { name: "PRUDENTIAL CENTER MANAGEMENT", type: "Commercial", isActive: true, balance: 11400.00, phone: "(617) 555-1001", fax: "(617) 555-1002", email: "ops@prudentialcenter.com", contact: "Patrick Sullivan", cellular: "(617) 555-1003", address: "800 BOYLSTON STREET SUITE 300", city: "BOSTON", state: "MA", zipCode: "02199", website: "www.prudentialcenter.com", officeCode: "N-MA" },
    { name: "JOHN HANCOCK TOWER LLC", type: "General", isActive: true, balance: 4600.00, phone: "(617) 555-2001", fax: "(617) 555-2002", email: "mgmt@johnhancocktower.com", contact: "Mary O'Connor", cellular: "(617) 555-2003", address: "200 CLARENDON STREET", city: "BOSTON", state: "MA", zipCode: "02116", officeCode: "N-MA" },
    // Washington DC
    { name: "NATIONAL PRESS BUILDING ASSOC.", type: "Commercial", isActive: true, balance: 6300.00, phone: "(202) 555-1001", fax: "(202) 555-1002", email: "facilities@nationalpressbuilding.com", contact: "Gregory Andrews", cellular: "(202) 555-1003", address: "529 14TH STREET NW SUITE 1000", city: "WASHINGTON", state: "DC", zipCode: "20045", website: "www.nationalpressbuilding.com", officeCode: "N-DC" },
    { name: "WATERGATE COMMERCIAL LLC", type: "General", isActive: true, balance: 2100.00, phone: "(202) 555-2001", fax: "(202) 555-2002", email: "mgmt@watergateoffice.com", contact: "Victoria Palmer", cellular: "(202) 555-2003", address: "2600 VIRGINIA AVENUE NW", city: "WASHINGTON", state: "DC", zipCode: "20037", officeCode: "N-DC" },
    // Missouri
    { name: "GATEWAY ARCH PARTNERS", type: "General", isActive: true, balance: 3800.00, phone: "(314) 555-1001", fax: "(314) 555-1002", email: "property@gatewaymall.com", contact: "Timothy Brooks", cellular: "(314) 555-1003", address: "100 CONVENTION PLAZA SUITE 200", city: "ST. LOUIS", state: "MO", zipCode: "63101", website: "www.gatewayarchpartners.com", officeCode: "N-MO" },
    { name: "CITY CENTER REDEVELOPMENT", type: "Commercial", isActive: true, balance: 0, phone: "(314) 555-2001", fax: "(314) 555-2002", email: "info@citycenterredevelopment.com", contact: "Rebecca Lane", cellular: "(314) 555-2003", address: "100 NORTH BROADWAY SUITE 400", city: "ST. LOUIS", state: "MO", zipCode: "63102", officeCode: "N-MO" },
    // Illinois
    { name: "WILLIS TOWER MANAGEMENT LLC", type: "Commercial", isActive: true, balance: 31500.00, phone: "(312) 555-1001", fax: "(312) 555-1002", email: "ops@willistower.com", contact: "Michael O'Brien", cellular: "(312) 555-1003", address: "233 SOUTH WACKER DRIVE SUITE 500", city: "CHICAGO", state: "IL", zipCode: "60606", website: "www.willistower.com", officeCode: "N-IL" },
    { name: "MARINA CITY CONDO ASSOCIATION", type: "General", isActive: true, balance: 1200.00, phone: "(312) 555-2001", fax: "(312) 555-2002", email: "board@marinacity.com", contact: "Linda Chen", cellular: "(312) 555-2003", address: "300 NORTH STATE STREET", city: "CHICAGO", state: "IL", zipCode: "60654", officeCode: "N-IL" },
    // Florida
    { name: "BRICKELL CITY CENTRE MANAGEMENT", type: "Commercial", isActive: true, balance: 9800.00, phone: "(305) 555-1001", fax: "(305) 555-1002", email: "facilities@brickellcc.com", contact: "Roberto Diaz", cellular: "(305) 555-1003", address: "701 SOUTH MIAMI AVENUE SUITE 300", city: "MIAMI", state: "FL", zipCode: "33131", website: "www.brickellcitycentre.com", officeCode: "N-FL" },
    { name: "SUNNY ISLES TOWER OWNERS", type: "General", isActive: true, balance: 2750.00, phone: "(305) 555-2001", fax: "(305) 555-2002", email: "board@sunnyislestower.com", contact: "Claudia Fernandez", cellular: "(305) 555-2003", address: "18001 COLLINS AVENUE", city: "SUNNY ISLES BEACH", state: "FL", zipCode: "33160", officeCode: "N-FL" },
    // Connecticut
    { name: "HARTFORD FINANCIAL CENTER LLC", type: "Commercial", isActive: true, balance: 7200.00, phone: "(860) 555-1001", fax: "(860) 555-1002", email: "facilities@hartfordfinancial.com", contact: "Nathan Burke", cellular: "(860) 555-1003", address: "100 PEARL STREET SUITE 500", city: "HARTFORD", state: "CT", zipCode: "06103", website: "www.hartfordfinancialcenter.com", officeCode: "N-CT" },
    { name: "STAMFORD HARBOR ASSOCIATES", type: "General", isActive: true, balance: 4100.00, phone: "(203) 555-2001", fax: "(203) 555-2002", email: "mgmt@stamfordharbor.com", contact: "Christine Morales", cellular: "(203) 555-2003", address: "1 LANDMARK SQUARE SUITE 200", city: "STAMFORD", state: "CT", zipCode: "06901", officeCode: "N-CT" },
  ];

  // Delete existing data in correct order (respecting foreign keys)
  await prisma.activityLog.deleteMany({});
  await prisma.fieldHistory.deleteMany({});
  await prisma.portalUser.deleteMany({});
  await prisma.sequenceEnrollment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.jobHistory.deleteMany({});
  await prisma.file.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.premises.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.jobTemplate.deleteMany({});
  await prisma.jobType.deleteMany({});
  console.log("Cleared existing data");

  // ============================================================
  // CREATE NY CUSTOMERS
  // ============================================================
  const customerIds: string[] = [];
  const customerIdMap: Record<string, string> = {}; // name → id
  for (const customerData of customersData) {
    const customer = await prisma.customer.create({
      data: {
        name: customerData.name,
        type: customerData.type,
        isActive: customerData.isActive,
        balance: customerData.balance,
        phone: customerData.phone || null,
        fax: customerData.fax || null,
        email: customerData.email || null,
        contact: customerData.contact || null,
        cellular: customerData.cellular || null,
        address: customerData.address || null,
        city: customerData.city || null,
        state: customerData.state || null,
        zipCode: customerData.zipCode || null,
        website: (customerData as any).website || null,
      },
    });
    customerIds.push(customer.id);
    customerIdMap[customerData.name] = customer.id;
  }
  console.log(`Created ${customersData.length} NY customers`);

  // ============================================================
  // CREATE OUT-OF-STATE CUSTOMERS
  // ============================================================
  const outOfStateCustomerMap: Record<string, { id: string; officeCode: string }> = {};
  for (const customerData of outOfStateCustomers) {
    const customer = await prisma.customer.create({
      data: {
        name: customerData.name,
        type: customerData.type,
        isActive: customerData.isActive,
        balance: customerData.balance,
        phone: customerData.phone || null,
        fax: customerData.fax || null,
        email: customerData.email || null,
        contact: customerData.contact || null,
        cellular: customerData.cellular || null,
        address: customerData.address || null,
        city: customerData.city || null,
        state: customerData.state || null,
        zipCode: customerData.zipCode || null,
        website: (customerData as any).website || null,
      },
    });
    outOfStateCustomerMap[customerData.name] = { id: customer.id, officeCode: customerData.officeCode };
  }
  console.log(`Created ${outOfStateCustomers.length} out-of-state customers`);

  // ============================================================
  // PREMISES/ACCOUNTS — Real data from Total Service
  // ============================================================
  const premisesData = [
    { premisesId: "1-5BOND", name: "1-5 BOND STREET", address: "318 LAFAYETTE STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Alex Monroe", phone: "(212) 555-3011", fax: "(212) 555-3012", cellular: "(646) 555-3013", email: "super@1-5bond.com", terr: "RS", route: 3, zone: 2 },
    { premisesId: "1-9NDPBIMC", name: "1-9 NATHAN D.PERLMAN PLACE NYC", address: "FIRST AVENUE @ 16TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Barbara Nolan", phone: "(212) 555-3021", fax: "(212) 555-3022", cellular: "(646) 555-3023", email: "bldg@ndperlman.com", terr: "DS", route: 1, zone: 1 },
    { premisesId: "1-9wFORDHAM***", name: "1-9 WEST FORDHAM ROAD", address: "1-9 WEST FORDHAM ROAD", city: "BRONX", state: "NY", type: "S", isActive: true, balance: 2850.00, contact: "Carlos Vega", phone: "(718) 555-3031", fax: "(718) 555-3032", cellular: "(917) 555-3033", email: "super@westfordham.com", website: "www.westfordhamcenter.com", terr: "DWS", route: 7, zone: 4 },
    { premisesId: "1-9wFORDHAMBLIN", name: "1-9 WEST FORDHAM ROAD - BLINK FITNESS", address: "1-9 WEST FORDHAM ROAD", city: "BRONX", state: "NY", type: "Non-Contract", isActive: true, balance: 0, contact: "Diana Torres", phone: "(718) 555-3041", fax: "(718) 555-3042", cellular: "(917) 555-3043", email: "ops@blinkfordham.com", terr: "SS", route: 7, zone: 4 },
    { premisesId: "10-12CHESTNUT**", name: "10-12 CHESTNUT STREET", address: "10-12 CHESTNUT STREET", city: "SUFFERN", state: "NY", type: "S", isActive: true, balance: 780.00, contact: "Edward Walsh", phone: "(845) 555-3051", fax: "(845) 555-3052", cellular: "(845) 555-3053", email: "super@chestnutsuffern.com", terr: "VS", route: 12, zone: 8 },
    { premisesId: "10-12NDPBI", name: "10-12 NATHAN D.PERLMAN PLACE", address: "10-12 NATHAND", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Frances Kim", phone: "(212) 555-3061", fax: "(212) 555-3062", cellular: "(646) 555-3063", email: "mgmt@10-12ndperlman.com", terr: "DS", route: 1, zone: 1 },
    { premisesId: "10-2746THAVE", name: "10-27 46TH AVENUE", address: "10-27 46TH AVENUE", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "George Huang", phone: "(718) 555-3071", fax: "(718) 555-3072", cellular: "(917) 555-3073", email: "super@1027-46thave.com", terr: "HS", route: 5, zone: 3 },
    { premisesId: "100 W44", name: "100 WEST 44th STREET", address: "100 WEST 44TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Helen Burke", phone: "(212) 555-3081", fax: "(212) 555-3082", cellular: "(646) 555-3083", email: "facilities@100w44.com", terr: "RS", route: 2, zone: 1 },
    { premisesId: "100-106EBROAD", name: "100-106 EAST BROAD STREET", address: "100-106 EAST BROAD STREET", city: "ELIZABETH", state: "NJ", type: "Non-Contract", isActive: true, balance: 0, contact: "Ivan Cruz", phone: "(908) 555-3091", fax: "(908) 555-3092", cellular: "(908) 555-3093", email: "super@100ebroad.com", terr: "SS", route: 11, zone: 7 },
    { premisesId: "100-1723RD*****", name: "100-17 23RD AVENUE - ELMHURST", address: "QUEENSBRIDGE SOUTH", city: "LONG ISLAND CITY", state: "NY", type: "SH", isActive: true, balance: 38500.00, contact: "Janet Robinson", phone: "(718) 555-3101", fax: "(718) 555-3102", cellular: "(917) 555-3103", email: "super@queensbridge.com", website: "www.queenbridgehousing.com", terr: "DWS", route: 6, zone: 3 },
    { premisesId: "100-1723RDTRADE", name: "100-17 23RD TRADES", address: "125 PARK AVENUE, SUITE 1530", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: true, balance: 0, contact: "Kevin Marsh", phone: "(212) 555-3111", fax: "(212) 555-3112", cellular: "(646) 555-3113", email: "admin@23rdtrades.com", terr: "RS", route: 2, zone: 1 },
    { premisesId: "100-30DIT*****", name: "100-30 DITMARS BOULEVARD", address: "100-30 DITMARS BOULEVARD", city: "EAST ELMHURST", state: "NY", type: "S", isActive: true, balance: 18750.00, contact: "Laura Diaz", phone: "(718) 555-3121", fax: "(718) 555-3122", cellular: "(917) 555-3123", email: "super@100-30ditmars.com", website: "www.ditmarsapts.com", terr: "DWS", route: 6, zone: 3 },
    { premisesId: "1000 PELHAM PKW", name: "1000PEL", address: "MORNINGSIDE NURSING & REHAB", city: "BRONX", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Mark Stevens", phone: "(718) 555-3131", fax: "(718) 555-3132", cellular: "(917) 555-3133", email: "admin@morningsidenursing.com", terr: "DWS", route: 8, zone: 5 },
    { premisesId: "100010THAVE****", name: "1000 10TH AVENUE", address: "1000 10TH AVENUE", city: "NEW YORK", state: "NY", type: "Resident Mech.", isActive: true, balance: 42000.00, contact: "Nancy Shaw", phone: "(212) 555-3141", fax: "(212) 555-3142", cellular: "(917) 555-3143", email: "super@100010thave.com", website: "www.100010thave.com", terr: "RS", route: 3, zone: 2 },
    { premisesId: "1000CAS", name: "1000 CASTLE ROAD", address: "1000 CASTLE ROAD", city: "SECAUCUS", state: "NJ", type: "Non-Contract", isActive: false, balance: 0, contact: "Oscar Field", phone: "(201) 555-3151", fax: "(201) 555-3152", cellular: "(201) 555-3153", email: "super@1000castlerd.com", terr: "SS", route: 10, zone: 6 },
    { premisesId: "1000FIF", name: "1000 FIFTH AVENUE", address: "1000 FIFTH AVENUE", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Patricia Lane", phone: "(212) 555-3161", fax: "(212) 555-3162", cellular: "(646) 555-3163", email: "facilities@1000fifth.com", terr: "RS", route: 4, zone: 2 },
    { premisesId: "1000FRA", name: "1000 FRANKLIN AVENUE", address: "1000 FRANKLIN AVENUE", city: "BETHPAGE", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Quinn Brady", phone: "(516) 555-3171", fax: "(516) 555-3172", cellular: "(516) 555-3173", email: "mgmt@1000franklin.com", terr: "HS", route: 9, zone: 6 },
    { premisesId: "1000MON", name: "1000 MONTAUK HIGHWAY", address: "1000 MONTAUK HIGHWAY", city: "ROCKVILLE CENTRE", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Rachel Ford", phone: "(516) 555-3181", fax: "(516) 555-3182", cellular: "(516) 555-3183", email: "admin@1000montauk.com", terr: "HS", route: 9, zone: 7 },
    { premisesId: "1000PEL****", name: "1000 PELHAM PARKWAY SOUTH", address: "1000 PELHAM PARKWAY SOUTH", city: "BRONX", state: "NY", type: "S", isActive: true, balance: 7400.00, contact: "Sam Quinn", phone: "(718) 555-3191", fax: "(718) 555-3192", cellular: "(917) 555-3193", email: "super@1000pelhampkwy.com", website: "www.1000pelham.com", terr: "DWS", route: 8, zone: 5 },
    { premisesId: "1000PELMMC", name: "1000 PELHAM PARKWAY SOUTH - MMC", address: "1000 PELHAM PARKWAY SOUTH", city: "BRONX", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Tina Moore", phone: "(718) 555-3201", fax: "(718) 555-3202", cellular: "(917) 555-3203", email: "admin@1000pelham-mmc.com", terr: "DWS", route: 8, zone: 5 },
    { premisesId: "1000SIXTHAVE", name: "1000 SIXTH AVENUE", address: "1000 AVENUE OF THE AMERICAS", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Ursula Grant", phone: "(212) 555-3211", fax: "(212) 555-3212", cellular: "(646) 555-3213", email: "ops@1000sixthave.com", terr: "RS", route: 2, zone: 1 },
    { premisesId: "1000STEWAR", name: "1000 STEWART AVENUE", address: "1000 STEWART AVENUE", city: "GARDEN CITY", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Victor Holt", phone: "(516) 555-3221", fax: "(516) 555-3222", cellular: "(516) 555-3223", email: "admin@1000stewartave.com", terr: "HS", route: 9, zone: 6 },
    { premisesId: "1000STEWART****", name: "1000 STEWART AVENUE - NEWMARK", address: "1000 STEWART AVENUE", city: "GARDEN CITY", state: "NY", type: "H", isActive: true, balance: 1850.00, contact: "Wendy Burns", phone: "(516) 555-3231", fax: "(516) 555-3232", cellular: "(516) 555-3233", email: "property@1000stewart-newmark.com", website: "www.newmark.com", terr: "HS", route: 9, zone: 6 },
    { premisesId: "1000STEWARTLIFE", name: "1000 STEWART AVENUE - LIFETIME BRANDS", address: "1000 STEWART AVENUE", city: "GARDEN CITY", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Xavier Price", phone: "(516) 555-3241", fax: "(516) 555-3242", cellular: "(516) 555-3243", email: "facilities@lifetimebrands.com", terr: "HS", route: 9, zone: 6 },
    { premisesId: "1000WASHINGT***", name: "1000 WASHINGTON AVENUE - BBG", address: "1000 WASHINGTON AVENUE", city: "BROOKLYN", state: "NY", type: "S", isActive: true, balance: 9200.00, contact: "Yvonne Cross", phone: "(718) 555-3251", fax: "(718) 555-3252", cellular: "(917) 555-3253", email: "super@1000washingtonbbg.com", website: "www.bbgmanagement.com", terr: "DS", route: 5, zone: 3 },
    { premisesId: "1001E45", name: "1001 EAST 45th STREET AKA 4502 FARRAGUT", address: "820 ELMONT ROAD", city: "ELMONT", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Zachary Ross", phone: "(516) 555-3261", fax: "(516) 555-3262", cellular: "(516) 555-3263", email: "mgmt@1001e45th.com", terr: "HS", route: 9, zone: 7 },
    { premisesId: "1001SOYSTER***", name: "1001 SOUTH OYSTER BAY ROAD - NORTHWELL", address: "1001 SOUTH OYSTER BAY ROAD", city: "BETHPAGE", state: "NY", type: "S", isActive: true, balance: 3100.00, contact: "Amy Frost", phone: "(516) 555-3271", fax: "(516) 555-3272", cellular: "(516) 555-3273", email: "facilities@northwell-bethpage.com", website: "www.northwell.edu", terr: "HS", route: 9, zone: 6 },
    { premisesId: "1002GREENACRE**", name: "1002 GREEN ACRES MALL", address: "1002 GREEN ACRES MALL, SPACE 01044", city: "VALLEY STREAM", state: "NY", type: "S", isActive: true, balance: 4600.00, contact: "Brian Carr", phone: "(516) 555-3281", fax: "(516) 555-3282", cellular: "(516) 555-3283", email: "ops@greenacres.com", website: "www.greenacresny.com", terr: "HS", route: 10, zone: 7 },
    { premisesId: "1002MAHSBC", name: "1002 Madison Avenue", address: "1002 MADISON AVENUE", city: "BUFFALO", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Carla Mason", phone: "(716) 555-3291", fax: "(716) 555-3292", cellular: "(716) 555-3293", email: "mgmt@1002madison-buffalo.com", terr: "VS", route: 12, zone: 8 },
    { premisesId: "1005E179", name: "1005 EAST 179TH STREET", address: "1005 EAST 179TH STREET", city: "BRONX", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Derek Shaw", phone: "(718) 555-3301", fax: "(718) 555-3302", cellular: "(917) 555-3303", email: "super@1005e179.com", terr: "DWS", route: 7, zone: 4 },
    { premisesId: "1009FIF", name: "1009 FIFTH AVENUE", address: "1009 FIFTH AVENUE", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Elena Morris", phone: "(212) 555-3311", fax: "(212) 555-3312", cellular: "(646) 555-3313", email: "contact@1009fifth.com", terr: "RS", route: 4, zone: 2 },
    { premisesId: "100AMI", name: "100 AMITY STREET", address: "45 MAIN STREET, SUITE 800", city: "BROOKLYN", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Frank Webb", phone: "(718) 555-3321", fax: "(718) 555-3322", cellular: "(917) 555-3323", email: "info@100amity.com", terr: "DS", route: 5, zone: 3 },
    { premisesId: "100BALDWIN*****", name: "100 BALDWIN ROAD", address: "100 BALDWIN ROAD", city: "HEMPSTEAD", state: "NY", type: "S", isActive: true, balance: 27500.00, contact: "Grace Owens", phone: "(516) 555-3331", fax: "(516) 555-3332", cellular: "(516) 555-3333", email: "super@100baldwinrd.com", website: "www.100baldwinrd.com", terr: "HS", route: 9, zone: 7 },
    { premisesId: "100BAR", name: "140 WEST STREET CONDOMINIUM", address: "140 WEST STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Harold Penn", phone: "(212) 555-3341", fax: "(212) 555-3342", cellular: "(646) 555-3343", email: "mgmt@140westst.com", terr: "RS", route: 3, zone: 2 },
    { premisesId: "100BARCLAYMAG", name: "100 BARCLAY - MAGNUM", address: "100 BARCLAY STREET", city: "NEW YORK", state: "NY", type: "MOD", isActive: true, balance: 0, contact: "Irene Fox", phone: "(212) 555-3351", fax: "(212) 555-3352", cellular: "(917) 555-3353", email: "ops@100barclay.com", website: "www.100barclay.com", terr: "RS", route: 3, zone: 2 },
    { premisesId: "100BRO", name: "100 BROADWAY", address: "100 BROADWAY", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "James Hunt", phone: "(212) 555-3361", fax: "(212) 555-3362", cellular: "(646) 555-3363", email: "super@100broadway.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "100BROAD", name: "100 BROAD STREET", address: "100 BROAD STREET", city: "ELIZABETH", state: "NJ", type: "Non-Contract", isActive: false, balance: 0, contact: "Karen Young", phone: "(908) 555-3371", fax: "(908) 555-3372", cellular: "(908) 555-3373", email: "info@100broadeliz.com", terr: "SS", route: 11, zone: 7 },
    { premisesId: "100BROWAL", name: "100 BROADWAY - DUANE", address: "440 NINTH AVENUE", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Larry Stone", phone: "(212) 555-3381", fax: "(212) 555-3382", cellular: "(646) 555-3383", email: "admin@100broadwayduane.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "100CHURCHST****", name: "100 CHURCH STREET", address: "100 CHURCH STREET", city: "NEW YORK", state: "NY", type: "S", isActive: true, balance: 5800.00, contact: "Mia Bell", phone: "(212) 555-3391", fax: "(212) 555-3392", cellular: "(917) 555-3393", email: "super@100churchst.com", website: "www.100churchstreet.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "100CLI", name: "100 CLINTON STREET", address: "340 COURT STREET", city: "BROOKLYN", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Nathan Cole", phone: "(718) 555-3401", fax: "(718) 555-3402", cellular: "(917) 555-3403", email: "super@100clintonst.com", terr: "DS", route: 5, zone: 3 },
    { premisesId: "100CLIFTONPL***", name: "100 CLIFTON PLACE", address: "100 CLIFTON PLACE", city: "JERSEY CITY", state: "NJ", type: "S", isActive: true, balance: 3950.00, contact: "Olivia Ford", phone: "(201) 555-3411", fax: "(201) 555-3412", cellular: "(201) 555-3413", email: "super@100cliftonpl.com", website: "www.cliftonplacejc.com", terr: "SS", route: 11, zone: 7 },
    { premisesId: "100COM", name: "100 COMMUNITY DRIVE", address: "100 COMMUNITY DRIVE", city: "GREAT NECK", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Paul Dean", phone: "(516) 555-3421", fax: "(516) 555-3422", cellular: "(516) 555-3423", email: "admin@100communitydrive.com", terr: "HS", route: 9, zone: 6 },
    { premisesId: "100E77CARRIER", name: "100 EAST 77TH STREET - CARRIER", address: "100 EAST 77TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: true, balance: 0, contact: "Rita Webb", phone: "(212) 555-3431", fax: "(212) 555-3432", cellular: "(646) 555-3433", email: "facilities@100e77carrier.com", terr: "RS", route: 4, zone: 2 },
    { premisesId: "100E77LENO***", name: "100 EAST 77TH ST **MASTER ACCOUNT**", address: "100 EAST 77TH ST", city: "NEW YORK", state: "NY", type: "Resident Mech.", isActive: true, balance: 31500.00, contact: "Steve Nash", phone: "(212) 555-3441", fax: "(212) 555-3442", cellular: "(917) 555-3443", email: "super@100e77th.com", website: "www.100e77th.com", terr: "RS", route: 4, zone: 2 },
    { premisesId: "100E77STEMPIRE", name: "100 EAST 77TH STREET - EMPIRE", address: "100 EAST 77TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: true, balance: 0, contact: "Tara Knox", phone: "(212) 555-3451", fax: "(212) 555-3452", cellular: "(646) 555-3453", email: "ops@100e77empire.com", terr: "RS", route: 4, zone: 2 },
    { premisesId: "100E77TH", name: "100 EAST 77TH STREET - HANDI-LIFT, INC.", address: "100 EAST 77TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: true, balance: 0, contact: "Uma Roth", phone: "(212) 555-3461", fax: "(212) 555-3462", cellular: "(646) 555-3463", email: "info@handilift.com", terr: "RS", route: 4, zone: 2 },
    { premisesId: "100E77THJCDUG", name: "100 EAST 77TH STREET - JC DUGGAN", address: "100 EAST 77TH STREET", city: "NEW YORK", state: "NY", type: "Non-Contract", isActive: true, balance: 0, contact: "Victor Page", phone: "(212) 555-3471", fax: "(212) 555-3472", cellular: "(646) 555-3473", email: "jcduggan@100e77.com", terr: "RS", route: 4, zone: 2 },
    { premisesId: "100EASTOCR", name: "100 EAST OLD COUNTRY ROAD", address: "100 EAST OLD COUNTRY ROAD", city: "HICKSVILLE", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Wanda Cruz", phone: "(516) 555-3481", fax: "(516) 555-3482", cellular: "(516) 555-3483", email: "mgmt@100eastocr.com", terr: "HS", route: 9, zone: 6 },
    { premisesId: "100EFORDHAM****", name: "100 E FORDHAM ROAD", address: "100 E FORDHAM ROAD", city: "BRONX", state: "NY", type: "S", isActive: true, balance: 2100.00, contact: "Xander Ross", phone: "(718) 555-3491", fax: "(718) 555-3492", cellular: "(917) 555-3493", email: "super@100efordham.com", website: "www.100efordham.com", terr: "DWS", route: 7, zone: 4 },
    { premisesId: "100GAR47", name: "100 GARDEN CITY PLAZA -", address: "ONE OLD COUNTRY RD", city: "CARLE PLACE", state: "NY", type: "Non-Contract", isActive: false, balance: 0, contact: "Yolanda Key", phone: "(516) 555-3501", fax: "(516) 555-3502", cellular: "(516) 555-3503", email: "ops@100gardencityplaza.com", terr: "HS", route: 9, zone: 6 },
  ];

  // Out-of-state premises for each office
  const outOfStatePremises = [
    // Texas - Dallas
    { premisesId: "13350DALLASPKWY***", name: "DALLAS GALLERIA", address: "13350 DALLAS PARKWAY", city: "DALLAS", state: "TX", type: "S", isActive: true, balance: 8400.00, officeCode: "N-TX", customerName: "DALLAS GALLERIA MANAGEMENT LLC", contact: "Rick Salazar", phone: "(214) 555-4011", fax: "(214) 555-4012", cellular: "(214) 555-4013", email: "super@dallasgalleria.com", website: "www.dallasgleria.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "300REUNIONBLVD***", name: "REUNION TOWER", address: "300 REUNION BOULEVARD", city: "DALLAS", state: "TX", type: "S", isActive: true, balance: 3200.00, officeCode: "N-TX", customerName: "REUNION TOWER ASSOCIATES", contact: "Maria Castillo", phone: "(214) 555-4021", fax: "(214) 555-4022", cellular: "(214) 555-4023", email: "ops@reuniontower.com", website: "www.reuniontoweratlas.com", terr: "DS", route: 2, zone: 1 },
    { premisesId: "2400AVIATION", name: "DFW TERMINAL B", address: "2400 AVIATION DRIVE", city: "DFW AIRPORT", state: "TX", type: "Non-Contract", isActive: true, balance: 0, officeCode: "N-TX", customerName: "DALLAS GALLERIA MANAGEMENT LLC", contact: "Tom Reeves", phone: "(972) 555-4031", fax: "(972) 555-4032", cellular: "(972) 555-4033", email: "facilities@dfwtermb.com", terr: "SS", route: 3, zone: 2 },
    // Georgia - Atlanta
    { premisesId: "225PEACHTREE***", name: "PEACHTREE CENTER", address: "225 PEACHTREE STREET NE", city: "ATLANTA", state: "GA", type: "S", isActive: true, balance: 14750.00, officeCode: "N-GA", customerName: "PEACHTREE CENTER DEVELOPMENT", contact: "James Barker", phone: "(404) 555-4041", fax: "(404) 555-4042", cellular: "(404) 555-4043", email: "super@peachtreecenter.com", website: "www.peachtreecenteratl.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "3340PEACHTREERD***", name: "BUCKHEAD TOWER", address: "3340 PEACHTREE ROAD NE", city: "ATLANTA", state: "GA", type: "S", isActive: true, balance: 1800.00, officeCode: "N-GA", customerName: "BUCKHEAD TOWER OWNERS CORP", contact: "Lynn Foster", phone: "(404) 555-4051", fax: "(404) 555-4052", cellular: "(404) 555-4053", email: "board@buckheadtower.com", terr: "DS", route: 2, zone: 1 },
    { premisesId: "3393PEACHTREERD", name: "LENOX SQUARE MALL", address: "3393 PEACHTREE ROAD NE", city: "ATLANTA", state: "GA", type: "Non-Contract", isActive: true, balance: 0, officeCode: "N-GA", customerName: "PEACHTREE CENTER DEVELOPMENT", contact: "Nina Watts", phone: "(404) 555-4061", fax: "(404) 555-4062", cellular: "(404) 555-4063", email: "ops@lenoxsquaremall.com", terr: "SS", route: 3, zone: 2 },
    // California - LA
    { premisesId: "900WILSHIRE***", name: "WILSHIRE GRAND CENTER", address: "900 WILSHIRE BOULEVARD", city: "LOS ANGELES", state: "CA", type: "S", isActive: true, balance: 22500.00, officeCode: "N-CA", customerName: "WILSHIRE GRAND CENTER LLC", contact: "Peter Chang", phone: "(213) 555-4071", fax: "(213) 555-4072", cellular: "(213) 555-4073", email: "super@wilshiregrand.com", website: "www.wilshiregrandcenter.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "2025AVEOFSTARS***", name: "THE CENTURY PLAZA", address: "2025 AVENUE OF THE STARS", city: "LOS ANGELES", state: "CA", type: "S", isActive: true, balance: 0, officeCode: "N-CA", customerName: "THE CENTURY PLAZA RESIDENCES", contact: "Quinn Barrett", phone: "(310) 555-4081", fax: "(310) 555-4082", cellular: "(310) 555-4083", email: "mgmt@centuryplaza.com", website: "www.centuryplazaresidences.com", terr: "DS", route: 2, zone: 1 },
    { premisesId: "633W5THST", name: "US BANK TOWER", address: "633 WEST 5TH STREET", city: "LOS ANGELES", state: "CA", type: "Non-Contract", isActive: true, balance: 0, officeCode: "N-CA", customerName: "WILSHIRE GRAND CENTER LLC", contact: "Rosa Nunez", phone: "(213) 555-4091", fax: "(213) 555-4092", cellular: "(213) 555-4093", email: "facilities@usbanktwrla.com", terr: "SS", route: 3, zone: 2 },
    // Massachusetts - Boston
    { premisesId: "800BOYLSTON***", name: "PRUDENTIAL CENTER", address: "800 BOYLSTON STREET", city: "BOSTON", state: "MA", type: "S", isActive: true, balance: 11400.00, officeCode: "N-MA", customerName: "PRUDENTIAL CENTER MANAGEMENT", contact: "Sean Murphy", phone: "(617) 555-4101", fax: "(617) 555-4102", cellular: "(617) 555-4103", email: "super@prudentialcenter.com", website: "www.prudentialcenter.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "200CLARENDON***", name: "JOHN HANCOCK TOWER", address: "200 CLARENDON STREET", city: "BOSTON", state: "MA", type: "S", isActive: true, balance: 4600.00, officeCode: "N-MA", customerName: "JOHN HANCOCK TOWER LLC", contact: "Theresa Flynn", phone: "(617) 555-4111", fax: "(617) 555-4112", cellular: "(617) 555-4113", email: "mgmt@johnhancocktwr.com", terr: "DS", route: 2, zone: 1 },
    // DC
    { premisesId: "52914THSTNW***", name: "NATIONAL PRESS BUILDING", address: "529 14TH STREET NW", city: "WASHINGTON", state: "DC", type: "S", isActive: true, balance: 6300.00, officeCode: "N-DC", customerName: "NATIONAL PRESS BUILDING ASSOC.", contact: "Ulysses Grant", phone: "(202) 555-4121", fax: "(202) 555-4122", cellular: "(202) 555-4123", email: "super@nationalpressbuilding.com", website: "www.nationalpressbuilding.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "2600VIRGINIAAVE***", name: "THE WATERGATE", address: "2600 VIRGINIA AVENUE NW", city: "WASHINGTON", state: "DC", type: "S", isActive: true, balance: 2100.00, officeCode: "N-DC", customerName: "WATERGATE COMMERCIAL LLC", contact: "Virginia Hart", phone: "(202) 555-4131", fax: "(202) 555-4132", cellular: "(202) 555-4133", email: "mgmt@watergateoffice.com", terr: "DS", route: 2, zone: 1 },
    // Missouri - St. Louis
    { premisesId: "100CONVENTION***", name: "GATEWAY MALL", address: "100 CONVENTION PLAZA", city: "ST. LOUIS", state: "MO", type: "S", isActive: true, balance: 3800.00, officeCode: "N-MO", customerName: "GATEWAY ARCH PARTNERS", contact: "Walter Brooks", phone: "(314) 555-4141", fax: "(314) 555-4142", cellular: "(314) 555-4143", email: "super@gatewaymall.com", website: "www.gatewayarchpartners.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "100NBROADWAY", name: "CITY CENTER", address: "100 NORTH BROADWAY", city: "ST. LOUIS", state: "MO", type: "Non-Contract", isActive: true, balance: 0, officeCode: "N-MO", customerName: "CITY CENTER REDEVELOPMENT", contact: "Xena Cross", phone: "(314) 555-4151", fax: "(314) 555-4152", cellular: "(314) 555-4153", email: "info@citycenter-stl.com", terr: "DS", route: 2, zone: 1 },
    // Illinois - Chicago
    { premisesId: "233SWACKER*****", name: "WILLIS TOWER", address: "233 SOUTH WACKER DRIVE", city: "CHICAGO", state: "IL", type: "S", isActive: true, balance: 31500.00, officeCode: "N-IL", customerName: "WILLIS TOWER MANAGEMENT LLC", contact: "Yuri Kowalski", phone: "(312) 555-4161", fax: "(312) 555-4162", cellular: "(312) 555-4163", email: "super@willistower.com", website: "www.willistower.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "300NSTATEST***", name: "MARINA CITY", address: "300 NORTH STATE STREET", city: "CHICAGO", state: "IL", type: "S", isActive: true, balance: 1200.00, officeCode: "N-IL", customerName: "MARINA CITY CONDO ASSOCIATION", contact: "Zelda Park", phone: "(312) 555-4171", fax: "(312) 555-4172", cellular: "(312) 555-4173", email: "board@marinacitycondo.com", terr: "DS", route: 2, zone: 1 },
    { premisesId: "222MERCHMART", name: "THE MART", address: "222 MERCHANDISE MART PLAZA", city: "CHICAGO", state: "IL", type: "Non-Contract", isActive: true, balance: 0, officeCode: "N-IL", customerName: "WILLIS TOWER MANAGEMENT LLC", contact: "Adam Cole", phone: "(312) 555-4181", fax: "(312) 555-4182", cellular: "(312) 555-4183", email: "ops@themartchicago.com", terr: "SS", route: 3, zone: 2 },
    // Florida - Miami
    { premisesId: "701SMIAMIAVE***", name: "BRICKELL CITY CENTRE", address: "701 SOUTH MIAMI AVENUE", city: "MIAMI", state: "FL", type: "S", isActive: true, balance: 9800.00, officeCode: "N-FL", customerName: "BRICKELL CITY CENTRE MANAGEMENT", contact: "Beth Morales", phone: "(305) 555-4191", fax: "(305) 555-4192", cellular: "(305) 555-4193", email: "super@brickellcc.com", website: "www.brickellcitycentre.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "18001COLLINS***", name: "SUNNY ISLES TOWER", address: "18001 COLLINS AVENUE", city: "SUNNY ISLES BEACH", state: "FL", type: "S", isActive: true, balance: 2750.00, officeCode: "N-FL", customerName: "SUNNY ISLES TOWER OWNERS", contact: "Carlos Vidal", phone: "(305) 555-4201", fax: "(305) 555-4202", cellular: "(305) 555-4203", email: "board@sunnyislestower.com", terr: "DS", route: 2, zone: 1 },
    // Connecticut - Hartford / Stamford
    { premisesId: "100PEARLST***", name: "HARTFORD FINANCIAL CENTER", address: "100 PEARL STREET", city: "HARTFORD", state: "CT", type: "S", isActive: true, balance: 7200.00, officeCode: "N-CT", customerName: "HARTFORD FINANCIAL CENTER LLC", contact: "Dennis Grant", phone: "(860) 555-4211", fax: "(860) 555-4212", cellular: "(860) 555-4213", email: "super@hartfordfinancial.com", website: "www.hartfordfinancialcenter.com", terr: "RS", route: 1, zone: 1 },
    { premisesId: "185ASYLUM***", name: "CITYPLACE I", address: "185 ASYLUM STREET", city: "HARTFORD", state: "CT", type: "S", isActive: true, balance: 3500.00, officeCode: "N-CT", customerName: "HARTFORD FINANCIAL CENTER LLC", contact: "Paula Rios", phone: "(860) 555-4221", fax: "(860) 555-4222", cellular: "(860) 555-4223", email: "ops@cityplace1.com", terr: "DS", route: 1, zone: 1 },
    { premisesId: "1LANDMARKSQ***", name: "LANDMARK SQUARE", address: "1 LANDMARK SQUARE", city: "STAMFORD", state: "CT", type: "S", isActive: true, balance: 4100.00, officeCode: "N-CT", customerName: "STAMFORD HARBOR ASSOCIATES", contact: "Victor Hale", phone: "(203) 555-4231", fax: "(203) 555-4232", cellular: "(203) 555-4233", email: "super@landmarksquare.com", website: "www.landmarksquare.com", terr: "SS", route: 2, zone: 1 },
  ];

  // Create NY premises and assign to random NY customers + NEI office
  const premisesIds: string[] = [];
  const premisesIdMap: Record<string, string> = {}; // premisesId → CUID
  for (const premisesItem of premisesData) {
    const randomCustomerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const premises = await prisma.premises.create({
      data: {
        premisesId: premisesItem.premisesId,
        name: premisesItem.name,
        address: premisesItem.address,
        city: premisesItem.city,
        state: premisesItem.state,
        type: premisesItem.type,
        isActive: premisesItem.isActive,
        balance: premisesItem.balance,
        customerId: randomCustomerId,
        officeId: officeMap["NEI"],
        contact: (premisesItem as any).contact || null,
        phone: (premisesItem as any).phone || null,
        fax: (premisesItem as any).fax || null,
        cellular: (premisesItem as any).cellular || null,
        email: (premisesItem as any).email || null,
        website: (premisesItem as any).website || null,
        terr: (premisesItem as any).terr || null,
        route: (premisesItem as any).route || 0,
        zone: (premisesItem as any).zone || 0,
      },
    });
    premisesIds.push(premises.id);
    premisesIdMap[premisesItem.premisesId] = premises.id;
  }
  console.log(`Created ${premisesData.length} NY premises/accounts`);

  // Create out-of-state premises
  const outOfStatePremisesIds: string[] = [];
  for (const p of outOfStatePremises) {
    const customerInfo = outOfStateCustomerMap[p.customerName];
    if (!customerInfo) continue;
    const premises = await prisma.premises.create({
      data: {
        premisesId: p.premisesId,
        name: p.name,
        address: p.address,
        city: p.city,
        state: p.state,
        type: p.type,
        isActive: p.isActive,
        balance: p.balance,
        customerId: customerInfo.id,
        officeId: officeMap[p.officeCode],
        contact: (p as any).contact || null,
        phone: (p as any).phone || null,
        fax: (p as any).fax || null,
        cellular: (p as any).cellular || null,
        email: (p as any).email || null,
        website: (p as any).website || null,
        terr: (p as any).terr || null,
        route: (p as any).route || 0,
        zone: (p as any).zone || 0,
      },
    });
    outOfStatePremisesIds.push(premises.id);
    premisesIdMap[p.premisesId] = premises.id;
  }
  console.log(`Created ${outOfStatePremises.length} out-of-state premises/accounts`);

  const allPremisesIds = [...premisesIds, ...outOfStatePremisesIds];

  // ============================================================
  // UNITS — Proper naming: P1/P2 (Passenger), F1 (Freight), ESC1 (Escalator), DW1 (Dumbwaiter)
  // ============================================================
  // Add units to ALL premises — active contract accounts get 2-5, non-contract/inactive get 1
  const allPremisesData = [...premisesData, ...outOfStatePremises];
  const manufacturers = ["Otis", "ThyssenKrupp", "Schindler", "KONE", "Mitsubishi"];
  let totalUnitsCreated = 0;

  for (const prem of allPremisesData) {
    const premCuid = premisesIdMap[prem.premisesId];
    if (!premCuid) continue;

    const isContract = prem.premisesId.includes("*");
    const bal = prem.balance || 0;

    // Contract accounts get more units based on building size
    let numPassenger: number;
    let numFreight: number;
    let numEscalator: number;
    let numDumbwaiter: number;

    if (isContract) {
      numPassenger = bal > 100000 ? 4 : bal > 20000 ? 3 : 2;
      numFreight = bal > 50000 ? 1 : 0;
      numEscalator = bal > 200000 ? 2 : 0;
      numDumbwaiter = bal > 400000 ? 1 : 0;
    } else {
      // Non-contract / inactive accounts get exactly 1 passenger elevator
      numPassenger = 1;
      numFreight = 0;
      numEscalator = 0;
      numDumbwaiter = 0;
    }

    const units: { unitNumber: string; cat: string; unitType: string; serial: string; manufacturer: string; description: string }[] = [];

    // Passenger elevators
    for (let i = 1; i <= numPassenger; i++) {
      units.push({
        unitNumber: `P${i}`,
        cat: i === 1 ? "Public" : "Service",
        unitType: "Elevator",
        serial: `${prem.premisesId.replace(/\*/g, "").slice(0, 6)}-P${i}`,
        manufacturer: manufacturers[i % manufacturers.length],
        description: `Passenger Elevator ${i}`,
      });
    }

    // Freight elevators
    for (let i = 1; i <= numFreight; i++) {
      units.push({
        unitNumber: `F${i}`,
        cat: "Freight",
        unitType: "Elevator",
        serial: `${prem.premisesId.replace(/\*/g, "").slice(0, 6)}-F${i}`,
        manufacturer: "Schindler",
        description: `Freight Elevator ${i}`,
      });
    }

    // Escalators
    for (let i = 1; i <= numEscalator; i++) {
      units.push({
        unitNumber: `ESC${i}`,
        cat: "Public",
        unitType: "Escalator",
        serial: `${prem.premisesId.replace(/\*/g, "").slice(0, 6)}-ESC${i}`,
        manufacturer: "KONE",
        description: `Escalator ${i}`,
      });
    }

    // Dumbwaiters
    for (let i = 1; i <= numDumbwaiter; i++) {
      units.push({
        unitNumber: `DW${i}`,
        cat: "Service",
        unitType: "Dumbwaiter",
        serial: `${prem.premisesId.replace(/\*/g, "").slice(0, 6)}-DW${i}`,
        manufacturer: "Matot",
        description: `Dumbwaiter ${i}`,
      });
    }

    for (const u of units) {
      await prisma.unit.create({
        data: {
          unitNumber: u.unitNumber,
          cat: u.cat,
          unitType: u.unitType,
          serial: u.serial,
          manufacturer: u.manufacturer,
          status: isContract ? "Active" : "Inactive",
          description: u.description,
          premisesId: premCuid,
        },
      });
      totalUnitsCreated++;
    }
  }
  console.log(`Created ${totalUnitsCreated} units for ALL ${allPremisesData.length} premises`);

  // ============================================================
  // CONTACTS — 1-3 per customer
  // ============================================================
  const contactNames = [
    { name: "John Martinez", title: "Property Manager", phone: "(212) 555-0101", email: "jmartinez@building.com" },
    { name: "Sarah Johnson", title: "Facilities Director", phone: "(212) 555-0102", email: "sjohnson@building.com" },
    { name: "David Lee", title: "Building Superintendent", phone: "(212) 555-0103", email: "dlee@building.com" },
    { name: "Maria Garcia", title: "Operations Manager", phone: "(212) 555-0104", email: "mgarcia@building.com" },
    { name: "James Williams", title: "Maintenance Supervisor", phone: "(212) 555-0105", email: "jwilliams@building.com" },
    { name: "Patricia Brown", title: "Accounts Payable", phone: "(212) 555-0106", email: "pbrown@building.com" },
    { name: "Robert Taylor", title: "Chief Engineer", phone: "(212) 555-0107", email: "rtaylor@building.com" },
    { name: "Linda Anderson", title: "Tenant Relations", phone: "(212) 555-0108", email: "landerson@building.com" },
    { name: "Michael Thomas", title: "Building Manager", phone: "(212) 555-0109", email: "mthomas@building.com" },
    { name: "Elizabeth Davis", title: "VP Operations", phone: "(212) 555-0110", email: "edavis@building.com" },
  ];

  let contactIdx = 0;
  const allCustomerIds = [...customerIds, ...Object.values(outOfStateCustomerMap).map(c => c.id)];
  for (const custId of allCustomerIds) {
    const numContacts = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numContacts; i++) {
      const tpl = contactNames[(contactIdx + i) % contactNames.length];
      const areaCode = Math.floor(Math.random() * 900) + 100;
      await prisma.contact.create({
        data: {
          name: tpl.name,
          title: tpl.title,
          phone: `(${areaCode}) 555-${String(contactIdx).padStart(4, "0")}`,
          email: `${tpl.name.toLowerCase().replace(/ /g, ".")}${contactIdx}@building.com`,
          mobile: `(${areaCode}) 555-${String(contactIdx + 1000).padStart(4, "0")}`,
          customerId: custId,
        },
      });
      contactIdx++;
    }
  }
  console.log(`Created contacts for ${allCustomerIds.length} customers`);

  // ============================================================
  // INVOICES — Real data from Total Service screenshot
  // ============================================================
  const invoiceData = [
    { invoiceNumber: 1, date: "2001-03-12", type: "Other", total: 181.86, status: "Paid" },
    { invoiceNumber: 314, date: "1999-12-16", type: "Other", total: 132.82, status: "Paid" },
    { invoiceNumber: 706, date: "2000-10-23", type: "Other", total: -8621.25, status: "Paid" },
    { invoiceNumber: 716, date: "2000-10-26", type: "Other", total: -62.91, status: "Paid" },
    { invoiceNumber: 950, date: "2001-05-17", type: "Other", total: 264.00, status: "Paid" },
    { invoiceNumber: 978, date: "2001-06-21", type: "Other", total: -16123.50, status: "Paid" },
    { invoiceNumber: 979, date: "2001-06-21", type: "Other", total: -16123.50, status: "Paid" },
    { invoiceNumber: 1158, date: "2001-08-02", type: "Other", total: -13418.76, status: "Paid" },
    { invoiceNumber: 1277, date: "2001-01-05", type: "Other", total: -160.00, status: "Paid" },
    { invoiceNumber: 1432, date: "2002-01-18", type: "Other", total: -14817.00, status: "Paid" },
    { invoiceNumber: 1553, date: "2002-01-31", type: "Other", total: 0.00, status: "Void" },
    { invoiceNumber: 1557, date: "2002-01-31", type: "Other", total: 0.00, status: "Void" },
    { invoiceNumber: 1603, date: "2002-02-12", type: "Other", total: -20.00, status: "Paid" },
    { invoiceNumber: 1616, date: "2002-02-25", type: "Other", total: -10.00, status: "Paid" },
    { invoiceNumber: 1662, date: "2002-04-03", type: "Other", total: -200.00, status: "Paid" },
    { invoiceNumber: 1671, date: "2002-04-09", type: "Other", total: -2381.50, status: "Paid" },
    { invoiceNumber: 1672, date: "2002-04-09", type: "Other", total: -275.00, status: "Paid" },
    { invoiceNumber: 1710, date: "2002-04-25", type: "Other", total: -1293.59, status: "Paid" },
    { invoiceNumber: 1715, date: "2002-04-30", type: "Other", total: -2381.50, status: "Paid" },
    { invoiceNumber: 1725, date: "2002-05-20", type: "Other", total: -200.00, status: "Paid" },
    { invoiceNumber: 1743, date: "2002-05-24", type: "Other", total: -316.44, status: "Paid" },
    { invoiceNumber: 1744, date: "2002-05-24", type: "Other", total: -315.00, status: "Paid" },
    { invoiceNumber: 1752, date: "2002-05-30", type: "Other", total: -4449.08, status: "Paid" },
    { invoiceNumber: 1755, date: "2002-06-04", type: "Other", total: -1158.34, status: "Paid" },
    { invoiceNumber: 1761, date: "2002-06-10", type: "Other", total: -2381.50, status: "Paid" },
    { invoiceNumber: 1966, date: "2002-11-18", type: "Other", total: -4717.07, status: "Open" },
    { invoiceNumber: 1999, date: "2002-12-06", type: "Other", total: -1158.34, status: "Paid" },
    { invoiceNumber: 2020, date: "2003-01-09", type: "Other", total: -1158.34, status: "Paid" },
    { invoiceNumber: 2032, date: "2003-01-15", type: "Other", total: -166.66, status: "Paid" },
  ];

  for (const invData of invoiceData) {
    const randomPremisesId = premisesIds[Math.floor(Math.random() * premisesIds.length)];
    await prisma.invoice.create({
      data: {
        invoiceNumber: invData.invoiceNumber,
        postingDate: new Date(invData.date),
        date: new Date(invData.date),
        type: invData.type,
        terms: "Net 30 Days",
        status: invData.status,
        description: `Imported Invoice for Job #`,
        taxable: 0,
        nonTaxable: invData.total,
        subTotal: invData.total,
        salesTax: 0,
        total: invData.total,
        remainingUnpaid: invData.status === "Paid" ? 0 : invData.total,
        emailStatusCode: 0,
        premisesId: randomPremisesId,
      },
    });
  }
  console.log(`Created ${invoiceData.length} hardcoded invoices`);

  // ============================================================
  // GENERATED INVOICES — 1-3 per premises for ALL premises
  // ============================================================
  const invoiceTypes = ["Service", "Repair", "Maintenance", "Annual Inspection", "Parts", "Modernization", "Other"];
  const invoiceDescriptions = [
    "Monthly maintenance service", "Emergency repair - door operator", "Annual inspection fee",
    "Hoist cable replacement", "Door detector edge replacement", "Brake adjustment and testing",
    "Hydraulic piston seal replacement", "Controller board repair", "Motor replacement labor",
    "Safety equipment testing", "Periodic inspection correction", "Cab interior refurbishment",
    "Fire service recall testing", "Intercom system repair", "Governor rope replacement",
    "Guide shoe replacement", "Buffer test and certification", "Machine room ventilation repair",
  ];
  let generatedInvoiceNum = 3000;
  let generatedInvoiceCount = 0;

  for (const premId of allPremisesIds) {
    const numInvoices = Math.floor(Math.random() * 3) + 1; // 1-3 invoices
    for (let i = 0; i < numInvoices; i++) {
      const daysAgo = Math.floor(Math.random() * 730); // last 2 years
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - daysAgo);
      const isPaid = Math.random() > 0.3; // 70% paid
      const amount = Math.round((Math.random() * 24850 + 150) * 100) / 100; // $150-$25000
      const desc = invoiceDescriptions[generatedInvoiceCount % invoiceDescriptions.length];
      const invType = invoiceTypes[generatedInvoiceCount % invoiceTypes.length];

      await prisma.invoice.create({
        data: {
          invoiceNumber: generatedInvoiceNum++,
          postingDate: invoiceDate,
          date: invoiceDate,
          type: invType,
          terms: "Net 30 Days",
          status: isPaid ? "Paid" : "Open",
          description: desc,
          taxable: 0,
          nonTaxable: amount,
          subTotal: amount,
          salesTax: 0,
          total: amount,
          remainingUnpaid: isPaid ? 0 : amount,
          emailStatusCode: 0,
          premisesId: premId,
        },
      });
      generatedInvoiceCount++;
    }
  }
  console.log(`Generated ${generatedInvoiceCount} additional invoices for all ${allPremisesIds.length} premises`);

  // ============================================================
  // TICKETS — Real data from Total Service screenshot
  // ============================================================
  const ticketData = [
    { ticketNumber: 3870484, workOrderNumber: 3870484, date: "2026-01-16T14:34:00", type: "Other", category: "Maintenance", accountId: "110WIL***", mechCrew: "LONDIS, GEORGE", hours: 6.75, unitName: "WC", status: "Completed" },
    { ticketNumber: 3939921, workOrderNumber: 3939921, date: "2026-01-16T15:46:00", type: "Other", category: "Maintenance", accountId: "100HAVEN2***", mechCrew: "FOWLER T (RES-CUMC)", hours: 0.50, unitName: "NORTH", status: "Completed" },
    { ticketNumber: 3941769, workOrderNumber: 3941769, date: "2026-01-16T15:42:00", type: "Other", category: "None", accountId: "50HAV***", mechCrew: "FOWLER T (RES-CUMC)", hours: 0.75, unitName: "BARD P1", status: "Completed" },
    { ticketNumber: 3941864, workOrderNumber: 3941864, date: "2026-01-15T13:40:00", type: "Other", category: "None", accountId: "60HAV***", mechCrew: "FOWLER T (RES-CUMC)", hours: 2.25, unitName: "SOUTH", status: "Completed" },
    { ticketNumber: 3956778, workOrderNumber: 3956778, date: "2026-01-16T12:29:00", type: "Other", category: "None", accountId: "701W168***", mechCrew: "DIXON J - Supervisor", hours: 1.00, unitName: "HAMMER H", status: "Completed" },
    { ticketNumber: 3961794, workOrderNumber: 3961794, date: "2026-01-16T14:42:00", type: "Other", category: "None", accountId: "722W168***", mechCrew: "FOWLER T (RES-CUMC)", hours: 2.00, unitName: "PSYCH 3", status: "Completed" },
    { ticketNumber: 3966188, workOrderNumber: 3966188, date: "2026-01-16T16:28:00", type: "Other", category: "Maintenance", accountId: "250W57***", mechCrew: "MELENDEZ, C", hours: 1.25, unitName: "LOW RISE 1", status: "Completed" },
    { ticketNumber: 3966308, workOrderNumber: 3966308, date: "2026-01-16T07:44:00", type: "Other", category: "None", accountId: "184LEXINGTON***", mechCrew: "ARLOTTA MATTHEW", hours: 0.00, unitName: "P1", status: "Completed" },
    { ticketNumber: 3985910, workOrderNumber: 3985910, date: "2026-01-16T10:25:00", type: "Maintenance", category: "Maintenance", accountId: "66W38TH***", mechCrew: "SANFILIPPO KENNETH", hours: 1.00, unitName: "P4", status: "Completed" },
    { ticketNumber: 3999968, workOrderNumber: 3999968, date: "2026-01-16T09:19:00", type: "Maintenance", category: "None", accountId: "445GOLDST***", mechCrew: "SHUPAC", hours: 2.00, unitName: "", status: "Completed" },
    { ticketNumber: 4005774, workOrderNumber: 4005774, date: "2026-01-16T13:58:00", type: "Maintenance", category: "None", accountId: "150E42***", mechCrew: "SULLIVAN, R", hours: 6.25, unitName: "PE23 - C BA", status: "Completed" },
    { ticketNumber: 4005775, workOrderNumber: 4005775, date: "2026-01-17T05:33:00", type: "Maintenance", category: "None", accountId: "150E42***", mechCrew: "SULLIVAN, R", hours: 1.25, unitName: "PE24 - C BA", status: "Completed" },
    { ticketNumber: 4006902, workOrderNumber: 4006902, date: "2026-01-15T07:27:00", type: "Maintenance", category: "Maintenance", accountId: "25W32ST***", mechCrew: "", hours: 0.00, unitName: "P2", status: "Completed" },
    { ticketNumber: 4007443, workOrderNumber: 4007443, date: "2026-01-16T15:15:00", type: "Maintenance", category: "Maintenance", accountId: "30LINCOLN***", mechCrew: "LYNCH, THOMAS", hours: 0.25, unitName: "P07 - NORTH", status: "Completed" },
    { ticketNumber: 4009478, workOrderNumber: 4009478, date: "2026-01-16T12:44:00", type: "Maintenance", category: "Maintenance", accountId: "620W168***", mechCrew: "FONTANEZ, AL (RES-CUMC)", hours: 4.00, unitName: "P/S4", status: "Completed" },
    { ticketNumber: 4011725, workOrderNumber: 4011725, date: "2026-01-15T11:06:00", type: "Other", category: "Maintenance", accountId: "114FIFTHAVE***", mechCrew: "FALLON, SEAN", hours: 1.00, unitName: "P5", status: "Completed" },
    { ticketNumber: 4015256, workOrderNumber: 4015256, date: "2026-01-16T11:41:00", type: "Other", category: "Maintenance", accountId: "116JOH***", mechCrew: "FALLON, SEAN", hours: 2.00, unitName: "Car 6", status: "Completed" },
    { ticketNumber: 4031169, workOrderNumber: 4031169, date: "2026-01-16T14:29:00", type: "Maintenance", category: "Maintenance", accountId: "10E45***", mechCrew: "TURNER C", hours: 1.25, unitName: "NEW", status: "Completed" },
    { ticketNumber: 4033068, workOrderNumber: 4033068, date: "2026-01-15T07:27:14", type: "Maintenance", category: "Maintenance", accountId: "25W32ST", mechCrew: "", hours: 0.00, unitName: "P2", status: "Completed" },
    { ticketNumber: 4033634, workOrderNumber: 4033634, date: "2026-01-15T15:25:00", type: "Maintenance", category: "Maintenance", accountId: "30LINCOLN***", mechCrew: "LYNCH, THOMAS", hours: 0.25, unitName: "P09 - NORTH", status: "Completed" },
    { ticketNumber: 4034189, workOrderNumber: 4034189, date: "2026-01-16T13:50:00", type: "Maintenance", category: "Maintenance", accountId: "400W55TH***", mechCrew: "MELENDEZ, C", hours: 0.75, unitName: "P1", status: "Completed" },
    { ticketNumber: 4034190, workOrderNumber: 4034190, date: "2026-01-15T13:00:00", type: "Maintenance", category: "Maintenance", accountId: "400W55TH***", mechCrew: "MELENDEZ, C", hours: 0.50, unitName: "P2", status: "Completed" },
    { ticketNumber: 4035680, workOrderNumber: 4035680, date: "2026-01-16T16:54:00", type: "Maintenance", category: "Maintenance", accountId: "620W168***", mechCrew: "FONTANEZ, AL (RES-CUMC)", hours: 4.00, unitName: "P/S2", status: "Completed" },
    { ticketNumber: 4037674, workOrderNumber: 4037674, date: "2026-01-15T12:28:00", type: "Other", category: "Maintenance", accountId: "275MADRPW***", mechCrew: "SYLVESTER, RONALD", hours: 2.00, unitName: "LOW RISE 3", status: "Completed" },
    { ticketNumber: 4041746, workOrderNumber: 4041746, date: "2026-01-15T14:08:00", type: "Maintenance", category: "Maintenance", accountId: "114FIFTHAVE***", mechCrew: "FALLON, SEAN", hours: 1.25, unitName: "P7", status: "Completed" },
    { ticketNumber: 4042974, workOrderNumber: 4042974, date: "2026-01-16T11:06:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "CISOWSKI, NICHOLAS", hours: 1.00, unitName: "COMM PASS", status: "Completed" },
    { ticketNumber: 4042981, workOrderNumber: 4042981, date: "2026-01-16T12:04:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "CISOWSKI, NICHOLAS", hours: 1.25, unitName: "COMM PASS", status: "Completed" },
    { ticketNumber: 4042991, workOrderNumber: 4042991, date: "2026-01-16T13:12:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "CISOWSKI, NICHOLAS", hours: 1.75, unitName: "COMM PASS", status: "Completed" },
    { ticketNumber: 4042995, workOrderNumber: 4042995, date: "2026-01-16T15:24:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "MELENDEZ, C", hours: 0.00, unitName: "COMM PASS", status: "Completed" },
    { ticketNumber: 4042997, workOrderNumber: 4042997, date: "2026-01-16T07:40:00", type: "Other", category: "None", accountId: "1745BRO***", mechCrew: "MELENDEZ, C", hours: 1.00, unitName: "COMM PASS", status: "Completed" },
  ];

  for (const tData of ticketData) {
    const randomPremisesId = premisesIds[Math.floor(Math.random() * premisesIds.length)];
    await prisma.ticket.create({
      data: {
        ticketNumber: tData.ticketNumber,
        workOrderNumber: tData.workOrderNumber,
        date: new Date(tData.date),
        type: tData.type,
        category: tData.category,
        status: tData.status,
        accountId: tData.accountId,
        mechCrew: tData.mechCrew,
        hours: tData.hours,
        unitName: tData.unitName,
        bill: false,
        reviewed: false,
        pr: false,
        vd: false,
        inv: false,
        emailStatus: "No Email Sent",
        premisesId: randomPremisesId,
      },
    });
  }
  console.log(`Created ${ticketData.length} hardcoded tickets`);

  // ============================================================
  // GENERATED TICKETS — 2-4 per premises for ALL premises
  // ============================================================
  const ticketDescriptions = [
    "REPLACE DOOR DETECTOR EDGE", "ADJUST BRAKE", "HOIST CABLE SHORTENING",
    "CAT 2026", "2026 PERIODIC", "REPLACE PISTON SEAL",
    "DOOR OPERATOR REPAIR", "CONTROLLER BOARD REPLACEMENT", "MOTOR REPAIR",
    "SAFETY TEST - ANNUAL", "GOVERNOR ROPE REPLACEMENT", "GUIDE SHOE REPLACEMENT",
    "INTERCOM REPAIR", "FIRE SERVICE RECALL TEST", "CAB FAN REPLACEMENT",
    "LEVELING ADJUSTMENT", "BUFFER TEST AND CERTIFICATION", "REPLACE ROLLER GUIDES",
    "MACHINE ROOM VENTILATION", "REPLACE DOOR GIBS", "HOIST MOTOR BRUSH REPLACEMENT",
    "RESEAL HYDRAULIC CYLINDER", "REPLACE TRAVELING CABLE", "ADJUST DOOR REOPENING DEVICE",
    "REPLACE LIMIT SWITCHES", "SMOKE DETECTOR TEST", "EMERGENCY POWER TEST",
  ];
  const mechCrewPool = [
    "LONDIS, GEORGE", "FOWLER T (RES-CUMC)", "DIXON J - Supervisor",
    "MELENDEZ, C", "ARLOTTA MATTHEW", "SANFILIPPO KENNETH",
    "SULLIVAN, R", "LYNCH, THOMAS", "FONTANEZ, AL (RES-CUMC)",
    "FALLON, SEAN", "TURNER C", "SHUPAC",
    "CISOWSKI, NICHOLAS", "SYLVESTER, RONALD", "RODRIGUEZ, M",
    "BAXTER, KEITH", "O'BRIEN, PATRICK", "DELUCA, FRANK",
  ];
  const ticketCategories = ["Maintenance", "None", "Repair", "Inspection"];
  const ticketTypes = ["Maintenance", "Other", "Repair", "Annual"];
  let generatedTicketNum = 4050000;
  let generatedTicketCount = 0;

  for (const premId of allPremisesIds) {
    const numTickets = Math.floor(Math.random() * 3) + 2; // 2-4 tickets
    for (let i = 0; i < numTickets; i++) {
      const daysAgo = Math.floor(Math.random() * 90); // last 90 days
      const ticketDate = new Date();
      ticketDate.setDate(ticketDate.getDate() - daysAgo);
      ticketDate.setHours(7 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      const isCompleted = Math.random() > 0.35; // 65% completed
      const desc = ticketDescriptions[generatedTicketCount % ticketDescriptions.length];
      const mech = mechCrewPool[generatedTicketCount % mechCrewPool.length];
      const hours = isCompleted ? Math.round((Math.random() * 6 + 0.25) * 4) / 4 : 0; // 0.25-6.25 in 0.25 increments
      const unitNames = ["P1", "P2", "P3", "F1", "ESC1", "DW1"];
      const unitName = unitNames[generatedTicketCount % unitNames.length];

      await prisma.ticket.create({
        data: {
          ticketNumber: generatedTicketNum,
          workOrderNumber: generatedTicketNum,
          date: ticketDate,
          type: ticketTypes[generatedTicketCount % ticketTypes.length],
          category: ticketCategories[generatedTicketCount % ticketCategories.length],
          status: isCompleted ? "Completed" : "Open",
          accountId: "",
          mechCrew: mech,
          hours,
          unitName,
          bill: false,
          reviewed: isCompleted,
          pr: false,
          vd: false,
          inv: false,
          emailStatus: "No Email Sent",
          premisesId: premId,
          description: desc,
        },
      });
      generatedTicketNum++;
      generatedTicketCount++;
    }
  }
  console.log(`Generated ${generatedTicketCount} additional tickets for all ${allPremisesIds.length} premises`);

  // ============================================================
  // JOBS — Real data from Total Service Job Maintenance screenshot
  // ============================================================
  const jobsData = [
    { externalId: "210372", accountId: "475SEA***", accountTag: "475 SEAVIEW AVENUE", date: "2026-01-21", description: "REPLACE DOOR DETECTOR EDGE - CAR 5P652", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210371", accountId: "475SEA***", accountTag: "475 SEAVIEW AVENUE", date: "2026-01-21", description: "CORRECT LEAKS - FLORINA 2", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210370", accountId: "37E64THST***", accountTag: "37 EAST 64TH STREET", date: "2026-01-21", description: "2026 PERIODIC - 1P15788 #S1", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-01" },
    { externalId: "210369", accountId: "475SEA***", accountTag: "475 SEAVIEW AVENUE", date: "2026-01-21", description: "CORRECT LEAKS - FLORINA 1", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210368", accountId: "35E64THST****", accountTag: "35 EAST 64TH STREET", date: "2026-01-21", description: "2026 PERIODIC - 1P2655 #PE1", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-21" },
    { externalId: "210367", accountId: "31W47***", accountTag: "31 WEST 47th STREET", date: "2026-01-21", description: "SHUTDOWN - WATER DAMAGE - 1/7/2026 - ELEVATOR 1P8391", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210366", accountId: "75VAN*****", accountTag: "75 VANDERBILT AVE", date: "2026-01-21", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210365", accountId: "1160TEL***", accountTag: "1160 TELLER AVE. BRONX NY", date: "2026-01-21", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210364", accountId: "375PEARL***", accountTag: "375 PEARL STREET", date: "2026-01-21", description: "NC: HOIST CABLE SHORTENINGS CARS 7 AND 9", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210363", accountId: "114FIFTHAVE***", accountTag: "114 FIFTH AVENUE", date: "2026-01-21", description: "014224195H - 1P3774 #P1 AND 1P3771 #P2", type: "Other", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210362", accountId: "1010UND***", accountTag: "1010 UNDERHILL AVENUE", date: "2026-01-21", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210361", accountId: "612ALLERTON***", accountTag: "612 ALLERTON AVENUE", date: "2026-01-21", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210360", accountId: "43NWHI***", accountTag: "43 NORTH WHITE HORSE PIKE", date: "2026-01-21", description: "2026 ANNUAL PRESSURE TEST", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210359", accountId: "2999SCH***", accountTag: "2999 SCHURZ AVENUE", date: "2026-01-21", description: "REPLACE PISTON SEAL #2P10423", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-27" },
    { externalId: "210358", accountId: "1CAROWPL***", accountTag: "1 CAROW PLACE", date: "2026-01-21", description: "2026 ANNUAL INSPECTION", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210357", accountId: "445GOLDST***", accountTag: "445 GOLD STREET", date: "2026-01-21", description: "R&R REPAIR BRAKE SWITCHES - CITY ID# 3P13802", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-21" },
    { externalId: "210356", accountId: "400W119***", accountTag: "400 WEST 119TH ST. NYC**#3", date: "2026-01-21", description: "2026 PERIODIC 1P14293 #P3-C", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210355", accountId: "400W119***", accountTag: "400 WEST 119TH ST. NYC**#3", date: "2026-01-21", description: "2026 PERIODIC 1P14291 #P1-A", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210354", accountId: "619W113ST", accountTag: "CUA-619W113ST", date: "2026-01-21", description: "2026 PERIODIC 1P47576 #179", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210353", accountId: "511W114ST", accountTag: "CUA:JOHN,JAY", date: "2026-01-21", description: "2026 PERIODIC 1F202#112", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210352", accountId: "575BRO***", accountTag: "575 BROADWAY", date: "2026-01-21", description: "2025 PERIODIC - 1P42026 #P1", type: "Other", status: "Hold", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210351", accountId: "411W116ST", accountTag: "CUA-WIEN HALL", date: "2026-01-21", description: "N/C - HOIST CABLE SHORTENING CARS 20 & 21", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210350", accountId: "2900BROADWAY", accountTag: "CUA-BROADWAY RESIDENTIAL CO-OP", date: "2026-01-21", description: "N/C - HOIST CABLE SHORTENING CARS 142 & 143", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210349", accountId: "3030BROADWAY", accountTag: "CUA-DODGE NGYM", date: "2026-01-21", description: "N/C - REVIEW SEAL - CAR 32", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210348", accountId: "96-05HORACE****", accountTag: "96-05 HORACE HARDING EXPRESSWAY", date: "2026-01-21", description: "NC ADJUST BRAKE - CAR 2", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210347", accountId: "3227BROADWAY", accountTag: "CUM:JEROME L GREEN SCIENCE CENTER", date: "2026-01-21", description: "VIO-FTF-VT-CAT1-201812-00003208- 1W6961", type: "Violations", status: "Completed", template: "Filing Fee", dueDate: "2026-01-21" },
    { externalId: "210346", accountId: "3600RT12***", accountTag: "3600 ROUTE 112", date: "2026-01-21", description: "2026 SEMI ANNUAL INSPECTION", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-21" },
    { externalId: "210345", accountId: "29-33LECOUNT***", accountTag: "29-33 LECOUNT PLACE", date: "2026-01-21", description: "2025 ANNUAL RESULTS - LETTER", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-21" },
    { externalId: "210344", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-21", description: "2026 PERIODIC - 1P15742 #CAR 14", type: "Other", status: "Hold", template: "Inspection / Correction", dueDate: "2026-01-21" },
    { externalId: "210343", accountId: "29-33LECOUNT***", accountTag: "29-33 LECOUNT PLACE", date: "2026-01-20", description: "NC REPLACE HYDRAULIC PISTON SEALS - CAR 4", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-20" },
    { externalId: "210342", accountId: "59MAIDEN***", accountTag: "59 MAIDEN LANE", date: "2026-01-20", description: "NC: HOIST CABLE SHORTENING CARS 16 AND 18", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210341", accountId: "224HAM***", accountTag: "224 HAMBURG TPK - WAYNE NJ", date: "2026-01-20", description: "REPLACE DOOR OPERATOR BOARD - CAR 1", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210340", accountId: "MTALIRRRESC***", accountTag: "MTA LIRR ESCALATORS", date: "2026-01-20", description: "MTA LIRR ESCALATORS - PENN STATION - MATERIAL ONLY", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210339", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P3579 #CAR 17", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210338", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15741 #CAR 13", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210337", accountId: "200USHIGHWAY1**", accountTag: "200 US HIGHWAY 1", date: "2026-01-20", description: "REPLACE FREIGHT DOOR GUIDE SHOES - CAR 17", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-20" },
    { externalId: "210336", accountId: "279BUTLERST***", accountTag: "279 BUTLER STREET", date: "2026-01-20", description: "CAT 2026", type: "Annual", status: "Open", template: "Annual 2026 Billable", dueDate: "2026-01-20" },
    { externalId: "210335", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15740 #CAR 12", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210334", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15739 #CAR 11", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-20" },
    { externalId: "210333", accountId: "200USHIGHWAY1**", accountTag: "200 US HIGHWAY 1", date: "2026-01-20", description: "REPLACE DOOR DETECTOR EDGE - CAR 13", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-20" },
    { externalId: "210332", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15738 #CAR 10", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-20" },
    { externalId: "210331", accountId: "270PARKAVE*****", accountTag: "270 PARK AVENUE", date: "2026-01-20", description: "CAT 2026 N/C", type: "Annual", status: "Open", template: "Annual 2026 Non-Billable", dueDate: "2026-01-15" },
    { externalId: "210330", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15737 #CAR 09", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210329", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15736 #CAR 08", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210328", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15735 #CAR 07", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210327", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15734 #CAR 06", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210326", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15733 #CAR 05", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
    { externalId: "210325", accountId: "667MADISON***", accountTag: "667 MADISON AVENUE", date: "2026-01-20", description: "S/D NC: COMP CABLE SHORTENING CAR 5", type: "NEW REPAIR", status: "Open", template: "NEW REPAIRS", dueDate: "2026-01-17" },
    { externalId: "210324", accountId: "3COL***", accountTag: "3 COLUMBUS CIRCLE, LLC", date: "2026-01-20", description: "2026 PERIODIC - 1P15732 #CAR 04", type: "Other", status: "Open", template: "Inspection / Correction", dueDate: "2026-01-17" },
  ];

  for (const jobData of jobsData) {
    const randomPremisesId = premisesIds[Math.floor(Math.random() * premisesIds.length)];
    const randomCustomerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    await prisma.job.create({
      data: {
        externalId: jobData.externalId,
        jobName: jobData.description,
        jobDescription: jobData.description,
        date: new Date(jobData.date),
        dueDate: new Date(jobData.dueDate),
        type: jobData.type,
        status: jobData.status,
        template: jobData.template,
        premisesId: randomPremisesId,
        customerId: randomCustomerId,
      },
    });
  }
  console.log(`Created ${jobsData.length} hardcoded jobs`);

  // ============================================================
  // GENERATED JOBS — 1-3 per premises for ALL premises
  // ============================================================
  const jobDescriptions = [
    "CAT 2026", "2026 PERIODIC INSPECTION", "2026 ANNUAL PRESSURE TEST",
    "REPLACE DOOR DETECTOR EDGE", "NC: HOIST CABLE SHORTENING", "REPLACE PISTON SEAL",
    "ADJUST BRAKE - ANNUAL", "REPLACE DOOR OPERATOR BOARD", "R&R BRAKE SWITCHES",
    "NC REPLACE HYDRAULIC PISTON SEALS", "REPLACE FREIGHT DOOR GUIDE SHOES",
    "S/D NC: COMP CABLE SHORTENING", "2026 SEMI ANNUAL INSPECTION",
    "N/C - HOIST CABLE SHORTENING", "SHUTDOWN - WATER DAMAGE REPAIR",
    "N/C - REVIEW SEAL", "REPLACE TRAVELING CABLE", "CONTROLLER MODERNIZATION",
    "VIO-FTF-VT-CAT1 CORRECTION", "2026 ANNUAL RESULTS - LETTER",
    "MACHINE ROOM VENTILATION REPAIR", "EMERGENCY POWER TRANSFER TEST",
    "INTERCOM SYSTEM UPGRADE", "FIRE SERVICE RECALL TEST",
  ];
  const jobTypes = ["Annual", "NEW REPAIR", "Maintenance", "Other", "Violations"];
  const jobStatuses = ["Open", "Completed", "Hold"];
  const jobTemplates = ["Annual 2026 Billable", "NEW REPAIRS", "Inspection / Correction", "Regular Maintenance", "Filing Fee", "Annual 2026 Non-Billable"];
  let generatedJobExternalId = 300000;
  let generatedJobCount = 0;

  // Build a reverse map: premisesId CUID → customerId CUID
  // We need to find which customer each premises belongs to
  // For NY premises, they were assigned to random customers — we need to query or track them
  // Since we already have premisesIdMap (premisesId string → CUID), we can query the DB
  // But simpler: just pick from allCustomerIds for NY, and use outOfStateCustomerMap for out-of-state
  for (const premId of allPremisesIds) {
    const numJobs = Math.floor(Math.random() * 3) + 1; // 1-3 jobs
    // Pick a customer ID — use a random one from all customers
    const randomCustId = allCustomerIds[Math.floor(Math.random() * allCustomerIds.length)];

    for (let i = 0; i < numJobs; i++) {
      const daysAgo = Math.floor(Math.random() * 90); // last 90 days
      const jobDate = new Date();
      jobDate.setDate(jobDate.getDate() - daysAgo);
      const dueDaysAhead = Math.floor(Math.random() * 30); // due 0-30 days after creation
      const dueDate = new Date(jobDate);
      dueDate.setDate(dueDate.getDate() + dueDaysAhead);

      const desc = jobDescriptions[generatedJobCount % jobDescriptions.length];
      const jType = jobTypes[generatedJobCount % jobTypes.length];
      const jStatus = jobStatuses[generatedJobCount % jobStatuses.length];
      const jTemplate = jobTemplates[generatedJobCount % jobTemplates.length];

      await prisma.job.create({
        data: {
          externalId: String(generatedJobExternalId++),
          jobName: desc,
          jobDescription: desc,
          date: jobDate,
          dueDate: dueDate,
          type: jType,
          status: jStatus,
          template: jTemplate,
          premisesId: premId,
          customerId: randomCustId,
        },
      });
      generatedJobCount++;
    }
  }
  console.log(`Generated ${generatedJobCount} additional jobs for all ${allPremisesIds.length} premises`);

  // ============================================================
  // JOB TYPES — Real data from Total Service
  // ============================================================
  const jobTypesData = [
    { name: "Annual", sortOrder: 1, count: 23, color: "Red", remarks: "" },
    { name: "BILLING ONLY", sortOrder: 2, count: 1, color: null, remarks: "" },
    { name: "Captial Improve", sortOrder: 3, count: 1, color: null, remarks: "" },
    { name: "CONSULTANT RPT", sortOrder: 4, count: 1, color: null, remarks: "" },
    { name: "GL Incidents", sortOrder: 5, count: 3, color: null, remarks: "" },
    { name: "LAWSUITS", sortOrder: 6, count: 1, color: null, remarks: "" },
    { name: "Maintenance", sortOrder: 7, count: 1, color: "Blue", remarks: "" },
    { name: "Modernization", sortOrder: 8, count: 1, color: "Green", remarks: "" },
    { name: "NEW REPAIR", sortOrder: 9, count: 2, color: "Orange", remarks: "" },
    { name: "NO CHARGE", sortOrder: 10, count: 2, color: null, remarks: "" },
    { name: "Other", sortOrder: 11, count: 9, color: null, remarks: "" },
    { name: "Repair", sortOrder: 12, count: 1, color: null, remarks: "" },
    { name: "Touchless", sortOrder: 13, count: 1, color: null, remarks: "" },
    { name: "Violations", sortOrder: 14, count: 1, color: "Purple", remarks: "" },
    { name: "XCALL", sortOrder: 15, count: 1, color: null, remarks: "" },
    { name: "Capital Impro", sortOrder: 16, count: 1, color: null, remarks: "" },
    { name: "CONSULTANT", sortOrder: 17, count: 1, color: null, remarks: "" },
  ];

  const jobTypeMap: Record<string, string> = {};
  for (const typeData of jobTypesData) {
    const jobType = await prisma.jobType.create({
      data: {
        name: typeData.name,
        sortOrder: typeData.sortOrder,
        count: typeData.count,
        color: typeData.color,
        remarks: typeData.remarks,
      },
    });
    jobTypeMap[typeData.name] = jobType.id;
  }
  console.log(`Created ${jobTypesData.length} job types`);

  // ============================================================
  // JOB TEMPLATES — Real data from Total Service
  // ============================================================
  const jobTemplatesData = [
    { name: "3D Edge", type: "NEW REPAIR", revNum: 1, expNum: 2 },
    { name: "Annual", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2015", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2016", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2017 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2017 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2018 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2018 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2019 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2019 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2020 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2020 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2021 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2021 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2022 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2022 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2023 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2023 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2024 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2024 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2025 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2025 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Annual 2026 Billable", type: "Annual", revNum: 1, expNum: 4 },
    { name: "Annual 2026 Non-Billable", type: "Annual", revNum: 1, expNum: 4, isBillable: false },
    { name: "Capital Improvement", type: "Capital Impro", revNum: 1, expNum: 2 },
    { name: "CONSULTANT REPORT", type: "CONSULTANT", revNum: 1, expNum: 2 },
    { name: "DO NOT USE (DIV REPAIR)", type: "Repair", revNum: 1, expNum: 2, isActive: false },
    { name: "DO NOT USE (Repair)", type: "Repair", revNum: 1, expNum: 2, isActive: false },
    { name: "Filing Fee", type: "Violations", revNum: 1, expNum: 2 },
    { name: "FOR SERVICES RENDERED", type: "BILLING ONL", revNum: 1, expNum: 2 },
    { name: "GL INCIDENTS", type: "GL Incidents", revNum: 1, expNum: 2 },
    { name: "GL INCIDENTS - ILLINOIS", type: "GL Incidents", revNum: 1, expNum: 2 },
    { name: "INACTIVE", type: "Other", revNum: 1, expNum: 2, isActive: false },
    { name: "Inspection / Correction", type: "Other", revNum: 1, expNum: 2 },
    { name: "LAWSUITS", type: "LAWSUITS", revNum: 1, expNum: 2 },
    { name: "Legal Reimbursements", type: "GL Incidents", revNum: 1, expNum: 2 },
    { name: "LOCAL LAW 10/81", type: "Other", revNum: 1, expNum: 2 },
    { name: "Modernization", type: "Modernization", revNum: 1, expNum: 2 },
    { name: "NEW REPAIRS", type: "NEW REPAIR", revNum: 1, expNum: 2 },
    { name: "NO CHARGE", type: "NO CHARGE", revNum: 1, expNum: 2, isBillable: false },
    { name: "Regular Maintenance", type: "Maintenance", revNum: 1, expNum: 2 },
    { name: "Shop", type: "NO CHARGE", revNum: 1, expNum: 2, isBillable: false },
    { name: "Test", type: "Other", revNum: 1, expNum: 2 },
    { name: "Touchless C", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Touchless CH", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Touchless H", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Touchless L", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Touchless LH", type: "Touchless", revNum: 1, expNum: 2 },
    { name: "Vehicles", type: "Other", revNum: 1, expNum: 2 },
    { name: "Violation", type: "Violations", revNum: 1, expNum: 2 },
    { name: "Violations(Inactive)", type: "Other", revNum: 1, expNum: 2, isActive: false },
    { name: "X Call", type: "XCALL", revNum: 1, expNum: 2 },
  ];

  for (const templateData of jobTemplatesData) {
    await prisma.jobTemplate.create({
      data: {
        name: templateData.name,
        typeId: jobTypeMap[templateData.type] || null,
        revNum: templateData.revNum,
        expNum: templateData.expNum,
        isBillable: templateData.isBillable ?? true,
        isActive: templateData.isActive ?? true,
      },
    });
  }
  console.log(`Created ${jobTemplatesData.length} job templates`);

  // ============================================================
  // ACTIVITY LOGS — Demo data for Activity History tabs
  // ============================================================
  const activityTypes = [
    { type: "email", direction: "outbound", subject: "Monthly Maintenance Report - January 2026", body: "Please find attached the monthly maintenance report for all units under contract. All elevators passed inspection.", emailStatus: "delivered", callDuration: null, callStatus: null, phoneNumber: null },
    { type: "call", direction: "inbound", subject: "Service Request - P2 making noise", body: "Tenant reported unusual grinding noise from P2. Scheduled mechanic for tomorrow AM.", emailStatus: null, callDuration: 180, callStatus: "answered", phoneNumber: "(212) 555-1234" },
    { type: "email", direction: "outbound", subject: "Invoice #2032 - Past Due Notice", body: "This is a reminder that Invoice #2032 dated 01/15/2003 in the amount of $166.66 is past due. Please remit payment at your earliest convenience.", emailStatus: "opened", callDuration: null, callStatus: null, phoneNumber: null },
    { type: "call", direction: "outbound", subject: "Follow up on repair estimate", body: "Called to discuss the estimate for door operator replacement on Car 5. Customer approved the work, will proceed next week.", emailStatus: null, callDuration: 420, callStatus: "answered", phoneNumber: "(212) 555-5678" },
    { type: "note", direction: null, subject: "Site visit notes", body: "Visited building to assess modernization scope. 4 elevators, all original 1985 equipment. Recommended full modernization of cars 1-3, cosmetic upgrade only for freight.", emailStatus: null, callDuration: null, callStatus: null, phoneNumber: null },
    { type: "email", direction: "inbound", subject: "RE: Annual Inspection Schedule", body: "We have reviewed the proposed inspection dates and confirm availability for all units. Please proceed as scheduled.", emailStatus: "delivered", callDuration: null, callStatus: null, phoneNumber: null },
    { type: "call", direction: "inbound", subject: "Emergency - Elevator entrapment", body: "Building manager called to report passenger entrapment in P1. Dispatched emergency crew immediately. Passenger safely removed within 15 minutes.", emailStatus: null, callDuration: 90, callStatus: "answered", phoneNumber: "(718) 555-9012" },
    { type: "email", direction: "outbound", subject: "Proposal for Escalator Maintenance", body: "Per our discussion, please find attached the proposal for bi-monthly escalator maintenance covering ESC1 and ESC2.", emailStatus: "sent", callDuration: null, callStatus: null, phoneNumber: null },
    { type: "call", direction: "outbound", subject: "Contract renewal discussion", body: "Discussed 2026 contract renewal. Customer wants to add 2 additional units. Will send updated pricing.", emailStatus: null, callDuration: 600, callStatus: "answered", phoneNumber: "(212) 555-3456" },
    { type: "note", direction: null, subject: "Violation response filed", body: "Filed response to DOB violation VIO-FTF-VT-CAT1. Included all repair documentation and test results. Expect resolution within 30 days.", emailStatus: null, callDuration: null, callStatus: null, phoneNumber: null },
    { type: "call", direction: "inbound", subject: "Billing inquiry", body: "Customer called about duplicate charge on last invoice. Confirmed it was an error and issued credit memo.", emailStatus: null, callDuration: 240, callStatus: "answered", phoneNumber: "(914) 555-7890" },
    { type: "email", direction: "outbound", subject: "Completed Work Order #4042997", body: "Work order has been completed. Mechanic replaced door detector edge on COMM PASS elevator. Unit is back in service.", emailStatus: "delivered", callDuration: null, callStatus: null, phoneNumber: null },
    { type: "call", direction: "outbound", subject: "Scheduling annual inspection", body: "Left voicemail to schedule CAT 2026 annual inspection. Will try again tomorrow.", emailStatus: null, callDuration: 30, callStatus: "missed", phoneNumber: "(516) 555-4321" },
    { type: "note", direction: null, subject: "Safety meeting notes", body: "Conducted quarterly safety review with building management. Reviewed emergency procedures and updated contact list.", emailStatus: null, callDuration: null, callStatus: null, phoneNumber: null },
    { type: "email", direction: "outbound", subject: "Parts on backorder - F1 update", body: "The replacement motor for the freight elevator (F1) is on backorder. Expected delivery in 2-3 weeks. Unit remains operational with temporary repair.", emailStatus: "delivered", callDuration: null, callStatus: null, phoneNumber: null },
  ];

  // Add activities to ALL customers
  let activityCount = 0;
  for (const custId of allCustomerIds) {
    const numActivities = Math.floor(Math.random() * 4) + 2; // 2-5 per customer
    for (let i = 0; i < numActivities; i++) {
      const tpl = activityTypes[(activityCount + i) % activityTypes.length];
      const daysAgo = Math.floor(Math.random() * 60); // within last 60 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      await prisma.activityLog.create({
        data: {
          customerId: custId,
          type: tpl.type,
          direction: tpl.direction,
          subject: tpl.subject,
          body: tpl.body,
          emailStatus: tpl.emailStatus,
          callDuration: tpl.callDuration,
          callStatus: tpl.callStatus,
          phoneNumber: tpl.phoneNumber,
          recordingUrl: tpl.type === "call" && tpl.callStatus === "answered" ? `https://recordings.twilio.com/demo/${activityCount}.mp3` : null,
          userName: "Zach Schwartz",
          contactName: customersData[activityCount % customersData.length]?.contact || "Building Manager",
          source: tpl.type === "call" ? "twilio" : "manual",
          createdAt,
        },
      });
      activityCount++;
    }
  }
  console.log(`Created ${activityCount} activity log entries (customers)`);

  // Add activities to ALL premises (accounts) too
  let premisesActivityCount = 0;
  for (const premId of allPremisesIds) {
    const numActivities = Math.floor(Math.random() * 3) + 2; // 2-4 per premises
    for (let i = 0; i < numActivities; i++) {
      const tpl = activityTypes[(premisesActivityCount + i) % activityTypes.length];
      const daysAgo = Math.floor(Math.random() * 90); // within last 90 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      await prisma.activityLog.create({
        data: {
          premisesId: premId,
          type: tpl.type,
          direction: tpl.direction,
          subject: tpl.subject,
          body: tpl.body,
          emailStatus: tpl.emailStatus,
          callDuration: tpl.callDuration,
          callStatus: tpl.callStatus,
          phoneNumber: tpl.phoneNumber,
          recordingUrl: tpl.type === "call" && tpl.callStatus === "answered" ? `https://recordings.twilio.com/demo/prem_${premisesActivityCount}.mp3` : null,
          userName: "Zach Schwartz",
          contactName: "Building Manager",
          source: tpl.type === "call" ? "twilio" : "manual",
          createdAt,
        },
      });
      premisesActivityCount++;
    }
  }
  console.log(`Created ${premisesActivityCount} activity log entries (premises)`);

  // ============================================================
  // FIELD HISTORY — Demo data for Field History tabs
  // ============================================================
  const fieldChanges = [
    { field: "type", fieldLabel: "Type", oldValue: "Non-Contract", newValue: "S" },
    { field: "balance", fieldLabel: "Balance", oldValue: "$0.00", newValue: "$3,602.79" },
    { field: "contact", fieldLabel: "Primary Contact", oldValue: "John Smith", newValue: "Karen Mitchell" },
    { field: "phone", fieldLabel: "Phone", oldValue: "(212) 555-0000", newValue: "(212) 555-1301" },
    { field: "email", fieldLabel: "Email", oldValue: null, newValue: "billing@building.com" },
    { field: "isActive", fieldLabel: "Status", oldValue: "Inactive", newValue: "Active" },
    { field: "address", fieldLabel: "Address", oldValue: "100 MAIN STREET", newValue: "100 BROADWAY" },
    { field: "name", fieldLabel: "Name", oldValue: "OLD BUILDING NAME", newValue: "NEW BUILDING NAME" },
    { field: "billing", fieldLabel: "Billing", oldValue: "Individual", newValue: "Consolidated" },
    { field: "cellular", fieldLabel: "Mobile", oldValue: null, newValue: "(917) 555-1234" },
  ];

  let historyCount = 0;
  // Add field history to ALL customers
  for (let ci = 0; ci < allCustomerIds.length; ci++) {
    const custId = allCustomerIds[ci];
    const numChanges = Math.floor(Math.random() * 5) + 2;
    const batchId = `batch_${ci}_${Date.now()}`;

    for (let i = 0; i < numChanges; i++) {
      const change = fieldChanges[(historyCount + i) % fieldChanges.length];
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      await prisma.fieldHistory.create({
        data: {
          entityType: "Customer",
          entityId: custId,
          batchId: `${batchId}_${i}`,
          field: change.field,
          fieldLabel: change.fieldLabel,
          oldValue: change.oldValue,
          newValue: change.newValue,
          userName: "Zach Schwartz",
          createdAt,
        },
      });
      historyCount++;
    }
  }

  // Add field history to ALL premises too
  for (let pi = 0; pi < allPremisesIds.length; pi++) {
    const premId = allPremisesIds[pi];
    const numChanges = Math.floor(Math.random() * 3) + 1;
    const batchId = `batch_prem_${pi}_${Date.now()}`;

    for (let i = 0; i < numChanges; i++) {
      const change = fieldChanges[(historyCount + i) % fieldChanges.length];
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      await prisma.fieldHistory.create({
        data: {
          entityType: "Premises",
          entityId: premId,
          batchId: `${batchId}_${i}`,
          field: change.field,
          fieldLabel: change.fieldLabel,
          oldValue: change.oldValue,
          newValue: change.newValue,
          userName: "Zach Schwartz",
          createdAt,
        },
      });
      historyCount++;
    }
  }
  console.log(`Created ${historyCount} field history entries`);

  // ============================================================
  // ASSIGN USER TO ALL OFFICES
  // ============================================================
  for (const [code, offId] of Object.entries(officeMap)) {
    await prisma.userOffice.upsert({
      where: { userId_officeId: { userId: user.id, officeId: offId } },
      update: {},
      create: { userId: user.id, officeId: offId },
    });
  }
  console.log("Assigned admin user to all offices");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
