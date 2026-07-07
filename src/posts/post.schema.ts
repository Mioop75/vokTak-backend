import { photoSchemaApi } from '../photos/photo.schema';
import { PostDto } from './dto/post.dto';

export const postSchemaApi: PostDto = {
  uuid: 'tsetu325a',
  content: 'Hello world',
  author: null,
  hidden: false,
  likes: [],
  comments: [],
  photos: [photoSchemaApi],
  created_at: new Date(Date.now()),
  updated_at: new Date(Date.now()),
};
