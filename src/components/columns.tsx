import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types/user";

export const columns = (
  isAdmin: boolean,
  onEditUser: (user: User) => void
): ColumnDef<User, unknown>[] => [
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
    cell: ({ row }) => {
      const status = parseInt(row.getValue("userAccountControl") as string);
      return status & 2 ? "Disabled" : "Enabled";
    },
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
              onClick={() => onEditUser(row.original)}
              disabled={true}
              /* TODO: Talk client */
            >
              <Edit2 className="mr-2 h-4 w-4" /> Edit user
            </DropdownMenuItem>
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
