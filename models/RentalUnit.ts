import mongoose, { Schema, Document } from "mongoose";

export interface IRentalUnit extends Document {
  organization: mongoose.Types.ObjectId;
  roomName: string;
  bedName: string;
  tenant?: mongoose.Types.ObjectId;
  rentAmount?: number;
  moveInDate?: string;
  billedPeriods: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RentalUnitSchema: Schema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    roomName: {
      type: String,
      required: true,
    },
    bedName: {
      type: String,
      required: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rentAmount: {
      type: Number,
      default: null,
    },
    moveInDate: {
      type: String,
      default: null,
    },
    billedPeriods: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Ensure room/bed combination is unique per organization
RentalUnitSchema.index({ organization: 1, roomName: 1, bedName: 1 }, { unique: true });

// Clear Mongoose model cache in development to ensure schema updates are applied during HMR
if (mongoose.models.RentalUnit) {
  delete mongoose.models.RentalUnit;
}

export default mongoose.model<IRentalUnit>("RentalUnit", RentalUnitSchema);
