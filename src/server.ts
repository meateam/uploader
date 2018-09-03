import * as express from 'express';
import * as http from 'http';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import { config } from './config';
import { AppRouter } from './router';
// <Error Handler>
import { userErrorHandler, serverErrorHandler, unknownErrorHandler } from './utils/errors/errorHandler';
// </Error Handler>
// <Authentication using JWT>
import { Authenticator } from './utils/authenticator';
// </Authentication using JWT>

export class Server {
    public app: express.Application;
    private server: http.Server;

    public static bootstrap(): Server {
        return new Server();
    }

    private constructor() {
        this.app = express();
        this.configureMiddlewares();
        this.app.use(AppRouter);
        // <Error Handler>
        this.initializeErrorHandler();
        // </Error Handler>
        this.server = http.createServer(this.app);
        this.server.listen(config.server.port, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} environment on port ${config.server.port}`);
        });
    }

    private configureMiddlewares() {
        this.app.use(helmet());

        if (process.env.NODE_ENV === 'development') {
            this.app.use(morgan('dev'));
        }

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        // <Authentication using JWT>
        if (config.authentication.required) {
            this.app.use(Authenticator.initialize());
            this.app.use(Authenticator.middleware);
        }
        // </Authentication using JWT>
    }
    // <Error Handler>

    private initializeErrorHandler() {
        this.app.use(userErrorHandler);
        this.app.use(serverErrorHandler);
        this.app.use(unknownErrorHandler);
    }
    // </Error Handler>
}