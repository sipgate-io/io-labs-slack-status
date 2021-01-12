import {createWebhookModule, AnswerEvent} from "sipgateio";
import {readFileSync} from "fs";

import {getStatus, setStatus, Status} from "./slack";
import {HangUpCause} from "sipgateio/dist/webhook";

const webhookModule = createWebhookModule();

const webhookServerPort = process.env.SIPGATE_WEBHOOK_SERVER_PORT || 8080;
const webhookServerAddress = process.env.SIPGATE_WEBHOOK_SERVER_ADDRESS;
if (!webhookServerAddress) {
    throw new Error("SIPGATE_WEBHOOK_SERVER_ADDRESS environment variable not set");
}

interface SlackUserInfo {
    slackMemberId: string;
}

const mappings: Record<string, SlackUserInfo | undefined> = JSON.parse(readFileSync("mappings.json", "utf8"));

// map from slackUserId to status before AnswerEvent
let previousStatuses: Record<string, Status> = {}

export let server = webhookModule.createServer({port: webhookServerPort, serverAddress: webhookServerAddress}).then(server => {
    console.log("Listening on port", webhookServerPort)

    server.onAnswer(handleAnswer);
    
    server.onHangUp(handleHangUp);
})

export const handleAnswer = async (answerEvent) => {
    console.log("answerEvent");
    console.log(answerEvent);
    const relevantNumber = getRelevantNumber(answerEvent);
    const slackUserInfo = getSlackUserInfo(relevantNumber);

    if (!slackUserInfo) {
        console.warn(`[answerEvent] No slack user mapped for number ${relevantNumber}`);
        return;
    }

    if (previousStatuses[slackUserInfo.slackMemberId]) {
        console.warn(`[answerEvent] Status of ${relevantNumber} was already set.`);
        return;
    }

    const previousStatus = await getStatus(slackUserInfo.slackMemberId);
    previousStatuses[slackUserInfo.slackMemberId] = previousStatus;

    const inCallStatus = {
        status_emoji: ":phone:",
        status_text: "Currently in a call",
    };
    await setStatus(slackUserInfo.slackMemberId, inCallStatus);

    console.log("[answerEvent] setting status of", relevantNumber, "from", previousStatus, "to", inCallStatus);
}


export const handleHangUp = async (hangUpEvent) => {
    console.log("HangUpEvent")
    if (hangUpEvent.cause === HangUpCause.FORWARDED) {
        return;
    }
    const relevantNumber = hangUpEvent.direction === "out" ? hangUpEvent.from : hangUpEvent.answeringNumber;
    const slackUserInfo: SlackUserInfo | undefined = mappings[relevantNumber] || mappings[`+${relevantNumber}`];
    if (!slackUserInfo) {
        console.warn(`[hangupEvent] No slack user mapped for number ${relevantNumber}`);
        return;
    }

    const previousStatus: Status | undefined = previousStatuses[slackUserInfo.slackMemberId];

    await setStatus(slackUserInfo.slackMemberId, previousStatus);

    console.log("[hangupEvent] setting status of", relevantNumber, "back to", previousStatus);

    delete previousStatuses[slackUserInfo.slackMemberId];
}

export const getRelevantNumber = (answerEvent) : number => {
    return answerEvent.direction === "out" ? answerEvent.from : answerEvent.answeringNumber;
}

export const getSlackUserInfo = (relevantNumber) : SlackUserInfo => {
    return (mappings[relevantNumber] || mappings[`+${relevantNumber}`]) || undefined;
}