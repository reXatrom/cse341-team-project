
import express from 'express';
import Path from 'path';
import { fileURLToPath } from 'url';
import pkg from './package.json' with { type: 'json' };
import session from 'express-session';
import MongoStore from 'connect-mongo';
import swaggerUi from 'swagger-ui-express';
import tripsSwaggerSpec from './src/config/swagger.js';
import schedulesSwaggerSpec from './src/docs/swagger.js';
import globalMiddleware from './src/middleware/global.js';
import routes from './src/routes/router.js';
import { getMongoClientPromise } from './src/db/connect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const app = express();

const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'development';
const isTestEnvironment = NODE_ENV === 'test';
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
    throw new Error('SESSION_SECRET is required.');
}

// Trust the hosting proxy when running in production.
if (NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Combine Trips, Users, and Schedules Swagger documentation.
const swaggerSpec = {
    ...tripsSwaggerSpec,
    info: {
        title: 'Kizuna Rail API',
        version: '1.0.0',
        description: 'API documentation for the Kizuna Rail application.'
    },
    tags: [
        { name: 'Trips', description: 'Operations for managing railway trips' },
        { name: 'Trains', description: 'Train catalogue and pagination' },
        { name: 'Schedules', description: 'Schedule management endpoints' },
        { name: 'Users', description: 'User management and pagination' }
    ],
    paths: {
        ...tripsSwaggerSpec.paths,
        ...schedulesSwaggerSpec.paths
    },
    components: {
        ...tripsSwaggerSpec.components,
        ...schedulesSwaggerSpec.components,
        schemas: {
            ...tripsSwaggerSpec.components?.schemas,
            ...schedulesSwaggerSpec.components?.schemas
        }
    }
};

// Use memory sessions for tests and MongoDB sessions otherwise.
const sessionStore = isTestEnvironment
    ? new session.MemoryStore()
    : MongoStore.create({
        clientPromise: getMongoClientPromise(),
        dbName: process.env.MONGODB_DB_NAME || 'practice',
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60
    });

// Add version information to EJS templates.
app.use((req, res, next) => {
    res.locals.appVersion = pkg.version;
    next();
});

// Configure static files and EJS templates.
app.use(express.static(Path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', Path.join(__dirname, 'src/views'));

// Parse JSON and URL-encoded request bodies.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure user sessions.
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: NODE_ENV === 'production',
        maxAge: 14 * 24 * 60 * 60 * 1000
    }
}));

// Run global middleware after session middleware.
app.use(globalMiddleware);

// Serve combined Swagger UI documentation once.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', routes);

// Catch requests that did not match a route.
app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
});

// Render the appropriate error page.
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    return res.status(status).render(`errors/${template}`, context);
});

export default app;
