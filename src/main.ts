import { createWebhookModule } from "sipgateio";
import { readFileSync } from "fs";

import { getStatus, setStatus, clearStatus, Status } from "./slack";

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
let currentStatuses: Record<string, Status> = {}

webhookModule.createServer({ port: webhookServerPort, serverAddress: webhookServerAddress }).then(server => {
    console.log("Listening on port", webhookServerPort)

    server.onAnswer(async answerEvent => {
        const relevantNumber = answerEvent.direction === "out" ? answerEvent.from : answerEvent.to;
        const slackUserInfo: SlackUserInfo | undefined = mappings[relevantNumber];

        if (!slackUserInfo) {
            console.warn(`No slack user mapped for number ${relevantNumber}`);
            return;
        }

        const oldStatus = await getStatus(slackUserInfo.slackMemberId);
        currentStatuses[slackUserInfo.slackMemberId] = oldStatus;

        await setStatus(slackUserInfo.slackMemberId, {
            status_emoji: ":phone:",
            status_text: "Currently in a call",
        });

        console.log("setting status of", relevantNumber);
    });
    server.onHangUp(async hangupEvent => {
        const relevantNumber = hangupEvent.direction === "out" ? hangupEvent.from : hangupEvent.to;
        const slackUserInfo: SlackUserInfo | undefined = mappings[relevantNumber];
        if (!slackUserInfo) return;

        const oldStatus: Status | undefined = currentStatuses[slackUserInfo.slackMemberId];

        if (!oldStatus) {
            // no custom status has been set yet
            // the hang up event occured, because the call was sent to voicemail
            return;
        }

        await setStatus(slackUserInfo.slackMemberId, oldStatus);
        delete currentStatuses[slackUserInfo.slackMemberId];

        console.log("clearing status of", relevantNumber);
    });
})