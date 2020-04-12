/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

const dimensions = document.querySelector('#dimensions');
const video = document.querySelector('video');
let stream;

const captureButton = document.querySelector('#capture');

const videoblock = document.querySelector('#videoblock');
const messagebox = document.querySelector('#errormessage');

const widthInput = document.querySelector('div#width input');
const widthOutput = document.querySelector('div#width span');
var widthSetting;

const heightInput = document.querySelector('div#height input');
const heightOutput = document.querySelector('div#height span');
var heightSetting;

const frameRateInput = document.querySelector('div#frameRate input');
const frameRateOutput = document.querySelector('div#frameRate span');
var frameRateSetting;

const aspectRatioInput = document.querySelector('div#aspectRatio input');
const aspectRatioOutput = document.querySelector('div#aspectRatio span');
var aspectRatioSetting;

const sizeLock = document.querySelector('#sizelock');

let currentWidth = 0;
let currentHeight = 0;

captureButton.onclick = () => {
  getMedia({video:true});
};


function gotStream(mediaStream) {
  stream = window.stream = mediaStream; // stream available to console
  video.srcObject = mediaStream;
  messagebox.style.display = 'none';
  videoblock.style.display = 'block';
  const track = mediaStream.getVideoTracks()[0];
  const constraints = track.getConstraints();
  console.log('Result constraints: ' + JSON.stringify(constraints));
  const capabilities = track.getCapabilities();
  console.log('Result capabilities: ' + JSON.stringify(capabilities));

  const capabilities_p = document.querySelector('#capabilities');
  capabilities_p.innerText = JSON.stringify(capabilities);

  if(capabilities && capabilities.aspectRatio) {
    aspectRatioInput.min = capabilities.aspectRatio.min;
    aspectRatioInput.max = capabilities.aspectRatio.max;
    console.log("aspectRatioInput min:" + aspectRatioInput.min + ", max:" + aspectRatioInput.max);
  }

  if(capabilities && capabilities.frameRate) {
    frameRateInput.min = capabilities.frameRate.min;
    frameRateInput.max = capabilities.frameRate.max;
    console.log("frameRateInput min:" + frameRateInput.min + ", max:" + frameRateInput.max);
  }

  if(capabilities && capabilities.width) {
    widthInput.min = capabilities.width.min;
    widthInput.max = capabilities.width.max;
    console.log("widthInput min:" + widthInput.min + ", max:" + widthInput.max);
  }

  if(capabilities && capabilities.height) {
    heightInput.min = capabilities.height.min;
    heightInput.max = capabilities.height.max;
    console.log("heightInput min:" + heightInput.min + ", max:" + heightInput.max);
  }
}

function errorMessage(who, what) {
  const message = who + ': ' + what;
  messagebox.innerText = message;
  messagebox.style.display = 'block';
  console.log(message);
}

function clearErrorMessage() {
  messagebox.style.display = 'none';
}

function displayVideoDimensions(whereSeen) {
  if (video.videoWidth) {
    dimensions.innerText = 'Actual video dimensions: ' + video.videoWidth +
      'x' + video.videoHeight + 'px.';
      video.frameRate
    if (currentWidth !== video.videoWidth ||
      currentHeight !== video.videoHeight) {
      console.log(whereSeen + ': ' + dimensions.innerText);
      currentWidth = video.videoWidth;
      currentHeight = video.videoHeight;
    }
  } else {
    dimensions.innerText = 'Video not ready';
  }
}

video.onloadedmetadata = () => {
  displayVideoDimensions('loadedmetadata');
};

video.onresize = () => {
  displayVideoDimensions('resize');
};

function constraintChange() {
  const track = window.stream.getVideoTracks()[0];
  let constraints;
  constraints = {};
  if(widthSetting) {
    constraints.width = widthSetting;
  }
  if(heightSetting) {
    constraints.height = heightSetting;
  }
  if(frameRateSetting) {
    constraints.frameRate = frameRateSetting;
  }
  if(aspectRatioSetting) {
    constraints.aspectRatio = aspectRatioSetting;
  }

  clearErrorMessage();
  console.log('applying ' + JSON.stringify(constraints));
  track.applyConstraints(constraints)
      .then(() => {
        console.log('applyConstraint success');
        displayVideoDimensions('applyConstraints');
      })
      .catch(err => {
        errorMessage('applyConstraints', err.name);
      });
}

widthInput.onchange = (e) => {
  widthOutput.textContent = e.target.value;
  widthSetting = e.target.value;

  constraintChange();
};
heightInput.onchange = (e) => {
  heightOutput.textContent = e.target.value;
  heightSetting = e.target.value;

  constraintChange();
};
frameRateInput.onchange = (e) => {
  frameRateOutput.textContent = e.target.value;
  frameRateSetting = e.target.value;

  constraintChange();
};
aspectRatioInput.onchange = (e) => {
  aspectRatioOutput.textContent = e.target.value;
  aspectRatioSetting = e.target.value;

  constraintChange();
};

sizeLock.onchange = () => {
  if (sizeLock.checked) {
    console.log('Setting fixed size');
    video.style.width = '100%';
  } else {
    console.log('Setting auto size');
    video.style.width = 'auto';
  }
};

function getMedia(constraints) {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }

  clearErrorMessage();
  videoblock.style.display = 'none';
  navigator.mediaDevices.getUserMedia(constraints)
      .then(gotStream)
      .catch(e => {
        errorMessage('getUserMedia', e.message, e.name);
      });
}
