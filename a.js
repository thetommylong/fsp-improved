// ==UserScript==
// @name        block devtools your ass
// @namespace   Violentmonkey Scripts
// @match       https://*.fpt.edu.vn/*
// @icon
// @grant       none
// @version     1.0
// @author      -
// @description 3/17/2026, 9:23:47 PM
// ==/UserScript==

const _setInterval = window.setInterval;
window.setInterval = (fn, delay, ...args) => {
  return _setInterval(
    () => {
      // still run it
    },
    delay,
    ...args,
  );
};

// toString detectors
const _regToString = RegExp.prototype.toString;
RegExp.prototype.toString = function () {
  return _regToString.call(this);
};

const _dateToString = Date.prototype.toString;
Date.prototype.toString = function () {
  return _dateToString.call(this);
};

const _funcToString = Function.prototype.toString;
Function.prototype.toString = function () {
  return _funcToString.call(this);
};

// performance timing detector
const _perfNow = performance.now.bind(performance);
performance.now = () => {
  return _perfNow();
};

// watch for the redirect attempt
const _assign = window.location.assign.bind(window.location);
Object.defineProperty(window.location, "assign", {
  value: (url) => {
    // don't actually call _assign
  },
});

// replace the redirect attempt differently
const _pushState = history.pushState.bind(history);
history.pushState = (state, title, url) => {
  if (url?.includes("disable-devtool") || url?.includes("404")) {
    return;
  }
  return _pushState(state, title, url);
};

// block the actual close/redirect
window.close = () => {};
