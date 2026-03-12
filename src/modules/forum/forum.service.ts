import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  async createPost(userId: string | null, createPostDto: CreatePostDto) {
    const { title, content, isAnonymous, location } = createPostDto;

    return this.prisma.forumPost.create({
      data: {
        title,
        content,
        authorId: isAnonymous ? null : userId,
        isAnonymous: isAnonymous || false,
        location: location || null,
      },
      include: {
        author: !isAnonymous,
      },
    });
  }

  async getAllPosts() {
    return this.prisma.forumPost.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPostById(postId: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async createReply(userId: string | null, createReplyDto: CreateReplyDto) {
    const { content, postId, isAnonymous } = createReplyDto;

    // Check if post exists
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Create reply
    const reply = await this.prisma.forumReply.create({
      data: {
        content,
        postId,
        authorId: isAnonymous ? null : userId,
        isAnonymous: isAnonymous || false,
      },
      include: {
        author: !isAnonymous,
      },
    });

    // Update reply count on post
    await this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        replyCount: {
          increment: 1,
        },
      },
    });

    return reply;
  }

  async markHelpful(userId: string, replyId: string) {
    // Check if reply exists
    const reply = await this.prisma.forumReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    // Increment helpful votes
    return this.prisma.forumReply.update({
      where: { id: replyId },
      data: {
        helpfulVotes: {
          increment: 1,
        },
      },
    });
  }
}
