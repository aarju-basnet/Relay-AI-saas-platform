import "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      workspace: string;
      role: string;
      email: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};