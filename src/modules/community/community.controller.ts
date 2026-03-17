// src/modules/community/community.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { UpdateCommunityPostDto } from './dto/update-community-post.dto';
import { CommunityResponseDto } from './dto/community-response.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  /**
   * Create a new post (requires login)
   */
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createPost(
    @CurrentUser() user: any,
    @Body() dto: CreateCommunityPostDto,
  ) {
    const post = await this.communityService.createPost(user.id, dto);
    return {
      success: true,
      message: 'Post created successfully',
      data: post,
    };
  }

  /**
   * Get local posts (UPDATED with radius-based search)
   */
  @Get('posts/local')
  @UseGuards(JwtAuthGuard)
  async getLocalPosts(
    @CurrentUser() user: any,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radius?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const posts = await this.communityService.getLocalPosts(
      user.id,
      radius,
      limit,
    );
    
    return {
      success: true,
      data: {
        posts,
      },
    };
  }

  /**
   * Get all posts with optional filters (UPDATED with radius-based local filter)
   */
  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  async getPosts(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('search') search?: string,
    @Query('local') local?: string,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radius?: number,
  ) {
    const result = await this.communityService.getPosts({
      type,
      page,
      limit,
      search,
      localOnly: local === 'true',
      userId: user?.id,
      radius,
    });
    
    return {
      success: true,
      data: result.posts,
      pagination: result.pagination,
    };
  }

  /**
   * Get a single post by ID (public)
   */
  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getPostById(@Param('id') id: string) {
    const post = await this.communityService.getPostById(id);
    return {
      success: true,
      data: post,
    };
  }

  /**
   * Update a post (requires login, only author or admin)
   */
  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateCommunityPostDto,
  ) {
    const post = await this.communityService.updatePost(
      user.id,
      user.isAdmin || false,
      id,
      dto,
    );
    return {
      success: true,
      message: 'Post updated successfully',
      data: post,
    };
  }

  /**
   * Delete a post (requires login, only author or admin)
   */
  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const result = await this.communityService.deletePost(
      user.id,
      user.isAdmin || false,
      id,
    );
    return result;
  }

  /**
   * Add/update response to a post (requires login)
   */
  @Post('posts/:id/responses')
  @UseGuards(JwtAuthGuard)
  async addResponse(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CommunityResponseDto,
  ) {
    const response = await this.communityService.addResponse(user.id, id, dto);
    return {
      success: true,
      message: 'Response added successfully',
      data: response,
    };
  }

  /**
   * Remove response from a post (requires login)
   */
  @Delete('posts/:id/responses')
  @UseGuards(JwtAuthGuard)
  async removeResponse(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const result = await this.communityService.removeResponse(user.id, id);
    return result;
  }

  /**
   * Get posts by a specific user (public)
   */
  @Get('users/:userId/posts')
  async getUserPosts(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const result = await this.communityService.getUserPosts(userId, page, limit);
    return {
      success: true,
      data: result.posts,
      pagination: result.pagination,
    };
  }
}