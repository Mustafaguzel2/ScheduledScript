import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { X } from "lucide-react";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { toast } from "sonner";

type ColumnDefinition = {
  name: string;
};

type ColumnManagerProps = {
  nodeKind: string;
  columns: ColumnDefinition[];
  onAddColumn: (columnName: string) => void;
  onRemoveColumn: (columnIndex: number) => void;
};

export function ColumnManager({
  nodeKind,
  columns,
  onAddColumn,
  onRemoveColumn,
}: ColumnManagerProps) {
  const [newColumn, setNewColumn] = useState<string>("");

  const handleAddColumn = () => {
    if (!newColumn.trim()) return;
    
    if (columns.some((column) => column.name === newColumn.trim())) {
      toast.error("Column already exists");
      return;
    }
    
    onAddColumn(newColumn.trim());
    setNewColumn("");
  };

  return (
    <Card className="border-2">
      <CardHeader className="bg-muted/30 border-b-2">
        <CardTitle className="text-lg text-foreground">
          Columns for {nodeKind}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-end gap-2 mb-6">
          <div className="flex-1 space-y-2">
            <Label htmlFor="columnName">Column Name</Label>
            <Input
              id="columnName"
              value={newColumn}
              onChange={(e) => setNewColumn(e.target.value)}
              placeholder="Enter column name"
              className="border-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newColumn.trim()) {
                  handleAddColumn();
                }
              }}
            />
          </div>
          <Button onClick={handleAddColumn} disabled={!newColumn.trim()}>
            Add
          </Button>
        </div>

        {columns.length > 0 ? (
          <div className="mt-2">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              Defined Columns:
            </h4>
            <ScrollArea className="w-full pr-4">
              <ul className="space-y-2">
                {columns.map((column, columnIndex) => (
                  <li
                    key={columnIndex}
                    className="flex justify-between items-center bg-muted/30 px-4 py-2 rounded-md border"
                  >
                    {column.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveColumn(columnIndex)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      aria-label={`Remove column ${column.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No columns defined yet
          </p>
        )}
      </CardContent>
    </Card>
  );
} 