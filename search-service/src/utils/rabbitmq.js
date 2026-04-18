import amqp from 'amqplib';
import logger from './logger.js';

let channel = null;
let connection = null;

const EXCHANGE_NAME = 'facebook_events';

async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });
    logger.info('Connected to RabbitMQ successfully');
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', {
      message: error.message,
      stack: error.stack,
    });
  }
}

async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  const q = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg);
    }
  });
  logger.info(`Subscribed to events with routing key: ${routingKey}`);
}

export { connectToRabbitMQ, consumeEvent };
