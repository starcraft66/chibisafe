import type { FastifyReply } from 'fastify';
import prisma from '@/structures/database.js';
import type { RequestWithUser } from '@/structures/interfaces.js';
import { http4xxErrorSchema } from '@/structures/schemas/HTTP4xxError.js';
import { http5xxErrorSchema } from '@/structures/schemas/HTTP5xxError.js';
import { SETTINGS } from '@/structures/settings.js';

export const schema = {
	summary: 'Get link',
	description: 'Get a link and redirect the response',
	tags: ['Links'],
	response: {
		'4xx': http4xxErrorSchema,
		'5xx': http5xxErrorSchema
	}
};

export const options = {
	url: '/link/:identifier',
	method: 'get'
};

export const run = async (req: RequestWithUser, res: FastifyReply) => {
	if (!SETTINGS.useUrlShortener) {
		void res.notImplemented('URL shortener is disabled');
		return;
	}

	const { identifier } = req.params as { identifier: string };

	const link = await prisma.shortenedLinks.findFirst({
		where: {
			identifier
		},
		select: {
			destination: true
		}
	});

	if (!link) {
		void res.notFound('The link could not be found');
		return;
	}

	if (!link.destination.startsWith('http')) {
		link.destination = `http://${link.destination}`;
	}

	return res.redirect(link.destination);
};
