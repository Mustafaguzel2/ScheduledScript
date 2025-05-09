export type ColumnDefinition = {
  name: string;
};

export type NodeSelection = {
  nodeKind: string;
  columns: ColumnDefinition[];
}; 