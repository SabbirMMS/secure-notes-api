import { z } from 'zod';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function paginate(model, filter, { page, limit }, projection) {
  const [data, total] = await Promise.all([
    model.find(filter, projection).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit),
    model.countDocuments(filter),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
