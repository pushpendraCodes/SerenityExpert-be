import { Model, FilterQuery } from "mongoose";
import type { PaginatedResult, PaginationQuery } from "../types/index.js";
export interface PaginateOptions<T> {
    model: Model<T>;
    filter?: FilterQuery<T>;
    query: PaginationQuery;
    select?: string;
    populate?: string | string[] | Record<string, unknown> | Array<Record<string, unknown>>;
    sort?: Record<string, 1 | -1>;
}
/**
 * Generic pagination helper for Mongoose models.
 */
export declare function paginate<T>(options: PaginateOptions<T>): Promise<PaginatedResult<T>>;
//# sourceMappingURL=pagination.d.ts.map