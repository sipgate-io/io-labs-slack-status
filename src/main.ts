import { getStatus, setStatus, clearStatus } from "./slack";

async function run(slackMemberId: string) {
    await setStatus(slackMemberId, {
        status_text: "Running some code",
        status_emoji: ":bug:",
    });
}

const SLACK_MEMBER_ID = "...";

run(SLACK_MEMBER_ID).catch(console.error);
