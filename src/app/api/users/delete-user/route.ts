import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import ldap from "ldapjs";

const config = {
  url: process.env.LDAP_URL || "",
  baseDN: process.env.LDAP_BASE_DN || "",
};

if (!config.url || !config.baseDN) {
  throw new Error(
    "Invalid LDAP configuration. Check your environment variables."
  );
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required." },
        { status: 400 }
      );
    }

    const sessionCookie = (await cookies()).get("session");
    if (!sessionCookie) {
      return NextResponse.json(
        { message: "Unauthorized. No session found." },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const { username, password } = session;

    const client = ldap.createClient({
      url: config.url,
    });

    return new Promise((resolve) => {
      client.bind(username, password, (err) => {
        if (err) {
          console.error("Bind error:", err);
          resolve(
            NextResponse.json(
              { message: "Authentication failed." },
              { status: 401 }
            )
          );
          return;
        }

        type SearchScope = "base" | "one" | "sub";

        const searchOptions = {
          scope: "sub" as SearchScope, // Use custom SearchScope type
          filter: `(sAMAccountName=${userId})`,
        };

        client.search(config.baseDN, searchOptions, (err, res) => {
          if (err) {
            console.error("Search error:", err);
            resolve(
              NextResponse.json(
                { message: "Error searching for user." },
                { status: 500 }
              )
            );
            return;
          }

          let userDN: string | null = null;

          res.on("searchEntry", (entry) => {
            userDN = entry.objectName;
          });

          res.on("error", (err) => {
            console.error("Search result error:", err);
          });

          res.on("end", () => {
            if (!userDN) {
              resolve(
                NextResponse.json(
                  { message: "User not found." },
                  { status: 404 }
                )
              );
              return;
            }

            client.del(userDN, (err) => {
              if (err) {
                console.error("Delete error:", err);
                resolve(
                  NextResponse.json(
                    { message: "Error deleting user." },
                    { status: 500 }
                  )
                );
              } else {
                resolve(
                  NextResponse.json(
                    { message: "User deleted successfully." },
                    { status: 200 }
                  )
                );
              }

              client.unbind();
            });
          });
        });
      });
    });
  } catch (error) {
    console.error("Error during user deletion:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
