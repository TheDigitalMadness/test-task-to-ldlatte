export type User = {
  id: number;
  username: string;
  login: string;
  fullName: string;
};

export type AuthUser = User & {
  token: string;
};

export type UUID = string;

export type MeetUser = {
  id: UUID;
  meet_id: UUID;
  user_id: number;
};

export type Meet = {
  id: UUID;
  topic: string;
  date: string;
  meet_users: MeetUser[];
  createdBy: number;
  createdAt: string;
};

export type TimeFilterMode = "day" | "week";

export type ApiError = {
  status: number;
  message: string;
  conflicts?: UUID[];
  detail?: {
    message?: string;
    conflicts?: UUID[];
  };
};

export type SignInPayload = {
  login: string;
  password: string;
};

export type SignUpPayload = {
  login: string;
  password: string;
  username: string;
  fullName: string;
};

export type CreateMeetPayload = {
  topic: string;
  participantIds: number[];
  date: string;
};
