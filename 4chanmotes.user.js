// ==UserScript==
// @name        4chan(X too) Emotes
// @namespace   4chanmotes
// @version     0.5.10
// @description 2022 April Fool's 4chan (X too) permanent support
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
const emotes_url = "https://elch01.github.io/4chinemotes.github.io/emotes/";

/* JSON file with all emoji/emote names and respective filenames */
const emotes_json = "https://elch01.github.io/4chinemotes.github.io/emote_list.json";

/* This is the menu button, if you want to customize it then change this */
const menu_emote = `<img id="emote-select" data-xa-cmd="open" src="${emotes_url}kurisuprised.png">`

// stores the dictionaries and regex
let using4chanx, re_emoji, re_emote, emotes_data;

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
        self.insertEmote(t.getAttribute('title')); // inserts emote on reply
      }

      return;
    }

    if (t.classList.contains("xa-em-tabitem") && !t.classList.contains("selected")) {
      document.querySelector(".xa-em-tabitem.selected").className = "xa-em-tabitem";
      t.className += " selected";
      self.refreshEmoteList();
    }

    return;
  },

  open: function() {
    let menu, self = EmoteMenu;

    // Is menu already open?
    if (document.getElementById('xa-em')) return;

    menu = document.createElement('div');
    menu.id = 'xa-em';
    menu.innerHTML = menu_html;

    document.body.appendChild(menu);

    self.refreshEmoteList();
  },

  close: function() {
    let menu = document.getElementById('xa-em');

    if (menu) {
      menu.remove();
    }
  },

  refreshEmoteList: function() {
    let self = EmoteMenu, list = document.getElementById('xa-em-l');
    let tab = document.querySelector(".xa-em-tabitem.selected");

    if (!list) return;
    list.textContent = '';

    if (!tab.getAttribute('data')) {
      if (tab.id === "settings") {
        return;
      }
      list.innerHTML = '<h1>Error</h1>';
      return;
    }

    if ((tab = tab.getAttribute('data')).indexOf("emoji") >= 0) {
      Object.keys(emotes_data.emoji).forEach(function(eid) {
        let el = document.createElement('div');
        el.className = 'xa-em-emote';
        el.setAttribute('data-xa-cmd', 'use-emote');
  
        let arg = emotes_data.emoji[eid];
  
        el.setAttribute('title', `:${eid}:`);
        el.innerHTML = `<span>${arg}</span>`;
  
        list.appendChild(el);
      });
    }
    if (tab.indexOf("emotes") >= 0) {
      Object.keys(emotes_data.emotes).forEach(function(eid) {
        let el = document.createElement('div');
        el.className = 'xa-em-emote';
        el.setAttribute('data-xa-cmd', 'use-emote');
  
        let arg = emotes_data.emotes[eid];
  
        el.setAttribute('title', `:${eid}:`);
        el.innerHTML = `<img src="${emotes_url}${arg}">`;
  
        list.appendChild(el);
      });
    }
    if (tab.indexOf("new") >= 0) {
      Object.keys(emotes_data.new).forEach(function(eid) {
        let el = document.createElement('div');
        el.className = 'xa-em-emote';
        el.setAttribute('data-xa-cmd', 'use-emote');

        let arg = emotes_data.new[eid];
  
        el.setAttribute('title', `:${eid}:`);
        el.innerHTML = `<img src="${emotes_url}${arg}">`;
  
        list.appendChild(el);
      });
    }
    if (tab.indexOf("ASCII") >= 0) {
      Object.keys(emotes_data.ascii).forEach(function(eid) {
        let el = document.createElement('div');
        el.className = 'xa-em-emote';
        el.setAttribute('data-xa-cmd', 'use-emote');

        let arg = emotes_data.ascii[eid];
  
        el.setAttribute('title', `:${eid}:`);
        el.innerHTML = `<img src="${emotes_url}${arg}">`;
  
        list.appendChild(el);
      });
    }
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
    style.textContent = css_to_add;
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

        emotes_data = data;
        re_emoji = new RegExp(":" + Object.keys(data.emoji).join(":|:") + ":", "g");
        re_emote = new RegExp(":" + Object.keys(data.emotes).join(":|:") + ":", "g");
        console.log(data);

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

  var temp = document.createElement('div');
  var quote_array = [];
  var quotes = message.querySelectorAll(event_classes);

  if (quotes.length) {
    for (let alink of quotes) {
      var clone = document.createElement('a');
      clone.setAttribute('class', 'tobeswitched')
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
          return `<img class="xae" data-xa-cmd="use-emote" title="${m}" src="${emotes_url}${emotes_data.emotes[m.split(':')[1]]}">`})
        .replace(re_emoji, function(m) {
          /* Emoji character, title for tooltip, data- to use like in menu */
          i++;
          if (i > max_emotes || disable_all_emotes) { // After max all others removed
            return "";
          }
          return `<abbr class="xae" data-xa-cmd="use-emote" title="${m}">${emotes_data.emoji[m.split(':')[1]]}</abbr>`});

  // Refresh
  quotes = message.querySelectorAll('.tobeswitched');

  // Swap back
  if (quotes.length) {
    for (i = 0; i < quotes.length; i++) {
      swapNodes(quote_array[i], quotes[i]);
    }
  }
  temp.remove();
}

/* These are all(maybe) the 4chanX classes that contain event listeners */
const event_classes = ".quotelink, .embedder, .audio, .bitchute, .clyp, .dailymotion, .gfycat, .gist, .image, .installgentoo, .liveleak, .pastebin, .peertube, .soundcloud, .streamable, .twitchtv, .twitter, .video, .vidlii, .vimeo, .vine, .vocaroo, .youtube"

const menu_html = `
<div id="xa-em-panel">
  <ul id="xa-em-tabs">
    <li class="xa-em-tabitem selected" data="emoji emotes">All</li>
    <li class="xa-em-tabitem" data="emoji">Emoji</li>
    <li class="xa-em-tabitem" data="emotes">Emotes</li>
    <li class="xa-em-tabitem" data="new">New</li>
    <li class="xa-em-tabitem" data="new">ASCII</li>
  </ul>
  <div id="xa-em-h"><div id="xa-em-x">Close</div></div>
  <div id="xa-em-l"></div>
  <div id="xa-em-i">Please do not use more than ${max_emotes} as they will not show up</div>
</div>
`;

/* This is all the css used to make the menu and others */
const css_to_add = `
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
  font-family: Arial, sans-serif;
  background: #a9acb5;
  pointer-events: all;
  user-select: none;
  color: #000;

  width: ${36 * emote_cols + 12}px;
  box-shadow: 0 0 32px #2e3b4dd9;
  box-sizing: border-box;
  border-radius: 8px;
  position: relative;
  padding: 6px;
}

#xa-em-h {
  text-align: center;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 6px;
  margin-top: 4px;
  height: 22px;
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
  flex-wrap: wrap;
  max-height: 75vh;
  overflow-y: auto;
  scrollbar-width: thin;
}

#xa-em-i {
  font-size: 14px;
  font-family: sans-serif;
  line-height: 16px;
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

abbr[title] {
  border-bottom: none !important;
  cursor: inherit !important;
  text-decoration: none !important;
}

#emote-select {
  cursor: pointer;
  float: right;
  height: 16px;
}

#xa-em-tabs {
  margin: 0;
  padding: 0;
  top: 10px;
  left: 9px;
  width: 100%;
  list-style: none;
  position: absolute;
}

.xa-em-tabitem {
  border-radius: 3px;
  border: 1px solid #777;
  padding: 1px 4px;
  float: left;
  margin-right: 6px;
}
.xa-em-tabitem:hover {
  border: 2px solid #444;
  padding: 0 3px;
}
.xa-em-tabitem.selected {
  border: 2px solid #666;
  padding: 0 3px;
}
`;
