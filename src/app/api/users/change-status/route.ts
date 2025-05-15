import { NextResponse } from "next/server";
import { Client, Change, Attribute } from "ldapts";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_LDAP_URL || "";
const baseDN = process.env.LDAP_BASE_DN || "";

if (!url || !baseDN) {
  throw new Error("Invalid LDAP configuration. Check your environment variables.");
}

export async function PATCH(request: Request) {
  let client: Client | null = null;
  try {
    // Get session cookie
    const sessionCookie = (await cookies()).get("session");
    if (!sessionCookie) {
      return NextResponse.json(
        { message: "Session not found. Please login again." },
        { status: 401 }
      );
    }
    const session = JSON.parse(sessionCookie.value);
    const { username, password } = session;

    const isMember = (await cookies()).get("isMember");
    if (!isMember) {
      return NextResponse.json(
        { message: "User is not a member of the Administrators group." },
        { status: 403 }
      );
    }

    // Get request body
    const { userDn, enabled } = await request.json();
    if (!userDn) {
      return NextResponse.json(
        { message: "User DN is required." },
        { status: 400 }
      );
    }

    client = new Client({ url });
    await client.bind(username, password);

    // Search for the user to get current userAccountControl
    const { searchEntries } = await client.search(userDn, {
      scope: "base",
      attributes: ["userAccountControl", "sAMAccountName", "objectClass"],
    });
    if (!searchEntries.length) {
      await client.unbind();
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }
    const user = searchEntries[0] as { 
      userAccountControl?: string | string[],
      sAMAccountName?: string | string[],
      objectClass?: string | string[]
    };
    
    // Check if this is a protected account
    const samAccountName = Array.isArray(user.sAMAccountName) ? user.sAMAccountName[0] : user.sAMAccountName || "";
    
    // List of system accounts or special accounts that shouldn't be modified
    const protectedAccounts = ["krbtgt", "administrator", "guest"];
    
    // Check if this is a system account that shouldn't be modified
    if (protectedAccounts.includes(samAccountName.toLowerCase())) {
      await client.unbind();
      return NextResponse.json(
        { message: `The account '${samAccountName}' is a protected system account and cannot be modified.` },
        { status: 403 }
      );
    }
    
    const currentUAC = parseInt(Array.isArray(user.userAccountControl) ? user.userAccountControl[0] : user.userAccountControl || "0");

    // 0x0002 is the ADS_UF_ACCOUNTDISABLE flag
    const newUAC = enabled
      ? currentUAC & ~0x0002 // Clear the disable bit
      : currentUAC | 0x0002; // Set the disable bit

    // Modify the userAccountControl attribute
    await client.modify(userDn, [
      new Change({
        operation: "replace",
        modification: new Attribute({
          type: "userAccountControl",
          values: [newUAC.toString()],
        }),
      }),
    ]);

    await client.unbind();
    return NextResponse.json(
      { message: `Account ${enabled ? "enabled" : "disabled"} successfully.` },
      { status: 200 }
    );
  } catch (error) {
    if (client) await client.unbind().catch(() => {});
    console.error("Error changing account status:", error);
    
    // Extract more detailed error information
    let errorMessage = "Internal server error.";
    if (error instanceof Error) {
      errorMessage = error.message;
      // If the error contains AD-specific error codes, extract more meaningful information
      if (errorMessage.includes("DSID") && errorMessage.includes("problem")) {
        errorMessage = `Active Directory error: ${errorMessage}`;
      }
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
