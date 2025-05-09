export type TableColumn = {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export type TableInfo = {
  schema: string;
  table: string;
  columns: TableColumn[];
  data: Record<string, string | number | boolean | null>[];
}
