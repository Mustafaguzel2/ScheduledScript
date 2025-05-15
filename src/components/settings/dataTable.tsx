import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";
import { MoveRight, MoveLeft } from "lucide-react";
import { User } from "../../types/user";
import { SortingState } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData extends User, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchType, setSearchType] = useState<"name" | "group">("name");
  const [searchValue, setSearchValue] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((user) => {
      if (searchType === "name") {
        return user.cn.toLowerCase().includes(searchValue.toLowerCase());
      } else {
        return user.groups.some((group) =>
          group.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
    });
  }, [data, searchType, searchValue]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl mb-4">User Management</CardTitle>
        <div className="flex flex-row gap-4 items-center flex-wrap">
          <Input
            placeholder={
              searchType === "name" ? "Search by name..." : "Search by group..."
            }
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="max-w-sm"
          />
          <RadioGroup
            defaultValue="name"
            onValueChange={(value) => setSearchType(value as "name" | "group")}
            className="flex flex-row gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="name" id="name" />
              <Label htmlFor="name">Search by name</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="group" id="group" />
              <Label htmlFor="group">Search by group</Label>
            </div>
          </RadioGroup>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <MoveLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <MoveRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
