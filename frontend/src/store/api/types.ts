export interface CursorPagination {
  next_cursor: string | null;
  previous_cursor: string | null;
  page_size: number;
  has_more: boolean;
}

export interface ListResponse<T> {
  data: T[];
  pagination: CursorPagination;
}

export type ListParams = {
  cursor?: string;
  page_size?: number;
} & Record<string, string | number | undefined>;
