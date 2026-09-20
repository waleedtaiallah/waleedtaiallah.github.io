
var porter = porter || {};

(function () {
    $.extend(porter, {
        CODES: {
            BAG: 'BAG',
            SEAT: 'SET'
        },
        // Porter.Core.Reservations.Constants.ChargeType
        CHARGE_TYPE: {
            DISCOUNT: 1,
            TAX: 5,
            NOTE: 13
        },
        PAX_TYPE: {
            ADT: 'ADT',
            CHD: 'CHD'
        },
        PAYMENT_METHOD: {
            LOYALTY: 6
        },
        getGroupedSum: function (grouped) {
            var arr = [];
            for (group in grouped) {
                arr.push({
                    chargeCode: _.first(grouped[group]).chargeCode,
                    feeDetail: _.first(grouped[group]).feeDetail,
                    amount: _.reduce(grouped[group], function (memo, g) {
                        return memo + g.amount();
                    }, 0),
                    item: _.max(grouped[group], function (bag) {
                        return bag.getBagCount ? bag.getBagCount() : 0;
                    })
                });
            }
            return arr;
        },
        getGroupedSumLast: function (grouped) {
            var arr = [];
                        
            for (group in grouped) {                
                var bookingFee = new BookingFee();
                bookingFee.chargeCode(_.last(grouped[group]).chargeCode);
                bookingFee.feeDetail(_.last(grouped[group]).feeDetail);
                bookingFee.amount(_.reduce(grouped[group], function (memo, g) {
                        return memo + g.amount();
                    }, 0));
                bookingFee.flightReference(_.first(grouped[group]).flightReference);
                arr.push(bookingFee);

                /*
                arr.push({
                    chargeCode: _.last(grouped[group]).chargeCode,
                    feeDetail: _.last(grouped[group]).feeDetail,
                    amount: ko.observable(_.reduce(grouped[group], function (memo, g) {
                        return memo + g.amount();
                    }, 0)),
                    flightReference: _.first(grouped[group]).flightReference                            
                });
                */
            }
            return arr;
        },
        getGroupedSumFunc: function (grouped) {
            var arr = [];
            for (group in grouped) {
                arr.push({
                    chargeCode: _.first(grouped[group]).chargeCode(),
                    feeDetail: _.first(grouped[group]).feeDetail(),
                    amount: _.reduce(grouped[group], function (memo, g) {
                        return memo + g.amount();
                    }, 0)
                });
            }
            return arr;
        },        
        /*
        getGroupedSumTop: function (grouped) {
            var groups = _.groupBy(grouped, function (item) {
                return item.flightReference();
                //return item.flightReference() + '#' + item.chargeCode();
            });            
    
            var keys = _.keys(groups);                        
            var out = [];

            _.each(keys, function(key) {
                var result = _.max(groups[key], function(item){ 
                    return item.amount();
                });

                out.push(result)
            })        
            return out;                
        },
        */  
        getJourneyIndex: function(journeys, flightReference){
           if(flightReference != ""){
            var regex = "([0-9]{4})([0-9]{2})([0-9]{2}).*?([0-9]+)"; // 20141127 PD 426 YULYTZ
            var matches = flightReference.match(regex);
            var index=0;
            for (var x=0;x<journeys.length;x++){
            var journey = journeys[x].Journey;
                var flightNumber = journey.JourneySellKey.substring(0, 8);
                if(matches.length === 5 && journey.JourneySellKey.indexOf(matches[2] + '/' + matches[3] + '/' + matches[1]) > 0 && flightNumber.indexOf(matches[4]) > 0)
                        return index;
                    index++;
                }
                return index;        
            }
        },
        getAirportName: function (stationCode) {
            if (this.jsonStations.Airports) {
                return this.jsonStations.Airports[stationCode];
            }
            return stationCode;
        },
        getStationName: function (stationCode) {
            if (this.jsonStations.Names) {
                return this.jsonStations.Names[stationCode];
            }
            return stationCode;
        },
    });

    var BookingSummaryPassenger = function () {
        this.name = ko.observable({
            first: ko.observable(''),
            last: ko.observable(''),
            middle: ko.observable('')
        });
        this.infant = ko.observable({
            name: ko.observable({
                first: ko.observable(''),
                last: ko.observable(''),
                middle: ko.observable('')
            })
        });
        this.hasInfant = ko.observable(false);
        this.passengerNumber = ko.observable();
        this.customerNumber = ko.observable();
        this.seats = ko.observableArray();
        this.flightFares = ko.observableArray();
        this.flightTaxes = ko.observableArray();
        this.insurances = ko.observableArray();
        this.bags = ko.observableArray();
        this.bagsBDL = ko.observableArray();
        this.gateBags = ko.observableArray();
        this.ssrs = ko.observableArray();
        this.points = ko.observableArray();
        
        this.serviceFees = ko.observableArray();
        this.newFeesOnly = ko.observable();
        //this.showSeats = ko.observable(true);
        this.showSeatsDetail = ko.observable(false);
        //this.showBags = ko.observable(true);
        this.showBagsDetail = ko.observable(false);
        this.showSSRsDetail = ko.observable(false);
        this.showSeatsTaxSummary = ko.observable(false);
        this.showSSRsTaxSummary = ko.observable(false);
        this.showBagsTaxSummary = ko.observable(false);
        this.showSSRTaxSummary = ko.observable(false);
        this.showInsuranceTaxSummary = ko.observable(false);
        this.showFareTaxSummary = ko.observable(true);
        this.showSeatsTaxDetail = ko.observable(false);
        this.showInsurance = ko.observable(true);        
        this.showInsuranceDetail = ko.observable(false);
        this.showBagsTaxDetail = ko.observable(false);
        this.showSSRsTaxDetail = ko.observable(false);
        this.showInsuranceTaxDetail = ko.observable(true);

        this.paxType = ko.observable(porter.PAX_TYPE.ADT);
        this.onCheckInPage = ko.observable(false);


        this.showFareFees = ko.observable(true);
        this.showSeatFees = ko.observable(true);
        this.showBagFees = ko.observable(true);

        //this.allowCarryOn = ko.observable(true);
        //this.isBasicFare = ko.observable(true);

        /*
        var TotalsPerSegment = function () {
            this.amount = ko.observable(0);
            this.flight = ko.observable();            
        };
        */



        this.toggleSeatsDetail = function (pax, fee) {
            
            /*
            this.showSeatsDetail(!this.showSeatsDetail());
            this.showSeatsTaxSummary(!this.showSeatsTaxSummary());
            this.showSeatsTaxDetail(false);
            */

            pax.showSeatsDetail(!pax.showSeatsDetail());
            pax.showSeatsTaxSummary(!pax.showSeatsTaxSummary());
            pax.showSeatsTaxDetail(false);
        };
        this.toggleSSRsDetail = function () {
            this.showSSRsDetail(!this.showSSRsDetail());
            this.showSSRsTaxSummary(!this.showSSRsTaxSummary());
            this.showSSRsTaxDetail(false);
        };

        this.toggleBagsDetail = function () {
            this.showBagsDetail(!this.showBagsDetail());
            this.showBagsTaxSummary(!this.showBagsTaxSummary());
            this.showBagsTaxDetail(false);
        };
        
        this.toggleInsuranceTaxDetail = function () {
            this.showBagsDetail(!this.showInsuranceDetail());
            this.showInsuranceTaxSummary(!this.showInsuranceTaxSummary());
            this.showInsuranceTaxDetail(false);
        };

        this.toggleSeatsTaxDetail = function () {
            this.showSeatsTaxDetail(!this.showSeatsTaxDetail());
        };

        this.toggleSSRsTaxDetail = function () {
            this.showSSRsTaxDetail(!this.showSSRsTaxDetail());
        };

        this.toggleBagsTaxDetail = function () {
            this.showBagsTaxDetail(!this.showBagsTaxDetail());
        };

        

        this.totalSeatAmtBySegment = function (flight) {
            var total = 0;            
            if (this.seats()) {                  
                for (var seat in this.seats()) {
                    var item = this.seats()[seat];
                    //if (item.flightReference() == flight){
                    if (flight.indexOf(item.flightReference()) >= 0){    
                        total += item.amount();
                    }
                }
            }                        
            return total;
        };

        this.totalBagsBySegment = function (flight) {
            var bags = _.filter(this.bagFeesTop(), function (item) {
                return item.flightReference() == flight;
            });

            if (bags.length > 0)
                return bags[0].getBagCount();
            else
                return 0;

        };

        this.totalBDLBagsBySegment = function (flight) {
            var bags = _.filter(this.bagBDLFeesTop(), function (item) {
                return item.flightReference() == flight;
            });

            if (bags.length > 0)
                return bags[0].getBagCount();
            else
                return 0;

        };

        this.totalBagsAmtBySegment = function (flight) {
            /*
            var total = 0;            
            if (this.bags()) {                  
                for (var bag in this.bags()) {
                    var item = this.bags()[bag];
                    if (item.flightReference() == flight){
                        total += item.amount();
                    }
                }
            }                        
            return total;
            */

            var bagFees = _.filter(this.bagFeesTop(), function (item) {
                return item.flightReference() == flight;
            });

            var fees = _.reduce(bagFees, function (memo, fee) {
                return memo + fee.amount();
            }, 0);

            var bagTaxes = _.filter(this.bagTaxesTop(), function (item) {
                return item.flightReference() == flight;
            });
            var taxes = _.reduce(bagTaxes, function (memo, fee) {
                return memo + fee.amount();
            }, 0);

            // updated bag SSR
           
            var ssrs = _.filter(this.bagSsrFees(), function (item) {

                return item.flightReference() == flight;
            });

            var SSRsfees = _.reduce(ssrs, function (memo, fee) {   // this.ssrs() was removed as it needs to take the one above this
                return memo + fee.amount();
            }, 0);

            return fees + taxes + SSRsfees;

        }

        this.totalBagsBDLAmtBySegment = function (flight) {
            /*
            var total = 0;            
            if (this.bags()) {                  
                for (var bag in this.bags()) {
                    var item = this.bags()[bag];
                    if (item.flightReference() == flight){
                        total += item.amount();
                    }
                }
            }                        
            return total;
            */

            var bagFees = _.filter(this.bagBDLFeesTop(), function (item) {
                return item.flightReference() == flight;
            });

            var fees = _.reduce(bagFees, function (memo, fee) {
                return memo + fee.amount();
            }, 0);

            var bagTaxes = _.filter(this.bagBDLTaxesTop(), function (item) {
                return item.flightReference() == flight;
            });
            var taxes = _.reduce(bagTaxes, function (memo, fee) {
                return memo + fee.amount();
            }, 0);
           
            return fees + taxes;

        }

        this.totalBagSSRAmtBySegment = function (flight, departureStation) {
            var total = 0;
            if (this.ssrs()) {
                for (var ssr in this.ssrs()) {
                    var item = this.ssrs()[ssr];
                    if (item.flightReference() == flight && item.departureStation() == departureStation && item.feeDetail() == "BIKE" || item.feeDetail() == "WEAP") {
                        total += item.amount();
                    }
                }
            }
            return total;
        };
        this.totalSSRAmtBySegment = function (flight, departureStation) {
            var total = 0;            
            if (this.ssrs()) {
                for (var ssr in this.ssrs()) {
                    var item = this.ssrs()[ssr];
                    if (item.flightReference() == flight && item.departureStation() == departureStation && item.feeDetail() != "BIKE" && item.feeDetail() != "WEAP"){
                        total += item.amount();
                    }
                }
            }                        
            return total;
        };

        this.totalNonFlightAmountBySegment = function (flightReference, departureStation) {            
           
           var total = 
           this.totalSeatAmtBySegment(flightReference) +
           this.totalBagsAmtBySegment(flightReference) +
           this.totalSSRAmtBySegment(flightReference, departureStation);

           return total;
        };
                    
        // data is a Passenger object
        // journeys is a list of journeys
        this.injectData = function (data, journeys) {
            this.name().first(data.Name.First);
            this.name().last(data.Name.Last);
            this.name().middle(data.Name.Middle);
            this.passengerNumber(data.PassengerNumber);
            this.customerNumber(data.CustomerNumber);
            this.paxType(data.TypeInfo[0].PaxType);
            
            if (data.HasInfant) {
                // Check if any journeys still have an infant SSR
                if (!_.isEmpty(journeys)) {
                    for (var x = 0; x < journeys.length; x++) {
                        for (var y = 0; y < journeys[x].Segments.length; y++) {
                            if (!_.isEmpty(journeys[x].Segments[y].PaxSSRs)) {
                                if (_.find(journeys[x].Segments[y].PaxSSRs, function (ssr) {
                                    return ssr.PassengerNumber === data.PassengerNumber && ssr.SSRCode === 'INFT';
                                })) {
                                    this.hasInfant(true);
                                }
                            }
                        }
                    }
                }
                this.infant().name().first(data.Infant.Name.First);
                this.infant().name().last(data.Infant.Name.Last);
                this.infant().name().middle(data.Infant.Name.Middle);
            }
        };


        this.mobileNameInitial = ko.computed(function() {
            return this.name().first() + " " + this.name().last().charAt(0) + ".";
        }, this);

        this.totalSeats = ko.computed(function () {
            return _.reduce(this.seats(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);
        
              
       
        
       
        this.fareFees = ko.computed(function () {
            return ko.utils.arrayFilter(this.flightFares(), function (fee) {
                return fee.chargeType() !== porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.fareFeeAndTaxes = ko.computed(function () {
            var grouped = _.groupBy(this.flightFares(), function (item) {
                return item.journeyIndex();
            });
            return porter.getGroupedSum(grouped);
        }, this);
        
        this.totalFares = ko.computed(function () {
            return _.reduce(this.flightFares(), function (memo, fee) {
                var discount = fee.discount() == undefined ? 0 : fee.discount();
                var taxes = 0;
                if(fee.taxes().length > 0){
                    taxes = _.reduce(fee.taxes(), function (memo, tax) { return Number(memo) + Number(tax.amount())},0);
                }
                return memo + fee.amount() + taxes - discount;
            }, 0);
        }, this);

        this.totalPoints = ko.computed(function () {
            return _.reduce(this.flightFares(), function (memo, fee) {
                return memo + fee.points();
            }, 0);
        }, this);
        
        this.fareTaxes = ko.computed(function () {
            // Return taxes for all flights as one array
            var _arr = [];
            for (var x = 0; x < this.flightFares().length; x++) {
                _arr = this.flightFares()[x].taxes().concat(_arr);
            }
            return _arr;
            /*return ko.utils.arrayFilter(this.flightFares(), function (fee) {
                return fee.chargeType() === porter.CHARGE_TYPE.TAX;
            });*/
        }, this);

        // Groups the fare taxes by charge code and sums the amounts
        this.fareTaxesSum = ko.computed(function () {
            var grouped = _.groupBy(this.fareTaxes(), function (item) {
                return item.chargeCode();
            });
            return porter.getGroupedSum(grouped);
        }, this);
        
        // returns taxes in a group by journey
        /*this.fareTaxesByJourney = ko.computed(function (){
            var grouped = _.groupBy(this.fareTaxes(), function(item){ 
                return item.journeyIndex();
            });
            return grouped;
        },this);

        this.fareTaxesByJourneySum = ko.computed(function (){
            var grouped = _.groupBy(this.fareTaxes(), function(item){ 
                return item.journeyIndex();
            });
             return porter.getGroupedSumFunc(grouped);
        },this);*/

         this.totalFareTaxes = ko.computed(function () {
            return _.reduce(this.fareTaxes(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);

        /* Insurance */
         this.insuranceFees = ko.computed(function () {
            return ko.utils.arrayFilter(this.insurances(), function (fee) {
                return fee.chargeType() !== porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.totalInsurance = ko.computed(function () {
            return _.reduce(this.insurances(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);
        
          this.insuranceTaxes = ko.computed(function () {
            return ko.utils.arrayFilter(this.insurances(), function (fee) {
                return fee.chargeType() === porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.insuranceSum = ko.computed(function () {
            var grouped = _.groupBy(this.insuranceTaxes(), function (item) {
                return item.chargeCode();
            });
            return porter.getGroupedSum(grouped);
        }, this);

         this.totalInsuranceTaxes = ko.computed(function () {
            return _.reduce(this.insuranceTaxes(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);

        this.insuranceTaxesSum = ko.computed(function () {
            var grouped = _.groupBy(this.insuranceTaxes(), function (item) {
                return item.chargeCode();
            });
            return porter.getGroupedSum(grouped);
        }, this);
        /* end of insurance */

        /*
        this.totalBags = ko.computed(function () {
            return _.reduce(this.bags(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);
        */
   

        this.seatFees = ko.computed(function () {
            return ko.utils.arrayFilter(this.seats(), function (fee) {
                return fee.chargeType() !== porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.seatTaxes = ko.computed(function () {
            return ko.utils.arrayFilter(this.seats(), function (fee) {
                return fee.chargeType() === porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.seatTaxesSum = ko.computed(function () {
            var grouped = _.groupBy(this.seatTaxes(), function (item) {
                return item.chargeCode();
            });
            return porter.getGroupedSum(grouped);
        }, this);

 

        // ssrs
        this.ssrFees = ko.computed(function () {
            return ko.utils.arrayFilter(_.filter(this.ssrs(), function (x) { return x.feeDetail() != "BIKE" && x.feeDetail() != "WEAP" }), function (fee) {
                return fee.chargeType() !== porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.bagSsrFees = ko.computed(function () {
            return ko.utils.arrayFilter(_.filter(this.ssrs(), function (x) { return x.feeDetail() == "BIKE" || x.feeDetail() == "WEAP" }), function (fee) {
                return fee.chargeType() !== porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.ssrTaxes = ko.computed(function () {
            
            //todo: this was just added... need to add this section but including bike and weap, to the tax on the bag section
            return ko.utils.arrayFilter(this.ssrs(), function (fee) {
           
                return fee.chargeType() === porter.CHARGE_TYPE.TAX;
            });
        }, this);
        this.totalBagSSRs = ko.computed(function () {
            return _.reduce(this.ssrFees(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);

        this.totalBags = ko.computed(function () {
            return _.reduce(this.bags(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
    
        }, this);
        /*
        this.totalSSRTaxBySegment = function (flight) {
            var total = 0;
            var grouped = _.groupBy(this.ssrTaxes(), function (item) {
                return item.journeyIndex();
            });
            
            return porter.getGroupedSumByFlight(grouped, flight);                     
        };
        */
       
        this.ssrFeesGrouped = ko.computed(function () {
           
            var grouped = _.groupBy(this.ssrFees(), function (item) {
                return item.feeDetail() + '#' + item.flightReference();
            });
                
            var out = _.map(grouped, function(group){
                                
                //grab only the first flight in a connecting flight as we don't want to 
                //charge ssr taxes for each connecting flight
                if (group.length > 1){
                    var dep = group[0].departureStation();
                    
                    //group = _.where(group, {departureStation: dep});

                    group = _.filter(group,
                        function (item) {
                            return item.departureStation() == dep;
                        }
                    );
                }
                
                                
                return {
                    chargeCode: ko.observable(group[0].chargeCode()),
                    feeDetail: ko.observable(group[0].feeDetail()),
                    flightReference: ko.observable(group[0].flightReference()),  
                    arrivalStation: ko.observable(group[0].arrivalStation()),  
                    departureStation: ko.observable(group[0].departureStation()),  
                    amount:  ko.observable(
                                _.reduce(_.pluck(group, 'amount'), function (memo, g){
                                    return memo + g();    
                                }, 0)
                              )      
                }
            });

            return out;

        }, this);            

        this.ssrTaxesGrouped = ko.computed(function () {
           
            var grouped = _.groupBy(this.ssrTaxes(), function (item) {
          
                return item.chargeCode() + '#' + item.flightReference();
            });
                       
            var validStations = _.map(this.fareFees(), function(value, key){
                return { name : key, value : value.departureStation() };
            });       

            var out = _.map(grouped, function(group){
                
                //grab only the first flight in a connecting flight as we don't want to 
                //charge ssr taxes for each connecting flight
                if (group.length > 1){                
                    var dep = group[0].departureStation();
                                        
                    group = _.filter(group,
                        function (item) {
                            return item.departureStation() == dep;
                        }
                    );
                }

                //if (_.contains(validStationsgroup.departureStation())
                var validStation = _.findWhere(validStations, {value: group[0].departureStation()});
                var ret;

                if (typeof validStation !== 'undefined')
                {
                    ret = {
                        chargeCode: group[0].chargeCode(),
                        feeDetail: group[0].feeDetail(),
                        flightReference: group[0].flightReference(),                    
                        departureStation: group[0].departureStation(),                    
                        amount:  _.reduce(_.pluck(group, 'amount'), function (memo, g){
                            return memo + g();    
                        }, 0)                                       
                    }                
                }

                return ret;
            });
            
            
            out = _.filter(out, function(item){ 
               if (typeof item !== 'undefined'){ 
                  return item;
               } 
            });
            

            return out;

        }, this);
        

        this.ssrTaxesSum = ko.computed(function () {
            var grouped = _.groupBy(this.ssrTaxes(), function (item) {
                return item.chargeCode();
            });
            return porter.getGroupedSum(grouped);
        }, this);

        this.gateBagFees = ko.computed(function () {
            return ko.utils.arrayFilter(this.gateBags(), function (fee) {
                return fee.chargeType() !== porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.gateBagFeesTop = ko.computed(function () {
            var grouped = _.groupBy(this.gateBagFees(), function (item) {
                return item.flightReference();
            });

            var arr = [];
            for (group in grouped) {
                var bookingFee = new BookingFee();
                bookingFee.chargeCode(_.last(grouped[group]).chargeCode());
                bookingFee.feeDetail(_.last(grouped[group]).feeDetail());
                
                bookingFee.amount(_.reduce(grouped[group], function (memo, g) {
                    return memo + g.amount();
                }, 0));

                bookingFee.flightReference(_.first(grouped[group]).flightReference());
                bookingFee.departureStation(_.first(grouped[group]).departureStation());
                bookingFee.arrivalStation(_.first(grouped[group]).arrivalStation());

                arr.push(bookingFee);
            }

            return arr;

        }, this);

        this.totalGateBagFees = ko.computed(function () {
            return _.reduce(this.gateBagFees(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);
        
        this.bagFees = ko.computed(function () {
            return ko.utils.arrayFilter(this.bags(), function (fee) {
                return fee.chargeType() !== porter.CHARGE_TYPE.TAX;
            });
        }, this);
                
        this.bagFeesTop = ko.computed(function () {           
            

            var grouped = _.groupBy(this.bagFees(), function (item) {
                return item.flightReference();
            });

            var arr = [];
            for (group in grouped) {                
                var bookingFee = new BookingFee();
                // _.sortBy returns ascending -> 1, 2, 3
                // Return the chargeCode for the highest bag count
                var ordered = _.sortBy(grouped[group], function (g) { return g.chargeCode(); });
                bookingFee.chargeCode(_.last(ordered).chargeCode());
                bookingFee.feeDetail(_.last(grouped[group]).feeDetail());
                /*
                if (this.onCheckInPage()){
                    bookingFee.amount(_.last(grouped[group]).amount());                    
                }
                else{
                    bookingFee.amount(_.reduce(grouped[group], function (memo, g) {
                            return memo + g.amount();
                        }, 0));                    
                }
                */

                bookingFee.amount(_.reduce(grouped[group], function (memo, g) {
                            return memo + g.amount();
                }, 0));

                bookingFee.flightReference(_.first(grouped[group]).flightReference());
                bookingFee.departureStation(_.first(grouped[group]).departureStation());
                bookingFee.arrivalStation(_.first(grouped[group]).arrivalStation());


                //filter: only get selected journey
                var paxIndex = this.passengerNumber();
                var bookingDepartureStation = _.first(grouped[group]).departureStation();
                var bookingArrivalStation = _.first(grouped[group]).arrivalStation();


                // probably not needed. to remove... eventually
                var typeCartData = typeof cartData;
                if (typeCartData != "undefined")
                {
                    var paxJourneys = _.filter(cartData.CartData.Passengers, function (pax) {
                        return pax.PassengerNumber == paxIndex;
                    })[0].Journeys;
                    
                    _.each(paxJourneys, function (journey) {
                        var departureCode = journey.FlightInfo.DepartureCode;
                        var arrivalCode = journey.FlightInfo.ArrivalCode;

                        // current journey exist in cart Journey
                        if (bookingDepartureStation == departureCode &&
                                bookingArrivalStation == arrivalCode) {
                            arr.push(bookingFee);
                            return;
                        }
                    });
                }
                else
                {
                    arr.push(bookingFee);
                }
            }

            //return porter.getGroupedSumTop(this.bagFees());
            //return porter.getGroupedSumTop(arr);
            
            return arr;

        }, this);
        

        this.bagFeesSum = ko.computed(function () {
            var grouped = _.groupBy(this.bagFees(), function (item) {
                return item.flightReference();
            });
            return porter.getGroupedSum(grouped);
        }, this);

        this.bagBDLFees = ko.computed(function () {
            return ko.utils.arrayFilter(this.bagsBDL(), function (fee) {
                return fee.chargeType() !== porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.bagBDLFeesTop = ko.computed(function () {


            var grouped = _.groupBy(this.bagBDLFees(), function (item) {
                return item.flightReference();
            });

            var arr = [];
            for (group in grouped) {
                var bookingFee = new BookingFee();
                // _.sortBy returns ascending -> 1, 2, 3
                // Return the chargeCode for the highest bag count
                var ordered = _.sortBy(grouped[group], function (g) { return g.chargeCode(); });
                bookingFee.chargeCode(_.last(ordered).chargeCode());
                bookingFee.feeDetail(_.last(grouped[group]).feeDetail());
                
                bookingFee.amount(_.reduce(grouped[group], function (memo, g) {
                    return memo + g.amount();
                }, 0));

                bookingFee.flightReference(_.first(grouped[group]).flightReference());
                bookingFee.departureStation(_.first(grouped[group]).departureStation());
                bookingFee.arrivalStation(_.first(grouped[group]).arrivalStation());

                //filter: only get selected journey
                var paxIndex = this.passengerNumber();
                var bookingDepartureStation = _.first(grouped[group]).departureStation();
                var bookingArrivalStation = _.first(grouped[group]).arrivalStation();

                // probably not needed. to remove... eventually
                var typeCartData = typeof cartData;
                if (typeCartData != "undefined") {
                    var paxJourneys = _.filter(cartData.CartData.Passengers, function (pax) {
                        return pax.PassengerNumber == paxIndex;
                    })[0].Journeys;

                    _.each(paxJourneys, function (journey) {
                        var departureCode = journey.FlightInfo.DepartureCode;
                        var arrivalCode = journey.FlightInfo.ArrivalCode;

                        // current journey exist in cart Journey
                        if (bookingDepartureStation == departureCode &&
                            bookingArrivalStation == arrivalCode) {
                            arr.push(bookingFee);
                            return;
                        }
                    });
                }
                else {
                    arr.push(bookingFee);
                }
            }

            //return porter.getGroupedSumTop(this.bagFees());
            //return porter.getGroupedSumTop(arr);

            return arr;

        }, this);

        this.bagBDLFeesSum = ko.computed(function () {
            var grouped = _.groupBy(this.bagBDLFees(), function (item) {
                return item.flightReference();
            });
            return porter.getGroupedSum(grouped);
        }, this);

        this.bagBDLTaxes = ko.computed(function () {
            return ko.utils.arrayFilter(this.bagsBDL(), function (fee) {
                return fee.chargeType() === porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.bagBDLTaxesTop = ko.computed(function () {
            
            var grouped = _.groupBy(this.bagBDLTaxes(), function (item) {
                return item.flightReference();
            });

            var arr = [];
            for (group in grouped) {
                var bookingFee = new BookingFee();
                bookingFee.chargeCode(_.last(grouped[group]).chargeCode());
                bookingFee.feeDetail(_.last(grouped[group]).feeDetail());
                
                bookingFee.amount(_.reduce(grouped[group], function (memo, g) {
                    return memo + g.amount();
                }, 0));

                bookingFee.flightReference(_.first(grouped[group]).flightReference());
                bookingFee.departureStation(_.first(grouped[group]).departureStation());
                bookingFee.arrivalStation(_.first(grouped[group]).arrivalStation());

                //filter: only get selected journey
                var paxIndex = this.passengerNumber();
                var bookingDepartureStation = bookingFee.departureStation();
                var bookingArrivalStation = bookingFee.arrivalStation();

                var typeCartData = typeof cartData;
                if (typeCartData != "undefined") {
                    var paxJourneys = _.filter(cartData.CartData.Passengers, function (pax) {
                        return pax.PassengerNumber == paxIndex;
                    })[0].Journeys;

                    _.each(paxJourneys, function (journey) {
                        var departureCode = journey.FlightInfo.DepartureCode;
                        var arrivalCode = journey.FlightInfo.ArrivalCode;

                        // current journey exist in cart Journey
                        if (bookingDepartureStation == departureCode &&
                            bookingArrivalStation == arrivalCode) {
                            arr.push(bookingFee);
                            return;
                        }
                    });
                }
                else {
                    arr.push(bookingFee);
                }
            }

            //return porter.getGroupedSumTop(arr);
            return arr;

        }, this);

        this.bagTaxes = ko.computed(function () {
            return ko.utils.arrayFilter(this.bags(), function (fee) {
                return fee.chargeType() === porter.CHARGE_TYPE.TAX;
            });
        }, this);

        this.bagTaxesTop = ko.computed(function () {
            //return porter.getGroupedSumTop(this.bagTaxes());

          var grouped = _.groupBy(this.bagTaxes(), function (item) {
                return item.flightReference();
            });

            var arr = [];
            for (group in grouped) {                
                var bookingFee = new BookingFee();
                bookingFee.chargeCode(_.last(grouped[group]).chargeCode());
                bookingFee.feeDetail(_.last(grouped[group]).feeDetail());
                /*
                if (this.onCheckInPage()){
                    bookingFee.amount(_.last(grouped[group]).amount());                    
                }
                else{
                    bookingFee.amount(_.reduce(grouped[group], function (memo, g) {
                            return memo + g.amount();
                        }, 0));                    
                }
                */

                bookingFee.amount(_.reduce(grouped[group], function (memo, g) {
                            return memo + g.amount();
                }, 0));                    
                
                bookingFee.flightReference(_.first(grouped[group]).flightReference());
                bookingFee.departureStation(_.first(grouped[group]).departureStation());
                bookingFee.arrivalStation(_.first(grouped[group]).arrivalStation());

                //filter: only get selected journey
                var paxIndex = this.passengerNumber();
                var bookingDepartureStation = bookingFee.departureStation();
                var bookingArrivalStation = bookingFee.arrivalStation();

                var typeCartData = typeof cartData;
                if (typeCartData != "undefined") {
                    var paxJourneys = _.filter(cartData.CartData.Passengers, function (pax) {
                        return pax.PassengerNumber == paxIndex;
                    })[0].Journeys;

                    _.each(paxJourneys, function (journey) {
                        var departureCode = journey.FlightInfo.DepartureCode;
                        var arrivalCode = journey.FlightInfo.ArrivalCode;

                        // current journey exist in cart Journey
                        if (bookingDepartureStation == departureCode &&
                                bookingArrivalStation == arrivalCode) {
                            arr.push(bookingFee);
                            return;
                        }
                    });
                }
                else {
                    arr.push(bookingFee);
                }


                     
            }

            //return porter.getGroupedSumTop(arr);
            return arr;

        }, this);
        /*
        this.bagTaxesSum = ko.computed(function () {
            var grouped = _.groupBy(this.bagTaxes(), function (item) {
                return item.chargeCode();
            });
            return porter.getGroupedSum(grouped);
        }, this);
        */
        
        this.bagTaxesSum = ko.computed(function () {
            var grouped = _.groupBy(this.bagTaxesTop(), function (item) {
                return item.chargeCode();
            });
            return porter.getGroupedSum(grouped);
        }, this);

        this.totalSeatTaxes = ko.computed(function () {
            return _.reduce(this.seatTaxes(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);
        
        /*
        this.totalSSRsTaxes = ko.computed(function () {
            return _.reduce(this.ssrTaxes(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);
        */
        
        this.totalSSRsTaxes = ko.computed(function () {
            return _.reduce(this.ssrTaxesGrouped(), function (memo, fee) {
                return memo + fee.amount;
            }, 0);
        }, this);

        this.totalSSRs = ko.computed(function () {
            var totalSSRAmt =  _.reduce(this.ssrFeesGrouped().concat(this.gateBagFees()), function (memo, fee) {
                return memo + fee.amount();
            }, 0);

            return totalSSRAmt + this.totalSSRsTaxes();
        }, this);
    
        this.totalBagTaxes = ko.computed(function () {
            return _.reduce(this.bagTaxes(), function (memo, fee) {
                return memo + fee.amount();
            }, 0);
        }, this);

        this.totalBagsTop = ko.computed(function () {
            var bagFees = 0;
            var bagBDLFees = 0;
            var bagTaxes = 0;
            var bagBDLTaxes = 0;
            var bagSsrFees = 0;
  
            

            if (this.bagFeesTop().length > 0) {
                bagFees = _.reduce(this.bagFeesTop(), function (memo, item){
                    var memoOut = typeof memo.amount == 'undefined' ? memo : memo.amount();
                    return memoOut + item.amount();
                });

            }

            if (this.bagTaxesTop().length > 0) {
                bagTaxes = _.reduce(this.bagTaxesTop(), function (memo, item) {
                    //return memo.amount != null ? memo : memo.amount() + item.amount();
                    var memoOut = typeof memo.amount == 'undefined' ? memo : memo.amount();
                    return memoOut + item.amount();
                    //return memo.amount() + item.amount();
                });
            }

            if (this.bagBDLFeesTop().length > 0) {
                bagBDLFees = _.reduce(this.bagBDLFeesTop(), function (memo, item) {
                    var memoOut = typeof memo.amount == 'undefined' ? memo : memo.amount();
                    return memoOut + item.amount();
                });

            }

            if (this.bagBDLTaxesTop().length > 0) {
                bagBDLTaxes = _.reduce(this.bagBDLTaxesTop(), function (memo, item) {
                    //return memo.amount != null ? memo : memo.amount() + item.amount();
                    var memoOut = typeof memo.amount == 'undefined' ? memo : memo.amount();
                    return memoOut + item.amount();
                    //return memo.amount() + item.amount();
                });
            }

            

            if (this.bagSsrFees().length > 0) {
                bagSsrFees = _.reduce(this.bagSsrFees(), function (memo, item) {
                    var memoOut = typeof memo.amount == 'undefined' ? memo : memo.amount();
                    return memoOut + item.amount();
                });
            }

            
            var outBagFees = typeof bagFees.amount == 'undefined' ? bagFees : bagFees.amount();
            var outBagBDLFees = typeof bagBDLFees.amount == 'undefined' ? bagBDLFees : bagBDLFees.amount();            
            var outBagTaxes = typeof bagTaxes.amount == 'undefined' ? bagTaxes : bagTaxes.amount();
            var outBagBDLTaxes = typeof bagBDLTaxes.amount == 'undefined' ? bagBDLTaxes : bagBDLTaxes.amount();
            var outSsrBagFees = typeof bagSsrFees.amount == 'undefined' ? bagSsrFees : bagSsrFees.amount();

            return outBagFees + outBagBDLFees + outBagTaxes + outBagBDLTaxes + outSsrBagFees;    

        }, this);

        this.totalAmountDue = ko.computed(function () {
            //return this.totalSeats() + this.totalBags() + this.totalFares() + this.totalSSRs() + this.totalInsurance();

            var totalSSR = 0;
            if (this.fareFees()) {                                  
                for (var fee in this.fareFees()) {
                    var item = this.fareFees()[fee];
                    totalSSR += this.totalSSRAmtBySegment(item.flightReference(), item.departureStation());

                }                
            }        

            var fares = this.totalFares() > 0 ? this.totalFares() : 0;

            var serviceFees = _.reduce(this.serviceFees(), function (memo, tax) { return memo + tax.amount(); }, 0);

            return this.totalSeats() + this.totalBagsTop() + fares + this.totalInsurance() + totalSSR +  this.totalGateBagFees() + serviceFees;
            
        }, this);

        cancelChange = function () {
            //var pnr = data.BookingDetail.RecordLocator;
            //var lastName = data.Passengers[0].Name.Last;
            var token = data.BookingDetail.Token;
            window.location.href = porter.util.updateQueryStringParameter(cancelURl, "token", token);
                //cancelURl + "?token=" + token;
        },
        this.totalAmountServiceFees = ko.computed(function ()
        {
            var serviceFees = _.reduce(this.serviceFees(), function (memo, tax) { return memo + tax.amount(); }, 0);

            return serviceFees;

        }, this);

    };

    var TaxFee = function () {
        this.amount = ko.observable(0);
        this.chargeCode = ko.observable();
        this.chargeType = ko.observable();
        this.feeDetail = ko.observable();
        this.feeDetail2 = ko.observable();
    };

    var BookingFee = function () {
        this.amount = ko.observable(0);
        this.points = ko.observable(0);
        this.chargeCode = ko.observable();
        this.chargeType = ko.observable();
        this.productClass = ko.observable();
        this.ssrNumber = ko.observable();
        this.seatNumber = ko.observable();
        this.flightReference = ko.observable();
        this.departureStation = ko.observable();
        this.arrivalStation = ko.observable();
        this.journeyIndex = ko.observable();
        this.feeDetail = ko.observable();
        this.feeDetail2 = ko.observable();
        this.feeDetail3 = ko.observable(); //used for accessibility
        this.discount = ko.observable(0);
        this.discountDetail = ko.observable();
        this.oneTimeUsePromoCode = ko.observable();
        this.taxes = ko.observableArray(TaxFee());
        this.showFareTaxDetail = ko.observable(true);
        this.collapse = ko.observable(false);
        this.showFlightTotal = ko.observable(true);
        this.showFlightFareTotal = ko.observable(true);

        this.showFareTaxSummary = ko.observable(true);
        
        this.showFare = ko.observable(true);

        this.showSeats = ko.observable(true);        
        this.showSeatsDetail = ko.observable(false);
        this.showSeatsTaxDetail = ko.observable(false);
        this.showChangeSeatsLink = ko.observable(true);
        
        this.showBags = ko.observable(true);        
        this.showBagsDetail = ko.observable(false);

        this.showAdditionalFees = ko.observable(true);
        this.showAdditionalFeeDetails = ko.observable(false);
        //this.NAVCharges = ko.observable(true);
        //this.showSSRsDetail = ko.observable(true);

        // For PNR mod, show/hide sections only meant for changing or cancelling flights
        this.isChanging = ko.observable(false);
        this.isCancelling = ko.observable(false);

        this.allowCarryOn = ko.observable(false);
        this.isBasicFare = ko.observable(false);

        this.toggleFareTaxDetail = function () {
            this.showFareTaxDetail(!this.showFareTaxDetail());
        };
        this.toggleFlightTotal = function () {
            this.showFlightTotal(!this.showFlightTotal());
        };
        this.toggleFlightFareTotal = function () {
            this.showFlightFareTotal(!this.showFlightFareTotal());
        };
        this.showBreakdownToggle = function (data){  
            var showToggle = false;
            var _self = this;        
            
            var bags = _.filter(data.bagFees(), function (item) {
                return item.departureStation() == _self.departureStation();
            });
                                
            var seats = _.filter(data.seatFees(), function (item) {
                return item.departureStation() == _self.departureStation();
            });
            
            if (bags.length > 0 || seats.length > 0) {
                showToggle = true;
            }
            return showToggle;         
        };


        /*
        this.getTotalSSRs = function (data, parent) {
            parent.ssrTaxes()
        };
        */
        this.taxesGrouped = ko.computed(function () {
            var grouped = _.groupBy(this.taxes(), function (item) {
                return item.chargeCode();
            });
            return porter.getGroupedSumFunc(grouped);
        }, this);

        this.findNAV = ko.computed(function () {
            var nav, thistaxcode, alltaxcodes = [];
            for (nav = 0; nav < this.taxesGrouped().length; nav++) {
                alltaxcodes.push(this.taxesGrouped()[nav].chargeCode);
            }
            var navfee = alltaxcodes.indexOf('NAV');
            return navfee;
        }, this);

        this.OtherTaxes = ko.computed(function () {
            var OtherTaxesarr = this.taxesGrouped().slice(0);

            if(this.findNAV() !== -1){
                OtherTaxesarr.splice(this.findNAV(), 1);
            }
            return OtherTaxesarr;
        }, this);

        this.NAVCharges = ko.computed(function () {
            return this.taxesGrouped()[this.findNAV()];
        }, this);

        this.OthertaxesSum = ko.computed(function () {
            return _.reduce(this.OtherTaxes(), function (memo, tax) {
                return memo + tax.amount;
            }, 0);
        }, this);

        this.taxesSum = ko.computed(function () {
            return _.reduce(this.taxes(), function (memo, tax){
                return memo + tax.amount();
            }, 0);
        }, this);

        this.departureStationFlightReference= ko.computed(function () {
            if (this.flightReference()) {

                return _.last(this.flightReference().split(' ')).substr(0, 3);
            }
        }, this);

        this.arrivalStationFlightReference = ko.computed(function () {
            if (this.flightReference()) {
                return _.last(this.flightReference().split(' ')).substr(3);
            }
        }, this);
        this.getBagCount = ko.computed(function () {
            if (this.chargeCode() == 'BDL') {
                return 1;
            }
            else if (this.chargeCode() && this.chargeCode().length > 0) {
                return parseInt(this.chargeCode().substr(0, 1));
            }
        }, this);
        /*
        this.showBreakdownToggle = ko.computed(function () {
        }, this);
        */
        
        
        /*
        this.getBagCount = ko.computed(function () {
            if (this.chargeCode() && this.chargeCode().length > 0) {
                return parseInt(this.chargeCode().substr(0, 1));
            }
        }, this);
        */
       
        this.toggleFareDetails = function(passenger, bookingFee, element) {            
            
            // toggle all other rows             
            /*
            if (bookingFee.collapse() == true ){
                bookingFee.collapse(false);
                var targets = $(element.target.closest('tr')).nextAll('tr').not('.tax-details');
                targets.show();                                
            }
            else{                
                bookingFee.collapse(true);
                var targets = $(element.target.closest('tr')).nextAll('tr');
                targets.hide();
            }
            */

            var flag = false;

            // level 3 collapse AA
            if (bookingFee.collapse() == true) {
                bookingFee.collapse(false);
                flag = true;
                $(this).find('.icon-arrow-down').focus();
            }
            else {
                bookingFee.collapse(true);                
                flag = false;
                $(this).find('.icon-arrow-up').focus();
            }

            bookingFee.showFare(flag);
            bookingFee.showFareTaxSummary(flag);
            bookingFee.showFareTaxDetail(flag);
            bookingFee.showFlightFareTotal(flag);
            bookingFee.showFlightTotal(flag);
            bookingFee.showSeats(flag);
            bookingFee.showSeatsDetail(flag);
            bookingFee.showBags(flag);                    
            bookingFee.showBagsDetail(flag);
            bookingFee.showAdditionalFees(flag);
            bookingFee.showAdditionalFeeDetails(flag);
            

            //passenger.showBagsDetail(flag);
            //passenger.showSeatsDetail(flag);
            //passenger.showFareTaxSummary(flag);

            //details
            //bookingFee.showFareTaxDetail(flag);
           
            //passenger.toggleSeatsDetail(passenger, bookingFee);
            
            //passenger.showSeatsTaxDetail(false);
            //passenger.showBagsTaxDetail(false);
            //bookingFee.showFareTaxDetail(false);

        };
        
       
        
    };
    
    var BookingSummary = function () {
        var _self = this;
        this.passengers = ko.observableArray();
        this.showSummary = ko.observable(true);
        this.showCart = ko.observable(false);
        this.totalAmountDue = ko.observable(0);
        this.summaryText = ko.observable();
        this.summaryText2 = ko.observable();
        this.currencyCode = ko.observable();
        this.totalAmount = ko.observable(0);
        this.totalSummaryAmount = ko.observable(0);
        this.onCheckInPage = ko.observable(0);
        this.checkInFlightref = ko.observable();
        this.checkInDepartureStation = ko.observable();
        this.onBookingModFlow = ko.observable(0);
        this.onPNRModFlow = ko.observable(false);
        this.onRebookFlow = ko.observable(false);
        this.onNewFlow = ko.observable(false);

        // Added for rebook flow
        this.isModifying = ko.observable(false);
        this.isCancelling = ko.observable(false);

        // Show the seats section even if no seat fees
        this.showSeatsSection = ko.observable(false);

        this.toggleSummary = function () {
            this.showSummary(!this.showSummary());
        };

        this.toggleCart = function () {
            this.showCart(!this.showCart());

            if (jQuery('.summary-container .icon-down-toggle').length > 0){
                jQuery('#cart-summary-toggle').removeClass('icon-down-toggle').addClass('icon-up-toggle');
            }else{
                jQuery('#cart-summary-toggle').removeClass('icon-up-toggle').addClass('icon-down-toggle');
            }

            if (jQuery('.summary-container .icon-arrow-down').length > 0) {
                jQuery('#cart-summary-toggle').removeClass('icon-arrow-down').addClass('icon-arrow-up');
            } else {
                jQuery('#cart-summary-toggle').removeClass('icon-arrow-up').addClass('icon-arrow-down');
            }
        };

        this.totalAmount = ko.computed(function () {
            return _.reduce(this.passengers(), function (memo, pax){
                return memo + pax.totalAmountDue();
            }, 0);
        }, this);

        this.totalPoints = ko.computed(function () {
            return _.reduce(this.passengers(), function (memo, pax) {
                return memo + pax.totalPoints();
            }, 0);
        }, this);

        this.adtPax = ko.computed(function () {
            return ko.utils.arrayFilter(this.passengers(), function (pax) {
                return pax.paxType() === porter.PAX_TYPE.ADT;
            });
        }, this);

        this.chdPax = ko.computed(function () {
            return ko.utils.arrayFilter(this.passengers(), function (pax) {
                return pax.paxType() === porter.PAX_TYPE.CHD;
            });
        }, this);

        this.infPax = ko.computed(function () {
            return ko.utils.arrayFilter(this.passengers(), function (pax) {
                return pax.hasInfant();
            });
        }, this);

        this.getSummaryString = function (adt, chd, inf) {
            var str = '';
            if (this.adtPax().length > 0) {
                str += this.adtPax().length + ' ' + adt;
                if (this.chdPax().length + this.infPax().length > 0) {
                    str += ', ';
                }
            }
            if (this.chdPax().length > 0) {
                str += this.chdPax().length + ' ' + chd;
                if (this.infPax().length > 0) {
                    str += ', ';
                }
            }
            if (this.infPax().length > 0) {
                str += this.infPax().length + ' ' + inf;
            }
            return str;
        };
    };

    var p = BookingSummary.prototype;
    p.Constructor = BookingSummary;

    $.extend(p, {
        // data is an array of Porter.Core.Reservations.ViewModels.PaymentViewModel
        /*addLoyaltyRedemptions: function (data) {
            for (var x = 0; x < data.length; x++) {
                var _data = data[x];
                if (_data.PaymentMethodType === porter.PAYMENT_METHOD.LOYALTY) {
                    var _payment = new TaxFee();
                    _payment.amount(_data.CollectedAmount);
                    _payment.feeDetail(localization.Redemption);
                    var _pax = _.find(this.passengers(), function (pax) {
                        return pax.customerNumber() === _data.AccountNumber;
                    });
                    if (_.isEmpty(_pax)) {
                        _pax = _.first(this.passengers());
                    }
                    _pax.points.push(_payment);
                }
            }
        },*/

        activate: function (data, target, stations) {
            
            if (!_.isEmpty(data)) {
                if (data.ItineraryNavigation && data.ItineraryNavigation.OnBookingModFlow) // follow same rules as checkIn
                    this.onBookingModFlow(true)

                for (var x = 0; x < data.Passengers.length; x++) {
                    var pax = new BookingSummaryPassenger();
                    pax.injectData(data.Passengers[x], data.Journeys);
                    
                    

                    if (data.ItineraryNavigation && data.ItineraryNavigation.OnCheckInPage) {
                       pax.onCheckInPage(true) ;
                    }
                    this.passengers.push(pax);
                    if(data.Payments.items[0].CurrencyCode)
                        this.currencyCode(data.Payments.items[0].CurrencyCode);
                    else
                        this.currencyCode("CAD");
                }

                //add insurance
                var insAmount = 0;
                if (data.InsuranceQuote && data.InsuranceQuote.SelectedProduct){
                    insAmount = Number(data.InsuranceQuote.SelectedProduct.Premium) + Number(data.InsuranceQuote.SelectedProduct.Tax);
                }

                this.totalAmountDue(data.Payments.Total + insAmount);
            }
            this.compositionComplete();
        },


        compositionComplete: function () {
            var _self = this;
            // Close summary cart on click outside of cart
            $(document).on('click', function (event) {
                if (!$(event.target).closest('#check-in-summary').length) {
                    _self.showCart(false);
                }
            });
        },
       
        setSummaryCart: function (data, excludeForCheckin, excludeSeats, excludeServiceFees) {
            // Check if localization variable exists
            var hasLocalization = typeof feeDescriptionLocalization !== 'undefined';            
            this.checkInFlightref(data.CartData.CheckInFlightRef);
            this.checkInDepartureStation(data.CartData.CheckInDepartureStation);

            for (var i = 0; i < data.CartData.Passengers.length; i++)
            {
                var cartDataPax = data.CartData.Passengers[i];
          
                var pax = _.filter(this.passengers(), function (pax) {
                    return cartDataPax.PassengerNumber == pax.passengerNumber()
                })[0];

                pax.name().first(cartDataPax.FirstName);
                pax.name().last(cartDataPax.LastName);
                pax.passengerNumber(cartDataPax.PassengerNumber);
                var newFee;
                pax.flightFares().length = 0;
                pax.seats().length = 0;
                pax.bags().length = 0;
                pax.ssrs().length = 0;
                pax.insurances().length = 0;
                

                // flight fares               
                if (cartDataPax.FlightFares){
                    for (var x = 0; x < cartDataPax.FlightFares.length; x++) {
                        var flightFee = cartDataPax.FlightFares[x];
                        newFee = new BookingFee();
                        if (!excludeForCheckin){                        
                            newFee.amount(flightFee.Amount);
                        }
                        newFee.points(flightFee.Points);
                        newFee.productClass(flightFee.ProductClass);
                        if (flightFee.FlightInfo) {
                            newFee.arrivalStation(flightFee.FlightInfo.ArrivalCity);
                            newFee.departureStation(flightFee.FlightInfo.DepartureCity);
                        }

                        var flightRef = flightFee.JourneySellKey ? flightFee.JourneySellKey : "";
                        newFee.flightReference(flightRef);

                        newFee.chargeCode(flightFee.ChargeCode);
                        newFee.journeyIndex(x);
                        
                        newFee.feeDetail(flightFee.Date);
                        newFee.feeDetail2(flightFee.Time);
                        newFee.feeDetail3(moment(flightFee.FlightInfo.strSTD));
                        if (data.journeyAccessFlags != null && x + 1 <= data.journeyAccessFlags.length) {
                            newFee.allowCarryOn(data.journeyAccessFlags[x].AllowCarryOn);
                            newFee.isBasicFare(data.journeyAccessFlags[x].IsBasicFare);
                        }

                        if (flightFee.Discount) {
                            newFee.discount(flightFee.Discount);
                            newFee.discountDetail(flightFee.DiscountDetail);
                            newFee.oneTimeUsePromoCode(flightFee.OneTimeUsePromoCode)
                        }
                        pax.flightFares.push(newFee);

                        if (!excludeForCheckin){
                            for (var ii = 0; ii < flightFee.Taxes.length; ii++) {
                                var taxes = flightFee.Taxes[ii];
                                taxFee = new TaxFee();
                                taxFee.chargeType(porter.CHARGE_TYPE.TAX);
                                taxFee.chargeCode(taxes.TaxType);
                                taxFee.feeDetail((hasLocalization && feeDescriptionLocalization[taxes.TaxType]) ?
                                    feeDescriptionLocalization[taxes.TaxType] : taxes.TaxType);
                             
                                taxFee.amount(taxes.TaxAmount);
                              //  newFee.flightReference(flightFee.JourneySellKey);
                              //  newFee.journeyIndex(x);
                                newFee.taxes.push(taxFee);  // push taxes
                            }
                        }
                    }
                }
                
                // end of the flight fares
            
                   
                // bags
                
                if (cartDataPax.BaggageFees){
                    for (var x = 0; x < cartDataPax.BaggageFees.length; x++) {

                        var bagFee = cartDataPax.BaggageFees[x];
                        newFee = new BookingFee();
                        newFee.amount(bagFee.Amount);
                        newFee.arrivalStation(bagFee.FlightInfo.ArrivalCity);
                        newFee.departureStation(bagFee.FlightInfo.DepartureCity);
                        newFee.flightReference(bagFee.JourneySellKey);                        
                        newFee.chargeCode(bagFee.NumberOfBags + "BG");
                        
                        // newFee.chargeCode("1BG");
                        pax.bags.push(newFee);

                        for (var ii = 0; ii < bagFee.Taxes.length; ii++) {
                            var taxes = bagFee.Taxes[ii];
                            newFee = new BookingFee();
                            newFee.arrivalStation(bagFee.FlightInfo.ArrivalCity);
                            newFee.departureStation(bagFee.FlightInfo.DepartureCity);
                            newFee.chargeType(porter.CHARGE_TYPE.TAX);
                            newFee.chargeCode(taxes.TaxType);
                            newFee.amount(taxes.TaxAmount);
                            newFee.flightReference(bagFee.JourneySellKey);
                            pax.bags.push(newFee);  // push taxes
                        }
                    }
                    
                    if (cartDataPax.SSRFees != null) {
                        for (var x = 0; x < cartDataPax.SSRFees.length; x++) {

                            var ssrFee = cartDataPax.SSRFees[x];
                            if (ssrFee.Detail == "BIKE" || ssrFee.Detail == "WEAP") {


                                for (var ii = 0; ii < ssrFee.Taxes.length; ii++) {
                                    var taxes = ssrFee.Taxes[ii];
                                    newFee = new BookingFee();
                                    newFee.arrivalStation(ssrFee.FlightInfo.ArrivalCity);
                                    newFee.departureStation(ssrFee.FlightInfo.DepartureCity);
                                    newFee.chargeType(porter.CHARGE_TYPE.TAX);
                                    newFee.chargeCode(taxes.TaxType);
                                    newFee.amount(taxes.TaxAmount);
                                    newFee.flightReference(ssrFee.JourneySellKey);
                                    pax.bags.push(newFee);  // push taxes
                                }
                            }
                        }
                    } 
                    
                }

                // Basic Bundle

                if (cartDataPax.BasicBundleBagFees) {
                    for (var x = 0; x < cartDataPax.BasicBundleBagFees.length; x++) {

                        var bagFee = cartDataPax.BasicBundleBagFees[x];
                        newFee = new BookingFee();
                        newFee.amount(bagFee.Amount);
                        newFee.arrivalStation(bagFee.FlightInfo.ArrivalCity);
                        newFee.departureStation(bagFee.FlightInfo.DepartureCity);
                        newFee.flightReference(bagFee.JourneySellKey);
                        newFee.chargeCode("BDL");
                        //if (bagFee.NumberOfUpsellBags > 0) {
                        //    newFee.chargeCode("BDL");
                        //}
                        //else {
                        //    newFee.chargeCode(bagFee.NumberOfBags + "BG");
                        //}
                        // newFee.chargeCode("1BG");
                        pax.bagsBDL.push(newFee);

                        for (var ii = 0; ii < bagFee.Taxes.length; ii++) {
                            var taxes = bagFee.Taxes[ii];
                            newFee = new BookingFee();
                            newFee.arrivalStation(bagFee.FlightInfo.ArrivalCity);
                            newFee.departureStation(bagFee.FlightInfo.DepartureCity);
                            newFee.chargeType(porter.CHARGE_TYPE.TAX);
                            newFee.chargeCode(taxes.TaxType);
                            newFee.amount(taxes.TaxAmount);
                            newFee.flightReference(bagFee.JourneySellKey);
                            pax.bagsBDL.push(newFee);  // push taxes
                        }
                    }                    
                }

                // ServiceFees
                if (cartDataPax.ServiceFees && !excludeServiceFees)
                {
                    for (var x = 0; x < cartDataPax.ServiceFees.length; x++)
                    {
                        var serviceFee = cartDataPax.ServiceFees[x];
                        newFee = new TaxFee();
                        newFee.amount(serviceFee.Amount);
                        newFee.chargeCode(serviceFee.ChargeCode);

                        newFee.feeDetail((hasLocalization && feeDescriptionLocalization[serviceFee.ChargeCode]) ?
                            feeDescriptionLocalization[serviceFee.ChargeCode] : serviceFee.ChargeCode);

                        pax.serviceFees.push(newFee);

                        for (var ii = 0; ii < serviceFee.Taxes.length; ii++)
                        {
                            var taxes = serviceFee.Taxes[ii];
                            newFee = new TaxFee();

                            newFee.feeDetail((hasLocalization && feeDescriptionLocalization[taxes.TaxType]) ?
                                feeDescriptionLocalization[taxes.TaxType] : taxes.TaxType);

                            newFee.chargeType(porter.CHARGE_TYPE.TAX);
                            newFee.chargeCode(taxes.TaxType);
                            newFee.amount(taxes.TaxAmount);
                            pax.serviceFees.push(newFee);  // push taxes
                        }
                    }

                }
                
                // SSRS

               
                    var _gateBagCodes = ['1GBG', '2GBG', '3GBG'];
                    
                    if (cartDataPax.SSRFees != null) {
                        
                        for (var x = 0; x < cartDataPax.SSRFees.length; x++) {

                            var ssrFee = cartDataPax.SSRFees[x];

                            newFee = new BookingFee();
                            newFee.amount(ssrFee.Amount);
                            newFee.flightReference(ssrFee.JourneySellKey);
                            newFee.feeDetail(ssrFee.Detail);
                            newFee.arrivalStation(ssrFee.FlightInfo.ArrivalCity);
                            newFee.departureStation(ssrFee.FlightInfo.DepartureCity);
                            if (_.contains(_gateBagCodes, ssrFee.Detail)) {
                                pax.gateBags.push(newFee);
                            } else {
                                pax.ssrs.push(newFee);
                            }
                            if (ssrFee.Detail != "BIKE" && ssrFee.Detail != "WEAP") {
                                for (var ii = 0; ii < ssrFee.Taxes.length; ii++) {
                                    var taxes = ssrFee.Taxes[ii];
                                    newFee = new BookingFee();
                                    newFee.chargeType(porter.CHARGE_TYPE.TAX);
                                    newFee.chargeCode(taxes.TaxType);
                                    newFee.amount(taxes.TaxAmount);
                                    newFee.flightReference(ssrFee.JourneySellKey);
                                    newFee.departureStation(ssrFee.FlightInfo.DepartureCity);
                                    pax.ssrs.push(newFee);  // push taxes
                                }
                            }

                        }
                    }
                    if (!excludeForCheckin) {
                    // insurance
                    var DividePrice = function(total, count){
                        var parts = [count];
                        for (var i = 0; i < count; ++i)
                        {
                          //  var part = Math.trunc((100 * total) / (count - i)) / 100;
                          var part = Math.floor(Number((100 * total).toFixed(2)) / (count - i)) / 100;   // known problem with float in javascript 100 * 9.2 = 919.99999
                            parts[i] = part;
                            total -= part;
                        }
                        return parts;
                    };
                                
                    var amountOfPax = data.CartData.Passengers.length;
                    for (var x = 0; x < cartDataPax.InsuranceFees.length; x++) {
                        var insuranceFee = cartDataPax.InsuranceFees[x];
                        newFee = new BookingFee();
                        newFee.amount(DividePrice(insuranceFee.Amount, amountOfPax)[0]);
                       // newFee.flightReference(ssrFee.JourneySellKey);
                        newFee.feeDetail(insuranceFee.Detail);
                        pax.insurances.push(newFee);
                        for (var ii = 0; ii < insuranceFee.Taxes.length; ii++) {
                            var taxes = insuranceFee.Taxes[ii];
                            newFee = new BookingFee();
                            newFee.chargeType(porter.CHARGE_TYPE.TAX);
                            newFee.chargeCode(taxes.TaxType);
                            newFee.amount(DividePrice(taxes.TaxAmount,amountOfPax)[0]);          
                            pax.insurances.push(newFee);  // push taxes
                        }
                    }
                }

                //seat fees
                
                if (!excludeSeats) {
                    
                    for (var iii = 0; iii < cartDataPax.Journeys.length; iii++) {
                        var journey = cartDataPax.Journeys[iii];

                        for (var iiii = 0; iiii < journey.SeatFees.length; iiii++) {
                            var seatFee = journey.SeatFees[iiii];

                            // Find the selected seat
                            newFee = new BookingFee();
                            newFee.flightReference(seatFee.SegmentSellKey);
                           
                            newFee.seatNumber(seatFee.Unit);
                            newFee.arrivalStation(seatFee.FlightInfo.ArrivalCity);
                            newFee.departureStation(seatFee.FlightInfo.DepartureCity);
                            newFee.discount(seatFee.DiscountAmount * -1);
                            
                            newFee.flightReference().substring(0, 2) == 'B6' && typeof(localization) != 'undefined' ? newFee.seatNumber(localization[newFee.seatNumber()]) : newFee.seatNumber();

                            if (seatFee.WaiveFee) {
                                newFee.amount(0);
                                pax.seats.push(newFee);
                            } else {
                                newFee.amount(seatFee.Amount);

                                /*
                                //push regular tax into seat fee
                                var seatFeeTax = seatFee.Taxes;
                                if (seatFeeTax.length > 0){
                                    
                                    var newSeatTaxFee = new TaxFee();
                                                                                                                                            
                                    newSeatTaxFee.amount(seatFeeTax.TaxAmount);
                                    //newSeatTaxFee.chargeCode = ko.observable();
                                    //newSeatTaxFee.chargeType = ko.observable();
                                    newSeatTaxFee.feeDetail(taxes.TaxType);
                                    //newSeatTaxFee.feeDetail2 = ko.observable();
    
                                    newFee.taxes.push(newSeatTaxFee);
                                }
                                */
                                newFee.seatNumber(seatFee.Unit);
                                pax.seats.push(newFee); // push regular fee
                                for (var t = 0; t < seatFee.Taxes.length; t++) {
                                    var taxes = seatFee.Taxes[t];
                                    newFee = new BookingFee();
                                    newFee.chargeType(porter.CHARGE_TYPE.TAX);
                                    newFee.chargeCode(taxes.TaxType);
                                    newFee.amount(taxes.TaxAmount);
                                    if (seatFee.DiscountAmount != 0) {
                                        newFee.discount(seatFee.DiscountAmount * -1);
                                    }
                                    
                                    if (seatFee.JourneySellKey)
                                        newFee.flightReference(seatFee.JourneySellKey);
                                    else
                                        newFee.flightReference(seatFee.SegmentSellKey);

                                    pax.seats.push(newFee);  // push taxes
                                }
                            }
                        }
                    }
                }
            }
        },
        // data is a CheckInInputViewModel
        injectCheckInData: function (data) {
            if (!_.isEmpty(data)) {
                for (var x = 0; x < this.passengers().length; x++) {
                    var pax = this.passengers()[x];
                    var criteria = _.find(data.Criteria, function (c) { return c.Passenger.PassengerNumber === pax.passengerNumber(); });
                    if (criteria) {
                        for (var y = 0; y < pax.fareFees().length; y++) {
                            var fareFee = pax.fareFees()[y];
                            var paxJourney = _.find(criteria.PassengerJourneys, function (j) { return j.Journey.JourneySellKey === fareFee.flightReference(); });
                            if (paxJourney) {
                                if (paxJourney.HasBlockBoardingPassSSRs || paxJourney.HasRetrictedSSRs) {
                                    // Hide the change seats link
                                    fareFee.showChangeSeatsLink(false);
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    porter.BookingSummary = BookingSummary;
}());



    
    