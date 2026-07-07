import { photoSchemaApi } from '../photos/photo.schema';
import { UserDto } from './dto/user.dto';

export const userSchemaApi: UserDto = {
  uuid: 'asd214',
  avatar: null,
  email: 'exampleEmail@example.com',
  nickname: 'example123',
  firstname: 'Nick',
  lastname: 'Smith',
  language: 'rus',
  posts: [],
  photos: [photoSchemaApi],
  comments: [],
  likes: [],
  friends: [],
};
