export interface SlackUserInfo {
	slackMemberId: string;
}

export const getRelevantNumber = (answerEvent): number => {
	return answerEvent.direction === 'out'
		? answerEvent.from
		: answerEvent.answeringNumber;
};

export const getSlackUserInfo = (relevantNumber, mappings): SlackUserInfo => {
	return (
		mappings[relevantNumber] || mappings[`+${relevantNumber}`] || undefined
	);
};
