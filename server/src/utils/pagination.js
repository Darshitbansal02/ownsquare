export function sortOptions(sort) {
  const descending = sort.startsWith("-");
  const field = descending ? sort.slice(1) : sort;
  return { [field]: descending ? -1 : 1, _id: descending ? -1 : 1 };
}
export function dateRange(query) {
  return query.from || query.to ? {
    createdAt: { ...(query.from ? { $gte: new Date(query.from) } : {}), ...(query.to ? { $lt: new Date(query.to) } : {}) }
  } : {};
}
export async function pageOf(model, filter, query, transform, session) {
  const total = await model.countDocuments(filter).session(session || null);
  const rows = await model.find(filter).sort(sortOptions(query.sort))
    .skip((query.page - 1) * query.limit).limit(query.limit).session(session || null);
  const items = [];
  for (const row of rows) items.push(await transform(row));
  return { items, page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) };
}
