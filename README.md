# video-chat-serverless

A serverless video chat application built with Twilio Programmable Video.

## Setup

- Create [a Twilio account](https://www.twilio.com/referral/D4tqHM).
- Install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart) [Twilio Serverless Toolkit](https://www.twilio.com/docs/labs/serverless-toolkit).
- Generate a new API Key from the [Twilio Console](https://www.twilio.com/console/project/api-keys).
- Clone this repository.
- Create a _.env_ file by copying the _.env.template_ file. Replace the placeholder text with the values for your Twilio Account SID, Auth Token, API Key SID, and API Key Secret.
- Run `npm install` to install dependencies.
- To run the server locally, run `npm start`.
- To deploy on Twilio Functions, run the command `npm run deploy`. Once you deploy, the application will be available at a URL with the format `https://video-chat-serverless-XXXX-dev.twil.io`.