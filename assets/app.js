const video = document.getElementById('video');
const gallery = document.getElementById('gallery');
const identityInput = document.getElementById('identity');
const statusDiv = document.getElementById('status-message');
const hostPanel = document.querySelector('.host-panel');

// buttons
const joinRoomButton = document.getElementById('button-join');
const leaveRoomButton = document.getElementById('button-leave');
const toggleButton = document.getElementById('button-panel-toggle');
const closePanelButton = document.getElementById('button-panel-close');

const ROOM_NAME = 'my-video-chat';
let videoRoom;

const addLocalVideo = async () => {
  const videoTrack = await Twilio.Video.createLocalVideoTrack();
  const localVideoDiv = document.createElement('div');
  localVideoDiv.classList.add('participant', 'localParticipant');

  const trackElement = videoTrack.attach();
  localVideoDiv.appendChild(trackElement);
  gallery.appendChild(localVideoDiv);
  leaveRoomButton.disabled = true;
};

const joinRoom = async (event) => {
  event.preventDefault();
  const identity = identityInput.value;
  // identityInput.disabled = true;
  identityInput.disabled = false;
  joinRoomButton.disabled = true;
  toggleButton.disabled = true;
  leaveRoomButton.disabled = true;

  // Close the host panel if the local participant leaves the call
  if (hostPanel.classList.contains('open')) {
    hostPanel.classList.toggle('open');
  }

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

    const localParticipantDiv = document.getElementsByClassName('localParticipant participant')[0];
    localParticipantDiv.setAttribute('data-sid', videoRoom.localParticipant.sid);

    const identityDiv = document.createElement('div');
    identityDiv.classList.add('identity');
    identityDiv.innerHTML = identity;

    localParticipantDiv.appendChild(identityDiv);
    leaveRoomButton.disabled = false;
    toggleButton.disabled = false;

    videoRoom.participants.forEach(participantConnected);
    videoRoom.on('participantConnected', participantConnected);
    videoRoom.on('participantDisconnected', participantDisconnected);

    // If the localParticipant is the one who has been removed, reset their UI to a non-joined state
    videoRoom.localParticipant.on('disconnected', leaveRoom);

  } catch (error) {
    console.log(error);
  }
}

const leaveRoom = () => {
  if (videoRoom.localParticipant.state === 'connected') {
    videoRoom.disconnect();
  }

  statusDiv.innerText = `You are now disconnected from Room ${videoRoom.name}`;
  setTimeout(() => { statusDiv.innerText = '' }, 5000);

  // List all the participants
  let removeParticipants = gallery.getElementsByClassName('participant');

  // For remote participants, remove their entire div from the UI.
  // For the local participant, just remove their identity label from the UI
  // and return the UI back to how it looked before joining the call.
  for (participant of removeParticipants) {
    if (!participant.classList.contains('localParticipant')) {
      gallery.removeChild(participant);
    } else {
      const localParticipantDiv = document.getElementsByClassName('localParticipant participant')[0];
      const identity = localParticipantDiv.getElementsByClassName('identity');
      if (identity.length) {
        identity[0].remove();
      }
    }
  }

  joinRoomButton.disabled = false;
  leaveRoomButton.disabled = true;
  toggleButton.disabled = true;
  identityInput.disabled = false;
}

const participantConnected = (participant) => {
  console.log(`${participant.identity} has joined the call.`);

  // Add their video and audio to the gallery
  const participantDiv = document.createElement('div');
  participantDiv.setAttribute('data-sid', participant.sid);
  participantDiv.classList.add('participant');

  const tracksDiv = document.createElement('div');
  participantDiv.appendChild(tracksDiv);

  const identityDiv = document.createElement('div');
  identityDiv.classList.add('identity');
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
  const participants = Array.from(document.getElementsByClassName('participant'));
  participants.find(div => div.dataset.sid === participant.sid).remove();
};

// Show the participant a preview of their video
addLocalVideo();

// Event listeners
joinRoomButton.addEventListener('click', joinRoom);
leaveRoomButton.addEventListener('click', leaveRoom);

toggleButton.addEventListener('click', () => {
  hostPanel.classList.toggle('open');
  hostPanel.classList.contains('open') ? openHostPanel() : closeHostPanel()
});

closePanelButton.addEventListener('click', () => {
  hostPanel.classList.toggle('open');
  closeHostPanel();
});

const openHostPanel = async () => {
  // Get the empty participants list
  const participants = document.getElementById('participants');

  videoRoom.participants.forEach(participant => {
    const participantDetails = document.createElement('li');
    participantDetails.classList.add('participantDetails')

    participantDetails.setAttribute('data-sid', participant.sid);
    participantDetails.innerText = participant.identity;

    const participantDeleteButton = document.createElement('button');
    participantDeleteButton.innerText = 'Remove';
    participantDetails.appendChild(participantDeleteButton);
    participantDeleteButton.addEventListener('click', removeParticipant);

    participants.appendChild(participantDetails);
  })

  hostPanel.appendChild(participants);
}

const removeParticipant = async (event) => {
  event.preventDefault();

  try {
    const response = await fetch('/removeParticipant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'roomSid': videoRoom.sid,
        'participantSid': event.target.parentElement.dataset.sid
      })
    });

    const data = await response.json();
    const participantDetails = Array.from(document.getElementsByClassName('participantDetails'));
    participantDetails.find(participant => participant.dataset.sid === data.removedSid).remove();

  } catch (error) {
    console.log(error)
  }
}

const closeHostPanel = () => {
  const participants = document.getElementById('participants');

  if (participants.children) {
    for (child of participants.children) { child.remove() };
  }
}
