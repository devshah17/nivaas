import mongoose, { Schema, Document } from "mongoose";

export interface IOrgMember {
  user: mongoose.Types.ObjectId;
  role: "admin" | "member";
  status: boolean;
  tiffinCycleStart?: number;
  rentCycleStart?: number;
}

export interface IOrganization extends Document {
  name: string;
  creator: mongoose.Types.ObjectId;
  members: IOrgMember[];
  inviteCode: string;
  tiffinPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrgMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    status: { type: Boolean, default: false },
    tiffinCycleStart: { type: Number, default: 1, min: 1, max: 31 },
    rentCycleStart: { type: Number, default: 1, min: 1, max: 31 },
  },
  { _id: false }
);

const OrganizationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide an organization name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [OrgMemberSchema],
    inviteCode: {
      type: String,
      unique: true,
      required: true,
    },
    tiffinPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Clear Mongoose model cache in development to ensure schema updates are applied during HMR
if (mongoose.models.Organization) {
  delete (mongoose.models as Record<string, unknown>).Organization;
}
if (mongoose.connection && mongoose.connection.models && mongoose.connection.models.Organization) {
  delete (mongoose.connection.models as Record<string, unknown>).Organization;
}

export default mongoose.model<IOrganization>("Organization", OrganizationSchema);
