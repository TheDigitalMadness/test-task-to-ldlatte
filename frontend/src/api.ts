import type {
  ApiError,
  AuthUser,
  CreateMeetPayload,
  Meet,
  SignInPayload,
  SignUpPayload,
  User,
} from "./types";

const TOKEN_KEY = "meeting_calendar_jwt";
const USER_KEY = "meeting_calendar_user";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayValue = () => toDateInputValue(new Date());

export const getStoredUser = (): AuthUser | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  if (!token || !userJson) {
    return null;
  }

  try {
    const user = JSON.parse(userJson) as User;
    return { ...user, token };
  } catch {
    clearSession();
    return null;
  }
};

const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const saveSession = (user: AuthUser) => {
  const { token, ...publicUser } = user;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(publicUser));
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object") {
    const data = payload as { message?: string; detail?: { message?: string } | string };
    if (typeof data.message === "string") {
      return data.message;
    }
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (typeof data.detail?.message === "string") {
      return data.detail.message;
    }
  }

  return fallback;
};

const buildError = (response: Response, payload: unknown): ApiError => {
  const detail =
    payload && typeof payload === "object" && "detail" in payload
      ? (payload as { detail?: ApiError["detail"] }).detail
      : undefined;

  return {
    status: response.status,
    message: getErrorMessage(payload, "Ошибка запроса"),
    conflicts:
      detail && typeof detail === "object" && Array.isArray(detail.conflicts)
        ? detail.conflicts
        : payload && typeof payload === "object" && Array.isArray((payload as ApiError).conflicts)
          ? (payload as ApiError).conflicts
          : undefined,
    detail: typeof detail === "object" ? detail : undefined,
  };
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
    }
    throw buildError(response, payload);
  }

  return payload as T;
};

export const api = {
  async signIn(payload: SignInPayload): Promise<AuthUser> {
    const user = await request<AuthUser>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    saveSession(user);
    return user;
  },

  async signUp(payload: SignUpPayload): Promise<AuthUser> {
    const user = await request<AuthUser>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    saveSession(user);
    return user;
  },

  async logout() {
    await request<void>("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearSession();
  },

  async getUsers(): Promise<User[]> {
    try {
      return await request<User[]>("/users/");
    } catch (error) {
      if ((error as ApiError).status === 405) {
        return request<User[]>("/users/", { method: "POST" });
      }
      throw error;
    }
  },

  async getMeets(): Promise<Meet[]> {
    const meets = await request<Meet[]>("/meets/");
    return meets.sort((left, right) => left.date.localeCompare(right.date));
  },

  async createMeet(payload: CreateMeetPayload): Promise<Meet> {
    const response = await request<{ meet: Meet }>("/meets/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return response.meet;
  },
};
