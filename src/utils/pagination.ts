import { Model, QueryOptions } from "mongoose";
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "./constants.js";
import type { PaginatedResult, PaginationQuery } from "../types/index.js";

export interface PaginateOptions<T> {
  model: Model<T>;
  filter?: Record<string, unknown>;
  query: PaginationQuery;
  select?: string;
  populate?: string | string[] | Record<string, unknown> | Array<Record<string, unknown>>;
  sort?: Record<string, 1 | -1>;
}

/**
 * Generic pagination helper for Mongoose models.
 */
export async function paginate<T>(options: PaginateOptions<T>): Promise<PaginatedResult<T>> {
  const {
    model,
    filter = {},
    query,
    select,
    populate,
    sort: defaultSort,
  } = options;

  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const limit = Math.min(Math.max(1, Number(query.limit) || DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;

  // Build sort object
  let sort: Record<string, 1 | -1> = defaultSort || { createdAt: -1 };
  if (query.sort) {
    sort = { [query.sort]: query.order === "asc" ? 1 : -1 };
  }

  // Execute count and find in parallel
  const [total, data] = await Promise.all([
    model.countDocuments(filter),
    model
      .find(filter, select, { skip, limit, sort } as QueryOptions)
      .populate(populate as string || "")
      .lean<T[]>()
      .exec(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
