document.xURL = "https://poki.com/";

if (typeof consoleLog == "undefined") {
  consoleLog = console.log;
}

var originalEval = eval;
eval = function () {
  // consoleLog("--fx--eval--", arguments[0]);
  // debugger;
  arguments[0] = arguments[0].replace(
    "aHR0cHM6Ly9wb2tpLmNvbS9zaXRlbG9jaw==",
    "I3ViZzIzNQ==",
  );
  arguments[0] = arguments[0].replace("'location'", "'xlocation'");
  arguments[0] = arguments[0].replace("] = _0x3296f7;", "]==_0x3296f7;");
  arguments[0] = arguments[0].replace(
    "] = window[_0xcdc9(",
    "]==window[_0xcdc9(",
  );

  return originalEval.apply(this, arguments);
};

navigator.sendBeacon = function () {
  consoleLog("--fx--navigator.sendBeacon--", arguments);
};

WebSocket = function () {};

xlocation = new Proxy(location, {
  get: function (target, property, receiver) {
    consoleLog("--fx--xlocation--get--property--", property);
    let targetObj = target[property];
    if (typeof targetObj == "function") {
      return (...args) => target[property].apply(target, args);
    } else {
      if (property == "host" || property == "hostname") {
        return "localhost";
      }
      if (property == "href") {
        return "https://localhost/";
      }
      if (property == "origin") {
        return "https://localhost/";
      }
      return targetObj;
    }
  },
  set: function (target, property, receiver) {
    consoleLog("--fx--xlocation--set--property--", property, receiver);
    return true;
  },
});

xwindow = new Proxy(window, {
  get: function (target, property, receiver) {
    // consoleLog("--fx--xWindow--property--", property, receiver);
    if (typeof target[property] == "function") {
      return (...args) => target[property].apply(target, args);
    } else {
      if (property == "location") {
        return target["xlocation"];
      }
      // consoleLog("--fx--xwindow--targetObj--", targetObj);
      return target[property];
    }
  },
});
// consoleLog(xwindow.location.href);
// consoleLog("window.xlocation.href", window.xlocation.href);

PokiSDK = function () {
  // ***** UTILS *****
  function loadJS(FILE_URL, callback) {
    let scriptEle = document.createElement("script");

    scriptEle.setAttribute("src", FILE_URL);
    scriptEle.setAttribute("type", "text/javascript");
    scriptEle.setAttribute("async", true);

    document.body.appendChild(scriptEle);

    // Success
    scriptEle.addEventListener("load", () => {
      consoleLog("--fx--PokiSDK--loadJS Done--");
      callback(true);
    });

    // Error
    scriptEle.addEventListener("error", () => {
      consoleLog("--fx--PokiSDK--loadJS Error--");
      callback(false);
    });
  }

  this.getURLParam = function (name) {
    return "";
  };

  // ***** INIT *****
  this.init = function () {
    return new Promise((resolve, reject) => {
      resolve("InitDone");
    });
  };

  this.setDebug = function (debug) {
    consoleLog("--fx--PokiSDK--setDebug--", debug);
  };

  this.setDebugTouchOverlayController = function (debug) {
    consoleLog("--fx--PokiSDK--setDebugTouchOverlayController--", debug);
  };

  this.isAdBlocked = function () {
    consoleLog("--fx--PokiSDK--isAdBlocked--");
    return false;
  };

  this.happyTime = function (scale) {
    consoleLog("--fx--PokiSDK--happyTime--", scale);
  };

  // ***** LOADING *****
  this.gameLoadingStart = function () {
    consoleLog("--fx--PokiSDK--gameLoadingStart--");
  };

  this.gameLoadingProgress = function (progress) {
    consoleLog("--fx--PokiSDK--gameLoadingProgress--", progress);
  };

  this.gameLoadingFinished = function () {
    consoleLog("--fx--PokiSDK--gameLoadingFinished--");
  };

  // ***** GAME CONTROL *****
  this.gameplayStart = function () {
    consoleLog("--fx--PokiSDK--gameplayStart--");
  };

  this.gameplayStop = function () {
    consoleLog("--fx--PokiSDK--gameplayStop--");
  };

  // ***** ADS CONTROL *****
  this.commercialBreak = function () {
    consoleLog("--fx--PokiSDK--commercialBreak-- (bypassed)");
    return new Promise((resolve, reject) => {
      // Immediately resolve without loading ad script
      resolve(true);
    });
  };

  this.rewardedBreak = function () {
    consoleLog("--fx--PokiSDK--rewardedBreak-- (bypassed - granting free reward)");
    return new Promise((resolve, reject) => {
      // Immediately resolve without loading ad script - grant free reward
      resolve(true);
    });
  };

  this.displayAd = function () {
    consoleLog("--fx--PokiSDK--displayAd--", arguments);
  };

  this.destroyAd = function () {
    consoleLog("--fx--PokiSDK--destroyAd--", arguments);
  };
};

PokiSDK.prototype.initWithVideoHB = function () {
  consoleLog("--fx--PokiSDK--initWithVideoHB--");
  return new Promise((resolve, reject) => {
    resolve("");
  });
};

PokiSDK.prototype.customEvent = function () {
  consoleLog("--fx--PokiSDK--customEvent--");
};

PokiSDK.prototype.sendHighscore = function (score) {
  consoleLog("--fx--PokiSDK--sendHighscore--", score);
  window.gameScore = score;
  try {
    window.parent.postMessage({ type: "gameScore", score: score }, "*");
  } catch (e) {}
};

(function () {
  var originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    if (/score|highscore|points/i.test(key)) {
      try {
        window.parent.postMessage(
          { type: "gameScore", score: Number(value) },
          "*",
        );
      } catch (e) {}
    }
    return originalSetItem.apply(this, arguments);
  };

  var originalLog = console.log;
  console.log = function () {
    var args = Array.prototype.slice.call(arguments);
    var msg = args.join(" ");
    if (msg.match(/score/i)) {
      var nums = msg.match(/\d+/g);
      if (nums && nums.length > 0) {
        var score = parseInt(nums[nums.length - 1], 10);
        if (!isNaN(score) && score > 0) {
          try {
            window.parent.postMessage({ type: "gameScore", score: score }, "*");
          } catch (e) {}
        }
      }
    }
    return originalLog.apply(this, arguments);
  };

  var scoreInterval = setInterval(function () {
    var foundScore = null;
    if (window.game && window.game.scene && window.game.scene.keys) {
      var scenes = window.game.scene.keys;
      for (var key in scenes) {
        var scene = scenes[key];
        var candidates = [
          scene.score,
          scene.Score,
          scene.runScore,
          scene.currentScore,
          scene.points,
          scene.highScore,
          scene.highscore,
          scene.playerScore,
          scene.myScore,
          scene.bestScore,
        ];
        for (var i = 0; i < candidates.length; i++) {
          var val = candidates[i];
          if (typeof val === "number" && !isNaN(val) && val > 0) {
            foundScore = val;
            break;
          }
        }
        if (foundScore) break;
      }
    }
    if (foundScore) {
      try {
        localStorage.setItem("_ubg235_score", String(foundScore));
        window.parent.postMessage(
          { type: "gameScore", score: foundScore },
          "*",
        );
        window.parent.localStorage.setItem("_ubg235_score", String(foundScore));
      } catch (e) {}
    }
  }, 500);
})();

PokiSDK = new PokiSDK();
