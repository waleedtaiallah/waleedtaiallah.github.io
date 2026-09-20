$(function () {
    // https://www.coditty.com/code/how-to-detect-search-crawlers-using-javascript
    function botCheck() {
        var botPattern = "(googlebot\/|Googlebot-Mobile|Googlebot-Image|Google favicon|Mediapartners-Google|bingbot|slurp|java|wget|curl|Commons-HttpClient|Python-urllib|libwww|httpunit|nutch|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|biglotron|teoma|convera|seekbot|gigablast|exabot|ngbot|ia_archiver|GingerCrawler|webmon |httrack|webcrawler|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|bibnum.bnf|findlink|msrbot|panscient|yacybot|AISearchBot|IOI|ips-agent|tagoobot|MJ12bot|dotbot|woriobot|yanga|buzzbot|mlbot|yandexbot|purebot|Linguee Bot|Voyager|CyberPatrol|voilabot|baiduspider|citeseerxbot|spbot|twengabot|postrank|turnitinbot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|blekkobot|ezooms|dotbot|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|ahrefsbot|Aboundex|domaincrawler|wbsearchbot|summify|ccbot|edisterbot|seznambot|ec2linkfinder|gslfbot|aihitbot|intelium_bot|facebookexternalhit|yeti|RetrevoPageAnalyzer|lb-spider|sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|seokicks-robot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|blexbot|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|Lipperhey SEO Service|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Livelapbot|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|Twitterbot|OrangeBot|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|SemrushBot|yoozBot|lipperhey|y!j-asr|Domain Re-Animator Bot|AddThis)";
        var re = new RegExp(botPattern, 'i');
        var userAgent = navigator.userAgent;
        if (re.test(userAgent)) {
            return true;
        } else {
            return false;
        }
    }

    // Send data to the server
    // isAsync needs to be false for beforeunload
    function sendHumanData(isAsync) {
        if (arguments.length === 0) {
            isAsync = true;
        }
        if (isDataSent) {
            // Exit this function if the data was already sent
            return;
        }
        isDataSent = true;

        // Calculate how long the user spent on this page
        var dateTimeNow = new Date();
        var timeSpent = (dateTimeNow - dateTimeStart) / 1000;
        var postUrl = dirPath + lang + '/common/onlyhuman';
        dataToSend.userTimeSpent = timeSpent;

        if (navigator.sendBeacon && typeof 'Blob' != 'undefined') {
            // For modern browsers
            var blob = new Blob([$.param(dataToSend)], { type: 'application/x-www-form-urlencoded' });
            navigator.sendBeacon(postUrl, blob);
        } else {
            // For older browsers that don't support navigator.sendBeacon
            $.ajax({
                url: postUrl,
                async: isAsync,
                data: JSON.stringify(dataToSend),
                contentType: 'application/json',
                type: 'POST'
            });
        }
    }

    // Data that will be sent to the server
    var dataToSend = {
        controller: '',
        action: '',
        pageUrl: location.href,
        userIsAgentBot: false,
        referralUrl: '',
        userTimeSpent: 0,
        userIsScroll: false,
        userIsClick: false
    };

    var lang = 'en-CA';
    if (typeof userCulture != 'undefined') {
        // Newer: ResponsiveSite.master, _Layout.cshtml
        lang = userCulture;
    } else if (typeof culture != 'undefined') {
        // Legacy: Site.master
        lang = culture;
    }

    // dateTimeStart is used to calculate how long the user spent on the current page
    var dateTimeStart = new Date();

    // The ID from setTimeout
    var dataTimeout;

    // Boolean to indicate that data was already sent to the server
    var isDataSent = false;

    // Check if the user agent is a bot
    if (botCheck()) {
        dataToSend.userIsAgentBot = true;
    }
        
    // Referral url
    if (typeof humanData !== 'undefined') {
        dataToSend.referralUrl = humanData.referralUrl;
        dataToSend.controller = humanData.controller;
        dataToSend.action = humanData.action;
    } else if (document.referrer) {
        dataToSend.referralUrl = document.referrer;
    }

    // Check if the user scrolled the window
    $(window).one('scroll touchstart', function (event) {
        dataToSend.userIsScroll = true;
    });

    // Check if the user did a mouse click
    $(document).one('click', function (event) {
        dataToSend.userIsClick = true;
    });

    // Send the data after 10 seconds
    dataTimeout = setTimeout(sendHumanData, 10000);

    // Send the data if the user navigates away from the page before the above timeout goes off
    $(window).bind('beforeunload unload', function () {
        if (!isDataSent) {
            // Clear the timeout if the user navigates away before human data is sent to the server
            clearTimeout(dataTimeout);
            sendHumanData(false);
        }
    });
});