export type User = {
  cn: string;
  userPrincipalName: string;
  sAMAccountName: string;
  groups: string[];
  userAccountControl: string;
};
