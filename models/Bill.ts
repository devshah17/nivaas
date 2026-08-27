import mongoose, { Schema, Document } from "mongoose";

export interface IBill extends Document {
  organization: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  periodName: string; // E.g. "Aug 2026" or "Aug 12 - Sep 11"
  startDate: Date;
  endDate: Date;
  tiffinCount: number;
  tiffinRate: number;
  tiffinTotal: number;
  rentAmount: number;
  otherCharges: number;
  otherChargesNote: string;
  totalAmount: number;
  status: "unpaid" | "paid";
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema: Schema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    periodName: {
      type: String,
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    tiffinCount: {
      type: Number,
      default: 0,
    },
    tiffinRate: {
      type: Number,
      default: 0,
    },
    tiffinTotal: {
      type: Number,
      default: 0,
    },
    rentAmount: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },
    otherChargesNote: {
      type: String,
      default: "",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

// Optional: Index on dates to quickly find overlapping bills if needed
BillSchema.index({ organization: 1, customer: 1, startDate: 1, endDate: 1 });

// Clear Mongoose model cache in development to ensure schema updates are applied during HMR
if (mongoose.models.Bill) {
  delete mongoose.models.Bill;
}

export default mongoose.model<IBill>("Bill", BillSchema);
