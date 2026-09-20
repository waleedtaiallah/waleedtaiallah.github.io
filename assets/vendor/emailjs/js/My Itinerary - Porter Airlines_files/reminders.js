    var reminders = {
    	moduleName: 'reminders'
    	, base: '.reminders' // jQuery base
    	, debug: false // controls logging
    	// , isIE8: $("html").hasClass('ie8')
    	, alert: function(val) {
    	    if (this.debug) {
    	        window.alert(val);
    	    }
    	}
    	, log: function(val) {
    	    if (this.debug && !porter.util.isIE8) {
    	        console.log(val);
    	    }
    	}
        , importOptions: function(options) {

        	if (typeof options == "object") {
                reminders = $.extend({}, this, options || {});
                $(window).trigger(this.moduleName + ':imported');
        	}
        }
        ,initVariables: function() {
        	this.fbLink         = $(this.base).find('.icon-facebook').parent();
        	this.twLink         = $(this.base).find('.icon-twitter').parent();
            this.gcal           = $(this.base).find('.gcal');
            this.numOfJourneys  = porter.itinerary.data.Booking.Journeys.length;
        }
        , initEvents: function() {
            var self = this;
            $(window).on( "smallBreakpointEnter", function( e ) {
                self.smallBreakpointEnter();
            })

            $(window).on( "largeBreakpointEnter", function( e ) {
                self.largeBreakpointEnter();
            })

//            $(this.fbLink).on( "click", function( e ) {
//            	e.preventDefault();
//                self.shareItineraryWith('fb');
//            });

//            $(this.twLink).on( "click", function( e ) {
//                e.preventDefault();
//                self.shareItineraryWith('tw');
//            });

            $(this.gcal).on( "click", function( e ) {
            	e.preventDefault();
                self.addReminderToGoogleCalendar();
            });
        }

        , smallBreakpointEnter: function() {
            this.log(this.moduleName + ':onSmallBreakpointEnter');
        }

        , largeBreakpointEnter: function() {
            this.log(this.moduleName + ':onLargeBreakpointEnter');
        }

        , addReminderToGoogleCalendar: function() {
            var numOfJourneys = this.numOfJourneys;
            var tabid = porter.util.getParameterByName("tabid");

            if(numOfJourneys > 0) {
                for (var i = 0; i < numOfJourneys; i++) {
                    var url = porter.getUrlWithCulture("Special-Offers/Add-Reminder-To-Google-Calendar?idx=" + i);
                    if (!_.isEmpty(tabid)) {
                        url += '&tabID=' + tabid;
                    }
                    window.open(url);
                }
            }
        }

        , shareItineraryWith: function(socialMedia) {
        	var r = reminders; // losing scope when using 'this'
    		var smURL = r.shareDetails[socialMedia].baseUrl + r.shareDetails[socialMedia].title + r.shareDetails[socialMedia].url;
    		smURL += '&' + r.shareDetails.common.part1 + r.shareDetails.common.part2 + r.shareDetails.common.part3 + r.shareDetails.common.part4;

    		if (socialMedia=='fb') {
    		    smURL += r.shareDetails[socialMedia].imageUrl;
    		}

    		window.open(smURL);        		

    		//track via google
    		//setTimeout(function () { _gaq.push(['_trackPageview', '/PostPurchase/ShareOnFB']); }, 1000);

                      /* https://twitter.com/share?
            url=https%3A%2F%2Fdev.twitter.com%2Fweb%2Ftweet-button&
            via=twitterdev&
            related=twitterapi%2Ctwitter&
            hashtags=example%2Cdemo&
            text=custom%20share%20text" */
	    }
        
    	, init: function() {
    		this.log('init:' + this.moduleName);
    		//this.importOptions(itineraryRemindersOptions);

            this.initVariables();
            this.initEvents();
    	}
    };