export type User = {
  id: string;
  user_pic: string | null;
  username: string | null;
  twitch_username: string | null;
  currently_editing: number | null;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Submision = {
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
};

export type WeekApiResponse = {
  week_info: {
    week: string;
    theme: string;
  };
  not_reviewed: Submision[];
  reviewed: Submision[];
  total_num: number;
  reviewed_num: number;
  reviewed_percentage: number;
};

export type SubmissionResponse = {
  submission: Submision;
  images: string[];
  files: string[];
  isAdmin: boolean;
  show_button: boolean;
  show_sub: boolean;
};
