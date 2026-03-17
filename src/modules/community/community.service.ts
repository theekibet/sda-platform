// src/modules/community/community.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { UpdateCommunityPostDto } from './dto/update-community-post.dto';
import { CommunityResponseDto } from './dto/community-response.dto';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper method for distance calculation (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number | null {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  }

  /**
   * Create a new community post
   */
  async createPost(userId: string, dto: CreateCommunityPostDto) {
    // Prepare the data based on post type
    const postData: any = {
      authorId: userId,
      type: dto.type,
      title: dto.title,
      description: dto.description,
    };

    // Add optional fields if they exist
    if (dto.eventDate) postData.eventDate = new Date(dto.eventDate);
    if (dto.location) postData.location = dto.location;
    if (dto.goalAmount) postData.goalAmount = dto.goalAmount;
    if (dto.currentAmount) postData.currentAmount = dto.currentAmount;
    if (dto.itemsNeeded) postData.itemsNeeded = dto.itemsNeeded;
    if (dto.fromLocation) postData.fromLocation = dto.fromLocation;
    if (dto.toLocation) postData.toLocation = dto.toLocation;
    if (dto.departureTime) postData.departureTime = new Date(dto.departureTime);
    if (dto.seatsAvailable) postData.seatsAvailable = dto.seatsAvailable;
    if (dto.contactPhone) postData.contactPhone = dto.contactPhone;
    if (dto.contactEmail) postData.contactEmail = dto.contactEmail;

    // Create the post
    const post = await this.prisma.communityPost.create({
      data: postData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
            locationPrivacy: true,
            latitude: true, // Added
            longitude: true, // Added
          },
        },
      },
    });

    return post;
  }

  /**
   * Get local posts using coordinates (UPDATED with radius-based search)
   */
  async getLocalPosts(
    userId: string,
    radius: number = 10,
    limit: number = 10
  ) {
    // Get current user's location
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: { 
        latitude: true, 
        longitude: true,
        locationName: true 
      }
    });

    if (!user?.latitude || !user?.longitude) {
      return [];
    }

    // Find users within radius using raw SQL
    const nearbyUsers = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM members
      WHERE 
        id != ${userId}
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND locationPrivacy != 'none'
        AND (
          6371 * acos(
            cos(radians(${user.latitude})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${user.longitude})) + 
            sin(radians(${user.latitude})) * 
            sin(radians(latitude))
          )
        ) < ${radius}
    `;

    const userIds = nearbyUsers.map(u => u.id);

    if (userIds.length === 0) {
      return [];
    }

    // Get posts from these users
    const posts = await this.prisma.communityPost.findMany({
      where: {
        authorId: { in: userIds },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
            locationPrivacy: true,
            latitude: true, // Added
            longitude: true, // Added
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Calculate distance for each post
    const postsWithDistance = posts.map(post => {
      let distance: number | null = null; // Fixed type
      if (post.author?.latitude && post.author?.longitude) {
        distance = this.calculateDistance(
          user.latitude!,
          user.longitude!,
          post.author.latitude,
          post.author.longitude
        );
      }

      return {
        ...post,
        responseCount: post._count?.responses || 0, // Added optional chaining
        distance,
        location: post.author?.locationName || 'Unknown location',
      };
    });

    return postsWithDistance;
  }

  /**
   * Get all community posts with optional filters (including radius-based local filter)
   */
  async getPosts(filters: {
    type?: string;
    page?: number;
    limit?: number;
    search?: string;
    localOnly?: boolean;
    userId?: string;
    radius?: number;
  }) {
    const { 
      type, 
      page = 1, 
      limit = 20, 
      search, 
      localOnly,
      userId,
      radius = 10
    } = filters;
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get current user's location for distance calculations and local filtering
    interface UserLocation {
      latitude: number | null;
      longitude: number | null;
      locationName: string | null;
    }
    
    let currentUser: UserLocation | null = null; // Fixed typing
    if (userId) {
      currentUser = await this.prisma.member.findUnique({
        where: { id: userId },
        select: { 
          latitude: true, 
          longitude: true,
          locationName: true 
        }
      });
    }

    // Filter by location if requested (radius-based)
    if (localOnly && userId && currentUser?.latitude && currentUser?.longitude) {
      // Find users within radius
      const nearbyUsers = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM members
        WHERE 
          id != ${userId}
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND locationPrivacy != 'none'
          AND (
            6371 * acos(
              cos(radians(${currentUser.latitude})) * 
              cos(radians(latitude)) * 
              cos(radians(longitude) - radians(${currentUser.longitude})) + 
              sin(radians(${currentUser.latitude})) * 
              sin(radians(latitude))
            )
          ) < ${radius}
      `;

      const userIds = nearbyUsers.map(u => u.id);
      
      if (userIds.length > 0) {
        where.authorId = { in: userIds };
      } else {
        // If no users nearby, return empty result
        return {
          posts: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              locationName: true,
              locationPrivacy: true,
              latitude: true,
              longitude: true,
            },
          },
          responses: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    // Calculate distance for each post if user has location
    let postsWithDistance = posts;
    if (currentUser?.latitude && currentUser?.longitude) {
      postsWithDistance = posts.map(post => {
        let distance: number | null = null; // Fixed type
        if (post.author?.latitude && post.author?.longitude) {
          distance = this.calculateDistance(
            currentUser.latitude!,
            currentUser.longitude!,
            post.author.latitude,
            post.author.longitude
          );
        }
        return { ...post, distance };
      });
    }

    // Calculate response counts by type
    const postsWithStats = postsWithDistance.map(post => {
      const responses = post.responses || [];
      const interestedCount = responses.filter(r => r.response === 'interested').length;
      const goingCount = responses.filter(r => r.response === 'going').length;
      const helpingCount = responses.filter(r => r.response === 'helping').length;
      const prayingCount = responses.filter(r => r.response === 'praying').length;

      return {
        ...post,
        stats: {
          interested: interestedCount,
          going: goingCount,
          helping: helpingCount,
          praying: prayingCount,
          total: responses.length,
        },
        responses: undefined,
      };
    });

    return {
      posts: postsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single post by ID
   */
  async getPostById(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            locationName: true,
            locationPrivacy: true,
            latitude: true, // Added
            longitude: true, // Added
          },
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Calculate response stats
    const responses = post.responses || [];
    const stats = {
      interested: responses.filter(r => r.response === 'interested').length,
      going: responses.filter(r => r.response === 'going').length,
      helping: responses.filter(r => r.response === 'helping').length,
      praying: responses.filter(r => r.response === 'praying').length,
      total: responses.length,
    };

    return {
      ...post,
      stats,
    };
  }

  /**
   * Update a post (only author or admin)
   */
  async updatePost(
    userId: string, 
    userIsAdmin: boolean, 
    postId: string, 
    dto: UpdateCommunityPostDto
  ) {
    // Check if post exists
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check permission (only author or admin can update)
    if (post.authorId !== userId && !userIsAdmin) {
      throw new ForbiddenException('You can only update your own posts');
    }

    // Prepare update data
    const updateData: any = { ...dto };

    // Handle date fields
    if (dto.eventDate) updateData.eventDate = new Date(dto.eventDate);
    if (dto.departureTime) updateData.departureTime = new Date(dto.departureTime);

    // Update the post
    const updated = await this.prisma.communityPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a post (only author or admin)
   */
  async deletePost(userId: string, userIsAdmin: boolean, postId: string) {
    // Check if post exists
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check permission (only author or admin can delete)
    if (post.authorId !== userId && !userIsAdmin) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    // Delete the post (cascade will delete responses)
    await this.prisma.communityPost.delete({
      where: { id: postId },
    });

    return { success: true, message: 'Post deleted successfully' };
  }

  /**
   * Add a response to a post
   */
  async addResponse(userId: string, postId: string, dto: CommunityResponseDto) {
    // Check if post exists
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already responded
    const existingResponse = await this.prisma.communityResponse.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingResponse) {
      // Update existing response
      const updated = await this.prisma.communityResponse.update({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
        data: {
          response: dto.response,
          comment: dto.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
      return updated;
    } else {
      // Create new response
      const response = await this.prisma.communityResponse.create({
        data: {
          postId,
          userId,
          response: dto.response,
          comment: dto.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
      return response;
    }
  }

  /**
   * Remove a response from a post
   */
  async removeResponse(userId: string, postId: string) {
    // Check if response exists
    const response = await this.prisma.communityResponse.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (!response) {
      throw new NotFoundException('Response not found');
    }

    // Delete the response
    await this.prisma.communityResponse.delete({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    return { success: true, message: 'Response removed' };
  }

  /**
   * Get posts by a specific user
   */
  async getUserPosts(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where: { authorId: userId },
        include: {
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({
        where: { authorId: userId },
      }),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}