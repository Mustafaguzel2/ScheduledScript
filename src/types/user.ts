  export type SortingState = {
    id: string;
    desc: boolean;
  }[];
  
  export type ColumnFiltersState = {
    id: string;
    value: string;
  }[];
  export type User = {
    cn: string;
    sAMAccountName: string;
    groups: string[];
    userAccountControl: string;
  };
  