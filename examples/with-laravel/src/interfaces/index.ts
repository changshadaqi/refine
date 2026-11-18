export interface ICategory {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export type PostStatus = "published" | "draft" | "rejected";

export interface IPost {
  id: number;
  title: string;
  content: string;
  status: PostStatus;
  category_id: number;
  category?: ICategory;
  created_at: string;
  updated_at: string;
}

export interface IUser {
  id: number;
  name: string;
  email: string;
}
