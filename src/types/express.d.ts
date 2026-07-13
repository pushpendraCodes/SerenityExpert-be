import type { IUser } from "../models/User.js";
import type { IExpert } from "../models/Expert.js";

declare global {
  namespace Express {
    interface Request {
      /** Populated by auth middleware after JWT verification */
      user?: IUser & { _id: import("mongoose").Types.ObjectId };
      /** Populated by requireExpert middleware */
      expert?: IExpert & { _id: import("mongoose").Types.ObjectId };
    }
  }
}

export {};
