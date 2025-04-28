import { NextResponse } from "next/server";
import ActiveDirectory from "activedirectory2";
import { cookies } from "next/headers";
import crypto from "crypto";
import { User } from "@/types/user";

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

// Common cookie settings
const commonCookieSettings = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
};

// Helper to parse AD error codes
function parseADError(error: Error | unknown): { code: string; message: string; status: number } {
  if (!error) {
    return { code: "UNKNOWN", message: "Unknown error occurred", status: 500 };
  }
  
  // Default error response
  let result = { code: "UNKNOWN", message: "Authentication failed", status: 401 };
  
  // Try to extract error code from AD error message
  const errorMessage = error.toString();
  let errorCode = "";
  
  // Extract the data code from error message (typically in "data XXX" format)
  const dataMatch = errorMessage.match(/data\s([0-9a-fA-F]+)/);
  if (dataMatch && dataMatch[1]) {
    errorCode = dataMatch[1].toLowerCase();
    
    // Map specific error codes to user-friendly messages
    switch (errorCode) {
      case "525":
        result = { code: "USER_NOT_FOUND", message: "User does not exist in the directory", status: 404 };
        break;
      case "52e":
        result = { code: "INVALID_CREDENTIALS", message: "Invalid username or password", status: 401 };
        break;
      case "530":
        result = { code: "TIME_RESTRICTION", message: "Not permitted to login at this time", status: 403 };
        break;
      case "531":
        result = { code: "WORKSTATION_RESTRICTION", message: "Not permitted to login from this workstation", status: 403 };
        break;
      case "532":
        result = { code: "PASSWORD_EXPIRED", message: "Your password has expired", status: 401 };
        break;
      case "533":
      case "2":
        result = { code: "ACCOUNT_DISABLED", message: "Your account is disabled. Please contact your administrator", status: 403 };
        break;
      case "701":
        result = { code: "ACCOUNT_EXPIRED", message: "Your account has expired", status: 403 };
        break;
      case "773":
        result = { code: "PASSWORD_RESET_REQUIRED", message: "You must reset your password", status: 401 };
        break;
      case "775":
        result = { code: "ACCOUNT_LOCKED", message: "Your account is locked. Please contact your administrator", status: 403 };
        break;
      default:
        result = { code: "AUTH_FAILED", message: "Authentication failed", status: 401 };
    }
  }
  
  console.error(`Authentication error: ${result.code} (${errorCode}) - ${error}`);
  return result;
}

// Helper function to authenticate user
async function authenticateUser(ad: ActiveDirectory, username: string, password: string): Promise<{ success: boolean; error?: { code: string; message: string; status: number } }> {
  return new Promise((resolve) => {
    ad.authenticate(username, password, (err, auth) => {
      if (err || !auth) {
        const errorDetails = parseADError(err);
        return resolve({ success: false, error: errorDetails });
      }
      resolve({ success: true });
    });
  });
}

// Helper function to find user
async function findUser(ad: ActiveDirectory, username: string): Promise<User | null> {
  return new Promise<User | null>((resolve, reject) => {
    ad.findUser(username, (err, user) => {
      if (err) {
        console.error("Error finding user:", err);
        return reject(err);
      }
      resolve(user as User);
    });
  });
}

// Helper function to check group membership
async function checkGroupMembership(ad: ActiveDirectory, username: string, groupName: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    ad.isUserMemberOf(username, groupName, (err, member) => {
      if (err) {
        console.error("Error checking group membership:", err);
        return resolve(false);
      }
      resolve(member);
    });
  });
}

// Helper function to set cookies
async function setCookies(username: string, password: string, isMember: boolean) {
  const cookieStore = await cookies();
  const session = {
    id: crypto.randomUUID(),
    username,
    password,
    isMember,
    createdAt: new Date().toISOString(),
  };
  
  cookieStore.set("session", JSON.stringify(session), {
    ...commonCookieSettings,
    httpOnly: true,
  });
  
  cookieStore.set("username", username, {
    ...commonCookieSettings,
    httpOnly: false,
  });
  
  cookieStore.set("isMember", isMember.toString(), {
    ...commonCookieSettings,
    httpOnly: false,
  });
}

export async function POST(request: Request) {
  try {
    // Get user credentials from request
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required." },
        { status: 400 }
      );
    }

    // Create AD connection
    const ad = new ActiveDirectory({
      url: config.url,
      baseDN: config.baseDN,
      username,
      password,
    });

    // Step 1: Authenticate user
    const authResult = await authenticateUser(ad, username, password);
    if (!authResult.success) {
      return NextResponse.json(
        { message: authResult.error?.message || "Authentication failed" },
        { status: authResult.error?.status || 401 }
      );
    }
    
    console.log("Authentication successful for user:", username);

    // Step 2: Find user and check if account is disabled
    let user: User | null;
    try {
      user = await findUser(ad, username);
      if (!user) {
        return NextResponse.json(
          { message: "User not found in the directory." },
          { status: 404 }
        );
      }
    } catch (err) {
      console.error("Error finding user:", err);
      return NextResponse.json(
        { message: "Error retrieving user information." },
        { status: 500 }
      );
    }

    // Check userAccountControl for the disabled flag (0x0002)
    if (user.userAccountControl && (parseInt(user.userAccountControl) & 0x0002)) {
      console.log(`Account for ${username} is disabled.`);
      return NextResponse.json(
        { message: "Your account is disabled. Please contact your administrator." },
        { status: 403 }
      );
    }

    // Step 3: Check if user is an administrator
    const groupName = "Administrators";
    const isMember = await checkGroupMembership(ad, username, groupName);
    console.log(`${username} is a member of ${groupName}: ${isMember}`);

    if (!isMember) {
      console.log(`User ${username} is not an administrator.`);
      // We still log them in, but with non-admin privileges
    }

    // Step 4: Set cookies and session
    await setCookies(username, password, isMember);

    return NextResponse.json(
      { message: "Authentication successful.", isMember },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during authentication:", error);
    return NextResponse.json(
      { message: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
