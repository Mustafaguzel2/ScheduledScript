import { NextResponse } from "next/server";
import { Client, Change, Attribute } from "ldapts";
import { cookies } from "next/headers";

const url = process.env.LDAP_URL || "";
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
      attributes: ["userAccountControl"],
    });
    if (!searchEntries.length) {
      await client.unbind();
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }
    const user = searchEntries[0] as { userAccountControl?: string | string[] };
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
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
