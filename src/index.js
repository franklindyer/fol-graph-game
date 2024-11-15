/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {Network, DataSet} from 'vis-network';
import {blocks} from './blocks/fol-blocks';
import {folGenerator} from './generators/fol-generator';
import {save, load} from './serialization';
import {toolbox} from './toolbox';
import * as FOL from './logic/fol.js';
import * as MVC from './logic/mvc';
import './index.css';

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);

// Set up UI elements and inject Blockly
const graphDiv = document.getElementById('networkbox')
const blocklyDiv = document.getElementById('blocklyDiv');
var levelsList = document.getElementById("levels-list");
const ws = Blockly.inject('blocklyDiv', {
    toolbox: toolbox,
    zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 1.0,
        minScale: 0.3,
        scaleSpeed: 1.2,
        pinch: true
    },
    trashcan: true
});

// Set up logic for Model Theory game
var m = new MVC.Model()
m.runRandomGraph(20, 0.1)
var v = new MVC.View()
v.visNodesList(20)
v.visEdgesList(m.edglist)
var c = new MVC.Controller(m, v)
c.randomize()

global.c = c;
global.levels = MVC.levels;

// Set up list of levels
for (let n in MVC.levels) {
    var level = MVC.levels[n];
    var levelElt = document.createElement("div");
    var levelLabel = document.createElement("a");
    var levelMarker = document.createElement("a");
    levelMarker.textContent = "🔒"
    levelElt.id = `level-marker-${n}`
    levelMarker.classList.add("level-icon");
    levelMarker.id = `level-icon-${n}`;
    levelLabel.textContent = level.name;
    levelElt.disabled = true;
    levelElt.appendChild(levelLabel);
    levelElt.appendChild(levelMarker);
    levelElt.classList.add("level-entry");
    levelElt.classList.add("locked-level-entry");
    levelsList.appendChild(levelElt);
}
MVC.activateLevel(c, 0);

// This function resets the code and applies a predicate to the graph
const runCode = () => {
  const code = folGenerator.workspaceToCode(ws);
  // console.log(code);
  try {
    c.tryPredicate(code);
  } catch (e) {
    // console.log(e);
    c.tryPredicate("~(eq(y,y))");
  }
};

// Load the initial state from storage and run the code.
load(ws);
runCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
});

// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
  // Don't run the code when the workspace finishes loading; we're
  // already running it once when the application starts.
  // Don't run the code during drags; we might have invalid state.
  if (
    e.isUiEvent ||
    e.type == Blockly.Events.FINISHED_LOADING ||
    ws.isDragging()
  ) {
    return;
  }
  runCode();
});
