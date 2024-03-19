var localConnection: RTCPeerConnection | null = null; // RTCPeerConnection for our "local" connection
var remoteConnection: RTCPeerConnection | null = null; // RTCPeerConnection for the "remote"

var sendChannel: RTCDataChannel | null = null; // RTCDataChannel for the local (sender)
var receiveChannel: any = null; // RTCDataChannel for the remote (receiver)

var localCandidate:any = null;
var remoteCandidate:any = null;

export async function connectPeers() {
  // Create the local connection and its event listeners

  localConnection = new RTCPeerConnection();

  // Create the data channel and establish its event listeners
  sendChannel = localConnection.createDataChannel('sendChannel');
  sendChannel.onopen = handleSendChannelStatusChange;
  sendChannel.onclose = handleSendChannelStatusChange;

  // Create the remote connection and its event listeners

  remoteConnection = new RTCPeerConnection();
  remoteConnection.ondatachannel = receiveChannelCallback;

  // Set up the ICE candidates for the two peers

  localConnection.onicecandidate = async (e) => {
    console.warn('local onicecandidate');
    if (e.candidate) {
      console.warn('local onicecandidate!!!');
      localCandidate = JSON.stringify(e.candidate);
      // 此步骤要保证在第三步骤执行完毕
        // await new Promise((resolve) => setTimeout(resolve, 2200));
        // await remoteConnection!.addIceCandidate(e.candidate);
        // console.error('remote addIceCandidate success');
    }

    // !e.candidate ||
    //   remoteConnection!
    //     .addIceCandidate(e.candidate)
    //     .then(() => console.error('remote addIceCandidate success'))
    //     .catch(handleAddCandidateError);
  };

  remoteConnection.onicecandidate = async (e) => {
    console.warn('remote onicecandidate');
    if (e.candidate) {
      remoteCandidate = JSON.stringify(e.candidate);
      // 此步骤要保证在第六步骤执行完毕
      console.warn('remote onicecandidate!!!');
      // await new Promise((resolve) => setTimeout(resolve, 3200));
      // await localConnection!.addIceCandidate(e.candidate);
      // console.error('local addIceCandidate success');
    }

    // !e.candidate ||
    //   localConnection!
    //     .addIceCandidate(e.candidate)
    //     .then(() => console.error('local addIceCandidate success'))
    //     .catch(handleAddCandidateError);
  };

  // Now create an offer to connect; this starts the process

  /* 本地创建offer */
  const offer = await localConnection.createOffer();
  console.log(1, 'local createOffer');
  await new Promise((resolve) => setTimeout(resolve, 200));

  /* 本地设置本地Description */
  console.group(2, 'setLocalDescription');
  await localConnection!.setLocalDescription(offer);
  const local_sdp = JSON.stringify(localConnection!.localDescription);
  await new Promise((resolve) => setTimeout(resolve, 200));
  console.groupEnd();

  await remoteConnection!.setRemoteDescription(
    JSON.parse(local_sdp)
  );
  console.log(3, 'remote setRemoteDescription');
  await new Promise((resolve) => setTimeout(resolve, 200));

  const answer = await remoteConnection!.createAnswer();
  console.log(4, 'remote createAnswer');
  await new Promise((resolve) => setTimeout(resolve, 200));

  await remoteConnection!.setLocalDescription(answer);
  console.log(5, 'remote setLocalDescription');
  const remote_sdp = JSON.stringify(remoteConnection!.localDescription);
  await new Promise((resolve) => setTimeout(resolve, 200));

  await localConnection!.setRemoteDescription(
    JSON.parse(remote_sdp)
  );
  console.log(6, 'local setRemoteDescription');
  await new Promise((resolve) => setTimeout(resolve, 200));

  localConnection?.addIceCandidate(JSON.parse(remoteCandidate));
  remoteConnection?.addIceCandidate(JSON.parse(localCandidate));

  //.catch(handleCreateDescriptionError);
}

// Handle errors attempting to create a description;
// this can happen both when creating an offer and when
// creating an answer. In this simple example, we handle
// both the same way.

function handleCreateDescriptionError(error: Error) {
  console.log('Unable to create an offer: ' + error.toString());
}

function handleAddCandidateError() {
  console.log('Oh noes! addICECandidate failed!');
}

// Handles clicks on the "Send" button by transmitting
// a message to the remote peer.

export function sendMessage() {
  sendChannel?.send('你好啊');
}

// Handle status changes on the local end of the data
// channel; this is the end doing the sending of data
// in this example.

function handleSendChannelStatusChange(event: any) {
  if (sendChannel) {
    var state = sendChannel.readyState;
    console.log("Send channel's state has changed to " + state);
  }
}

// Called when the connection opens and the data
// channel is ready to be connected to the remote.

function receiveChannelCallback(event: any) {
  receiveChannel = event.channel;
  receiveChannel!.onmessage = handleReceiveMessage;
  receiveChannel!.onopen = handleReceiveChannelStatusChange;
  receiveChannel!.onclose = handleReceiveChannelStatusChange;
}

// Handle onmessage events for the receiving channel.
// These are the data messages sent by the sending channel.

function handleReceiveMessage(event: any) {
  console.log('Received message: ' + event.data);
}

// Handle status changes on the receiver's channel.

function handleReceiveChannelStatusChange(event: any) {
  if (receiveChannel) {
    console.log(
      "Receive channel's status has changed to " + receiveChannel.readyState
    );
  }

  // Here you would do stuff that needs to be done
  // when the channel's status changes.
}

// Close the connection, including data channels if they're open.
// Also update the UI to reflect the disconnected status.

function disconnectPeers() {
  sendChannel = null;
  receiveChannel = null;
  localConnection = null;
  remoteConnection = null;
}
