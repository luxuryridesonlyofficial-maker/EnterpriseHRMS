import { Prisma } from '@prisma/client';

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function buildPaginationOptions(query: any) {
  const page = Math.max(1, parseInt(query.page as any) || 1);
  const limit = Math.max(1, parseInt(query.limit as any) || 10);
  const skip = (page - 1) * limit;
  const orderBy = query.sort
    ? ({ [query.sort]: (query.order || 'desc') as Prisma.SortOrder } as any)
    : { createdAt: 'desc' };

  return { page, limit, skip, orderBy };
}

export function buildDateRangeFilter(field: string, dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return undefined;

  const gte = dateFrom ? new Date(dateFrom) : undefined;
  const lte = dateTo ? new Date(dateTo) : undefined;

  const filter: any = {};
  if (gte) filter.gte = gte;
  if (lte) filter.lte = lte;

  return { [field]: filter };
}
