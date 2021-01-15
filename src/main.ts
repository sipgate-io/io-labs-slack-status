/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable camelcase */

import {
	AnswerEvent,
	HangUpCause,
	HangUpEvent,
	createWebhookModule,
} from 'sipgateio';

import { SlackUserInfo, getRelevantNumber } from './utils';
import { Status, getStatus, setStatus } from './slack';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MAPPINGS: Record<string, SlackUserInfo> = require('../mappings.json');

const webhookModule = createWebhookModule();

const webhookServerPort = process.env.SIPGATE_WEBHOOK_SERVER_PORT || 8080;
const webhookServerAddress = process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS;

if (!webhookServerAddress) {
	throw new Error(
		'SIPGATE_WEBHOOK_SERVER_ADDRESS environment variable not set'
	);
}

// map from slackUserId to status before AnswerEvent
const previousStatuses: Record<string, Status> = {};

webhookModule
	.createServer({
		port: webhookServerPort,
		serverAddress: webhookServerAddress,
	})
	.then((server) => {
		console.log('Listening on port', webhookServerPort);

		server.onAnswer(handleAnswer);

		server.onHangUp(handleHangUp);
	});

async function handleAnswer(answerEvent: AnswerEvent): Promise<void> {
	if (answerEvent.user === 'voicemail') return;

	const relevantNumber = getRelevantNumber(answerEvent);
	const slackUserInfo: SlackUserInfo | undefined = MAPPINGS[relevantNumber];

	if (!slackUserInfo) {
		console.warn(
			`[answerEvent] No slack user mapped for number ${relevantNumber}`
		);
		return;
	}

	if (previousStatuses[slackUserInfo.slackMemberId]) {
		console.warn(`[answerEvent] Status of ${relevantNumber} was already set.`);
		return;
	}

	const previousStatus = await getStatus(slackUserInfo.slackMemberId);
	previousStatuses[slackUserInfo.slackMemberId] = previousStatus;

	const inCallStatus = {
		status_emoji: ':phone:',
		status_text: 'Currently in a call',
	};
	await setStatus(slackUserInfo.slackMemberId, inCallStatus);

	console.log(
		`[answerEvent] setting status of ${relevantNumber} to ${inCallStatus}`
	);
}

async function handleHangUp(hangUpEvent: HangUpEvent): Promise<void> {
	if (hangUpEvent.cause === HangUpCause.FORWARDED) return;

	const relevantNumber = getRelevantNumber(hangUpEvent);
	const slackUserInfo: SlackUserInfo | undefined = MAPPINGS[relevantNumber];

	if (!slackUserInfo) {
		console.warn(
			`[hangupEvent] No slack user mapped for number ${relevantNumber}`
		);
		return;
	}

	const previousStatus: Status | undefined =
		previousStatuses[slackUserInfo.slackMemberId];

	if (!previousStatus) return;

	console.log(
		`[hangupEvent] setting status of ${relevantNumber} back to ${previousStatus}`
	);

	await setStatus(slackUserInfo.slackMemberId, previousStatus);
	delete previousStatuses[slackUserInfo.slackMemberId];
}
