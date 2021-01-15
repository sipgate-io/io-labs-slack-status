/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable camelcase */

import { WebClient } from '@slack/web-api';

const token = process.env.SLACK_TOKEN;
//if (!token) throw new Error("SLACK_TOKEN environment variable not set!");

const web = new WebClient(token);

export interface Status {
	status_text: string;
	status_emoji: string;
}

export async function getStatus(slackMemberId: string): Promise<Status> {
	const response = await web.users.profile.get({ user: slackMemberId });
	if (!response.ok) throw Error(response.error);

	const profile = response.profile as Status;
	return {
		status_text: profile.status_text,
		status_emoji: profile.status_emoji,
	};
}

export async function setStatus(
	slackMemberId: string,
	status: Status
): Promise<void> {
	const response = await web.users.profile.set({
		user: slackMemberId,
		profile: JSON.stringify(status),
	});
	if (!response.ok) throw Error(response.error);
}

export async function clearStatus(slackMemberId: string): Promise<void> {
	await setStatus(slackMemberId, { status_text: '', status_emoji: '' });
}

export async function getScopes(): Promise<Array<string>> {
	const response = await web.auth.test();
	return response.response_metadata.scopes;
}
