export interface Comment {
  index: number;
  datetime_created: string;
  author: string;
  body: string;
}

export interface CommentCreate {
  datetime_created: string;
  author: string;
  body: string;
}

export interface CommentUpdate {
  author?: string;
  body?: string;
}
