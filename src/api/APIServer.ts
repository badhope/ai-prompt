import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PromptFramework } from '../index';
import { HealthChecker } from '../health';
import { RateLimiter } from '../security';

export interface APIServerConfig {
  port: number;
  enableCors: boolean;
  enableRateLimit: boolean;
  rateLimitConfig?: {
    windowMs: number;
    maxRequests: number;
  };
  framework: PromptFramework;
}

export class APIServer {
  private app: express.Application;
  private config: APIServerConfig;
  private framework: PromptFramework;
  private rateLimiter?: RateLimiter;
  private healthChecker: HealthChecker;

  constructor(config: APIServerConfig) {
    this.config = config;
    this.framework = config.framework;
    this.app = express();
    this.healthChecker = new HealthChecker();

    if (config.enableRateLimit) {
      this.rateLimiter = new RateLimiter(config.rateLimitConfig || {
        windowMs: 60000,
        maxRequests: 100,
      });
    }

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(compression());
    
    if (this.config.enableCors) {
      this.app.use(cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      }));
    }

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    if (this.rateLimiter) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        const identifier = req.ip || 'unknown';
        const result = this.rateLimiter!.check(identifier);

        res.setHeader('X-RateLimit-Limit', result.limit.toString());
        res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
        res.setHeader('X-RateLimit-Reset', result.resetTime.toString());

        if (!result.allowed) {
          res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            retryAfter: result.retryAfter,
          });
          return;
        }

        this.rateLimiter!.record(identifier);
        next();
      });
    }

    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });
      
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'AI Prompt Engineering Framework API',
        version: '2.0.0',
        documentation: '/docs',
        health: '/health',
        endpoints: {
          prompts: '/api/prompts',
          templates: '/api/templates',
          complete: '/api/complete',
          stream: '/api/stream',
          agents: '/api/agents',
        },
      });
    });

    this.app.get('/health', this.healthChecker.healthEndpoint());
    this.app.get('/ready', this.healthChecker.readinessEndpoint());
    this.app.get('/live', this.healthChecker.livenessEndpoint());

    this.app.get('/api/prompts', async (req: Request, res: Response) => {
      try {
        const prompts = await this.framework.prompts.list();
        res.json({
          success: true,
          data: prompts,
          count: prompts.length,
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    this.app.get('/api/prompts/:id', async (req: Request, res: Response) => {
      try {
        const prompt = await this.framework.prompts.get(req.params.id);
        if (!prompt) {
          return res.status(404).json({
            success: false,
            error: 'Prompt not found',
          });
        }
        res.json({
          success: true,
          data: prompt,
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    this.app.post('/api/prompts', async (req: Request, res: Response) => {
      try {
        const prompt = await this.framework.prompts.create(req.body);
        res.status(201).json({
          success: true,
          data: prompt,
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    });

    this.app.put('/api/prompts/:id', async (req: Request, res: Response) => {
      try {
        const prompt = await this.framework.prompts.update(req.params.id, req.body);
        res.json({
          success: true,
          data: prompt,
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    });

    this.app.delete('/api/prompts/:id', async (req: Request, res: Response) => {
      try {
        await this.framework.prompts.delete(req.params.id);
        res.json({
          success: true,
          message: 'Prompt deleted successfully',
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    this.app.post('/api/complete', async (req: Request, res: Response) => {
      try {
        const { prompt, variables, provider, model, options } = req.body;

        const processedInput = await this.framework.processWithSecurity(prompt);
        if (!processedInput.validation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Security validation failed',
            details: processedInput.validation.errors,
          });
        }

        const providerInstance = this.framework.providers.get(provider || 'claude');
        if (!providerInstance) {
          return res.status(400).json({
            success: false,
            error: `Provider ${provider} not found`,
          });
        }

        const response = await providerInstance.complete({
          variables: { prompt: processedInput.output, ...variables },
          model_config: {
            provider,
            model,
            ...options,
          },
        });

        if (this.framework.costs) {
          this.framework.costs.recordCost({
            id: Date.now().toString(),
            timestamp: new Date(),
            provider,
            model: response.model,
            inputTokens: response.tokens.input,
            outputTokens: response.tokens.output,
            cost: providerInstance.estimateCost(response.tokens, response.model),
          });
        }

        res.json({
          success: true,
          data: response,
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    this.app.post('/api/stream', async (req: Request, res: Response) => {
      try {
        const { prompt, variables, provider, model, options } = req.body;

        const processedInput = await this.framework.processWithSecurity(prompt);
        if (!processedInput.validation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Security validation failed',
          });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const providerInstance = this.framework.providers.get(provider || 'claude');
        if (!providerInstance) {
          return res.status(400).json({
            success: false,
            error: `Provider ${provider} not found`,
          });
        }

        const stream = providerInstance.stream({
          variables: { prompt: processedInput.output, ...variables },
          model_config: {
            provider,
            model,
            ...options,
          },
        });

        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    this.app.post('/api/agents/react', async (req: Request, res: Response) => {
      try {
        const { question, tools, provider } = req.body;

        const { ReActEngine } = await import('../agent');
        const providerInstance = this.framework.providers.get(provider || 'claude');

        if (!providerInstance) {
          return res.status(400).json({
            success: false,
            error: `Provider ${provider} not found`,
          });
        }

        const react = new ReActEngine(providerInstance, { tools });
        const result = await react.execute(question);

        res.json({
          success: true,
          data: result,
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    this.app.post('/api/agents/tot', async (req: Request, res: Response) => {
      try {
        const { problem, config, provider } = req.body;

        const { TreeOfThoughtsEngine } = await import('../agent');
        const providerInstance = this.framework.providers.get(provider || 'claude');

        if (!providerInstance) {
          return res.status(400).json({
            success: false,
            error: `Provider ${provider} not found`,
          });
        }

        const tot = new TreeOfThoughtsEngine(providerInstance, config);
        const result = await tot.solve(problem);

        res.json({
          success: true,
          data: result,
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    this.app.get('/api/stats', (req: Request, res: Response) => {
      const stats = {
        cache: this.framework.cacheLayer?.getStats(),
        costs: this.framework.costs?.getStats(),
        metrics: this.framework.getMetrics(),
      };

      res.json({
        success: true,
        data: stats,
      });
    });

    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
      });
    });

    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Not found',
        path: req.path,
      });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`API Server running on port ${this.config.port}`);
        console.log(`Health check: http://localhost:${this.config.port}/health`);
        console.log(`API docs: http://localhost:${this.config.port}/docs`);
        resolve();
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }
}
