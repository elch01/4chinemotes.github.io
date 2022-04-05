// ==UserScript==
// @name        4chantest
// @namespace   4chanmotes
// @match       *://*.4chan.org/*
// @match       *://*.4channel.org/*
// @version     0.4
// @description 2022 April Fool's 4chan (X too) permanent support
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlHttpRequest
// @updateURL   https://4chanmotes.neocities.org/emotes/4chanmotes.user.js
// @downloadURL https://4chanmotes.neocities.org/emotes/4chanmotes.user.js
// @icon        https://4chanmotes.neocities.org/emotes/kurisuprised.png
// ==/UserScript==

const emote_timer = 500; //milliseconds
const emotes_json = "https://4chanmotes.neocities.org/emotes/emote_list.json";

console.log(emotes_json, GM_xmlhttpRequest);

let deets = {
  method: "GET",
  url: emotes_json,
  onload: function(xhr) {
    console.log(JSON.parse(xhr.responseText));
  },
};

console.log(deets);
let res = GM_xmlhttpRequest(deets)