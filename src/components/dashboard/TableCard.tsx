import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TableColumn, TableInfo } from "@/app/api/utils/db";

interface TableCardProps {
  tableInfo: TableInfo;
  selectedColumns: string[];
  columnFilter: string;
  dataFilter: string;
  onColumnFilterChange: (value: string) => void;
  onDataFilterChange: (value: string) => void;
  onColumnSelection: (columnName: string, checked: boolean) => void;
}

export function TableCard({
  tableInfo,
  selectedColumns,
  columnFilter,
  dataFilter,
  onColumnFilterChange,
  onDataFilterChange,
  onColumnSelection,
}: TableCardProps) {
  const tableKey = `${tableInfo.schema}.${tableInfo.table}`;

  const filterColumns = (columns: TableColumn[], filter: string) => {
    if (!filter) return columns;
    return columns.filter(
      (column) =>
        column.column_name.toLowerCase().includes(filter) ||
        column.data_type.toLowerCase().includes(filter)
    );
  };

  const filterData = (data: Record<string, string | number | boolean | null>[], filter: string) => {
    if (!filter) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(filter)
      )
    );
  };

  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-muted/30 border-b-2">
        <CardTitle className="text-lg text-foreground">
          {tableInfo.schema}.{tableInfo.table}
          <span className="ml-2 text-sm text-muted-foreground">
            ({tableInfo.type === 'VIEW' ? 'View' : 'Table'})
          </span>
        </CardTitle>
      </CardHeader>
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Table structure */}
          <div className="col-span-3">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Structure
                </h3>
                <Input
                  placeholder="Filter columns..."
                  value={columnFilter}
                  onChange={(e) => onColumnFilterChange(e.target.value)}
                  className="mb-4 border-2"
                />
              </div>
              <div className="overflow-x-auto border-2 rounded-lg">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          Select
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          Column
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filterColumns(tableInfo.columns, columnFilter).map((column: TableColumn, colIndex: number) => (
                        <tr
                          key={colIndex}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-2">
                            <Checkbox
                              id={`${tableKey}-${column.column_name}`}
                              checked={selectedColumns.includes(column.column_name)}
                              onCheckedChange={(checked: boolean) =>
                                onColumnSelection(column.column_name, checked as boolean)
                              }
                            />
                          </td>
                          <td className="px-4 py-2 text-xs">
                            <Label htmlFor={`${tableKey}-${column.column_name}`}>
                              {column.column_name}
                            </Label>
                          </td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">
                            {column.data_type}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Table data */}
          <div className="col-span-9">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Data
                </h3>
                <Input
                  placeholder="Filter data..."
                  value={dataFilter}
                  onChange={(e) => onDataFilterChange(e.target.value)}
                  className="mb-4 border-2"
                />
              </div>
              <div className="overflow-x-auto border-2 rounded-lg">
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {tableInfo.columns
                          .filter(
                            (column: TableColumn) =>
                              selectedColumns.length === 0 ||
                              selectedColumns.includes(column.column_name)
                          )
                          .map((column: TableColumn, colIndex: number) => (
                            <th
                              key={colIndex}
                              className="px-4 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap sticky top-0 bg-muted/50"
                            >
                              {column.column_name}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filterData(tableInfo.data, dataFilter).map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {tableInfo.columns
                            .filter(
                              (column: TableColumn) =>
                                selectedColumns.length === 0 ||
                                selectedColumns.includes(column.column_name)
                            )
                            .map((column: TableColumn, colIndex: number) => (
                              <td
                                key={colIndex}
                                className="px-4 py-2 text-sm whitespace-nowrap"
                              >
                                {String(row[column.column_name] ?? "")}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 