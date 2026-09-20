//detect browser and display a modal to inform user to use supported browsers
$(document).ready(function () {
    var userAgentString = window.navigator.userAgent;
    var isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Mobile/.test(userAgentString);
    var found = dectectNonSupportedBrowser(userAgentString, isMobile);
    if (found) {
        //validate url and show modal in homepage only
        if (/flyporter.com\/(en|fr)-(ca|us)\/$|en\/$/.test(window.location.href)) {
            document.getElementById("unsupported-browser-overlay").style.visibility = "visible";
        }
         //show modal in flight search and PNR modify
        if (document.getElementsByClassName("flight-search-result-container").length > 0 ||
            window.location.href.indexOf("my-bookings/modify") > 0 ||
            window.location.href.indexOf("packages/hotel-options") > 0) {
            $("#closeBtn-mobile").hide();
            $("#closeBtn").hide();
            document.getElementById("unsupported-browser-overlay").style.visibility = "visible";
        }
    }
});

function closeModal() {
    document.getElementById("unsupported-browser-overlay").style.visibility = "hidden";
};

function dectectNonSupportedBrowser(userAgentString, isMobile) {
    if (isMobile) {//for mobile
        if (((/(Chrome|CriOS)/.test(userAgentString) && !(/(OPR|OPT)/.test(userAgentString)))||
            (userAgentString.indexOf("Safari") > -1 && !(/(Chrome)/.test(userAgentString))) ||
            userAgentString.indexOf("Edg") > -1 || (/(Firefox|Mozilla|FxiOS)/.test(userAgentString)) ||
            (/(SAMSUNG|SamsungBrowser)/.test(userAgentString))) &&
            !(/(MSIE|Trident|UCBrowser|WebView|WKWebView)/.test(userAgentString))) {
            return false;
        }
        return true;
    }
    else { //for desktop
        if (((userAgentString.indexOf("Chrome") > -1 && !(/(OPR|Opera)/.test(userAgentString))) ||
            (userAgentString.indexOf("Safari") > -1 && userAgentString.indexOf("Chrome") === -1) ||
            userAgentString.indexOf("Edg") > -1 || (/(Firefox|Mozilla)/.test(userAgentString)) ||
            (/(SAMSUNG|SamsungBrowser)/.test(userAgentString))) &&
            !(/(MSIE|Trident|UCBrowser|WebView|WKWebView)/.test(userAgentString))) {
            return false;
        }
        return true;
    }
};