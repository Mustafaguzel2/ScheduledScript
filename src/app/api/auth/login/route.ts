import { NextResponse } from "next/server";
import ActiveDirectory from "activedirectory2";
import { cookies } from "next/headers";
import crypto from "crypto";

// LDAP Configuration
const config = {
  url: process.env.LDAP_URL || "",
  baseDN: process.env.LDAP_BASE_DN || "",
};

if (!config.url || !config.baseDN) {
  throw new Error(
    "Invalid LDAP configuration. Check your environment variables."
  );
}

export async function POST(request: Request) {
  try {
    // İstekten kullanıcı bilgilerini alın
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required." },
        { status: 400 }
      );
    }

    // Active Directory bağlantısı
    const ad = new ActiveDirectory({
      url: config.url,
      baseDN: config.baseDN,
      username,
      password,
    });

    // Kullanıcı kimlik doğrulama
    const isAuthenticated = await new Promise<boolean>((resolve) => {
      ad.authenticate(username, password, (err, auth) => {
        if (err || !auth) {
          console.error("Authentication failed:", err);
          return resolve(false);
        }
        resolve(true);
      });
    });

    if (!isAuthenticated) {
      return NextResponse.json(
        { message: "Authentication failed." },
        { status: 401 }
      );
    }

    console.log("Authentication successful for user:", username);

    // Kullanıcının grup üyeliğini kontrol et
    const groupName = "Administrators";
    const isMember = await new Promise<boolean>((resolve) => {
      ad.isUserMemberOf(username, groupName, (err, member) => {
        if (err) {
          console.error("Error checking group membership:", err);
          return resolve(false);
        }
        resolve(member);
      });
    });

    console.log(`${username} is a member of ${groupName}: ${isMember}`);

    // Oturum oluştur ve çerezi ayarla
    const session = {
      id: crypto.randomUUID(),
      username,
      password, // Uygulamada sadece backend kullanmalı
      isMember,
      createdAt: new Date().toISOString(),
    };

    (await cookies()).set("session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    (await cookies()).set("username", username, {
      httpOnly: false, // Frontend erişimi için false
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    (await cookies()).set("isMember", isMember.toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json(
      { message: "Authentication successful.", isMember },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during authentication:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
