/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* global TimelineDataSeries, TimelineGraphView */

'use strict';

const audio2 = document.querySelector('audio#audio2');
const callButton = document.querySelector('button#callButton');
const hangupButton = document.querySelector('button#hangupButton');
const codecSelector = document.querySelector('select#codec');
hangupButton.disabled = true;
callButton.onclick = call;
hangupButton.onclick = hangup;

const sampleRateSelector = document.querySelector('select#sample_rate');
const sampleSizeSelector = document.querySelector('select#sample_size');
const latencySelector = document.querySelector('select#latency');
const channelCountSelector = document.querySelector('select#channel_count');
const agcSelector = document.querySelector('select#agc');
const aecSelector = document.querySelector('select#aec');
const nsSelector = document.querySelector('select#ns');  
var selectConstaints = {};

let pc1;
let pc2;
let localStream;

let lastResult;

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 0,
  voiceActivityDetection: false
};

function gotStream(stream) {
  hangupButton.disabled = false;
  console.log('Received local stream');
  localStream = stream;
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length > 0) {
    console.log(`Using Audio device: ${audioTracks[0].label}`);
  }
  localStream.getTracks().forEach(track => {
    pc1.addTrack(track, localStream)
    
    const capabilities = track.getCapabilities();
    console.log('Result capabilities: ' + JSON.stringify(capabilities));

    if(capabilities && capabilities.sampleRate) {
      console.log("sampleRateSelector min:" + capabilities.sampleRate.min + ", max:" + capabilities.sampleRate.max);
      var objOption = document.createElement("OPTION");
      objOption.value = capabilities.sampleRate.min;
      objOption.text = capabilities.sampleRate.min;
      sampleRateSelector.add(objOption);
      if(capabilities.sampleRate.min != capabilities.sampleRate.max) {
        console.log("TODO");
      }
    }

    if(capabilities && capabilities.sampleSize) {
      console.log("sampleSizeSelector min:" + capabilities.sampleSize.min + ", max:" + capabilities.sampleSize.max);
      var objOption = document.createElement("OPTION");
      objOption.value = capabilities.sampleSize.min;
      objOption.text = capabilities.sampleSize.min;
      sampleSizeSelector.add(objOption);
      if(capabilities.sampleSize.min != capabilities.sampleSize.max) {
        console.log("TODO");
      }
    }

    if(capabilities && capabilities.latency) {
      console.log("sampleSizeSelector min:" + capabilities.latency.min + ", max:" + capabilities.latency.max);
      var objOption = document.createElement("OPTION");
      objOption.value = capabilities.latency.min;
      objOption.text = capabilities.latency.min;
      latencySelector.add(objOption);
      if(capabilities.latency.min != capabilities.latency.max) {
        console.log("TODO");
      }
    }

    if(capabilities && capabilities.channelCount) {
      console.log("channelCountSelector min:" + capabilities.channelCount.min + ", max:" + capabilities.channelCount.max);
      var objOption = document.createElement("OPTION");
      objOption.value = capabilities.channelCount.min;
      objOption.text = capabilities.channelCount.min;
      channelCountSelector.add(objOption);
      if(capabilities.channelCount.min != capabilities.channelCount.max) {
        console.log("TODO");
      }
    }

    if(capabilities && capabilities.echoCancellation) {
      console.log("echoCancellation supported");
      var objOption = document.createElement("OPTION");
      objOption.value = true;
      objOption.text = "true";
      aecSelector.add(objOption);
      objOption = document.createElement("OPTION");
      objOption.value = false;
      objOption.text = "false";
      aecSelector.add(objOption);
    }

    if(capabilities && capabilities.noiseSuppression) {
      console.log("noiseSuppression supported");
      var objOption = document.createElement("OPTION");
      objOption.value = true;
      objOption.text = "true";
      nsSelector.add(objOption);
      objOption = document.createElement("OPTION");
      objOption.value = false;
      objOption.text = "false";
      nsSelector.add(objOption);
    }

    if(capabilities && capabilities.autoGainControl) {
      console.log("autoGainControl supported");
      var objOption = document.createElement("OPTION");
      objOption.value = true;
      objOption.text = "true";
      agcSelector.add(objOption);
      objOption = document.createElement("OPTION");
      objOption.value = false;
      objOption.text = "false";
      agcSelector.add(objOption);
    }

    const capabilities_p = document.querySelector('#capabilities');
    capabilities_p.innerText = JSON.stringify(capabilities);
  });
  console.log('Adding Local Stream to peer connection');

  pc1.createOffer(offerOptions)
      .then(gotDescription1, onCreateSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

function call() {
  callButton.disabled = true;
  codecSelector.disabled = true;
  console.log('Starting call');
  const servers = null;
  pc1 = new RTCPeerConnection(servers);
  console.log('Created local peer connection object pc1');
  pc1.onicecandidate = e => onIceCandidate(pc1, e);
  pc2 = new RTCPeerConnection(servers);
  console.log('Created remote peer connection object pc2');
  pc2.onicecandidate = e => onIceCandidate(pc2, e);
  pc2.ontrack = gotRemoteStream;
  console.log('Requesting local stream');
  navigator.mediaDevices
      .getUserMedia({
        audio: {channelCount:2},
        video: false
      })
      .then(gotStream)
      .catch(e => {
        alert(`getUserMedia() error: ${e.name}`);
      });
}

function gotDescription1(desc) {
  console.log(`Offer from pc1\n${desc.sdp}`);
  pc1.setLocalDescription(desc)
      .then(() => {
        desc.sdp = forceChosenAudioCodec(desc.sdp);
        pc2.setRemoteDescription(desc).then(() => {
          return pc2.createAnswer().then(gotDescription2, onCreateSessionDescriptionError);
        }, onSetSessionDescriptionError);
      }, onSetSessionDescriptionError);
}

function gotDescription2(desc) {
  console.log(`Answer from pc2\n${desc.sdp}`);
  pc2.setLocalDescription(desc).then(() => {
    desc.sdp = forceChosenAudioCodec(desc.sdp);
    pc1.setRemoteDescription(desc).then(() => {}, onSetSessionDescriptionError);
  }, onSetSessionDescriptionError);
}

function hangup() {
  console.log('Ending call');
  localStream.getTracks().forEach(track => track.stop());
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  codecSelector.disabled = false;
}

function gotRemoteStream(e) {
  if (audio2.srcObject !== e.streams[0]) {
    audio2.srcObject = e.streams[0];
    console.log('Received remote stream');
  }
}

function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}

function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}

function onIceCandidate(pc, event) {
  getOtherPc(pc).addIceCandidate(event.candidate)
      .then(
          () => onAddIceCandidateSuccess(pc),
          err => onAddIceCandidateError(pc, err)
      );
  console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  console.log(`Failed to add ICE Candidate: ${error.toString()}`);
}

function onSetSessionDescriptionError(error) {
  console.log(`Failed to set session description: ${error.toString()}`);
}

function forceChosenAudioCodec(sdp) {
  return maybePreferCodec(sdp, 'audio', 'send', codecSelector.value);
}

// Copied from AppRTC's sdputils.js:

// Sets |codec| as the default |type| codec if it's present.
// The format of |codec| is 'NAME/RATE', e.g. 'opus/48000'.
function maybePreferCodec(sdp, type, dir, codec) {
  const str = `${type} ${dir} codec`;
  if (codec === '') {
    console.log(`No preference on ${str}.`);
    return sdp;
  }

  console.log(`Prefer ${str}: ${codec}`);

  const sdpLines = sdp.split('\r\n');

  // Search for m line.
  const mLineIndex = findLine(sdpLines, 'm=', type);
  if (mLineIndex === null) {
    return sdp;
  }

  // If the codec is available, set it as the default in m line.
  const codecIndex = findLine(sdpLines, 'a=rtpmap', codec);
  console.log('codecIndex', codecIndex);
  if (codecIndex) {
    const payload = getCodecPayloadType(sdpLines[codecIndex]);
    if (payload) {
      sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], payload);
    }
  }

  sdp = sdpLines.join('\r\n');
  return sdp;
}

// Find the line in sdpLines that starts with |prefix|, and, if specified,
// contains |substr| (case-insensitive search).
function findLine(sdpLines, prefix, substr) {
  return findLineInRange(sdpLines, 0, -1, prefix, substr);
}

// Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
// and, if specified, contains |substr| (case-insensitive search).
function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
  const realEndLine = endLine !== -1 ? endLine : sdpLines.length;
  for (let i = startLine; i < realEndLine; ++i) {
    if (sdpLines[i].indexOf(prefix) === 0) {
      if (!substr ||
        sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
        return i;
      }
    }
  }
  return null;
}

// Gets the codec payload type from an a=rtpmap:X line.
function getCodecPayloadType(sdpLine) {
  const pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
  const result = sdpLine.match(pattern);
  return (result && result.length === 2) ? result[1] : null;
}

// Returns a new m= line with the specified codec as the first one.
function setDefaultCodec(mLine, payload) {
  const elements = mLine.split(' ');

  // Just copy the first three parameters; codec order starts on fourth.
  const newLine = elements.slice(0, 3);

  // Put target payload first and copy in the rest.
  newLine.push(payload);
  for (let i = 3; i < elements.length; i++) {
    if (elements[i] !== payload) {
      newLine.push(elements[i]);
    }
  }
  return newLine.join(' ');
}

