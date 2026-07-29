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
    let findQuery = model.find(filter);
    if (select)
        findQuery = findQuery.select(select);
    findQuery = findQuery.skip(skip).limit(limit).sort(sort);
    if (populate)
        findQuery = findQuery.populate(populate);
    const [total, data] = await Promise.all([
        model.countDocuments(filter),
        findQuery.lean().exec(),
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