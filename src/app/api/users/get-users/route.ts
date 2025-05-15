import { NextResponse } from "next/server";
import ActiveDirectory from "activedirectory2";
import { cookies } from "next/headers";
import { User } from "@/types/user";

interface ADGroup {
  cn: string;
  dn: string;
}

// LDAP Configuration
const config = {
  url: process.env.NEXT_PUBLIC_LDAP_URL || "",
  baseDN: process.env.LDAP_BASE_DN || "",
};

if (!config.url || !config.baseDN) {
  throw new Error(
    "Invalid LDAP configuration. Check your environment variables."
  );
}

export async function GET() {
  try {
    const sessionCookie = (await cookies()).get("session");
    if (!sessionCookie) {
      return NextResponse.json(
        { message: "Session not found. Please login again." },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    // Service account ile AD bağlantısı
    const ad = new ActiveDirectory({
      url: config.url,
      baseDN: config.baseDN,
      username: process.env.LDAP_SERVICE_USER || "",
      password: process.env.LDAP_SERVICE_PASS || "",
    });

    const users = await new Promise<User[]>((resolve, reject) => {
      ad.findUsers(
        "(&(objectClass=user)(objectCategory=person))",
        (err, users) => {
          if (err) {
            console.error("Error fetching users:", err);
            return reject(err);
          }
          if (!users || users.length === 0) {
            return resolve([]);
          }
          resolve(users.map((user) => ({ ...user } as User)));
        }
      );
    });

    const usersWithGroups = await Promise.all(
      users.map(async (user: User) => {
        const groups = await new Promise<string[]>((resolve, reject) => {
          ad.getGroupMembershipForUser(user.sAMAccountName, (err, groups) => {
            if (err) {
              console.error("Error fetching groups:", err);
              return reject(err);
            }
            if (!groups || groups.length === 0) {
              return resolve([]);
            }
            resolve((groups as ADGroup[]).map((group) => group.cn));
          });
        });

        return {
          ...user,
          groups,
        };
      })
    );

    // Admin bilgisini session'dan döndür
    const isAdmin = !!session.isMember;

    return NextResponse.json(
      {
        message: "Users and their groups fetched successfully.",
        users: usersWithGroups,
        isAdmin,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during fetching users:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
