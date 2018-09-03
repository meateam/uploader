import * as mongoose from 'mongoose';
import { Server } from './server';
import { RabbitMQ } from './utils/rabbitMQ';
import { Logger, SeverityType, MessageType } from './utils/logger';
import { config } from './config';
// <RabbitMQ>
import { FeatureNameService } from './FEATURE_NAME/FEATURE_NAME.broker';
// </RabbitMQ>

process.on('uncaughtException', (err) => {
    console.error('Unhandled Exception', err.stack);
    RabbitMQ.closeConnection();
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection', err);
    RabbitMQ.closeConnection();
    process.exit(1);
});

process.on('SIGINT', async () => {
    try {
        console.log('User Termination');
        await mongoose.disconnect();
        RabbitMQ.closeConnection();
        process.exit(0);
    } catch (error) {
        console.error('Faild to close connections', error);
    }
});

(async () => {
    // <MongoDB>
    await mongoose.connect(
        `mongodb://${config.db.host}:${config.db.port}/${config.db.name}`,
        { useNewUrlParser: true },
    );

    console.log(`[MongoDB] connected to port ${config.db.port}`);
    // </MongoDB>

    const connection = await RabbitMQ.connect();
    await Logger.start();
    Logger.log('Service started', SeverityType.Info, MessageType.Event, `Port ${config.server.port}`);

    // <RabbitMQ>
    await FeatureNameService.startReceiver();
    // </RabbitMQ>

    console.log('Starting server');
    const server: Server = Server.bootstrap();

    server.app.on('close', () => {
        RabbitMQ.closeConnection();
        // <MongoDB>
        mongoose.disconnect();
        // </MongoDB>
        console.log('Server closed');
    });
})();