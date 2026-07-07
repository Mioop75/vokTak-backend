import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from 'src/shared/decorators/user.decorator';
import { AuthGuard } from 'src/shared/Guards/auth.guard';
import { InjectUserInterceptor } from 'src/shared/interceptors/InjectUser.interceptor';
import { UploadFileInterceptor } from 'src/shared/interceptors/upload-file.interceptor';
import { InputPhotoDto } from './dto/input-photo.dto';
import { PhotoDto } from './dto/photo.dto';
import { photoSchemaApi } from './photo.schema';
import { PhotosService } from './photos.service';

@ApiTags('photos')
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @ApiOkResponse({
    description: 'All photos was gotten',
    schema: { example: photoSchemaApi },
  })
  @ApiUnauthorizedResponse({ description: "User isn't authorized" })
  @UseGuards(AuthGuard)
  @UseInterceptors(InjectUserInterceptor)
  @HttpCode(200)
  @Get()
  async getPhotos(@CurrentUser('uuid') uuid: string) {
    const photos = await this.photosService.getPhotos(uuid);

    return plainToInstance(PhotoDto, photos);
  }

  @ApiOkResponse({
    description: 'The photo was gotten',
    schema: { example: photoSchemaApi },
  })
  @ApiUnauthorizedResponse({ description: "User isn't authorized" })
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Get(':id')
  async getPhoto(@Param('id', ParseIntPipe) id: number) {
    const photo = await this.photosService.getPhoto(id);

    return plainToInstance(PhotoDto, photo);
  }

  @ApiCreatedResponse({
    description: 'Photo was added',
    schema: { example: photoSchemaApi },
  })
  @ApiUnauthorizedResponse({ description: "User isn't authorized" })
  @UseGuards(AuthGuard)
  @UseInterceptors(
    UploadFileInterceptor('image', {
      dest: 'uploads/photos/[YYYY]/[MM]',
    }),
    InjectUserInterceptor,
  )
  @HttpCode(201)
  @Post()
  async addPhoto(
    @Body() dto: Pick<InputPhotoDto, 'name' | 'alt' | 'hidden'>,
    @UploadedFile() img: Express.Multer.File,
    @CurrentUser('uuid') uuid: string,
  ) {
    const addedPhoto = await this.photosService.addPhoto(
      {
        name: img.filename,
        image: img.path,
        hidden: false,
      },
      uuid,
    );

    return plainToInstance(PhotoDto, addedPhoto);
  }

  @ApiResponse({
    status: 204,
    description: 'Photo was deleted',
  })
  @ApiUnauthorizedResponse({ description: "User isn't authorized" })
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Delete(':id')
  async deletePhoto(@Param('id', ParseIntPipe) id: number) {
    const deletedPhoto = await this.photosService.deletePhoto(id);

    return plainToInstance(PhotoDto, deletedPhoto);
  }

  @ApiOkResponse({
    description: 'The photo was hid',
    schema: { example: { ...photoSchemaApi, hidden: true } },
  })
  @ApiUnauthorizedResponse({ description: "User isn't authorized" })
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Patch('hide/:id')
  async hidePhoto(@Param('id', ParseIntPipe) id: number) {
    return await this.photosService.hidePhoto(id);
  }

  @ApiOkResponse({
    description: 'The photo was unhid',
    schema: { example: photoSchemaApi },
  })
  @ApiUnauthorizedResponse({ description: "User isn't authorized" })
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Patch('unhide/:id')
  async unhidePhoto(@Param('id', ParseIntPipe) id: number) {
    return await this.photosService.unhidePhoto(id);
  }
}
