// ==UserScript==
// @name        4chan(X too) Emotes
// @namespace   4chanmotes
// @version     0.5.7
// @description 2022 April Fool's 4chan (X too) permanent support
// @match       *://*.4chan.org/*
// @match       *://*.4channel.org/*
// @run-at      document-idle
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlHttpRequest
// @updateURL   https://4chanmotes.github.io/4chanmotes.meta.js
// @downloadURL https://4chanmotes.github.io/4chanmotes.user.js
// @icon        https://4chanmotes.github.io/emotes/kurisuprised.png
// ==/UserScript==

/* Removes all :emoteshit: if true*/
const disable_all_emotes = false;

/* This is the delay between new posts/entering a thread and the
    parser running, more = less responsive but bigger stability */
const emote_timer = 500; //milliseconds

/* This is the maximum emotes/emojis per post, all other matches are removed
    this doesn't limit emotes posted, only seen*/
const max_emotes = 9;

/* This is the amount of emotes/emojis per line on the menu */
const emote_cols = 13;

/* The url with the emotes, duh
    4chan one is https://s.4cdn.org/image/emotes/
    not recommended because it has no custom ones */
const emotes_url = "https://4chanmotes.github.io/emotes/";

/* JSON file with all emoji/emote names and respective filenames */
const emotes_json = "https://4chanmotes.github.io/emote_list.json";

/* This is the menu button, if you want to customize it then change this */
const menu_emote = `<img id="emote-select" data-xa-cmd="open" src="${emotes_url}kurisuprised.png">`

// stores the dictionaries and regex
let using4chanx, re_emoji, re_emote, emoji, emotes;

// Main class, everything emote posting related
var EmoteMenu = {
  init: function() {
    EmoteMenu.addCSS();

    document.addEventListener('click', EmoteMenu.onClick);
    using4chanx = document.querySelector("a[data-cmd=custom-menu-edit]") === null;

    // Adds listener for new posts and EmoteButton injection
    if (using4chanx) {
      Xchanevents();
    } else {
      Nchanevents();
    }

    parseOriginalPosts();
  },

  onClick: function(e) {
    let t/*arget*/, com/*mand*/, self = EmoteMenu;

    if (e.which != 1 || e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
      return;
    }

    if ((t = e.target) == document) {
      return;
    }

    if (t.id === 'xa-em-x') {
      self.close();
      return;
    }

    if (t.hasAttribute('data-xa-cmd')) {
      e.stopPropagation();

      com = t.getAttribute('data-xa-cmd');

      if (com === 'open') {
        self.open(); // Opens menu
      }
      else if (com === 'use-emote') {
        self.insertEmote(t.getAttribute('data-tip')); // inserts emote on reply
      }

      return;
    }

    return;
  },

  open: function() {
    let menu, self = EmoteMenu;

    // Is menu already open?
    if (document.getElementById('xa-em')) return;

    menu = document.createElement('div');
    menu.id = 'xa-em';
    menu.innerHTML = `<div id="xa-em-panel"><div id="xa-em-h">Emotes<div id="xa-em-x">Close</div></div><div id="xa-em-l"></div><div id="xa-em-i">Please do not use more than ${max_emotes} as they will not show up</div></div>`;

    document.body.appendChild(menu);

    self.createEmoteList();
  },

  close: function() {
    let menu = document.getElementById('xa-em');

    if (menu) {
      menu.remove();
    }
  },

  createEmoteList: function() {
    let self = EmoteMenu, list = document.getElementById('xa-em-l');

    if (!list) return;
    list.textContent = '';

    Object.keys(emoji).forEach(function(eid) {
      let el = document.createElement('div');
      el.className = 'xa-em-emote';

      el.setAttribute('data-xa-cmd', 'use-emote');

      let arg = emoji[eid];

      el.setAttribute('data-tip', `:${eid}:`);
      el.innerHTML = `<span>${arg}</span>`;

      list.appendChild(el);
    });

    Object.keys(emotes).forEach(function(eid) {
      let el = document.createElement('div');
      el.className = 'xa-em-emote';

      el.setAttribute('data-xa-cmd', 'use-emote');

      let arg = emotes[eid];

      el.setAttribute('data-tip', `:${eid}:`);
      el.innerHTML = `<img src="${emotes_url}${arg}">`;

      list.appendChild(el);
    });
  },

  insertEmote: function(code) {
    let qr;
    if (using4chanx) {
      qr =document.querySelector('textarea.field');
    } else {
      if (typeof QR !== undefined) QR.show(Main.tid);
      qr = document.querySelector('#quickReply textarea');
    }
    
    // Put code in cursor
    pos = qr.selectionEnd;
    if (qr.value) {
      qr.value = qr.value.slice(0, pos)
        + code + qr.value.slice(qr.selectionEnd);
    }
    else {
      qr.value = code;
    }

    // Keep cursor in same spot
    qr.selectionStart = qr.selectionEnd = pos + code.length;

    qr.focus();
  },

  addCSS: function() {
    let style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = `
#xa-em {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
}

#xa-em-panel {
  background: #a9acb5;
  width: ${36 * emote_cols + 12}px;
  padding: 6px;
  box-sizing: border-box;
  border-radius: 16px;
  box-shadow: 0 0 32px #2e3b4dd9;
  pointer-events: all;
  position: relative;
  font-family: Arial, sans-serif;
  user-select: none;
  color: #000;
}

#xa-em-h {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 6px;
  margin-top: 4px;
}

#xa-em-x {
  font-size: 12px;
  position: absolute;
  right: 12px;
  top: 12px;
  cursor: pointer;
}
#xa-em-x:hover {
  color: #fff;
}

#xa-em-l {
  display: flex;
  max-height: 80vh;
  flex-wrap: wrap;
  overflow-y: auto;
  scrollbar-width: thin;
}

#xa-em-i {
  font-size: 12px;
  font-family: Arial, sans-serif;
  line-height: 16px;
  margin-bottom: 10px;
}

.xa-em-emote {
  width: 32px;
  height: 32px;
  background: #dfe2e6;
  margin: 2px;
  overflow: hidden;
  font-size: 22px;
  text-align: center;
  cursor: pointer;
}
.xa-em-emote > * {
  pointer-events: none;
}

.xae {
  cursor: pointer;
  user-select: none;
  font-size: 18px;
}

abbr[data-tip] {
  border-bottom: none !important;
  cursor: inherit !important;
  text-decoration: none !important;
}

#emote-select {
  cursor: pointer;
  float: right;
  height: 16px;
}
`;
    document.head.appendChild(style);
  }
}

/* Userscript-dependent request, ignores CORS(Cross Origin) 
    Gets JSON and starts the EmoteMenu*/
setTimeout(function() {
  let req = {
    method:     "GET",
    url:        emotes_json,
    onloadend:  function(res) {
      if (res.responseText !== undefined) {
        let data = JSON.parse(res.responseText);

        emoji = data.emoji;
        emotes = data.emotes;
        re_emoji = new RegExp(":" + Object.keys(emoji).join(":|:") + ":", "g");
        re_emote = new RegExp(":" + Object.keys(emotes).join(":|:") + ":", "g");
        console.log(emotes);

        EmoteMenu.init();
      } else {
        alert("Error: Couln't access emotes JSON, shit's fucked");
      }
    },
  };
  if (typeof GM_xmlhttpRequest === undefined) {
    GM.xmlHttpRequest(req);
  } else {
    GM_xmlhttpRequest(req);
  }
}, emote_timer);

// Below parses all new posts, code taken from (You) counter
// https://github.com/WhatIsThisImNotGoodWithComputers/All-time-You-count

// Events for 4chan X
function Xchanevents() {
  // Injects EmoteMenu on 4chanX quick reply
  document.addEventListener("QRDialogCreation", function() {
    console.log("QR opened - using 4chanx");
    // EmoteMenu button
    if (!document.getElementById("emote-select")) {
      if (!document.querySelector("#qr select[data-name=thread]")) {
        // Put button next to Option/Subject
        document.querySelector(".persona input[data-name=sub]").insertAdjacentHTML("afterend", menu_emote);
      } else {
        // Put button next to thread selector
        document.querySelector("#qr select[data-name=thread]").insertAdjacentHTML("afterend", menu_emote);
      }
    }
  });

  /* Listen to post updates from the thread updater for 4chan x v2 (loadletter) and v3 (ccd0 + ?) */
  document.addEventListener('ThreadUpdate', function (e) {
    var evDetail = e.detail || e.wrappedJSObject.detail;
    var evDetailClone = typeof cloneInto === 'function' ? cloneInto(evDetail, unsafeWindow) : evDetail;

    //ignore if 404 event
    if (evDetail[404] === true) {
        return;
    }

    setTimeout(function () {
        evDetailClone.newPosts.forEach(function (post_board_nr) {
            var post_nr = post_board_nr.split('.')[1];
            var newPostDomElement = document.getElementById("pc" + post_nr);
            EmotePostParsing(newPostDomElement);
        });
    }, emote_timer);
  }, false);
}

// Events for Native 4chan
function Nchanevents() {
  /* Since the native extention does not have a QR opening event
        we must repeatedly check whether the reply is open or not */
  setInterval(function () {
    // EmoteMenu button
    var e = document.getElementById("emote-select");
    var qr = (document.getElementById("t-help") ? document.getElementById("t-help") : document.getElementById("qrClose"));
    if (!e && qr) {
      console.log("QR opened - using native 4chan");
      qr.insertAdjacentHTML("afterend", menu_emote);
    }
  }, emote_timer);

  /* This waits for new posts and parses them when they appear */
  document.addEventListener('4chanThreadUpdated', function (e) {
    var evDetail = e.detail || e.wrappedJSObject.detail;
  
    setTimeout(function () {
      var threadID = window.location.pathname.split('/')[3];
      var postsContainer = Array.prototype.slice.call(document.getElementById('t' + threadID).childNodes);
      var lastPosts = postsContainer.slice(Math.max(postsContainer.length - evDetail.count, 1)); //get the last n elements (where n is evDetail.count)

      lastPosts.forEach(function (post_container) {
        EmotePostParsing(post_container);
      });
    }, emote_timer);
  }, false);
}

/* parse the posts already on the page before thread updater kicks in */
function parseOriginalPosts() {
  var tempAllPostsOnPage = document.getElementsByClassName('postContainer');
  var postContainers = Array.prototype.slice.call(tempAllPostsOnPage); //convert from element list to javascript array
  postContainers.forEach(function (postContainer) {
    EmotePostParsing(postContainer);
  });
}

/* swaps two elements, temp requires a parent */
function swapNodes(temp, n2) {
  var dive = temp.parentNode;

  n2.insertAdjacentElement('afterend', temp);

  dive.appendChild(n2);
}

// parses all new posts
/* What code is doing: 
    4chan messages are blockquotes with text and raw html mixed
    because of that, the easiest way is to change .innerHTML
    but changing .innerHTML removes all event listeners
    so, this goes through all the quotes and creates a dummy for each,
    swaps them so the dummies are in the blockquote and the original is elsewhere
    changes innerHTML but the original is elsewhere so evenlistener is fine
    then swaps them back and deletes the dummies.
*/
function EmotePostParsing(postContainer) {
  var message = postContainer.getElementsByClassName("post")[0].getElementsByClassName("postMessage")[0];
  //var name = postContainer.getElementsByClassName("post")[0].getElementsByClassName("name")[1];

  var temp = document.createElement('div');
  var quote_array = [];
  var quotes = message.querySelectorAll('.quotelink');
  // var quotes = message.getElementsByTagName('a');
  //el.setAttribute('data-tip', `:${eid}:`);

  if (quotes.length) {
    for (let alink of quotes) {
      var clone = document.createElement('a');
      clone.setAttribute('class', 'quotelink')
      temp.appendChild(clone);
      swapNodes(clone, alink);
      quote_array.push(alink); // saves original quote
    }
  }

  var i = 0;

  // Replace :emoshit:
  message.innerHTML = message.innerHTML.replace(/<wbr>/g, '')
        .replace(re_emote, function(m) {
          /* Emote image, title for tooltip, data- to use like in menu */
          i++;
          if (i > max_emotes || disable_all_emotes) { // After max all others removed
            return "";
          }
          return `<img class="xae" data-xa-cmd="use-emote" data-tip="${m}" title="${m}" src="${emotes_url}${emotes[m.split(':')[1]]}">`})
        .replace(re_emoji, function(m) {
          /* Emoji character, title for tooltip, data- to use like in menu */
          i++;
          if (i > max_emotes || disable_all_emotes) { // After max all others removed
            return "";
          }
          return `<abbr class="xae" data-xa-cmd="use-emote" data-tip="${m}" title="${m}">${emoji[m.split(':')[1]]}</abbr>`});

  // This checks the name too
  //name.innerHTML = name.innerHTML.replace(/<wbr>/g, '').replace(re_emoji, function(m) {return `<span class="xae">${emoji[m.split(':')[1]]}</span>`})
  //      .replace(re_emote, function(m) {return `<img class="xae" src="${emotes_url}${emotes[m.split(':')[1]]}">`});

  // Refresh
  quotes = message.querySelectorAll('.quotelink');

  // Swap back
  if (quotes.length) {
    for (i = 0; i < quotes.length; i++) {
      swapNodes(quote_array[i], quotes[i]);
    }
  }
  temp.remove();
}

