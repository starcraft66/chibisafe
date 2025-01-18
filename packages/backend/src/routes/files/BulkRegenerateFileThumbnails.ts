import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { URL, fileURLToPath } from 'node:url';
import type { FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '@/structures/database.js';
import type { RequestWithUser } from '@/structures/interfaces.js';
import { http4xxErrorSchema } from '@/structures/schemas/HTTP4xxError.js';
import { http5xxErrorSchema } from '@/structures/schemas/HTTP5xxError.js';
import { responseMessageSchema } from '@/structures/schemas/ResponseMessage.js';
import { SETTINGS } from '@/structures/settings.js';
import { deleteTmpFile } from '@/utils/File.js';
import { generateThumbnails, imageExtensions, videoExtensions } from '@/utils/Thumbnails.js';

export const schema = {
	summary: 'Regenerate thumbnails',
	description: 'Regenerates a all supplied files thumbnails',
	tags: ['Files', 'Bulk'],
	body: z.object({
		files: z.array(z.string()).optional().nullable().default([])
	}),
	response: {
		200: z.object({
			message: responseMessageSchema
		}),
		'4xx': http4xxErrorSchema,
		'5xx': http5xxErrorSchema
	}
};

export const options = {
	url: '/files/thumbnail/regenerate',
	method: 'post',
	middlewares: ['apiKey', 'auth']
};

export const run = async (req: RequestWithUser, res: FastifyReply) => {
	const { files } = req.body as z.infer<typeof schema.body>;

	if (!files?.length) {
		void res.badRequest('No file uuids provided');
		return;
	}

	// Make sure the file exists and belongs to the user
	const dbFiles = await prisma.files.findMany({
		where: {
			uuid: {
				in: files
			},
			userId: req.user.id
		},
		select: {
			name: true,
			isS3: true,
			isWatched: true,
			size: true
		}
	});

	if (!files.length) {
		void res.notFound('No file could be found');
		return;
	}

	for (const file of dbFiles) {
		if (file.isS3) {
			const fileURL = `${SETTINGS.S3PublicUrl || SETTINGS.S3Endpoint}/${file.name}`;

			const tmpDir = fileURLToPath(new URL('../../../../../uploads/tmp', import.meta.url));
			const newPath = `${tmpDir}/${file.name}`;

			const extension = path.extname(file.name);
			const needsThumbnails = [...imageExtensions, ...videoExtensions].includes(extension);
			const maxFileSizeForThumbnails = 100 * 1024 * 1024; // 100Mb

			if (needsThumbnails && Number.parseInt(file.size, 10) <= maxFileSizeForThumbnails) {
				try {
					const fetchResponse = await fetch(fileURL);
					if (!fetchResponse.body) return await res.internalServerError('Failed to fetch file');

					// @ts-expect-error wrong types
					await finished(Readable.fromWeb(fetchResponse.body).pipe(fs.createWriteStream(newPath)));
				} catch (error) {
					req.log.error(error);
					void deleteTmpFile(newPath);
					return res.internalServerError('Failed to fetch file');
				}
			}
		}

		void generateThumbnails({ filename: file.name, tmp: file.isS3, watched: file.isWatched, force: true });
	}

	return res.send({
		message: 'Successfully regenerated thumbnails'
	});
};
