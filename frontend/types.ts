export type User = {
  id: string;
  user_pic: string | null;
  username: string | null;
  twitch_username: string | null;
  currently_editing: number | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  submissions?: Submission[];
};

export type Submission = {
  description: string | null;
  submitted: boolean;
  reviewed: boolean;
  vod_link: string | null;
  discord_message: string | null;
  react_discord_message: string | null;
  id: number;
  gauntlet_week: number;
  attachments: string[];
  user: string;
  createdAt: Date;
  updatedAt: Date;
  user_profile: User | null;
  images: string[];
  files: string[];
  uploaded_files: File[];
};

export type FrontendSubmission = {
  id: number;
  description: string;
  user_profile: {
    id: string;
    username: string;
    user_pic: string;
  };
  gauntlet_week;
  images: File[];
  files: File[];
  uploaded_files: File[];
};

export type WeekApiResponse = {
  week_info: {
    week: string;
    theme: string;
  };
  not_reviewed: Submission[];
  reviewed: Submission[];
  total_num: number;
  reviewed_num: number;
  reviewed_percentage: number;
};

export type SubmissionResponse = {
  submission: Submission;
  images: string[];
  files: string[];
  isAdmin: boolean;
  show_button: boolean;
  show_sub: boolean;
};

export type File = {
  url: string;
  filename?: string;
  type?: string;
  etag?: string;
  key?: string;
  user_id: string;
  submissionsId?: number;
};
