import { fastifyMultipart } from '@fastify/multipart';
import { randomUUID } from 'crypto';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const app = Fastify({ logger: true });

app.register(fastifyMultipart);
app.post('/upload', async function (req: FastifyRequest, reply: FastifyReply) {
  const parts = req.parts();
  let source: string = '';
  let format: string = '';
  const uploadsDir: string = path.join(__dirname, 'upload');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdir(uploadsDir, (err: NodeJS.ErrnoException | null) => {
      console.log(err?.message);
    });
  }

  for await (const part of parts) {
    if (part.type === 'file') {
      const uniqueFilename = `${randomUUID()}${path.extname(part.filename)}`;
      const saveTo = path.join(uploadsDir, uniqueFilename);
      await pipeline(part.file, fs.createWriteStream(saveTo));
      source = uniqueFilename;
    } else {
      if (part.fieldname === 'format') {
        format = part.value as string;
      }
      if (part.fieldname === 'source') {
        source = part.value as string;
      }
    }
  }

  console.log(source, format);

  reply.send();
});

const start = async () => {
  try {
    await app.listen({ port: 3000 });
    app.log.info(`Server listening on http://localhost:3000`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
