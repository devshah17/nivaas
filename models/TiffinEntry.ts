import mongoose, { Schema, Document } from "mongoose";

export interface ITiffinEntry extends Document {
  organization: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format for easier querying
  lunchStatus: "none" | "consumed" | "cancelled";
  lunchExtra: number;
  dinnerStatus: "none" | "consumed" | "cancelled";
  dinnerExtra: number;
  lunchBill?: mongoose.Types.ObjectId;
  dinnerBill?: mongoose.Types.ObjectId;
  lunchPaymentStatus: "unpaid" | "paid";
  dinnerPaymentStatus: "unpaid" | "paid";
  createdAt: Date;
  updatedAt: Date;
}

const TiffinEntrySchema: Schema = new Schema(
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
    date: {
      type: String,
      required: true,
      index: true,
    },
    lunchStatus: {
      type: String,
      enum: ["none", "consumed", "cancelled"],
      default: "none",
    },
    lunchExtra: {
      type: Number,
      default: 0,
      min: 0,
    },
    dinnerStatus: {
      type: String,
      enum: ["none", "consumed", "cancelled"],
      default: "none",
    },
    dinnerExtra: {
      type: Number,
      default: 0,
      min: 0,
    },
    lunchBill: {
      type: Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },
    dinnerBill: {
      type: Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },
    lunchPaymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    dinnerPaymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

// Ensure a customer only has one entry per organization per date
TiffinEntrySchema.index({ organization: 1, customer: 1, date: 1 }, { unique: true });

// Clear Mongoose model cache in development to ensure schema updates are applied during HMR
if (mongoose.models.TiffinEntry) {
  delete mongoose.models.TiffinEntry;
}

export default mongoose.model<ITiffinEntry>("TiffinEntry", TiffinEntrySchema);
