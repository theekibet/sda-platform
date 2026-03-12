import { 
    Controller, Get, Post, Body, Param, UseGuards, 
    Patch, Query 
  } from '@nestjs/common';
  import { ForumService } from './forum.service';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  import { CreatePostDto } from './dto/create-post.dto';
  import { CreateReplyDto } from './dto/create-reply.dto';
  
  @Controller('forum')
  @UseGuards(JwtAuthGuard)
  export class ForumController {
    constructor(private readonly forumService: ForumService) {}
  
    @Post('posts')
    createPost(
      @CurrentUser() user: any,
      @Body() createPostDto: CreatePostDto,
    ) {
      return this.forumService.createPost(user?.id, createPostDto);
    }
  
    @Get('posts')
    getAllPosts() {
      return this.forumService.getAllPosts();
    }
  
    @Get('posts/:postId')
    getPostById(@Param('postId') postId: string) {
      return this.forumService.getPostById(postId);
    }
  
    @Post('replies')
    createReply(
      @CurrentUser() user: any,
      @Body() createReplyDto: CreateReplyDto,
    ) {
      return this.forumService.createReply(user?.id, createReplyDto);
    }
  
    @Patch('replies/:replyId/helpful')
    markHelpful(
      @CurrentUser() user: any,
      @Param('replyId') replyId: string,
    ) {
      return this.forumService.markHelpful(user.id, replyId);
    }
  }
  