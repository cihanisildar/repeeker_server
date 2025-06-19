import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
      };
      file?: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
} 