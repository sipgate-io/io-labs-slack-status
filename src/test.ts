import { getRelevantNumber, getSlackUserInfo } from "./main";

const IN_EVENT = { 
    event: 'answer',
    callId: '54566B150B0C0D3A5D544C54565D7B5F59555755545E5554795B575345514351474D425A5A57',
    answeringNumber: '15xxxxxx',
    xcid: '020cb15cb04a0d67',
    to: '+12xxxxxx',
    from: '+15xxxxxx',
    direction: 'in',
    originalCallId: '54566B150B0C0D3A5D514C54525E785D535557565B5F53547A5C575745514351474D425A5A56',
    user: 'TestUser1',
    userId: 'w0',
    fullUserId: '000001w0' 
}

const OUT_EVENT = { 
    event: 'answer',
    callId: '54566B150B0C0D3A5D544C54565D7B5F59555755545E5554795B575345514351474D425A5A57',
    answeringNumber: '+12xxxxxx',
    xcid: '020cb15cb04a0d67',
    to: '+15xxxxxx',
    from: '+12xxxxxx',
    direction: 'out',
    originalCallId: '54566B150B0C0D3A5D514C54525E785D535557565B5F53547A5C575745514351474D425A5A56',
    user: 'TestUser2',
    userId: 'w1',
    fullUserId: '000002w1' 
}

const MAPPINGS = {
    "+15xxxxxx": {
        "slackMemberId": "U01JD4ARTCH"
    }
}

test("getRelevantNumber returns the right number when receiving an inbound call", () => {
    const relevantNumber = getRelevantNumber(IN_EVENT);
    expect(relevantNumber).toBe("+12xxxxxx");
});

test("getSlackUserInfo returns the user status when receiving an inbound call") {
    //arrange 
    const relevantNumber = "+12xxxxxx"

    //act
    const slackUserInfo = getSlackUserInfo(relevantNumber);

    //assert
    expect(slackUserInfo).toBe("{slackMemberId: U01JD4ARTCH}");
}
