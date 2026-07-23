export type AdminUser = {
  adminId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminSessionResponse = {
  success: boolean;
  authenticated: boolean;
  admin?: AdminUser;
  permissions?: string[];
  expiresAt?: string;
  error?: string;
};

export type AdminLoginResponse = {
  success: boolean;
  admin?: AdminUser;
  permissions?: string[];
  expiresAt?: string;
  error?: string;
};

export async function loginAdmin(input: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<AdminLoginResponse> {
  const response = await fetch(
    "/api/admin/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(input),
    }
  );

  const result =
    (await response.json()) as AdminLoginResponse;

  if (!response.ok) {
    throw new Error(
      result.error ||
        "Unable to sign in."
    );
  }

  return result;
}

export async function getAdminSession(): Promise<AdminSessionResponse> {
  const response = await fetch(
    "/api/admin/auth/session",
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result =
    (await response.json()) as AdminSessionResponse;

  return result;
}

export async function logoutAdmin(): Promise<void> {
  await fetch("/api/admin/auth/logout", {
    method: "POST",
    cache: "no-store",
  });
}