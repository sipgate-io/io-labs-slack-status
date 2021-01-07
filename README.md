# Slack Status Prototype

This project is a showcase how to change the Slack status of different users
when they are in a call.

## Enabling sipgate.io for your sipgate account
In order to use sipgate.io, you need to book the corresponding package in your sipgate account. The most basic package is the free **sipgate.io S** package.

If you use [sipgate basic](https://app.sipgatebasic.de/feature-store) or [simquadrat](https://app.simquadrat.de/feature-store) you can book packages in your product's feature store.
If you are a _sipgate team_ user logged in with an admin account you can find the option under **Account Administration**&nbsp;>&nbsp;**Plans & Packages**.

## Configure webhooks for sipgate.io 
You can configure webhooks for sipgate.io as follows:

1. Navigate to [console.sipgate.com](https://console.sipgate.com/) and login with your sipgate account credentials.
2. Select the **Webhooks**&nbsp;>&nbsp;**URLs** tab in the left side menu
3. Click the gear icon of the **Incoming** or **Outgoing** entry
4. Fill in your webhook URL and click save. **Note:** your webhook URL has to be accessible from the internet. (See the section [Making your computer accessible from the internet](#making-your-computer-accessible-from-the-internet)) 
5. In the **sources** section you can select what phonelines and groups should trigger webhooks.

In this example we only use one server to handle all call events. Configure your server address and port
in `.env`.

## Slack Setup

For the prototype to work you need a Slack workspace with at least a **Standard Plan**.

### Custom Slack App Integration

In order to change statuses of other users you need to have the right permissions:
There are four roles with the hierarchy

Primary Owner > Workspace Owner > Workspace Admin > Full Member.

You can only change your own status and the statuses of users with lower permissions.
Create the Custom Slack App with a user according to your needs:

Go to `Settings & administration -> Manage apps`. Click on `Build` in the upper right corner (navbar).
Create an App and configure the permissions in `Add features and functionality`. Add the OAuth-Scopes
`users.profile:read`, `users.profile:write` and install the App. Copy the OAuth-Access-Token and write it into the `.env` file under `SLACK_TOKEN`.

### Configure user mappings

Add desired users to `mappings.json` for the status update to work.

## Install dependencies:
Navigate to the project's root directory and run:
```bash
npm install
```

## Execution

```bash
npm start
```
