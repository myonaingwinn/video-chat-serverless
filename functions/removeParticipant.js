const twilio = require('twilio');

exports.handler = async function (context, event, callback) {
    if (!event.roomSid || !event.participantSid) {
        const response = new twilio.Response();
        response.setStatusCode(400);
        response.setBody({
            message: 'Missing one of: sid, participantIdentity',
        });
        return callback(null, response);
    }

    const twilioClient = context.getTwilioClient();
    const roomSid = event.roomSid;
    const participantSid = event.participantSid;
    let removedParticipant;

    try {
        removedParticipant = await twilioClient.video.rooms(roomSid).participants(participantSid).update({ status: 'disconnected' });
    } catch (error) {
        const response = new twilio.Response();
        response.setStatusCode(401);
        response.setBody({
            message: 'Unable to remove participant',
            error: error
        });
        return callback(null, response);
    }

    return callback(null, {
        message: `Successfully removed participant ${removedParticipant.sid}`,
        removedSid: removedParticipant.sid
    });
}
