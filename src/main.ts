import { createWebhookModule } from 'sipgateio';

import * as MAPPINGS from '../mappings.json';
import { HangUpCause } from 'sipgateio/dist/webhook';
import { SlackUserInfo, getRelevantNumber, getSlackUserInfo } from './utils';
import { Status, getStatus, setStatus } from './slack';

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

export const server = webhookModule
	.createServer({
		port: webhookServerPort,
		serverAddress: webhookServerAddress,
	})
	.then((server) => {
		console.log('Listening on port', webhookServerPort);

		server.onAnswer(handleAnswer);

		server.onHangUp(handleHangUp);
	});

export const handleAnswer = async (answerEvent): Promise<void> => {
	console.log('answerEvent');
	console.log(answerEvent);
	const relevantNumber = getRelevantNumber(answerEvent);
	const slackUserInfo = getSlackUserInfo(relevantNumber, MAPPINGS);

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
		'[answerEvent] setting status of',
		relevantNumber,
		'from',
		previousStatus,
		'to',
		inCallStatus
	);
};

export const handleHangUp = async (hangUpEvent): Preomise<void> => {
	console.log('HangUpEvent');
	if (hangUpEvent.cause === HangUpCause.FORWARDED) {
		return;
	}
	const relevantNumber =
		hangUpEvent.direction === 'out'
			? hangUpEvent.from
			: hangUpEvent.answeringNumber;
	const slackUserInfo: SlackUserInfo | undefined =
		MAPPINGS[relevantNumber] || MAPPINGS[`+${relevantNumber}`];
	if (!slackUserInfo) {
		console.warn(
			`[hangupEvent] No slack user mapped for number ${relevantNumber}`
		);
		return;
	}

	const previousStatus: Status | undefined =
		previousStatuses[slackUserInfo.slackMemberId];

	await setStatus(slackUserInfo.slackMemberId, previousStatus);

	console.log(
		'[hangupEvent] setting status of',
		relevantNumber,
		'back to',
		previousStatus
	);

	delete previousStatuses[slackUserInfo.slackMemberId];
};
