import React from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { User } from "../../types/user";
import { useToast } from "../../hooks/use-toast";

interface StatusCellProps {
  row: Row<User>;
  isAdmin: boolean;
}

const StatusCell: React.FC<StatusCellProps> = ({ row, isAdmin }) => {
  const { toast } = useToast();
  const status = parseInt(row.getValue("userAccountControl") as string);
  const isDisabled = status & 2;

  const handleStatusChange = async () => {
    try {
      const response = await fetch("/api/users/change-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userDn: row.original.dn,
          enabled: isDisabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to change account status");
      }

      toast({
        title: "Success",
        description: `Account ${
          isDisabled ? "enabled" : "disabled"
        } successfully.`,
      });

      // Refresh the page to update the status
      window.location.reload();
    } catch {
      toast({
        title: "Error",
        description: "Failed to change account status",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleStatusChange}
      disabled={!isAdmin}
    >
      {isDisabled ? (
        <ToggleLeft className="h-4 w-4 text-red-500" />
      ) : (
        <ToggleRight className="h-4 w-4 text-green-500" />
      )}
      <span className="ml-2">{isDisabled ? "Disabled" : "Enabled"}</span>
    </Button>
  );
};

export const columns = (isAdmin: boolean): ColumnDef<User, unknown>[] => [
  {
    accessorKey: "cn",
    header: "Name",
  },
  {
    accessorKey: "sAMAccountName",
    header: "Username",
  },
  {
    accessorKey: "userPrincipalName",
    header: "User Principal Name",
  },
  {
    accessorKey: "groups",
    header: "Groups",
    cell: ({ row }) => {
      const groups = row.getValue("groups") as string[];
      return groups.join(", ");
    },
  },
  {
    accessorKey: "userAccountControl",
    header: "Account Status",
    cell: ({ row }) => <StatusCell row={row} isAdmin={isAdmin} />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={!isAdmin}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Administrator Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.sAMAccountName)}
            >
              Copy username
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("deleteUser", { detail: user })
                )
              }
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
