import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBanner extends Document {
  _id: Types.ObjectId;
  title: string;
  imageUrl: string;
  link?: string;
  position: "home" | "expert_list" | "community";
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  order: number;
  createdAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    link: String,
    position: {
      type: String,
      enum: ["home", "expert_list", "community"],
      default: "home",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: Date,
    endDate: Date,
    order: {
      type: Number,
      default: 0,
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

bannerSchema.index({ isActive: 1, position: 1, order: 1 });

const Banner = mongoose.model<IBanner>("Banner", bannerSchema);
export default Banner;
