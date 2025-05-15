import { NextResponse } from "next/server";
import ActiveDirectory from "activedirectory2";
import crypto from "crypto";
import { User } from "@/types/user";

// LDAP Configuration
const config = {
  url: process.env.NEXT_PUBLIC_LDAP_URL || "",
  baseDN: process.env.LDAP_BASE_DN || "",
};

const groupName = process.env.GROUP_NAME || "";
const groupName2 = process.env.GROUP_NAME2 || "";

if (!config.url || !config.baseDN) {
  throw new Error(
    "Invalid LDAP configuration. Check your environment variables."
  );
}

// Helper to parse AD error codes
function parseADError(error: Error | unknown): {
  code: string;
  message: string;
  status: number;
} {
  if (!error) {
    return { code: "UNKNOWN", message: "Unknown error occurred", status: 500 };
  }

  // Default error response
  let result = {
    code: "UNKNOWN",
    message: "Authentication failed",
    status: 401,
  };

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
        result = {
          code: "USER_NOT_FOUND",
          message: "User does not exist in the directory",
          status: 404,
        };
        break;
      case "52e":
        result = {
          code: "INVALID_CREDENTIALS",
          message: "Invalid username or password",
          status: 401,
        };
        break;
      case "530":
        result = {
          code: "TIME_RESTRICTION",
          message: "Not permitted to login at this time",
          status: 403,
        };
        break;
      case "531":
        result = {
          code: "WORKSTATION_RESTRICTION",
          message: "Not permitted to login from this workstation",
          status: 403,
        };
        break;
      case "532":
        result = {
          code: "PASSWORD_EXPIRED",
          message: "Your password has expired",
          status: 401,
        };
        break;
      case "533":
      case "2":
        result = {
          code: "ACCOUNT_DISABLED",
          message:
            "Your account is disabled. Please contact your administrator",
          status: 403,
        };
        break;
      case "701":
        result = {
          code: "ACCOUNT_EXPIRED",
          message: "Your account has expired",
          status: 403,
        };
        break;
      case "773":
        result = {
          code: "PASSWORD_RESET_REQUIRED",
          message: "You must reset your password",
          status: 401,
        };
        break;
      case "775":
        result = {
          code: "ACCOUNT_LOCKED",
          message: "Your account is locked. Please contact your administrator",
          status: 403,
        };
        break;
      default:
        result = {
          code: "AUTH_FAILED",
          message: "Authentication failed",
          status: 401,
        };
    }
  }

  console.error(
    `Authentication error: ${result.code} (${errorCode}) - ${error}`
  );
  return result;
}

// Helper function to authenticate user
async function authenticateUser(
  ad: ActiveDirectory,
  username: string,
  password: string
): Promise<{
  success: boolean;
  error?: { code: string; message: string; status: number };
}> {
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
async function findUser(
  ad: ActiveDirectory,
  username: string
): Promise<User | null> {
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
async function checkGroupMembership(
  ad: ActiveDirectory,
  username: string,
  groupName: string
): Promise<boolean> {
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
    if (
      user.userAccountControl &&
      (parseInt(user.userAccountControl, 10) & 0x0002)
    ) {
      console.log(`Account for ${username} is disabled.`);
      return NextResponse.json(
        {
          message:
            "Your account is disabled. Please contact your administrator.",
        },
        { status: 403 }
      );
    }

    // Step 3: Check if user is an administrator and member of Pusula_Discovery (parallel)
    const [isMember, isMember2] = await Promise.all([
      checkGroupMembership(ad, username, groupName),
      checkGroupMembership(ad, username, groupName2),
    ]);
    console.log(`${username} is a member of ${groupName}: ${isMember}`);
    console.log(`${username} is a member of ${groupName2}: ${isMember2}`);

    if (!isMember2) {
      console.log(`User ${username} is not a member of ${groupName2}.`);
      return NextResponse.json(
        {
          message: `You must be a member of the ${groupName2} group to log in.`,
        },
        { status: 403 }
      );
    }

    // Step 4: Set cookies and session (without password)
    const session = {
      id: crypto.randomUUID(),
      username,
      isMember,
      isMember2,
      createdAt: new Date().toISOString(),
    };

    const response = NextResponse.json(
      { message: "Authentication successful.", isMember },
      { status: 200 }
    );

    response.cookies.set("session", JSON.stringify(session), {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      secure: false,
    });

    response.cookies.set("isMember", isMember.toString(), {
      httpOnly: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      secure: false,
    });

    return response;
  } catch (error) {
    console.error("Error during authentication:", error);
    return NextResponse.json(
      { message: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
