import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFaq extends Document {
  _id: Types.ObjectId;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

const faqSchema = new Schema<IFaq>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

const Faq = mongoose.model<IFaq>("Faq", faqSchema);
export default Faq;
