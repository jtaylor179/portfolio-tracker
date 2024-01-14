/*
This is your site JavaScript code - you can add interactivity and carry out processing
- Initially the JS writes a message to the console, and moves a button you can add from the README
*/

// Print a message in the browser's dev tools console each time the page loads
// Use your menus or right-click / control-click and choose "Inspect" > "Console"
console.log("Hello from glitch 🌎");

var index = 0;
var stocks = [
  "MMM",
  "WBD",
  "SWAV",
  "LNTH",
  "CELH",
  "LI",
  "HALO",
  "SCU",
  "MELI",
  "BROS",
  "UUP",
  "AMZN",
  "ENB",
  "MMP",
  "TNA",
  "MO",
  "EPD",
  "CRM",
  "BNDX",
  "SNOW",
  "NOW",
  "TECS",
  "TECL",
  "O",
  "SQ",
  "UPST",
  "AAPL",
  "AMZN",
  "BOIL",
  "COM",
  "CORN",
  "CURE",
  "DM",
  "DRN",
  "EDC",
  "EDZ",
  "EPAM",
  "ERY",
  "EWS",
  "F",
  "FAS",
  "CXW",
  "FIVE",
  "GOOG",
  "GSK",
  "L",
  "LABU",
  "LLY",
  "M",
  "MP",
  "MSFT",
  "NRZ",
  "PILL",
  "PLNT",
  "PLTR",
  "PYPL",
  "RUN",
  "SAM",
  "SH",
  "SJB",
  "SLX",
  "SOXL",
  "SOXS",
  "SQ",
  "SQQQ",
  "T",
  "TBX",
  "TNK",
  "TZA",
  "XLE",
  "XLRE",
  "VIXY",
  "WOOD",
  "DDD",
];

// url https://tvc4.investing.com/init.php?family_prefix=tvc4&carrier=615bca0a5a51af775ac1b774a5323123&time=1635741342&domain_ID=1&lang_ID=1&timezone_ID=8&pair_ID=22459&interval=86400&refresh=24&session=session&client=1&user=202678500&width=650&height=750&init_page=instrument&m_pids=&watchlist=&site=https://www.investing.com
async function setNext() {
  //var ref = document.querySelector('.symbol-edit');
  //var i1 = document.querySelector('id = tvc_frame_');
  // await import("https://cdn.skypack.dev/@material/mwc-button@^0.25.3");

  // get a reference
  var symbolRef = document.body
    .querySelectorAll("iframe")[0]
    .contentWindow.document.querySelector(".symbol-edit");
  var containerRef = symbolRef.closest(".left");

  if (symbolRef) {
    debugger;
    var symbol = stocks[index];

    let fevent = new MouseEvent("focus", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    symbolRef.dispatchEvent(fevent);
    await timeoutResolver(2000);

    symbolRef.value = "";
    let nEvent = new Event("input", {
      bubbles: true,
      cancelable: true,
    });

    symbolRef.dispatchEvent(nEvent);

    await timeoutResolver(2000);
    symbolRef.value = stocks[index];
    symbolRef.dispatchEvent(nEvent);

    //     ref.closest('document').window.dispatchEvent(new KeyboardEvent('keydown', {
    //   key: "e",
    //   keyCode: 69,
    //   code: "KeyE",
    //   which: 69,
    //   shiftKey: false,
    //   ctrlKey: false,
    //   metaKey: false
    // }));
    await timeoutResolver(2000);

    // timeout
    //document.querySelector("[data-item-ticker]").click();
    let body = symbolRef.closest("body");
    body.querySelector(".header-group-undo-redo").click();

    await timeoutResolver(2000);
    if (body.querySelector("[data-item-ticker]")) {
      body.querySelector("[data-item-ticker]").click();

      if (index >= stocks.length - 1) {
        index = 0;
      } else {
        index++;
      }
    }
    symbolRef.value = "";
    let bEvent = new MouseEvent("blur", {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    symbolRef.dispatchEvent(bEvent);
  }
  window.setTimeout(setNext, 30000);
}

function timeoutResolver(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(function () {
      resolve(true);
    }, ms);
  });
}

debugger;

window.setTimeout(setNext, 5000);

