// ==UserScript==
// @name        4chantest Emotes
// @namespace   4chanmotes
// @version     1
// @match       *://*.4chan.org/*
// @match       *://*.4channel.org/*
// @run-at      document-idle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// @grant       GM_xmlhttpRequest

// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.listValues
// @grant       GM.deleteValue
// @grant       GM.xmlHttpRequest
// @icon        https://4chanmotes.github.io/emotes/kurisuprised.png
// ==/UserScript==

/* This is for compatibility between userscript managers
	Tampermonkey only likes GM_*, Greasemonkey likes GM.*
	and Violentmonkey likes both... */
const GMgetValue = ((typeof GM_getValue === undefined) ? GM.getValue : GM_getValue);
const GMsetValue = ((typeof GM_setValue === undefined) ? GM.setValue : GM_setValue);
const GMlistValues = ((typeof GM_listValues === undefined) ? GM.listValues : GM_listValues);
const GMdeleteValue = ((typeof GM_deleteValue === undefined) ? GM.deleteValue : GM_deleteValue);
const GMRequest = ((typeof GM_xmlHttpRequest === undefined) ? GM.xmlHttpRequest : GM_xmlhttpRequest);
