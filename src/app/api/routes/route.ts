import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/routes - Get all maintenance routes
export async function GET(request: NextRequest) {
  try {
    // Check if we have routes in the Route table
    const routeCount = await prisma.route.count();

    if (routeCount > 0) {
      // Fetch from Route model
      const routes = await prisma.route.findMany({
        orderBy: { name: "asc" },
      });

      // Get all employee IDs we need to look up
      const mechIds = routes.map((r) => r.mech).filter((id): id is number => id !== null);

      // Fetch employees for mechanic name resolution
      const employees = await prisma.employee.findMany({
        where: { id: { in: mechIds } },
        select: { id: true, name: true },
      });

      // Create lookup map
      const employeeMap = new Map(employees.map((e) => [e.id, e.name]));

      // Map routes with resolved mechanic names
      const routesWithData = routes.map((r) => ({
        id: r.id,
        name: r.name,
        mechanic: r.mech ? (employeeMap.get(r.mech) || `Mech #${r.mech}`) : "OPEN ROUTE",
        mechId: r.mech,
        accountCount: r.loc,
        unitCount: r.elev,
        hours: Number(r.hour),
        projectedRevenue: Number(r.amount),
        remarks: r.remarks,
      }));

      // Calculate totals
      const totals = {
        totalRoutes: routesWithData.length,
        totalAccounts: routesWithData.reduce((sum, r) => sum + r.accountCount, 0),
        totalUnits: routesWithData.reduce((sum, r) => sum + r.unitCount, 0),
        totalHours: routesWithData.reduce((sum, r) => sum + r.hours, 0),
        totalProjected: routesWithData.reduce((sum, r) => sum + r.projectedRevenue, 0),
      };

      return NextResponse.json({
        routes: routesWithData,
        totals,
        source: "routes_table",
      });
    }

    // Fallback: Aggregate from Premises if no Route records exist
    const routeData = await prisma.premises.groupBy({
      by: ["route"],
      _count: {
        id: true,
      },
      orderBy: {
        route: "asc",
      },
    });

    // Get unit counts per route
    const routesWithUnits = await Promise.all(
      routeData.map(async (r) => {
        // Count units for all premises on this route
        const unitCount = await prisma.unit.count({
          where: {
            premises: {
              route: r.route,
            },
          },
        });

        // Get projected revenue from contracts on this route
        const contracts = await prisma.contract.aggregate({
          where: {
            premises: {
              route: r.route,
            },
          },
          _sum: {
            bAmt: true,
          },
        });

        // Get total hours from tickets on this route
        const tickets = await prisma.ticket.aggregate({
          where: {
            premises: {
              route: r.route,
            },
          },
          _sum: {
            hours: true,
          },
        });

        return {
          id: r.route || 0,
          name: r.route !== null ? String(r.route) : "0",
          mechanic: "OPEN ROUTE", // No mechanic data in Premises
          mechId: null,
          accountCount: r._count.id,
          unitCount: unitCount,
          hours: Number(tickets._sum?.hours || 0),
          projectedRevenue: Number(contracts._sum?.bAmt || 0),
          remarks: null,
        };
      })
    );

    // Calculate totals
    const totals = {
      totalRoutes: routesWithUnits.length,
      totalAccounts: routesWithUnits.reduce((sum, r) => sum + r.accountCount, 0),
      totalUnits: routesWithUnits.reduce((sum, r) => sum + r.unitCount, 0),
      totalHours: routesWithUnits.reduce((sum, r) => sum + r.hours, 0),
      totalProjected: routesWithUnits.reduce((sum, r) => sum + r.projectedRevenue, 0),
    };

    return NextResponse.json({
      routes: routesWithUnits,
      totals,
      source: "premises_aggregation",
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    );
  }
}

// POST /api/routes - Create a new route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Route name is required" },
        { status: 400 }
      );
    }

    const route = await prisma.route.create({
      data: {
        name: body.name,
        mech: body.mech || null,
        loc: body.loc || 0,
        elev: body.elev || 0,
        hour: body.hour || 0,
        amount: body.amount || 0,
        remarks: body.remarks || null,
        symbol: body.symbol || null,
        en: body.en ?? 1,
        tfmId: body.tfmId || null,
        tfmSource: body.tfmSource || null,
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error("Error creating route:", error);
    return NextResponse.json(
      { error: "Failed to create route" },
      { status: 500 }
    );
  }
}
