const twilio = require('twilio');

exports.handler = async function(context, event, callback) {
  if (!event.identity || !event.roomName) {
    const response = new twilio.Response();
    response.setStatusCode(400);
    response.setBody({
      message: 'Missing one of: identity, roomName',
    });
    return callback(null, response);
  }

  // Get or create the video room
  const twilioClient = context.getTwilioClient();
  let videoRoom;

  try {
    let videoRoomList = await twilioClient.video.rooms.list({limit: 20});
    videoRoom = videoRoomList.find(room => room.uniqueName = event.roomName);

    if (!videoRoom) {
      videoRoom = await twilioClient.video.rooms.create({
        uniqueName: event.roomName
      });
    }

  } catch (error) {
    const response = new twilio.Response();
    response.setStatusCode(401);
    response.setBody({
      message: 'Cannot get or create video room',
      error: error
    });
    return callback(null, response);
  }

  // Create an access token
  const token = new twilio.jwt.AccessToken(context.ACCOUNT_SID, context.TWILIO_API_KEY_SID, context.TWILIO_API_KEY_SECRET);

  // Create a video grant
  const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
    room: event.room
  });

  // Add the video grant and the user's identity to the token
  token.addGrant(videoGrant);
  token.identity = event.identity;

  return callback(null, {
    videoRoomSid: videoRoom.sid,
    token: token.toJwt(),
  });
}