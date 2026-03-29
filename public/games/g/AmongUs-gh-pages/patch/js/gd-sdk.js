((gdsdk = function () {
  function e(e, o) {
    let n = document.createElement("script");
    (n.setAttribute("src", e),
      n.setAttribute("type", "text/javascript"),
      n.setAttribute("async", !0),
      document.body.appendChild(n),
      n.addEventListener("load", () => {
        (console.log("--fx--gdsdk--loadJS Done--"), o(!0));
      }),
      n.addEventListener("error", () => {
        (console.log("--fx--gdsdk--loadJS Error--"), o(!1));
      }));
  }
  ((this.getSession = function () {
    return new Promise((e, o) => {
      e(!0);
    });
  }),
    (this.AdType = {
      Rewarded: "rewarded",
      Interstitial: "interstitial",
      Preroll: "interstitial",
      Midroll: "interstitial",
      Display: "display",
    }),
    (this.Interstitial = function () {
      console.log("--gdsdk--Interstitial--", arguments);
    }),
    (this.preloadAd = function () {
      return (
        console.log("--gdsdk--preloadAd--"),
        window.GD_OPTIONS.onEvent({
          name: "SDK_READY",
          message: "Everything is ready.",
          status: "success",
        }),
        new Promise((e, o) => {
          e(!0);
        })
      );
    }),
    (this.cancelAd = function () {
      return new Promise((e, o) => {
        e(!0);
      });
    }),
    (this.showAd = function (o) {
      return (
        console.log("--gdsdk--showAd--", o, arguments),
        new Promise(
          "rewarded" == o
            ? (o, n) => {
                e("about:blank", (e) => {
                  e
                    ? (console.log("--fx--showAd--Done--"),
                      window.GD_OPTIONS.onEvent({
                        name: "SDK_REWARDED_WATCH_COMPLETE",
                        message: "Rewarded",
                        status: "success",
                      }),
                      window.GD_OPTIONS.onEvent({
                        name: "SDK_GAME_START",
                        message: "No Message",
                      }),
                      o(!0))
                    : (console.log("--fx--showAd--Rejected--"),
                      window.GD_OPTIONS.onEvent({
                        name: "SDK_GAME_START",
                        message: "Reward Skip!",
                        status: "success",
                      }),
                      n(!1));
                });
              }
            : (o, n) => {
                e("about:blank", (e) => {
                  (window.GD_OPTIONS.onEvent({
                    name: "SDK_GAME_START",
                    message: "No Message",
                  }),
                    o(!0));
                });
              },
        )
      );
    }),
    (this.showBanner = function () {
      return (
        console.log("--gdsdk--showBanner--", arguments),
        new Promise((o, n) => {
          e("about:blank", (e) => {
            (window.GD_OPTIONS.onEvent({
              name: "SDK_GAME_START",
              message: "Reward Skip!",
            }),
              e
                ? (console.log("--fx--showBanner--Done--"), o(!0))
                : (console.log("--fx--showBanner--Rejected--"), n(!1)));
          });
        })
      );
    }),
    (this.sendEvent = function () {
      console.log("--gdsdk--sendEvent--", arguments);
    }),
    (this.openConsole = function () {
      console.log("--gdsdk--openConsole--", arguments);
    }),
    (this.leaderboard = { addScore: function () {}, show: function () {} }));
  try {
    window.GD_OPTIONS.onEvent({
      name: "SDK_READY",
      message: "Everything is ready.",
      status: "success",
    });
  } catch (e) {}
}),
  (gdsdk = new gdsdk()),
  (xlocation = new Proxy(location, {
    get: function (e, o, n) {
      console.log("--fx--xlocation--get--property--", o);
      let t = e[o];
      return "function" == typeof t
        ? (...n) => e[o].apply(e, n)
        : "host" == o || "hostname" == o
          ? "localhost"
          : "href" == o || "origin" == o
            ? "https://localhost/"
            : t;
    },
    set: function (e, o, n) {
      return (console.log("--fx--xlocation--set--property--", o, n), !0);
    },
  })),
  (xwindow = new Proxy(window, {
    get: function (e, o, n) {
      return "function" == typeof e[o]
        ? (...n) => e[o].apply(e, n)
        : "location" == o
          ? e.xlocation
          : e[o];
    },
  })),
  (op3n = function () {
    (console.trace("--fx--op3n--", arguments),
      window.open("https://ads.games235.com/"));
  }));
