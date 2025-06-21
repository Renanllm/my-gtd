import { Request, Response, Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { LoginInput, loginSchema, RefreshTokenInput, refreshTokenSchema, RegisterInput, registerSchema } from "./schema";
import { AuthUtils } from "./utils";

const prisma = new PrismaClient();

const router = Router();
// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body) as RegisterInput;
    
    // Check if user already exists
    const existingUser = await AuthUtils.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name || null,
      },
    });

    // Generate tokens
    const accessToken = AuthUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = AuthUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Create session
    await AuthUtils.createSession(user.id, refreshToken);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body) as LoginInput;
    
    // Find user
    const user = await AuthUtils.getUserByEmail(validatedData.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(
      validatedData.password,
      user.password
    );
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = AuthUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = AuthUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Create session
    await AuthUtils.createSession(user.id, refreshToken);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Login failed' });
    }
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body) as RefreshTokenInput;
    
    // Verify refresh token
    const payload = AuthUtils.verifyToken(validatedData.refreshToken, true);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Validate session
    const isValidSession = await AuthUtils.validateSession(validatedData.refreshToken);
    if (!isValidSession) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get user
    const user = await AuthUtils.getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new tokens
    const accessToken = AuthUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = AuthUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Update session
    await AuthUtils.deleteSession(validatedData.refreshToken);
    await AuthUtils.createSession(user.id, refreshToken);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }
});

// Logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body) as RefreshTokenInput;
    
    // Delete session
    await AuthUtils.deleteSession(validatedData.refreshToken);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Logout failed' });
    }
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const payload = AuthUtils.verifyToken(token);
    if (payload.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const user = await AuthUtils.getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
});

export default router;