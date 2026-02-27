/**
 * Units (Elevators) Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

interface FetchUnitsOptions {
  search?: string;
  premisesId?: string;
  status?: string;
  officeIds?: string[];
  limit?: number;
}

/**
 * Fetch units from SQL Server and mirror to PostgreSQL
 */
export async function fetchUnits(options: FetchUnitsOptions = {}) {
  const { search, premisesId, status, limit = 500 } = options;

  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchUnitsFromPostgres(options);
  }

  try {
    const conditions: string[] = [];

    if (search) {
      conditions.push(`(e.Unit LIKE '%${search}%' OR e.Car LIKE '%${search}%')`);
    }
    if (premisesId) {
      conditions.push(`e.Loc = ${parseInt(premisesId)}`);
    }
    if (status === "Active") {
      conditions.push(`e.En = 1`);
    } else if (status === "Inactive") {
      conditions.push(`e.En = 0`);
    }

    let query = `
      SELECT TOP ${limit}
        e.ID,
        e.Loc,
        e.Unit,
        e.Car,
        e.Capacity,
        e.Speed,
        e.Machine,
        e.MFR,
        e.Controller,
        e.Motor,
        e.ElevType,
        e.Floors,
        e.Stops,
        e.En,
        e.Route,
        e.Remark,
        e.fCreated,
        e.fModified,
        l.ID as LocDisplayId,
        l.Tag as LocTag,
        r.Address as LocAddress,
        r.City as LocCity,
        r.State as LocState
      FROM Elev e
      LEFT JOIN Loc l ON e.Loc = l.Loc
      LEFT JOIN Rol r ON l.Rol = r.ID
    `;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY e.Unit`;

    const units: any[] = await sqlserver.$queryRawUnsafe(query);

    // Map and mirror each unit
    const mappedUnits = await Promise.all(units.map(async (u) => {
      const mappedUnit = {
        id: u.ID.toString(),
        unit: u.Unit || "",
        car: u.Car || "",
        capacity: u.Capacity,
        speed: u.Speed,
        machine: u.Machine || "",
        manufacturer: u.MFR || "",
        controller: u.Controller || "",
        motor: u.Motor || "",
        elevatorType: u.ElevType || "",
        floors: u.Floors,
        stops: u.Stops,
        isActive: u.En === 1,
        route: u.Route,
        remarks: u.Remark || "",
        createdAt: u.fCreated,
        updatedAt: u.fModified,
        premisesId: u.Loc?.toString() || null,
        accountDisplayId: u.LocDisplayId || "",
        premisesTag: u.LocTag || "",
        premisesAddress: u.LocAddress || "",
        premisesCity: u.LocCity || "",
        premisesState: u.LocState || "",
      };

      // Mirror to PostgreSQL
      await mirrorUnitToPostgres(mappedUnit);

      return mappedUnit;
    }));

    return mappedUnits;
  } catch (error) {
    console.error("Error fetching units from SQL Server:", error);
    return fetchUnitsFromPostgres(options);
  }
}

/**
 * Mirror a unit to PostgreSQL
 */
async function mirrorUnitToPostgres(unit: any) {
  try {
    await prisma.unit.upsert({
      where: { id: unit.id },
      update: {
        unitNumber: unit.unit,
        car: unit.car,
        capacity: unit.capacity?.toString(),
        speed: unit.speed?.toString(),
        machine: unit.machine,
        manufacturer: unit.manufacturer,
        controller: unit.controller,
        motor: unit.motor,
        elevatorType: unit.elevatorType,
        floors: unit.floors,
        stops: unit.stops,
        isActive: unit.isActive,
        remarks: unit.remarks,
      },
      create: {
        id: unit.id,
        unitNumber: unit.unit,
        car: unit.car,
        capacity: unit.capacity?.toString(),
        speed: unit.speed?.toString(),
        machine: unit.machine,
        manufacturer: unit.manufacturer,
        controller: unit.controller,
        motor: unit.motor,
        elevatorType: unit.elevatorType,
        floors: unit.floors,
        stops: unit.stops,
        isActive: unit.isActive,
        remarks: unit.remarks,
        premisesId: unit.premisesId,
      },
    });
  } catch (error) {
    console.error("Error mirroring unit to PostgreSQL:", error);
  }
}

/**
 * Fallback: fetch from PostgreSQL only
 */
async function fetchUnitsFromPostgres(options: FetchUnitsOptions) {
  const { search, premisesId, status, officeIds, limit = 500 } = options;

  const where: any = {};

  if (search) {
    where.OR = [
      { unitNumber: { contains: search, mode: "insensitive" } },
      { car: { contains: search, mode: "insensitive" } },
    ];
  }
  if (premisesId) {
    where.premisesId = premisesId;
  }
  if (status === "Active") {
    where.isActive = true;
  } else if (status === "Inactive") {
    where.isActive = false;
  }
  if (officeIds && officeIds.length > 0) {
    where.premises = { ...where.premises, OR: [{ officeId: { in: officeIds } }, { officeId: null }] };
  }

  const units = await prisma.unit.findMany({
    where,
    take: limit,
    orderBy: { unitNumber: "asc" },
    include: {
      premises: {
        include: {
          customer: true,
        },
      },
    },
  });

  return units.map(u => ({
    id: u.id,
    unit: u.unitNumber,
    car: u.car,
    capacity: u.capacity,
    speed: u.speed,
    machine: u.machine,
    manufacturer: u.manufacturer,
    controller: u.controller,
    motor: u.motor,
    elevatorType: u.elevatorType,
    floors: u.floors,
    stops: u.stops,
    isActive: u.isActive,
    remarks: u.remarks,
    premisesId: u.premisesId,
    accountDisplayId: u.premises?.premisesId || u.premises?.locId || u.premises?.name || "",
    premisesLocId: u.premises?.locId || "",
    premisesName: u.premises?.name || "",
    premisesTag: u.premises?.tag || "",
    premisesAddress: u.premises?.address || "",
    premisesCity: u.premises?.city || "",
    premisesState: u.premises?.state || "",
    customerId: u.premises?.customerId || "",
    customerName: u.premises?.customer?.name || "",
  }));
}

/**
 * Get a single unit by ID
 */
export async function fetchUnitById(unitId: string) {
  if (!isSqlServerAvailable()) {
    return prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        premises: true,
        tests: true,
      },
    });
  }

  try {
    const query = `
      SELECT TOP 1
        e.ID,
        e.Loc,
        e.Unit,
        e.Car,
        e.Capacity,
        e.Speed,
        e.Machine,
        e.MFR,
        e.Controller,
        e.Motor,
        e.ElevType,
        e.Floors,
        e.Stops,
        e.En,
        e.Route,
        e.Remark,
        e.Serial,
        e.fCreated,
        e.fModified,
        l.ID as LocDisplayId,
        l.Tag as LocTag,
        r.Address as LocAddress,
        r.City as LocCity,
        r.State as LocState
      FROM Elev e
      LEFT JOIN Loc l ON e.Loc = l.Loc
      LEFT JOIN Rol r ON l.Rol = r.ID
      WHERE e.ID = ${parseInt(unitId)}
    `;

    const units: any[] = await sqlserver.$queryRawUnsafe(query);

    if (units.length === 0) {
      return null;
    }

    const u = units[0];
    const mappedUnit = {
      id: u.ID.toString(),
      unit: u.Unit || "",
      car: u.Car || "",
      capacity: u.Capacity,
      speed: u.Speed,
      machine: u.Machine || "",
      manufacturer: u.MFR || "",
      controller: u.Controller || "",
      motor: u.Motor || "",
      elevatorType: u.ElevType || "",
      floors: u.Floors,
      stops: u.Stops,
      isActive: u.En === 1,
      route: u.Route,
      remarks: u.Remark || "",
      serial: u.Serial || "",
      createdAt: u.fCreated,
      updatedAt: u.fModified,
      premisesId: u.Loc?.toString() || null,
      accountDisplayId: u.LocDisplayId || "",
      premisesTag: u.LocTag || "",
      premisesAddress: u.LocAddress || "",
      premisesCity: u.LocCity || "",
      premisesState: u.LocState || "",
    };

    // Mirror to PostgreSQL
    await mirrorUnitToPostgres(mappedUnit);

    return mappedUnit;
  } catch (error) {
    console.error("Error fetching unit by ID from SQL Server:", error);
    return prisma.unit.findUnique({
      where: { id: unitId },
      include: { premises: true, tests: true },
    });
  }
}
