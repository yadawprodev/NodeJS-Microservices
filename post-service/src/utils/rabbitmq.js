import amqp from 'amqplib';
import logger from './logger.js';

let channel = null;
let connection = null;

const EXCHANGE_NAME = 'facebook_events';

async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false }); // exchange disappears on restart
    logger.info('Connected to RabbitMQ successfully');

    return channel;
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message)),
  );
  logger.info(`Published message to RabbitMQ with routing key: ${routingKey}`);
}

export { connectToRabbitMQ, publishEvent };
