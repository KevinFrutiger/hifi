"use strict";

//
//  record.js
//
//  Created by David Rowe on 5 Apr 2017.
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

var isUsingToolbar = false,
    isDisplayingInstructions = false,
    isRecording = false,
    numberOfPlayers = 0,
    recordingsBeingPlayed = [],
    elRecordings,
    elRecordingsPlaying,
    elRecordingsList,
    elInstructions,
    elPlayersUnused,
    elHideInfoButton,
    elShowInfoButton,
    elLoadButton,
    elSpinner,
    elRecordButton,
    elFinishOnOpen,
    elFinishOnOpenLabel,
    EVENT_BRIDGE_TYPE = "record",
    BODY_LOADED_ACTION = "bodyLoaded",
    USING_TOOLBAR_ACTION = "usingToolbar",
    RECORDINGS_BEING_PLAYED_ACTION = "recordingsBeingPlayed",
    NUMBER_OF_PLAYERS_ACTION = "numberOfPlayers",
    STOP_PLAYING_RECORDING_ACTION = "stopPlayingRecording",
    LOAD_RECORDING_ACTION = "loadRecording",
    START_RECORDING_ACTION = "startRecording",
    STOP_RECORDING_ACTION = "stopRecording",
    FINISH_ON_OPEN_ACTION = "finishOnOpen";

function stopPlayingRecording(event) {
    var playerID = event.target.getElementsByTagName("input")[0].value;
    EventBridge.emitWebEvent(JSON.stringify({
        type: EVENT_BRIDGE_TYPE,
        action: STOP_PLAYING_RECORDING_ACTION,
        value: playerID
    }));
}

function updatePlayersUnused() {
    elPlayersUnused.innerHTML = numberOfPlayers - recordingsBeingPlayed.length;
}

function orderRecording(a, b) {
    return a.filename > b.filename ? 1 : -1;
}

function updateRecordings() {
    var tbody,
        tr,
        td,
        span,
        input,
        length,
        i;

    recordingsBeingPlayed.sort(orderRecording);

    tbody = document.createElement("tbody");
    tbody.id = "recordings-list";

    for (i = 0, length = recordingsBeingPlayed.length; i < length; i += 1) {
        tr = document.createElement("tr");
        td = document.createElement("td");
        td.innerHTML = recordingsBeingPlayed[i].filename.slice(4);
        tr.appendChild(td);
        td = document.createElement("td");
        span = document.createElement("span");
        span.innerHTML = "x";
        span.addEventListener("click", stopPlayingRecording);
        input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("value", recordingsBeingPlayed[i].playerID);
        span.appendChild(input);
        td.appendChild(span);
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    // Empty rows representing available players.
    for (i = recordingsBeingPlayed.length, length = numberOfPlayers; i < length; i += 1) {
        tr = document.createElement("tr");
        td = document.createElement("td");
        td.colSpan = 2;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    elRecordingsPlaying.replaceChild(tbody, elRecordingsList);
    elRecordingsList = document.getElementById("recordings-list");
}

function updateInstructions() {
    // Display show/hide instructions buttons if players are available.
    if (numberOfPlayers === 0) {
        elHideInfoButton.classList.add("hidden");
        elShowInfoButton.classList.add("hidden");
    } else {
        elHideInfoButton.classList.remove("hidden");
        elShowInfoButton.classList.remove("hidden");
    }

    // Display instructions if user requested or no players available.
    if (isDisplayingInstructions || numberOfPlayers === 0) {
        elRecordingsList.classList.add("hidden");
        elInstructions.classList.remove("hidden");
    } else {
        elInstructions.classList.add("hidden");
        elRecordingsList.classList.remove("hidden");
    }
}

function showInstructions() {
    isDisplayingInstructions = true;
    updateInstructions();
}

function hideInstructions() {
    isDisplayingInstructions = false;
    updateInstructions();
}

function updateLoadButton() {
    if (numberOfPlayers > recordingsBeingPlayed.length) {
        elLoadButton.removeAttribute("disabled");
    } else {
        elLoadButton.setAttribute("disabled", "disabled");
    }
}

function updateSpinner() {
    if (isRecording) {
        elRecordings.classList.add("hidden");
        elSpinner.classList.remove("hidden");
    } else {
        elSpinner.classList.add("hidden");
        elRecordings.classList.remove("hidden");
    }
}

function updateFinishOnOpenLabel() {
    var WINDOW_FINISH_ON_OPEN_LABEL = "Finish recording when reopen dialog",
        TABLET_FINISH_ON_OPEN_LABEL = "Finish recording when reopen dialog or tablet";

    elFinishOnOpenLabel.innerHTML = isUsingToolbar ? WINDOW_FINISH_ON_OPEN_LABEL : TABLET_FINISH_ON_OPEN_LABEL;
}

function onScriptEventReceived(data) {
    var message = JSON.parse(data);
    if (message.type === EVENT_BRIDGE_TYPE) {
        switch (message.action) {
        case USING_TOOLBAR_ACTION:
            isUsingToolbar = message.value;
            updateFinishOnOpenLabel();
            break;
        case FINISH_ON_OPEN_ACTION:
            elFinishOnOpen.checked = message.value;
            break;
        case START_RECORDING_ACTION:
            isRecording = message.value;
            if (isRecording) {
                elRecordButton.classList.add("pressed");
            }
            updateSpinner();
            break;
        case RECORDINGS_BEING_PLAYED_ACTION:
            recordingsBeingPlayed = JSON.parse(message.value);
            updateRecordings();
            updatePlayersUnused();
            updateInstructions();
            updateLoadButton();
            break;
        case NUMBER_OF_PLAYERS_ACTION:
            numberOfPlayers = message.value;
            updateRecordings();
            updatePlayersUnused();
            updateInstructions();
            updateLoadButton();
            break;
        }
    }
}

function onLoadButtonClicked() {
    EventBridge.emitWebEvent(JSON.stringify({
        type: EVENT_BRIDGE_TYPE,
        action: LOAD_RECORDING_ACTION
    }));
}

function onRecordButtonClicked() {
    if (!isRecording) {
        elRecordButton.classList.add("pressed");
        EventBridge.emitWebEvent(JSON.stringify({
            type: EVENT_BRIDGE_TYPE,
            action: START_RECORDING_ACTION
        }));
        isRecording = true;
        updateSpinner();
    } else {
        elRecordButton.classList.remove("pressed");
        EventBridge.emitWebEvent(JSON.stringify({
            type: EVENT_BRIDGE_TYPE,
            action: STOP_RECORDING_ACTION
        }));
        isRecording = false;
        updateSpinner();
    }
}

function onFinishOnOpenClicked() {
    EventBridge.emitWebEvent(JSON.stringify({
        type: EVENT_BRIDGE_TYPE,
        action: FINISH_ON_OPEN_ACTION,
        value: elFinishOnOpen.checked
    }));
}

function signalBodyLoaded() {
    EventBridge.emitWebEvent(JSON.stringify({
        type: EVENT_BRIDGE_TYPE,
        action: BODY_LOADED_ACTION
    }));
}

function onBodyLoaded() {

    EventBridge.scriptEventReceived.connect(onScriptEventReceived);

    elRecordings = document.getElementById("recordings");

    elRecordingsPlaying = document.getElementById("recordings-playing");
    elRecordingsList = document.getElementById("recordings-list");
    elInstructions = document.getElementById("instructions");
    elPlayersUnused = document.getElementById("players-unused");

    elHideInfoButton = document.getElementById("hide-info-button");
    elHideInfoButton.onclick = hideInstructions;
    elShowInfoButton = document.getElementById("show-info-button");
    elShowInfoButton.onclick = showInstructions;

    elLoadButton = document.getElementById("load-button");
    elLoadButton.onclick = onLoadButtonClicked;

    elSpinner = document.getElementById("spinner");

    elRecordButton = document.getElementById("record-button");
    elRecordButton.onclick = onRecordButtonClicked;

    elFinishOnOpen = document.getElementById("finish-on-open");
    elFinishOnOpen.onclick = onFinishOnOpenClicked;

    elFinishOnOpenLabel = document.getElementById("finish-on-open-label");

    signalBodyLoaded();
}
