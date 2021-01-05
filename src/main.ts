import { createWebhookModule } from "sipgateio";
import { readFileSync } from "fs";

import { getStatus, setStatus, clearStatus } from "./slack";

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

async function run(slackMemberId: string) {
    await setStatus(slackMemberId, {
        status_text: "Running some code",
        status_emoji: ":bug:",
    });
}

webhookModule.createServer({ port: webhookServerPort, serverAddress: webhookServerAddress }).then(server => {
    console.log("Listening on port", webhookServerPort)

    server.onAnswer(answerEvent => {
        const relevantNumber = answerEvent.direction === "out" ? answerEvent.from : answerEvent.to;
        const slackUserInfo: SlackUserInfo | undefined = mappings[relevantNumber];

        if (!slackUserInfo) {
            console.warn(`No slack user mapped for number ${relevantNumber}`);
            return;
        }

        // TODO remember old status

        setStatus(slackUserInfo.slackMemberId, {
            status_emoji: ":phone:",
            status_text: "Currently in a call",
        }).catch(console.error);
    });
    server.onHangUp(hangupEvent => {
        const relevantNumber = hangupEvent.direction === "out" ? hangupEvent.from : hangupEvent.to;
        const slackUserInfo: SlackUserInfo | undefined = mappings[relevantNumber];
        if (!slackUserInfo) return;

        // TODO restore status
        clearStatus(slackUserInfo.slackMemberId).catch(console.error);
    });
})