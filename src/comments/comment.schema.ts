import { CommentDto } from './comment.dto';

export const commentSchemaApi: CommentDto = {
  id: 1,
  message: 'hello world',
  author: null,
  post: null,
  photos: [],
  created_at: new Date(Date.now()),
  updated_at: new Date(Date.now()),
};
