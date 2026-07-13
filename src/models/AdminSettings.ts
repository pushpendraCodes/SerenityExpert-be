import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAdminSettings extends Document {
  _id: Types.ObjectId;
  key: string;
  value: string;
  description?: string;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

const adminSettingsSchema = new Schema<IAdminSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
    description: String,
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        Reflect.deleteProperty(ret, "__v");
        return ret;
      },
    },
  }
);

const AdminSettings = mongoose.model<IAdminSettings>("AdminSettings", adminSettingsSchema);
export default AdminSettings;
