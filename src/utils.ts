import { AnswerEvent, HangUpEvent } from 'sipgateio';

export interface SlackUserInfo {
	slackMemberId: string;
}

export function getRelevantNumber(
	answerEvent: AnswerEvent | HangUpEvent
): string {
	return answerEvent.direction === 'out'
		? answerEvent.from
		: answerEvent.answeringNumber;
}

export function getSlackUserInfo(
	relevantNumber: string,
	mappings: Record<string, SlackUserInfo>
): SlackUserInfo | undefined {
	return mappings[relevantNumber] || mappings[`+${relevantNumber}`];
}
