import mongoose, { Document, Types } from "mongoose";
import { UserRole } from "../types/index.js";
export interface IUser extends Document {
    _id: Types.ObjectId;
    name: string;
    phone: string;
    email?: string;
    avatar: string;
    googleId?: string;
    role: UserRole;
    isVerified: boolean;
    isBlocked: boolean;
    walletBalance: number;
    fcmTokens: string[];
    refreshToken?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
export default User;
//# sourceMappingURL=User.d.ts.map