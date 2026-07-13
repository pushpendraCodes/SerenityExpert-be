import mongoose, { Document } from "mongoose";
export interface IOtp extends Document {
    phone: string;
    otp: string;
    expiresAt: Date;
    attempts: number;
    isUsed: boolean;
}
declare const Otp: mongoose.Model<IOtp, {}, {}, {}, mongoose.Document<unknown, {}, IOtp, {}, mongoose.DefaultSchemaOptions> & IOtp & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IOtp>;
export default Otp;
//# sourceMappingURL=Otp.d.ts.map