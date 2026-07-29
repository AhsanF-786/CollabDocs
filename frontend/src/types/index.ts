export interface User {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content_html: string;
  owner: User;
  current_user_access: "owner" | "editor";
  created_at: string;
  updated_at: string;
}

export interface DocumentList {
  items: Document[];
}

export interface Share {
  user: User;
  role: "editor";
  created_at: string;
}

