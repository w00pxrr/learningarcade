((document.xURL = "https://poki.com/"),
  "undefined" == typeof consoleLog && (consoleLog = console.log));
var originalEval = eval;
((eval = function () {
  return originalEval.apply(this, arguments);
}),
  (navigator.sendBeacon = function () {
    consoleLog("--fx--navigator.sendBeacon--", arguments);
  }),
  (WebSocket = function () {}),
  (PokiSDK = function () {
    ((this.getURLParam = function (o) {
      return "";
    }),
      (this.init = function () {
        return new Promise((o, e) => {
          o("InitDone");
        });
      }),
      (this.setDebug = function (o) {
        consoleLog("--fx--PokiSDK--setDebug--", o);
      }),
      (this.setDebugTouchOverlayController = function (o) {
        consoleLog("--fx--PokiSDK--setDebugTouchOverlayController--", o);
      }),
      (this.isAdBlocked = function () {
        return (consoleLog("--fx--PokiSDK--isAdBlocked--"), !1);
      }),
      (this.happyTime = function (o) {
        consoleLog("--fx--PokiSDK--happyTime--", o);
      }),
      (this.gameLoadingStart = function () {
        consoleLog("--fx--PokiSDK--gameLoadingStart--");
      }),
      (this.gameLoadingProgress = function (o) {
        consoleLog("--fx--PokiSDK--gameLoadingProgress--", o);
      }),
      (this.gameLoadingFinished = function () {
        consoleLog("--fx--PokiSDK--gameLoadingFinished--");
      }),
      (this.gameplayStart = function () {
        consoleLog("--fx--PokiSDK--gameplayStart--");
      }),
      (this.gameplayStop = function () {
        consoleLog("--fx--PokiSDK--gameplayStop--");
      }),
      (this.commercialBreak = function () {
        return (
          consoleLog("--fx--PokiSDK--commercialBreak-- (bypassed)"),
          new Promise((o, e) => {
            o(!0);
          })
        );
      }),
      (this.rewardedBreak = function () {
        return (
          consoleLog(
            "--fx--PokiSDK--rewardedBreak-- (bypassed - granting free reward)",
          ),
          new Promise((o, e) => {
            o(!0);
          })
        );
      }),
      (this.displayAd = function () {
        consoleLog("--fx--PokiSDK--displayAd--", arguments);
      }),
      (this.destroyAd = function () {
        consoleLog("--fx--PokiSDK--destroyAd--", arguments);
      }));
  }),
  (PokiSDK.prototype.initWithVideoHB = function () {
    return (
      consoleLog("--fx--PokiSDK--initWithVideoHB--"),
      new Promise((o, e) => {
        o("");
      })
    );
  }),
  (PokiSDK.prototype.customEvent = function () {
    consoleLog("--fx--PokiSDK--customEvent--");
  }),
  (PokiSDK.prototype.sendHighscore = function (o) {
    (consoleLog("--fx--PokiSDK--sendHighscore--", o), (window.gameScore = o));
    try {
      window.parent.postMessage({ type: "gameScore", score: o }, "*");
    } catch (o) {}
  }),
  (function () {
    var o = localStorage.setItem;
    localStorage.setItem = function (e, n) {
      if (/score|highscore|points/i.test(e))
        try {
          window.parent.postMessage(
            { type: "gameScore", score: Number(n) },
            "*",
          );
        } catch (o) {}
      return o.apply(this, arguments);
    };
    var e = console.log;
    ((console.log = function () {
      var o = Array.prototype.slice.call(arguments).join(" ");
      if (o.match(/score/i)) {
        var n = o.match(/\d+/g);
        if (n && n.length > 0) {
          var t = parseInt(n[n.length - 1], 10);
          if (!isNaN(t) && t > 0)
            try {
              window.parent.postMessage({ type: "gameScore", score: t }, "*");
            } catch (o) {}
        }
      }
      return e.apply(this, arguments);
    }),
      setInterval(function () {
        var o = null;
        if (window.game && window.game.scene && window.game.scene.keys) {
          var e = window.game.scene.keys;
          for (var n in e) {
            for (
              var t = e[n],
                i = [
                  t.score,
                  t.Score,
                  t.runScore,
                  t.currentScore,
                  t.points,
                  t.highScore,
                  t.highscore,
                  t.playerScore,
                  t.myScore,
                  t.bestScore,
                ],
                r = 0;
              r < i.length;
              r++
            ) {
              var c = i[r];
              if ("number" == typeof c && !isNaN(c) && c > 0) {
                o = c;
                break;
              }
            }
            if (o) break;
          }
        }
        if (o)
          try {
            (localStorage.setItem("_currentGameScore", String(o)),
              window.parent.postMessage({ type: "gameScore", score: o }, "*"),
              window.parent.localStorage.setItem(
                "_currentGameScore",
                String(o),
              ));
          } catch (o) {}
      }, 500));
  })(),
  (PokiSDK = new PokiSDK()));
