import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditLoggerMiddleware.name);

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, body, headers } = req;
    const userAgent = headers['user-agent'] || '';
    
    // Get user from request if authenticated
    const user = (req as any).user;
    
    // Store start time
    const startTime = Date.now();

    // Capture original send method
    const originalSend = res.send;
    let responseBody: any;

    // Override send method to capture response
    res.send = function(body): Response {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // Log after response is sent
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Only log important actions (POST, PUT, PATCH, DELETE)
      const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

      if (shouldLog && user) {
        try {
          // Parse response if it's JSON
          let parsedBody = null;
          try {
            parsedBody = responseBody ? JSON.parse(responseBody) : null;
          } catch {
            // Not JSON, ignore
          }

          // Create audit log
          await this.prisma.auditLog.create({
            data: {
              userId: user.id,
              action: this.getActionType(method),
              entity: this.getEntityFromUrl(originalUrl),
              entityId: this.extractEntityId(originalUrl, parsedBody),
              oldValue: null, // Would need previous state for updates
              newValue: method !== 'GET' ? JSON.stringify(parsedBody) : null,
              ipAddress: ip,
              userAgent,
              metadata: JSON.stringify({
                method,
                url: originalUrl,
                statusCode,
                duration,
              }),
            },
          });

          // Also log to console for development
          this.logger.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
        } catch (error) {
          this.logger.error('Failed to create audit log', error);
        }
      }
    });

    next();
  }

  private getActionType(method: string): string {
    switch (method) {
      case 'POST': return 'CREATE';
      case 'PUT': return 'UPDATE';
      case 'PATCH': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      default: return 'READ';
    }
  }

  private getEntityFromUrl(url: string): string {
    // Extract entity from URL (e.g., /admin/users/123 -> users)
    const parts = url.split('/').filter(p => p && !p.match(/^\d+$/));
    return parts[1] || 'unknown';
  }

  private extractEntityId(url: string, body: any): string | null {
    // Try to get ID from URL
    const parts = url.split('/');
    const possibleId = parts[parts.length - 1];
    
    if (possibleId && possibleId.match(/^[0-9a-f-]+$/)) {
      return possibleId;
    }

    // Try to get ID from request body
    if (body && body.id) {
      return body.id;
    }

    return null;
  }
}