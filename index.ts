import { fastifyMultipart, MultipartFile, MultipartValue } from '@fastify/multipart';
import { randomUUID } from 'crypto';
import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const app = Fastify({ logger: true });

app.register(fastifyMultipart, { attachFieldsToBody: true });
app.post(
  '/upload',
  async function (
    req: FastifyRequest<{
      Body: { source: MultipartFile | MultipartValue<string>; format: MultipartValue<string> };
    }>,
    reply: FastifyReply,
  ) {
    const source = req.body.source;
    const format = req.body.format;
    let res: { source: string; format: string } = {} as any;

    if (isMultipartFile(source)) {
      const uniqueFilename = `${randomUUID()}${path.extname(source.filename)}`;
      const saveTo = path.join(__dirname, 'upload', uniqueFilename);

      try {
        await pipeline(source.file, fs.createWriteStream(saveTo));
        res.source = uniqueFilename;
        res.format = format.value;
        reply.send(res);
      } catch (err) {
        reply.status(500).send({ error: 'Failed to upload file' });
      }
    } else {
      reply.send({
        source: source.value as string,
        format: format.value,
      });
    }
  },
);

function isMultipartFile(source: MultipartFile | MultipartValue<string>): source is MultipartFile {
  return (source as MultipartFile).filename !== undefined;
}

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
