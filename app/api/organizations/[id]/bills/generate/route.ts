import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import TiffinEntry from "@/models/TiffinEntry";
import RentalUnit from "@/models/RentalUnit";
import Bill from "@/models/Bill";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { startDate, endDate, periodName, customerId, includeTiffin = true, includeRent = true } = body;

    if (!startDate || !endDate || !periodName) {
      return NextResponse.json({ error: "startDate, endDate, and periodName are required" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Tiffin entries are string "YYYY-MM-DD", so we filter strings between start and end
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    await connectToDatabase();
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = (organization.members as { user: { toString: () => string }; role: string }[]).find(m => m.user.toString() === user.userId);
    if (!memberData || memberData.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin only." }, { status: 403 });
    }

    const tiffinRate = organization.tiffinPrice || 0;

    let targetMembers = (organization.members as { status: boolean; user: { toString: () => string } }[]).filter(m => m.status === true);
    if (customerId && customerId !== "all") {
      targetMembers = targetMembers.filter(m => m.user.toString() === customerId);
    }
    
    let generatedCount = 0;

    for (const member of targetMembers) {
      const currentCustId = member.user.toString();

      // We'll look for an existing unpaid bill for this period and customer.
      // If none exists but we have unbilled tiffins, we'll create a NEW bill for this same period (a supplementary bill).
      const unpaidBill = await Bill.findOne({ 
        organization: id, 
        customer: currentCustId, 
        periodName,
        status: "unpaid"
      });

      let tiffinCount = 0;
      let tiffinEntriesToUpdate: Awaited<ReturnType<typeof TiffinEntry.find>> = [];
      if (includeTiffin) {
        const query: Record<string, unknown> = {
          organization: id,
          customer: currentCustId,
          date: { $gte: startStr, $lte: endStr },
        };
        if (unpaidBill) {
          query.$or = [
            { lunchStatus: 'consumed', lunchBill: { $in: [null, unpaidBill._id] } },
            { dinnerStatus: 'consumed', dinnerBill: { $in: [null, unpaidBill._id] } }
          ];
        } else {
          query.$or = [
            { lunchStatus: 'consumed', lunchBill: null },
            { dinnerStatus: 'consumed', dinnerBill: null }
          ];
        }

        const entries = await TiffinEntry.find(query);
        tiffinEntriesToUpdate = entries;
        
        entries.forEach(entry => {
          if (entry.lunchStatus === "consumed" && (!entry.lunchBill || (unpaidBill && entry.lunchBill.toString() === unpaidBill._id.toString()))) {
            tiffinCount += (1 + entry.lunchExtra);
          }
          if (entry.dinnerStatus === "consumed" && (!entry.dinnerBill || (unpaidBill && entry.dinnerBill.toString() === unpaidBill._id.toString()))) {
            tiffinCount += (1 + entry.dinnerExtra);
          }
        });
      }

      const tiffinTotal = tiffinCount * tiffinRate;

      let rentAmount = 0;
      const rentalUnitsToUpdate: { _id: unknown; rentAmount?: number; billedPeriods?: string[]; moveInDate?: string | Date }[] = [];
      if (includeRent) {
        const rentalUnits = await RentalUnit.find({ organization: id, tenant: currentCustId });
        
        for (const unit of rentalUnits) {
          if (unit.moveInDate) {
            const moveIn = new Date(unit.moveInDate);
            if (moveIn > end) {
              continue;
            }
          }

          const alreadyBilled = unit.billedPeriods?.includes(periodName);
          let includeThisUnit = false;
          
          if (alreadyBilled) {
            if (unpaidBill && unpaidBill.rentAmount > 0) {
              includeThisUnit = true;
            }
          } else {
            includeThisUnit = true;
          }

          if (includeThisUnit) {
            rentAmount += (unit.rentAmount || 0);
            if (!alreadyBilled) {
              rentalUnitsToUpdate.push(unit);
            }
          }
        }
      }

      const totalAmount = tiffinTotal + rentAmount + (unpaidBill?.otherCharges || 0);

      if (totalAmount === 0) {
        if (unpaidBill) {
          await Bill.findByIdAndDelete(unpaidBill._id);
        }
        continue;
      }

      let billDoc;
      if (unpaidBill) {
        unpaidBill.tiffinCount = tiffinCount;
        unpaidBill.tiffinRate = tiffinRate;
        unpaidBill.tiffinTotal = tiffinTotal;
        unpaidBill.rentAmount = rentAmount;
        unpaidBill.totalAmount = totalAmount;
        billDoc = await unpaidBill.save();
      } else {
        billDoc = await Bill.create({
          organization: id,
          customer: currentCustId,
          periodName,
          startDate: start,
          endDate: end,
          tiffinCount,
          tiffinRate,
          tiffinTotal,
          rentAmount,
          totalAmount,
          status: "unpaid"
        });
      }
      
      // Update Tiffins to link to this bill
      if (tiffinEntriesToUpdate.length > 0) {
        for (const entry of tiffinEntriesToUpdate) {
          let updated = false;
          if (entry.lunchStatus === "consumed" && (!entry.lunchBill || (unpaidBill && entry.lunchBill.toString() === unpaidBill._id.toString()))) {
             entry.lunchBill = billDoc._id;
             updated = true;
          }
          if (entry.dinnerStatus === "consumed" && (!entry.dinnerBill || (unpaidBill && entry.dinnerBill.toString() === unpaidBill._id.toString()))) {
             entry.dinnerBill = billDoc._id;
             updated = true;
          }
          if (updated) await entry.save();
        }
      }

      // Update RentalUnit to record this period as billed for rent
      if (rentAmount > 0 && rentalUnitsToUpdate.length > 0) {
        for (const unit of rentalUnitsToUpdate) {
          await RentalUnit.updateOne(
            { _id: unit._id as unknown as string },
            { $addToSet: { billedPeriods: periodName } }
          );
        }
      }
      
      generatedCount++;
    }

    return NextResponse.json({ message: `Successfully generated ${generatedCount} bills.` }, { status: 200 });

  } catch (error: unknown) {
    console.error("Generate bills error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
