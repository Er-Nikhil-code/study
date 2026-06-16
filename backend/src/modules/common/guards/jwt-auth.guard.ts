import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("Access token missing");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request.user = payload;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    return true;
  }

  private extractToken(request: any): string | undefined {
    // Extract from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [scheme, credentials] = authHeader.split(" ");
      if (scheme === "Bearer") {
        return credentials;
      }
    }

    // Extract from cookies (for frontend)
    if (request.cookies?.accessToken) {
      return request.cookies.accessToken;
    }

    // Extract from query parameter (for secure image/pdf proxy)
    if (request.query?.token) {
      return request.query.token as string;
    }

    return undefined;
  }
}
