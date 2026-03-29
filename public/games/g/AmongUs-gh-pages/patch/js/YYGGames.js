("undefined" == typeof consoleLog && (consoleLog = console.log),
  (YYG = {
    TYPE: { INTERSTITIAL: 0, REWARD: 1 },
    Event: { YYGSDK_INITIALIZED: 1 },
    EventHandler: {
      create: function (o, e) {
        (consoleLog("--fx--YYG--EventHandler--create--", arguments), e());
      },
    },
  }),
  (YYGamesList = [
    {
      id: "3814",
      name: "Princess Glitter Coloring",
      thumb: "patch/images/null.png",
      appName: "Princess-Glitter-Coloring",
    },
    {
      id: "3509",
      name: "Princess Salon Frozen Party",
      thumb: "patch/images/null.png",
      appName: "Princess-Salon-Frozen-Party",
    },
  ]),
  (YYGGames = function () {
    function o(o, e) {
      let t = document.createElement("script");
      (t.setAttribute("src", o),
        t.setAttribute("type", "text/javascript"),
        t.setAttribute("async", !0),
        document.body.appendChild(t),
        t.addEventListener("load", () => {
          (console.log("--fx--gdsdk--loadJS Done--"), e(!0));
        }),
        t.addEventListener("error", () => {
          (console.log("--fx--gdsdk--loadJS Error--"), e(!1));
        }));
    }
    ((this.forgames = YYGamesList),
      (this.init = function (o, e) {
        return (
          consoleLog("--fx--YYGGames--init--", arguments),
          (this.appName = o),
          setTimeout(e, 1e3),
          !0
        );
      }),
      (this.__init__ = function () {
        consoleLog("--fx--YYGGames--__init__--", arguments);
      }),
      (this.icon = {}),
      (this.gameBox = { game1: {}, game2: {} }),
      (this.gameBanner = {}),
      (this.startupByYad = function (o) {
        console.log("--fx--YYGGames--startupByYad--", o);
      }),
      (this.startup = function (o) {
        (consoleLog("--fx--YYGGames--startup--", o), o.complete());
      }),
      (this.getForgames = function () {
        return (
          consoleLog("--fx--YYGGames--channel--", arguments),
          new Promise((o, e) => {
            o(this.forgames);
          })
        );
      }),
      (this.getAdPlatformType = function () {
        return (
          consoleLog("--fx--YYGGames--getAdPlatformType--", arguments),
          !0
        );
      }),
      (this.canShowReward = function () {
        return (consoleLog("--fx--canShowReward--", arguments), !0);
      }),
      (this.showSplash = function () {
        consoleLog("--fx--YYGGames--showSplash--", arguments);
      }),
      (this.showInterstitial = function (e) {
        return (
          consoleLog("--fx--showInterstitial--", arguments),
          o("about:blank", (o) => {
            (o
              ? console.log("--fx--showInterstitial--Done--")
              : console.log("--fx--showInterstitial--Rejected--"),
              e());
          }),
          !0
        );
      }),
      (this.showReward = function (e) {
        (consoleLog("--fx--showReward--", arguments),
          o("about:blank", (o) => {
            o
              ? (console.log("--fx--showReward--Done--"), e())
              : console.log("--fx--showReward--Rejected--");
          }));
      }),
      (this.onAfterShowAd = function (o) {
        return (consoleLog("--fx--onAfterShowAd--", arguments), o(), !0);
      }),
      (this.on = function (o, e) {
        return (consoleLog("--fx--event--", o), !0);
      }),
      (this.adsManager = {
        request: function (arguments) {
          consoleLog("--fx--adsManager--request--", arguments);
        },
      }),
      (this.navigate = function (o, e, t) {
        consoleLog("--fx--YYGGames--navigate--", o, e, t);
      }));
  }),
  (YYGGames = new YYGGames()));
