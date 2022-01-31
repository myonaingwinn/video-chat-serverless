const video = document.getElementById('video');
const gallery = document.getElementById('gallery');
const identityInput = document.getElementById('identity');

// buttons
const joinRoomButton = document.getElementById('button-join');
const leaveRoomButton = document.getElementById('button-leave');

const ROOM_NAME = 'my-video-chat';
let videoRoom;

const addLocalVideo = async () =>  {
  const videoTrack = await Twilio.Video.createLocalVideoTrack();
  const localVideoDiv = document.createElement('div');
  localVideoDiv.setAttribute('id', 'localParticipant');
  localVideoDiv.setAttribute('class', 'participant');

  const trackElement = videoTrack.attach();
  localVideoDiv.appendChild(trackElement);
  gallery.appendChild(localVideoDiv);
  leaveRoomButton.disabled = true;
};

const joinRoom = async (event) => {
  event.preventDefault();
  const identity = identityInput.value;
  identityInput.disabled = true;
  joinRoomButton.disabled = true;

  try {
    const response = await fetch('/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'identity': identity,
        'roomName': ROOM_NAME
      })
    });

    const data = await response.json();

    // Creates the audio and video tracks
    const localTracks = await Twilio.Video.createLocalTracks();

    videoRoom = await Twilio.Video.connect(data.token, {
      name: ROOM_NAME,
      tracks: localTracks
    });

    console.log(`You are now connected to Room ${videoRoom.name}`);

    const localParticipant = document.getElementById('localParticipant');
    const identityDiv = document.createElement('div');
    identityDiv.setAttribute('class', 'identity');
    identityDiv.innerHTML = identity;
    localParticipant.appendChild(identityDiv);
    leaveRoomButton.disabled = false;

    videoRoom.participants.forEach(participantConnected);
    videoRoom.on('participantConnected', participantConnected);
    videoRoom.on('participantDisconnected', participantDisconnected);

  } catch (error) {
    console.log(error);
  }
}

const leaveRoom = (event) => {
  event.preventDefault();
  videoRoom.disconnect();
  console.log(`You are now disconnected from Room ${videoRoom.name}`);

  let removeParticipants = gallery.getElementsByClassName('participant');

  for (participant of removeParticipants) {
    if (participant.id !== 'localParticipant') {
      gallery.removeChild(participant);
    }
  }

  localParticipant.removeChild(localParticipant.lastElementChild);
  joinRoomButton.disabled = false;
  leaveRoomButton.disabled = true;
  identityInput.disabled = false;
}

const participantConnected = (participant) => {
  console.log(`${participant.identity} has joined the call.`);

  // Add their video and audio to the gallery
  const participantDiv = document.createElement('div');
  participantDiv.setAttribute('id', participant.sid);
  participantDiv.setAttribute('class', 'participant');

  const tracksDiv = document.createElement('div');
  participantDiv.appendChild(tracksDiv);

  const identityDiv = document.createElement('div');
  identityDiv.setAttribute('class', 'identity');
  identityDiv.innerHTML = participant.identity;
  participantDiv.appendChild(identityDiv);

  gallery.appendChild(participantDiv);

  participant.tracks.forEach(publication => {
    if (publication.isSubscribed) {
      tracksDiv.appendChild(publication.track.attach());
    }
  });

  participant.on('trackSubscribed', track => {
    tracksDiv.appendChild(track.attach());
  });

  participant.on('trackUnsubscribed', track => {
    track.detach().forEach(element => element.remove());
  });
};

const participantDisconnected = (participant) => {
  console.log(`${participant.identity} has left the call.`);
  document.getElementById(participant.sid).remove();
};

// Show the participant a preview of their video
addLocalVideo();

// Event listeners
joinRoomButton.addEventListener('click', joinRoom);
leaveRoomButton.addEventListener('click', leaveRoom);