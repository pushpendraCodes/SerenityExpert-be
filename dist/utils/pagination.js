"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
const constants_js_1 = require("./constants.js");
/**
 * Generic pagination helper for Mongoose models.
 */
async function paginate(options) {
    const { model, filter = {}, query, select, populate, sort: defaultSort, } = options;
    const page = Math.max(1, Number(query.page) || constants_js_1.DEFAULT_PAGE);
    const limit = Math.min(Math.max(1, Number(query.limit) || constants_js_1.DEFAULT_LIMIT), constants_js_1.MAX_LIMIT);
    const skip = (page - 1) * limit;
    // Build sort object
    let sort = defaultSort || { createdAt: -1 };
    if (query.sort) {
        sort = { [query.sort]: query.order === "asc" ? 1 : -1 };
    }
    // Execute count and find in parallel
    const [total, data] = await Promise.all([
        model.countDocuments(filter),
        model
            .find(filter, select, { skip, limit, sort })
            .populate(populate || "")
            .lean()
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
//# sourceMappingURL=pagination.js.map