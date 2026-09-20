var porter = porter || {};

(function () {
    // Constants
    $.extend(porter, {
        PAX_TYPE: {
            ADULT: 'ADT',
            CHILD: 'CHD',
            INFANT: 'INF'
        },
        // Porter.Core.Reservations.ChargeType
        CHARGE_TYPE: {
            FARE_PRICE: 0,
            DISCOUNT: 1,
            TAX: 5,
            LOYALTY: 16,
            FARE_POINTS: 17
        },
        FLIGHT_MODIFY_TYPE: {
            NO_CHANGE: 0,
            CHANGE: 1,
            CANCEL: 2
        },
        // Special fee codes, charge codes, etc.
        CODES: {
            INFANT: 'INFT',
            BIKE: 'BIKE',
            WEAP: 'WEAP'
        },
        DIRECTION: {
            OUTBOUND: 2,
            INBOUND: 1
        },
        // Porter.Core.Reservations.FareApplicationType
        FARE_APPLICATION_TYPE: {
            GOVERNING: 2
        },
        // List of SSRs to display in service request section
        INCLUDED_SSR_LIST: ['ATTD', 'BLND', 'DEAF', 'ESAN', 'EXST', 'LANG', 'MAAS', 'MEDA', 'OXYG', 'SRVA', 'NFCZ', 'PETC', 'PFCZ', 'UMNR', 'WCHR', 'WCHS', 'WCHC'],
        BUNDLE_SSR_LIST: ['BB01', 'BB02', 'BB04', 'BB05', 'FB01', 'FB02', 'FB04', 'FB05', 'SB01', 'SB02', 'SB03', 'SB04', 'SB05'], // seat & bag bundles
        BUNDLE_TWO_BAGS: ['SB02', 'FB02'],
        JOURNEY_ADDON_SSR_LIST: ['FLEX', 'BDL'], // journey level add ons
        BOOKING_ADDON_SSR_LIST: ['RFN', 'RFND','FLRF'] // booking level add ons

    });
    
    var BaggageCharge = function (parent) {
        var _self = this;
        this.parent = parent;

        this.chargeCode = ko.observable();
        this.baseAmount = ko.observable(0);
        this.baseAmountTotal = ko.observable(0);
        this.totalAmount = ko.observable(0);
        this.count = ko.observable(1);
        this.HST = ko.observable(0);
        this.GST = ko.observable(0);
        this.QST = ko.observable(0);
    };

    $.extend(BaggageCharge.prototype, {
        injectData: function (data) {
            if (!_.isEmpty(data)) {
                this.chargeCode(data.chargeCode);
                this.baseAmount(data.baseAmount);
                this.baseAmountTotal(data.baseAmountTotal);
                this.totalAmount(data.totalAmount);
                this.count(data.count);
                this.HST(data.HST);
                this.GST(data.GST);
                this.QST(data.QST);
            }
        }
    });

    var ServiceCharge = function (parent) {
        var _self = this;

        // parent is a PassengerFee or PaxFare
        this.parent = parent;

        this.chargeType = ko.observable();
        this.chargeCode = ko.observable();
        this.currencyCode = ko.observable();
        this.description = ko.observable();
        this.newAmount = ko.observable(0);
        this.oldAmount = ko.observable(0);
        this.chargeDetail = ko.observable();
        this.feeCode = ko.observable(); // used for adding bundles dynamically
        
        this.amount = ko.computed(function () {
            return this.newAmount() - this.oldAmount();
        }, this);

        // Set amount to zero if it was set to a non numeric value
        this.newAmount.subscribe(function (val) {
            if (!_.isNumber(val) || _.isNaN(val)) {
                this.newAmount(0);
            }
        }, this);

        this.oldAmount.subscribe(function (val) {
            if (!_.isNumber(val) || _.isNaN(val)) {
                this.oldAmount(0);
            }
        }, this);
    };

    $.extend(ServiceCharge.prototype, {
        // data is of type BookingSummaryServiceChargeViewModel
        injectData: function (data, feeCode) {
            if (!_.isEmpty(data)) {
                this.chargeType(data.ChargeType);
                this.chargeCode(data.ChargeCode);
                this.currencyCode(data.CurrencyCode);
                this.description(data.Description);
                this.newAmount(data.NewAmount);
                this.oldAmount(data.OldAmount);
                this.chargeDetail(data.ChargeDetail);
                this.feeCode(feeCode);
            }
        },
        // Copy data from another ServiceCharge
        // data is another ServiceCharge
        copyData: function (data) {
            this.chargeType(data.chargeType());
            this.chargeCode(data.chargeCode());
            this.currencyCode(data.currencyCode());
            this.description(data.description());
            this.newAmount(data.newAmount());
            this.oldAmount(data.oldAmount());
            this.chargeDetail(data.chargeDetail());
        }
    });

    var PaxFare = function (parent) {
        var _self = this;

        // parent is a Fare
        this.parent = parent;

        this.paxType = ko.observable();

        this.fareCharges = ko.observableArray();
        this.farePoints = ko.observableArray();
        this.discounts = ko.observableArray();
        this.flightCharges = ko.observableArray();
        this.taxesFeesCharges = ko.observableArray();
    };

    $.extend(PaxFare.prototype, {
        // data is of type BookingSummaryPaxFareViewModel
        injectData: function (data) {
            if (!_.isEmpty(data)) {
                this.paxType(data.PaxType);
                if (!_.isEmpty(data.FareCharges)) {
                    for (var x = 0; x < data.FareCharges.length; x++) {
                        var serviceCharge = data.FareCharges[x];
                        var newServiceCharge = new ServiceCharge(this);
                        newServiceCharge.injectData(serviceCharge);
                        this.fareCharges.push(newServiceCharge);
                    }
                }
                if (!_.isEmpty(data.FarePoints)) {
                    for (var x = 0; x < data.FarePoints.length; x++) {
                        var serviceCharge = data.FarePoints[x];
                        var newServiceCharge = new ServiceCharge(this);
                        newServiceCharge.injectData(serviceCharge);
                        this.farePoints.push(newServiceCharge);
                    }
                }
                if (!_.isEmpty(data.Discounts)) {
                    for (var x = 0; x < data.Discounts.length; x++) {
                        var serviceCharge = data.Discounts[x];
                        var newServiceCharge = new ServiceCharge(this);
                        newServiceCharge.injectData(serviceCharge);
                        // Populate discounts as negative amounts
                        newServiceCharge.newAmount(-newServiceCharge.newAmount());
                        newServiceCharge.oldAmount(-newServiceCharge.oldAmount());
                        this.discounts.push(newServiceCharge);
                    }
                }
                if (!_.isEmpty(data.FlightCharges)) {
                    for (var x = 0; x < data.FlightCharges.length; x++) {
                        var serviceCharge = data.FlightCharges[x];
                        var newServiceCharge = new ServiceCharge(this);
                        newServiceCharge.injectData(serviceCharge);
                        this.flightCharges.push(newServiceCharge);
                    }
                }
                if (!_.isEmpty(data.TaxesFeesCharges)) {
                    for (var x = 0; x < data.TaxesFeesCharges.length; x++) {
                        var serviceCharge = data.TaxesFeesCharges[x];
                        var newServiceCharge = new ServiceCharge(this);
                        newServiceCharge.injectData(serviceCharge);
                        this.taxesFeesCharges.push(newServiceCharge);
                    }
                }
            }
        }
    });

    var PaxSeat = function (parent) {
        var _self = this;

        // parent is a Segment
        this.parent = parent;

        this.passengerNumber = ko.observable();
        this.newUnitDesignator = ko.observable();
        this.oldUnitDesignator = ko.observable();
    };

    $.extend(PaxSeat.prototype, {
        // data is of type BookingSummaryPaxSeatViewModel
        injectData: function (data) {
            if (!_.isEmpty(data)) {
                this.passengerNumber(data.PassengerNumber);
                this.newUnitDesignator(data.NewUnitDesignator);
                this.oldUnitDesignator(data.OldUnitDesignator);
            }
        }
    });

    var Fare = function (parent) {
        var _self = this;

        // parent is a Segment
        this.parent = parent;

        this.newFareApplicationType = ko.observable();
        this.oldFareApplicationType = ko.observable();
        this.newProductClass = ko.observable();
        this.newProductName = ko.observable();
        this.oldProductClass = ko.observable();
        this.oldProductName = ko.observable();

        this.paxFares = ko.observableArray();
    };

    $.extend(Fare.prototype, {
        // data is of type BookingSummaryFareViewModel
        injectData: function (data) {
            if (!_.isEmpty(data)) {
                this.newFareApplicationType(data.NewFareApplicationType);
                this.oldFareApplicationType(data.OldFareApplicationType);
                this.newProductClass(data.NewProductClass);
                this.newProductName(data.NewProductName);
                this.oldProductClass(data.OldProductClass);
                this.oldProductName(data.OldProductName);
                if (!_.isEmpty(data.PaxFares)) {
                    for (var x = 0; x < data.PaxFares.length; x++) {
                        var paxFare = data.PaxFares[x];
                        var newPaxFare = new PaxFare(this);
                        newPaxFare.injectData(paxFare);
                        this.paxFares.push(newPaxFare);
                    }
                }
            }
        }
    });

    var Leg = function (parent) {
        
        var _self = this;

        // parent is a Segment
        this.parent = parent;

        this.ArrivalAirportLongName = ko.observable();
        this.ArrivalStation = ko.observable();
        this.ArrivalStationName = ko.observable();
        this.ArrivalStationTerminal = ko.observable();
        this.DayDiff = ko.observable();
        this.EstimatedDayDiff = ko.observable();
        this.DepartureAirportLongName = ko.observable();
        this.DepartureStation = ko.observable();
        this.DepartureStationAmenity = ko.observable();
        this.DepartureStationName = ko.observable();
        this.DepartureStationTerminal = ko.observable();
        this.Duration = ko.observable();
        this.EstimatedDuration = ko.observable();
        this.FlightDesignator = ko.observable();
        this.Id = ko.observable();
        this.InventoryLegIDField = ko.observable();
        this.Layover = ko.observable();
        this.EstimatedLayover = ko.observable();
        this.LegInfo = ko.observable();
        this.OperationsInfo = ko.observable();
        this.STA = ko.observable();
        this.STD = ko.observable();
        this.ETA = ko.observable();
        this.ETD = ko.observable();
        this.State = ko.observable();
        this.formattedSTA = ko.observable();
        this.formattedSTD = ko.observable();
        this.formattedETA = ko.observable();
        this.formattedETD = ko.observable();
  
        this.hasAmenities = ko.computed(function () {
            var _amenity = this.DepartureStationAmenity();
            if (!_.isEmpty(_amenity)) {
                return _amenity.Drinks || _amenity.Snacks || _amenity.Wifi;
            }
            return false;
        }, this);

        // Has estimated time and estimated time is different from scheduled time
        this.hasETA = ko.computed(function () {
            return !_.isEmpty(this.ETA()) && this.ETA() !== this.STA();
        }, this);

        this.hasETD = ko.computed(function () {
            return !_.isEmpty(this.ETD()) && this.ETD() !== this.STD();
        }, this);

        this.layoverChanged = ko.computed(function () {
            if (!_.isEmpty(this.EstimatedLayover()) && this.EstimatedLayover().TotalSeconds > 0) {
                return this.EstimatedLayover().TotalMinutes !== this.Layover().TotalMinutes;
            }
            return false;
        }, this);
       
        this.departureTime = ko.computed(function () {
            if (!_.isEmpty(this.ETD())) {
                return this.ETD();
            }
            return this.STD();
        }, this);

        this.arrivalTime = ko.computed(function () {
            if (!_.isEmpty(this.ETA())) {
                return this.ETA();
            }
            return this.STA();
        }, this);

        this.formattedDepartureTime = ko.computed(function () {
            if (!_.isEmpty(this.ETD())) {
                return this.formattedETD();
            }
            return this.formattedSTD();
        }, this);

        this.formattedArrivalTime = ko.computed(function () {
            if (!_.isEmpty(this.ETA())) {
                return this.formattedETA();
            }
            return this.formattedSTA();
        }, this);

        this.durationToUse = ko.computed(function () {                                  
            if (!_.isEmpty(this.EstimatedDuration()) && this.EstimatedDuration().TotalSeconds > 0) {                
                return (this.buildDuration(this.EstimatedDuration()));
                //return this.EstimatedDuration();                                
            }
            return (this.buildDuration(this.Duration()));
            //return this.Duration();
        }, this);

        this.layoverToUse = ko.computed(function () {
            if (!_.isEmpty(this.EstimatedLayover()) && this.EstimatedLayover().TotalSeconds > 0) {
                return this.buildDuration(this.EstimatedLayover());
            }
            return this.buildDuration(this.Layover());
        }, this);

        this.dayDiffToUse = ko.computed(function () {
            if (this.hasETA()) {
                return this.EstimatedDayDiff();
            }
            return this.DayDiff();
        }, this);
    };

    $.extend(Leg.prototype, {
        //data is of type LegViewModel
        injectData: function (data) {
            this.ArrivalAirportLongName(data.ArrivalAirportLongName);
            this.ArrivalStation(data.ArrivalStation);
            this.ArrivalStationName(data.ArrivalStationName);
            this.ArrivalStationTerminal(data.ArrivalStationTerminal);
            this.DayDiff(data.DayDiff);
            this.EstimatedDayDiff(data.EstimatedDayDiff);
            this.DepartureAirportLongName(data.DepartureAirportLongName);
            this.DepartureStation(data.DepartureStation);
            this.DepartureStationAmenity(data.DepartureStationAmenity);            
            this.DepartureStationName(data.DepartureStationName);
            this.DepartureStationTerminal(data.DepartureStationTerminal);
            this.Duration(data.Duration);            
            this.EstimatedDuration(data.EstimatedDuration);
            this.FlightDesignator(data.FlightDesignator);
            this.Id(data.Id);
            this.InventoryLegIDField(data.InventoryLegIDField);
            this.Layover(data.Layover);
            this.EstimatedLayover(data.EstimatedLayover);
            this.LegInfo(data.LegInfo);
            this.OperationsInfo(data.OperationsInfo);
            this.STA(data.STA);
            this.STD(data.STD);            
            this.State(data.State);
            this.formattedSTA(data.formattedSTA);
            this.formattedSTD(data.formattedSTD);
            if (moment(data.ETA) > moment()) {
                this.ETA(data.ETA);
                this.formattedETA(data.formattedETA);
            }
            if (moment(data.ETD) > moment()) {
                this.ETD(data.ETD);
                this.formattedETD(data.formattedETD);
            }
        },

        //----Helper Functions-----//

        // depending on the way the faresummary json object is serialized,
        // the duration might be returned as either a string or a date time object
        // this function takes the string representation and converts it to a generic object as that is what the views are expecting
        // primarilly used in connecting / thru flights to mark flight duration per segment
        buildDuration: function (duration){
            if (duration != null && typeof duration == 'string') {
                var convertedDuration = moment.duration(duration, 'minutes')
                var hrs = convertedDuration.hours();
                var min = convertedDuration.minutes();
                var sec = convertedDuration.seconds();    
                
                // var durationToUse = {
                //     Minutes : ko.observable(min),
                //     Seconds : ko.observable(sec),
                // }                    

                var durationToUse = {
                    Hours: hrs,
                    Minutes : min,
                    Seconds : sec,
                }                    

                return durationToUse;
            }
            
            return duration;
        }
    });

    var Segment = function (parent) {
        var _self = this;

        // parent is a Journey
        this.parent = parent;

        this.newDepartureStationCode = ko.observable();
        this.oldDepartureStationCode = ko.observable();
        this.newArrivalStationCode = ko.observable();
        this.oldArrivalStationCode = ko.observable();
        this.newCarrierCode = ko.observable();
        this.oldCarrierCode = ko.observable();
        this.newFlightNumber = ko.observable();
        this.oldFlightNumber = ko.observable();
        this.newSTD = ko.observable();
        this.oldSTD = ko.observable();
        this.newSTA = ko.observable();
        this.oldSTA = ko.observable();
        this.newSTDUtc = ko.observable();
        this.newSTAUtc = ko.observable();
        this.newFlightReference = ko.observable();
        this.oldFlightReference = ko.observable();
        this.legs = ko.observableArray();
        this.DepartTime = ko.observable();
        this.ArrivalTime = ko.observable();

        //this.newLegs = ko.observableArray();
        //this.oldLegs = ko.observableArray();

        this.fares = ko.observableArray();
        this.paxSeats = ko.observableArray();

        this.newDepartureStationName = ko.computed(function () {
            return parent.getStationName(this.newDepartureStationCode());
        }, this);

        this.oldDepartureStationName = ko.computed(function () {
            return parent.getStationName(this.oldDepartureStationCode());
        }, this);

        this.newArrivalStationName = ko.computed(function () {
            return parent.getStationName(this.newArrivalStationCode());
        }, this);

        this.oldArrivalStationName = ko.computed(function () {
            return parent.getStationName(this.oldArrivalStationCode());
        }, this);

        // Returns the stations for this segment, used to match service charges to segment
        // e.g. 'YTZ-EWR'
        this.newStationPair = ko.computed(function () {
            return this.newDepartureStationCode() + '-' + this.newArrivalStationCode();
        }, this);

        this.infantCharges = ko.observableArray();//WEB-19169 - this stores tax charges applied to infants on US destination flights

        this.seatFees = ko.computed(function () {
            var fees = [];
            // parent is Journey
            // parent.parent is FareSummaryVM
            for (var x = 0; x < parent.parent.passengers().length; x++) {
                var passenger = parent.parent.passengers()[x];
                for (var y = 0; y < passenger.seatFees().length; y++) {
                    var fee = passenger.seatFees()[y];
                    if ((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference()) ||
                        (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference())) {
                        fees.push(fee);
                    }
                }
                // Check for added charges
                var group = passenger.groupedAddedSeatCharges()[this.newStationPair()];
                if (!_.isEmpty(group) && group.length > 0) {
                    var newPassengerFee = new PassengerFee(passenger);
                    for (var y = 0; y < group.length; y++) {
                        var serviceCharge = group[y];
                        newPassengerFee.newFlightReference(this.newFlightReference());
                        newPassengerFee.oldFlightReference(this.oldFlightReference());
                        if (serviceCharge.chargeType() === porter.CHARGE_TYPE.TAX) {
                            newPassengerFee.taxes.push(serviceCharge);
                        } else {
                            newPassengerFee.serviceCharges.push(serviceCharge);
                        }
                    }
                    fees.push(newPassengerFee);
                }
            }
            return fees;
        }, this);

        this.bagFees = ko.computed(function () {
            var fees = [];
            // parent is Journey
            // parent.parent is FareSummaryVM
            for (var x = 0; x < parent.parent.passengers().length; x++) {
                var passenger = parent.parent.passengers()[x];
                for (var y = 0; y < passenger.bagFees().length; y++) {
                    var fee = passenger.bagFees()[y];
                    if ((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference()) ||
                        (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference())) {
                        fees.push(fee);
                    }
                }
                // Check for added charges
                var group = passenger.groupedAddedBagCharges()[this.newStationPair()];
                if (!_.isEmpty(group) && group.length > 0) {
                    var newPassengerFee = new PassengerFee(passenger);
                    for (var y = 0; y < group.length; y++) {
                        var serviceCharge = group[y];
                        newPassengerFee.newFlightReference(this.newFlightReference());
                        newPassengerFee.oldFlightReference(this.oldFlightReference());
                        newPassengerFee.serviceCharges.push(serviceCharge);
                    }
                    fees.push(newPassengerFee);
                }
                // check for bags added from bundles
                if (passenger.hasBundle()) {
                    
                    var bundle = _.find(passenger.bundleFees(), function (x) { return porter.doesJourneyMatchFlightReference(parent.newJourneySellKey(), x.newFlightReference()); });

                    if (bundle) {
                        var fee = new PassengerFee(passenger);
                        var serviceCharge = new ServiceCharge();
                        fee.feeCode("1BG");
                        fee.newFlightReference(bundle.newFlightReference());
                        fee.oldFlightReference(bundle.oldFlightReference());
                        serviceCharge.injectData({ChargeCode: "1BG", NewAmount: 0});
                        fee.serviceCharges.push(serviceCharge);
                        if ((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference()) ||
                            (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference())) {
                                fees.push(fee);
                        }
                        if (_.contains(porter.BUNDLE_TWO_BAGS, bundle.feeCode())) {
                            var fee2 = new PassengerFee(passenger);
                            var serviceCharge2 = new ServiceCharge();
                            fee2.feeCode("2BG");
                            fee2.newFlightReference(bundle.newFlightReference());
                            fee2.oldFlightReference(bundle.oldFlightReference());
                            serviceCharge2.injectData({ ChargeCode: "2BG", NewAmount: 0 });
                            fee2.serviceCharges.push(serviceCharge2);
                            if ((!_.isEmpty(fee2.newFlightReference()) && fee2.newFlightReference() === this.newFlightReference()) ||
                                (!_.isEmpty(fee2.oldFlightReference()) && fee2.oldFlightReference() === this.oldFlightReference())) {
                                    fees.push(fee2);
                            }
                        }
                    }
                }
            }
            return fees;
        }, this);

        this.basicBundleFees = ko.computed(function () {
            var fees = [];
            // parent is Journey
            // parent.parent is FareSummaryVM
            for (var x = 0; x < parent.parent.passengers().length; x++) {
                var passenger = parent.parent.passengers()[x];
                for (var y = 0; y < passenger.basicBundleFees().length; y++) {
                    var fee = passenger.basicBundleFees()[y];
                    if ((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference()) ||
                        (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference())) {
                        fees.push(fee);
                    }
                }
                // Check for added charges
                var group = passenger.groupedAddedBasicBundleCharges()[this.newStationPair()];
                if (!_.isEmpty(group) && group.length > 0) {
                    var newPassengerFee = new PassengerFee(passenger);
                    for (var y = 0; y < group.length; y++) {
                        var serviceCharge = group[y];
                        newPassengerFee.newFlightReference(this.newFlightReference());
                        newPassengerFee.oldFlightReference(this.oldFlightReference());
                        newPassengerFee.serviceCharges.push(serviceCharge);
                    }
                    fees.push(newPassengerFee);
                }
            }
            return fees;
        }, this);

        this.petcFees = ko.computed(function () {
            var fees = [];
            // parent is Journey
            // parent.parent is FareSummaryVM
            for (var x = 0; x < parent.parent.passengers().length; x++) {
                var passenger = parent.parent.passengers()[x];
                for (var y = 0; y < passenger.petcFees().length; y++) {
                    var fee = passenger.petcFees()[y];
                    if ((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference()) ||
                        (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference())) {
                        fees.push(fee);
                    }
                }
                // Check for added charges
                var group = passenger.groupedAddedPetcCharges()[this.newStationPair()];
                if (!_.isEmpty(group) && group.length > 0) {
                    var newPassengerFee = new PassengerFee(passenger);
                    for (var y = 0; y < group.length; y++) {
                        var serviceCharge = group[y];
                        newPassengerFee.newFlightReference(this.newFlightReference());
                        newPassengerFee.oldFlightReference(this.oldFlightReference());
                        newPassengerFee.serviceCharges.push(serviceCharge);
                    }
                    fees.push(newPassengerFee);
                }
            }
            return fees;
        }, this);

        this.changeCancelFees = ko.computed(function () {
            var fees = [];
            // parent is Journey
            // parent.parent is FareSummaryVM
            for (var x = 0; x < parent.parent.passengers().length; x++) {
                var passenger = parent.parent.passengers()[x];
                // Shopping cart other fees includes change/cancel fees
                for (var y = 0; y < passenger.changeCancelFees().length; y++) {
                    var fee = passenger.changeCancelFees()[y];
                    if ((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference()) ||
                        (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference())) {
                        fees.push(fee);
                    }
                }
            }
            return fees;
        }, this);

        this.otherFees = ko.computed(function () {
            var fees = [];
            // parent is Journey
            // parent.parent is FareSummaryVM
            for (var x = 0; x < parent.parent.passengers().length; x++) {
                var passenger = parent.parent.passengers()[x];
                for (var y = 0; y < passenger.otherFees().length; y++) {
                    var fee = passenger.otherFees()[y];
                    if ((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference() && fee.feeCode() !== "INFT") ||
                        (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference() && fee.feeCode() !== "INFT")) {
                        fees.push(fee);
                    }
                }
            }        
            return fees;
        }, this);

        this.bundleFees = ko.computed(function () {
            var fees = [];
            // parent is Journey
            // parent.parent is FareSummaryVM
            for (var x = 0; x < parent.parent.passengers().length; x++) { // for each passenger
                var passenger = parent.parent.passengers()[x];
                for (var y = 0; y < passenger.bundleFees().length; y++) { // get other fees on passenger 
                    var fee = passenger.bundleFees()[y];
                    if ((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference()) ||
                        (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference())) {
                        fees.push(fee);
                    }
                }
            }
            
            parent.addedAdditionalBundleCharges().sort(function(x,y) { return x.totalAmount() > y.totalAmount() ? -1 : 1; }); // so positive charges are first in the array
            for (var z = 0; z < parent.addedAdditionalBundleCharges().length; z++) {
                var addedFee = parent.addedAdditionalBundleCharges()[z];

                if ((!_.isEmpty(addedFee.newFlightReference()) && addedFee.newFlightReference() === this.newFlightReference()) ||
                    (!_.isEmpty(addedFee.oldFlightReference()) && addedFee.oldFlightReference() === this.oldFlightReference())) {
                        // if added fee has negative total, we are removing the bundle
                        if (addedFee.totalAmount() < 0) {
                            var existingFee = _.find(fees, function(f) {
                                return f.feeCode() === addedFee.feeCode(); 
                            });
                            if (existingFee) {
                                for (var a = 0; a < fees.length; a++) {
                                    if (fees[a] === existingFee) { // find the existing one & remove it
                                        fees.splice(a, 1);
                                        break;
                                    }
                                }
                            }

                        } else {
                            fees.push(addedFee);
                        } 
                }
            }

            return fees;
        }, this);

        this.infantCharges = ko.computed(function () {
            var fees = [];
            var feeItems = [];
            // parent is Journey
            // parent.parent is FareSummaryVM
            for (var x = 0; x < parent.parent.passengers().length; x++) {
                var passenger = parent.parent.passengers()[x];
                for (var y = 0; y < passenger.otherFees().length; y++) {
                    var fee = passenger.otherFees()[y];
                    if ((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference() && fee.feeCode() === "INFT") ||
                        (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference() && fee.feeCode() === "INFT")) {
                        fees.push(fee);
                    }
                }
            }
            if (fees.length > 0) {
                for (var x = 0; x < fees.length; x++) {
                    for (var y = 0; y < fees[x].allCharges().length; y++) {
                        feeItems.push(fees[x].allCharges()[y]);
                    }
                }
            }
            return feeItems;
        }, this);

        this.addonFees = ko.computed(function () {
            var fees = [];
            // parent is Journey
            // parent.parent is FareSummaryVM
            for (var x = 0; x < parent.parent.passengers().length; x++) {
                var passenger = parent.parent.passengers()[x];
                for (var y = 0; y < passenger.addonFees().length; y++) {
                    var fee = passenger.addonFees()[y];
                    if (((!_.isEmpty(fee.newFlightReference()) && fee.newFlightReference() === this.newFlightReference()) ||
                         (!_.isEmpty(fee.oldFlightReference()) && fee.oldFlightReference() === this.oldFlightReference())) && 
                          _.contains(porter.JOURNEY_ADDON_SSR_LIST, fee.feeCode()) ) {
                        fees.push(fee);
                    }
                }
                
            }
            // check for dynamically added fees
            parent.addedAdditionalJourneyCharges(_.sortBy(parent.addedAdditionalJourneyCharges(), 'amount').reverse()); // reverse them otherwise HST comes before the fee
            for (var z = 0; z < parent.addedAdditionalJourneyCharges().length; z++) {
                var newPassengerFee = new PassengerFee(parent.parent.passengers()[0]); 
                var serviceCharge = parent.addedAdditionalJourneyCharges()[z];
                newPassengerFee.newFlightReference(this.newFlightReference()); 
                newPassengerFee.oldFlightReference(this.oldFlightReference());
                newPassengerFee.serviceCharges.push(serviceCharge);
                fees.push(newPassengerFee);
            }

            return fees;
        }, this);

        // WEB-24480 Remove ‘Add’ Baggage for B6, on Interline flights
        this.isPorterCarrierCode = ko.computed(function () {
            return porter.isPorterCarrierCode(this.newCarrierCode());
        }, this);
    };

    $.extend(Segment.prototype, {
        // data is of type BookingSummarySegmentViewModel
        injectData: function (data) {
            if (!_.isEmpty(data)) {
                this.newDepartureStationCode(data.NewDepartureStation ? data.NewDepartureStation : data.DepartureStation);
                this.oldDepartureStationCode(data.OldDepartureStation);
                this.newArrivalStationCode(data.NewArrivalStation ? data.NewArrivalStation : data.ArrivalStation);
                this.oldArrivalStationCode(data.OldArrivalStation);
                if (!_.isEmpty(data.NewFlightDesignator)) {
                    this.newCarrierCode(data.NewFlightDesignator.CarrierCode);
                    this.newFlightNumber(data.NewFlightDesignator.FlightNumber);
                }
                if (!_.isEmpty(data.OldFlightDesignator)) {
                    this.oldCarrierCode(data.OldFlightDesignator.CarrierCode);
                    this.oldFlightNumber(data.OldFlightDesignator.FlightNumber);
                }
                this.newSTD(moment(data.NewSTD ? data.NewSTD : data.STD));
                this.oldSTD(moment(data.OldSTD));
                this.newSTA(moment(data.NewSTA ? data.NewSTA : data.STA));
                this.oldSTA(moment(data.OldSTA));                
                this.newSTAUtc(moment(data.NewSTAUtc ? data.NewSTAUtc: data.STA));
                this.newSTDUtc(moment(data.NewSTDUtc ? data.NewSTDUtc: data.STD));
                
                this.DepartTime(data.DepartTime);
                this.ArrivalTime(data.ArriveTime);

                this.newFlightReference(data.NewFlightReference);
                this.oldFlightReference(data.OldFlightReference);
                if (!_.isEmpty(data.Fares)) {
                    for (var x = 0; x < data.Fares.length; x++) {
                        var fare = data.Fares[x];
                        var newFare = new Fare(this);
                        newFare.injectData(fare);
                        this.fares.push(newFare);
                    }
                }
                if (!_.isEmpty(data.PaxSeats)) {
                    for (var x = 0; x < data.PaxSeats.length; x++) {
                        var paxSeat = data.PaxSeats[x];
                        var newPaxSeat = new PaxSeat(this);
                        newPaxSeat.injectData(paxSeat);
                        this.paxSeats.push(newPaxSeat);
                    }
                }
                if (!_.isEmpty(data.NewSegmentLegs)) {
                    for (var x = 0; x < data.NewSegmentLegs.length; x++) {
                        var fare = data.NewSegmentLegs[x];

                        //var newFare = new Fare(this);
                        //newFare.injectData(fare);
                        //this.fares.push(newFare);
                    }
                }
            }
        }
    });

    var Journey = function (parent) {
        var _self = this;

        // parent is a FareSummaryVM
        this.parent = parent;
        
        this.newFlightReference = ko.observable();
        this.newJourneySellKey = ko.observable();
        this.oldJourneySellKey = ko.observable();
        this.segments = ko.observableArray();
        this.flightModifyType = ko.observable();
        this.B2CPromotionCode = ko.observable();
        this.corporatePromotionCode = ko.observable();
        this.promotionCode = ko.observable();
        this.isOneTimeUsePromoCode = ko.observable(false);
        this.isBasicFare = ko.observable(false);
        this.showJourney = ko.observable(true);
        // isNewFlight is for when we swap departure and return in pnr mod, it should be the same as isModified otherwise
        // Will always be true in booking flow, false in check in
        this.isNewFlight = ko.observable(true);
        this.fareToolTipVisible = ko.observable(false);
        this.fareToolTip = ko.observable('');
        this.STDUtc = ko.observable('');        
        this.STAUtc = ko.observable('');        
        this.Duration = ko.observable('');
        // Shopping cart
        this.collapseTotalAir = ko.observable(true);
        this.collapseTaxes = ko.observable(true);
        this.collapseBundles = ko.observable(true);
        this.collapseSeats = ko.observable(true);
        this.collapseBags = ko.observable(true);
        this.collapseBasicBundle = ko.observable(true);
        this.collapsePetc = ko.observable(true);
        this.collapseChangeCancel = ko.observable(true);
        this.collapseOther = ko.observable(true);
        this.collapseChange = ko.observable(true);
        this.collapseAddon = ko.observable(true);
        this.collapseFlightDetails = ko.observable(false);
        this.collapseOldBookingTotal = ko.observable(true);

        this.addedAdditionalJourneyCharges = ko.observableArray(); // for dynamically-added add ons
        this.addedAdditionalBundleCharges = ko.observableArray(); // for dynamically-added bundles 


        //this.stationNode = function (airportName, airportCode) {

        //    this.airportName = ko.observable(airportName);
        //    this.airportCode = ko.observable(airportCode);

        //};

        // this.stationNodes = ko.observableArray();

        this.getSeatSelections = ko.computed(function () {
            var seatSelections = "";
            if (!_.isEmpty(this.segments()) && this.segments().length > 0) {
                for (var x = 0; x < this.segments().length; x++) {
                    var segment = this.segments()[x];
                    for (var y = 0; y < segment.paxSeats().length; y++) {
                        var paxSeat = segment.paxSeats()[y];
                        if (!_.isEmpty(paxSeat.newUnitDesignator())) {
                            seatSelections += paxSeat.newUnitDesignator() + ", ";
                        }
                    }
                }
            }          
            return seatSelections !== "" ? seatSelections.substr(0, seatSelections.length-2) : "";
        }, this);
       
        this.isCancelled = ko.computed(function () {
            return this.flightModifyType() === porter.FLIGHT_MODIFY_TYPE.CANCEL;
        }, this);

        this.isModified = ko.computed(function () {
            return this.flightModifyType() === porter.FLIGHT_MODIFY_TYPE.CHANGE;
        }, this);

        this.firstSegment = ko.computed(function () {
            if (!_.isEmpty(this.segments()) && this.segments().length > 0) {
                var firstSegment = _.first(this.segments());
                return firstSegment;
            }
        }, this);

        this.lastSegment = ko.computed(function () {
            if (!_.isEmpty(this.segments()) && this.segments().length > 0) {
                var lastSegment = _.last(this.segments());
                return lastSegment;
            }
        }, this);

        // Departure station for the first segment
        this.newDepartureStationCode = ko.computed(function () {
            var firstSegment = this.firstSegment();
            if (!_.isEmpty(firstSegment)) {
                return firstSegment.newDepartureStationCode();
            }
        }, this);
        this.oldDepartureStationCode = ko.computed(function () {
            var firstSegment = this.firstSegment();
            if (!_.isEmpty(firstSegment)) {
                return firstSegment.oldDepartureStationCode();
            }
        }, this);

        this.departureStationCode = ko.computed(function () {
            return (this.isCancelled() || _.isEmpty(this.newDepartureStationCode())) ?
                this.oldDepartureStationCode() : this.newDepartureStationCode();
        }, this);

        // Arrival station for the last segment
        this.newArrivalStationCode = ko.computed(function () {
            var lastSegment = this.lastSegment();
            if (!_.isEmpty(lastSegment)) {
                return lastSegment.newArrivalStationCode();
            }
        }, this);
        this.oldArrivalStationCode = ko.computed(function () {
            var lastSegment = this.lastSegment();
            if (!_.isEmpty(lastSegment)) {
                return lastSegment.oldArrivalStationCode();
            }
        }, this);

        this.arrivalStationCode = ko.computed(function () {
            return (this.isCancelled() || _.isEmpty(this.newArrivalStationCode())) ?
                this.oldArrivalStationCode() : this.newArrivalStationCode();
        }, this);

        //display time as string

        this.departTimeDisplay = ko.computed(function () {
            var firstSegment = this.firstSegment();
            if (!_.isEmpty(firstSegment)) {
                return firstSegment.DepartTime();
            }
        }, this);
        this.arrivalTimeDisplay = ko.computed(function () {
            var lastSegment = this.lastSegment();
            if (!_.isEmpty(lastSegment)) {
                return lastSegment.ArrivalTime();
            }
        }, this);

        // Departure time for the first segment
        this.newSTD = ko.computed(function () {            
            var firstSegment = this.firstSegment();
            if (!_.isEmpty(firstSegment)) {
                var ret = firstSegment.newSTDUtc() ? firstSegment.newSTDUtc() : firstSegment.newSTD();
                return ret;
                //return firstSegment.newSTD();                
                //return firstSegment.newSTDUtc();
            }            
            return 
        }, this);
        this.oldSTD = ko.computed(function () {
            var firstSegment = this.firstSegment();
            if (!_.isEmpty(firstSegment)) {
                return firstSegment.oldSTD();
            }
        }, this);

        this.STD = ko.computed(function () {
            return (this.isCancelled() || _.isEmpty(this.newDepartureStationCode())) ?
                this.oldSTD() : this.newSTD();
        }, this);

        // Arrival time for the last segment
        this.newSTA = ko.computed(function () {
            var lastSegment = this.lastSegment();
            if (!_.isEmpty(lastSegment)) {
                var ret = lastSegment.newSTAUtc() ? lastSegment.newSTAUtc() : lastSegment.newSTA();
                return ret;
                //return lastSegment.newSTA();                
                //return lastSegment.newSTAUtc();
            }
        }, this);
        this.oldSTA = ko.computed(function () {
            var lastSegment = this.lastSegment();
            if (!_.isEmpty(lastSegment)) {
                return lastSegment.oldSTA();
            }
        }, this);

        this.STA = ko.computed(function () {
            return (this.isCancelled() || _.isEmpty(this.newDepartureStationCode())) ?
                this.oldSTA() : this.newSTA();
        }, this);

        // Station names
        this.newDepartureStationName = ko.computed(function () {
            return this.getStationName(this.newDepartureStationCode());
        }, this);

        this.oldDepartureStationName = ko.computed(function () {
            return this.getStationName(this.oldDepartureStationCode());
        }, this);

        this.departureStationName = ko.computed(function () {            
            return (this.isCancelled() || _.isEmpty(this.newDepartureStationName())) ?
                this.oldDepartureStationName() : this.newDepartureStationName();
        }, this);

        this.newArrivalStationName = ko.computed(function () {
            return this.getStationName(this.newArrivalStationCode());
        }, this);

        this.oldArrivalStationName = ko.computed(function () {
            return this.getStationName(this.oldArrivalStationCode());
        }, this);

        this.arrivalStationName = ko.computed(function () {
            return (this.isCancelled() || _.isEmpty(this.newArrivalStationName())) ?
                this.oldArrivalStationName() : this.newArrivalStationName();
        }, this);

        this.governingFare = ko.computed(function () {
            var governingFare;
            // Find the governing fare
            for (var x = 0; x < this.segments().length; x++) {
                var segment = this.segments()[x];
                for (var y = 0; y < segment.fares().length; y++) {
                    var fare = segment.fares()[y];
                    if (fare.newFareApplicationType() === porter.FARE_APPLICATION_TYPE.GOVERNING) {
                        governingFare = fare;
                        break;
                    }
                }
            }
            // Get the first fare if no governing fare was found
            if (_.isEmpty(governingFare)) {
                for (var x = 0; x < this.segments().length; x++) {
                    var segment = this.segments()[x];
                    governingFare = _.first(segment.fares());
                }
            }
            return governingFare;
        }, this);

        this.oldProductClass = ko.computed(function () {
            var productClass = '';
            var governingFare = this.governingFare();
            if (!_.isEmpty(governingFare)) {
                productClass = governingFare.oldProductClass();
            }
            return productClass;
        }, this);

        this.newProductClass = ko.computed(function () {
            var productClass = '';
            var governingFare = this.governingFare();
            if (!_.isEmpty(governingFare)) {
                productClass = governingFare.newProductClass();
            }
            return productClass;
        }, this);

        this.newProductName = ko.computed(function () {

            //var firstSegment = this.firstSegment();
            //if (!_.isEmpty(firstSegment)) {
            //    debugger
            //    var fares = firstSegment.fares();
            //    if (fares.length > 0) {
            //        return fares[0].newProductName();
            //    }

            //}

            var productName = '';
            var governingFare = this.governingFare();
            if (!_.isEmpty(governingFare)) {
                productName = governingFare.newProductName();
            }
            return productName;

        }, this);

        this.oldProductName = ko.computed(function () {
            var productName = '';
            var governingFare = this.governingFare();
            if (!_.isEmpty(governingFare)) {
                productName = governingFare.oldProductName();
            }
            return productName;

        }, this);

        this.showCorporateDiscount = ko.computed(function () {
            return !_.isEmpty(this.corporatePromotionCode()) && _.isEmpty(this.promotionCode());
        }, this);

        this.showB2CDiscount = ko.computed(function () {
            return !this.showCorporateDiscount() && !_.isEmpty(this.B2CPromotionCode());
        }, this);

        this.showTooltip = ko.observable(false);
        this.toggleTooltip = function () {
            this.showTooltip(!this.showTooltip());
        };

        // Array of pax fares for all segments
        this.paxFares = ko.computed(function () {
            var paxFares = [];
            for (var x = 0; x < this.segments().length; x++) {
                var segment = this.segments()[x];
                if (!_.isEmpty(segment)) {
                    for (var y = 0; y < segment.fares().length; y++) {
                        var fare = segment.fares()[y];
                        if (!_.isEmpty(fare)) {
                            for (var z = 0; z < fare.paxFares().length; z++) {
                                var paxFare = fare.paxFares()[z];
                                if (!_.isEmpty(paxFare)) {
                                    paxFares.push(paxFare);
                                }
                            }
                        }
                    }
                }
            }
            return paxFares;
        }, this);

        // Base fare for one passenger
        this.singleFareCharges = ko.computed(function () {
            var charges = [];
            var paxFares = this.paxFares();
            if (!_.isEmpty(paxFares)) {
                // Group the paxFares by paxType
                var group = _.groupBy(paxFares, function (p) { return p.paxType(); });
                // Get a group of paxFares, e.g. 'ADT' or 'CHD'
                var paxFareGroup = group[_.first(paxFares).paxType()];
                if (!_.isEmpty(paxFareGroup)) {
                    for (var x = 0; x < paxFareGroup.length; x++) {
                        var paxFare = paxFareGroup[x];
                        for (var y = 0; y < paxFare.fareCharges().length; y++) {
                            var fareCharge = paxFare.fareCharges()[y];
                            if (fareCharge.chargeType() === porter.CHARGE_TYPE.FARE_PRICE) {
                                // Add up base fare for all segments of this journey
                                charges.push(fareCharge);
                            }
                        }
                    }
                }
            }
            return charges;
        }, this);

        this.oldSingleFareCost = ko.computed(function () {
            return _.reduce(this.singleFareCharges(), function (memo, d) { return memo + d.oldAmount(); }, 0);
        }, this);

        this.newSingleFareCost = ko.computed(function () {
            return _.reduce(this.singleFareCharges(), function (memo, d) { return memo + d.newAmount(); }, 0);
        }, this);

        this.singleFareCost = ko.computed(function () {
            return _.reduce(this.singleFareCharges(), function (memo, d) { return memo + d.amount(); }, 0);
        }, this);

        // Base points for one passenger
        this.farePointCharges = ko.computed(function () {
            var charges = [];
            var paxFares = this.paxFares();
            if (!_.isEmpty(paxFares)) {
                // Group the paxFares by paxType
                var group = _.groupBy(paxFares, function (p) { return p.paxType(); });
                // Get a group of paxFares, e.g. 'ADT' or 'CHD'
                var paxFareGroup = group[_.first(paxFares).paxType()];
                if (!_.isEmpty(paxFareGroup)) {
                    for (var x = 0; x < paxFareGroup.length; x++) {
                        var paxFare = paxFareGroup[x];
                        for (var y = 0; y < paxFare.farePoints().length; y++) {
                            var fareCharge = paxFare.farePoints()[y];
                            if (fareCharge.chargeType() === porter.CHARGE_TYPE.FARE_POINTS) {
                                charges.push(fareCharge);
                            }
                        }
                    }
                }
            }
            return charges;
        }, this);

        this.oldSingleFarePoints = ko.computed(function () {
            return _.reduce(this.farePointCharges(), function (memo, d) { return memo + d.oldAmount(); }, 0);
        }, this);

        this.newSingleFarePoints = ko.computed(function () {
            return _.reduce(this.farePointCharges(), function (memo, d) { return memo + d.newAmount(); }, 0);
        }, this);

        this.singleFarePoints = ko.computed(function () {
            return _.reduce(this.farePointCharges(), function (memo, d) { return memo + d.amount(); }, 0);
        }, this);

        // Total points for all passengers
        this.totalFarePoints = ko.computed(function () {
            var totalFarePoints = 0;
            var paxFares = this.paxFares();
            if (!_.isEmpty(paxFares)) {
                var adtFarePoints = 0;
                var chdFarePoints = 0;
                for (var x = 0; x < paxFares.length; x++) {
                    var paxFare = paxFares[x];
                    if (!_.isEmpty(paxFare)) {
                        for (var y = 0; y < paxFare.farePoints().length; y++) {
                            var fareCharge = paxFare.farePoints()[y];
                            if (fareCharge.chargeType() === porter.CHARGE_TYPE.FARE_POINTS) {
                                if (paxFare.paxType() === porter.PAX_TYPE.ADULT) {
                                    adtFarePoints += fareCharge.amount();
                                } else if (paxFare.paxType() === porter.PAX_TYPE.CHILD) {
                                    chdFarePoints += fareCharge.amount();
                                }
                            }
                        }
                    }
                }
                totalFarePoints += (adtFarePoints * parent.numberOfAdults()) + (chdFarePoints * parent.numberOfChildren());
            }
            return totalFarePoints;
        }, this);

        this.oldTotalFarePoints = ko.computed(function () {
            var totalFarePoints = 0;
            var paxFares = this.paxFares();
            if (!_.isEmpty(paxFares)) {
                var adtFarePoints = 0;
                var chdFarePoints = 0;
                for (var x = 0; x < paxFares.length; x++) {
                    var paxFare = paxFares[x];
                    if (!_.isEmpty(paxFare)) {
                        for (var y = 0; y < paxFare.farePoints().length; y++) {
                            var fareCharge = paxFare.farePoints()[y];
                            if (fareCharge.chargeType() === porter.CHARGE_TYPE.FARE_POINTS) {
                                if (paxFare.paxType() === porter.PAX_TYPE.ADULT) {
                                    adtFarePoints += fareCharge.oldAmount();
                                } else if (paxFare.paxType() === porter.PAX_TYPE.CHILD) {
                                    chdFarePoints += fareCharge.oldAmount();
                                }
                            }
                        }
                    }
                }
                totalFarePoints += (adtFarePoints * parent.numberOfAdults()) + (chdFarePoints * parent.numberOfChildren());
            }
            return totalFarePoints;
        }, this);

        this.newTotalFarePoints = ko.computed(function () {
            var totalFarePoints = 0;
            var paxFares = this.paxFares();
            if (!_.isEmpty(paxFares)) {
                var adtFarePoints = 0;
                var chdFarePoints = 0;
                for (var x = 0; x < paxFares.length; x++) {
                    var paxFare = paxFares[x];
                    if (!_.isEmpty(paxFare)) {
                        for (var y = 0; y < paxFare.farePoints().length; y++) {
                            var fareCharge = paxFare.farePoints()[y];
                            if (fareCharge.chargeType() === porter.CHARGE_TYPE.FARE_POINTS) {
                                if (paxFare.paxType() === porter.PAX_TYPE.ADULT) {
                                    adtFarePoints += fareCharge.newAmount();
                                } else if (paxFare.paxType() === porter.PAX_TYPE.CHILD) {
                                    chdFarePoints += fareCharge.newAmount();
                                }
                            }
                        }
                    }
                }
                totalFarePoints += (adtFarePoints * parent.numberOfAdults()) + (chdFarePoints * parent.numberOfChildren());
            }
            return totalFarePoints;
        }, this);

        // Grouped is for single passenger charges
        this.groupedDiscounts = ko.computed(function () {
            return this.groupPaxFareByPaxType('discounts');
        }, this);

        // For combined charges for all passengers
        this.discounts = ko.computed(function () {
            var groupedDiscounts = this.groupedDiscounts();
            return this.getAggregatePaxFares(groupedDiscounts);
        }, this);

        // Total
        this.oldTotalDiscounts = ko.computed(function () {
            var sum = _.reduce(this.discounts(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalDiscounts = ko.computed(function () {
            var sum = _.reduce(this.discounts(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalDiscounts = ko.computed(function () {
            var sum = _.reduce(this.discounts(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.groupedFlightCharges = ko.computed(function () {
            return this.groupPaxFareByPaxType('flightCharges');
        }, this);

        this.flightCharges = ko.computed(function () {
            var groupedFlightCharges = this.groupedFlightCharges();
            return this.getAggregatePaxFares(groupedFlightCharges);
        }, this);

        this.oldTotalFlightCharges = ko.computed(function () {
            var sum = _.reduce(this.flightCharges(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalFlightCharges = ko.computed(function () {
            var sum = _.reduce(this.flightCharges(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalFlightCharges = ko.computed(function () {
            var sum = _.reduce(this.flightCharges(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.groupedTaxesFeesCharges = ko.computed(function () {
            return this.groupPaxFareByPaxType('taxesFeesCharges');
        }, this);

        this.taxesFeesCharges = ko.computed(function () {
            var groupedTaxesFeesCharges = this.groupedTaxesFeesCharges();
            var infantFees = [];
            if (!_.isEmpty(this.firstSegment())) {
                infantFees = this.firstSegment().infantCharges(); //infant tax charge for US destination flight
            }
            return this.getAggregatePaxFares(groupedTaxesFeesCharges, infantFees); //add this charge to taxesFeesCharges
        }, this);

        this.taxesFeesChargesPositive = ko.computed(function () {
            return _.filter(this.taxesFeesCharges(), function (d) { return d.amount() > 0; });
        }, this);

        this.taxesFeesChargesNegative = ko.computed(function () {
            return _.filter(this.taxesFeesCharges(), function (d) { return d.amount() < 0; });
        }, this);

        this.totalTaxesFeesCharges = ko.computed(function () {
            var sum = _.reduce(this.taxesFeesCharges(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.oldTotalTaxesFeesCharges = ko.computed(function () {
            var sum = _.reduce(this.taxesFeesCharges(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalTaxesFeesCharges = ko.computed(function () {
            var sum = _.reduce(this.taxesFeesCharges(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalTaxesFeesChargesPositive = ko.computed(function () {
            var sum = _.reduce(this.taxesFeesChargesPositive(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.totalTaxesFeesChargesNegative = ko.computed(function () {
            var sum = _.reduce(this.taxesFeesChargesNegative(), function (memo, d) { return memo + d.amount(); }, 0);
            return Math.abs(sum);
        }, this);

        this.oldTotalAirTransportationCost = ko.computed(function () {
            var totalCost = 0;
            if (parent.numberOfAdults() > 0) {
                totalCost += parent.numberOfAdults() * this.oldSingleFareCost();
            }
            if (parent.numberOfChildren() > 0) {
                totalCost += parent.numberOfChildren() * this.oldSingleFareCost();
            }
            totalCost += this.oldTotalDiscounts();
            totalCost += this.oldTotalFlightCharges();
            return totalCost;
        }, this);

        this.newTotalAirTransportationCost = ko.computed(function () {
            var totalCost = 0;
            if (parent.numberOfAdults() > 0) {
                totalCost += parent.numberOfAdults() * this.newSingleFareCost();
            }
            if (parent.numberOfChildren() > 0) {
                totalCost += parent.numberOfChildren() * this.newSingleFareCost();
            }
            totalCost += this.newTotalDiscounts();
            totalCost += this.newTotalFlightCharges();
            return totalCost;
        }, this);

        this.totalAirTransportationCost = ko.computed(function () {
            var totalCost = 0;
            if (parent.numberOfAdults() > 0) {
                totalCost += parent.numberOfAdults() * this.singleFareCost();
            }
            if (parent.numberOfChildren() > 0) {
                totalCost += parent.numberOfChildren() * this.singleFareCost();
            }
            totalCost += this.totalDiscounts();
            totalCost += this.totalFlightCharges();
            return totalCost;
        }, this);

        this.aggregateBundleFees = ko.computed(function() {
            return this.getAggregate('bundleFees');
        }, this);

        this.aggregateBundleFeesPositive = ko.computed(function () {
            return _.filter(this.aggregateBundleFees(), function (d) { return d.amount() > 0; });
        }, this);

        this.aggregateBundleFeesNegative = ko.computed(function () {
            return _.filter(this.aggregateBundleFees(), function (d) { return d.amount() < 0; });
        }, this);

        this.totalBundleFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateBundleFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.oldTotalBundleFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateBundleFees(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalBundleFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateBundleFees(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalBundleFeesPositive = ko.computed(function () {
            var sum = _.reduce(this.aggregateBundleFeesPositive(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.totalBundleFeesNegative = ko.computed(function () {
            var sum = _.reduce(this.aggregateBundleFeesNegative(), function (memo, d) { return memo + d.amount(); }, 0);
            return Math.abs(sum);
        }, this);

        // Combine seat fees from all segments
        // Returns a list of combined service charges
        this.aggregateSeatFees = ko.computed(function () {
            return this.getAggregate('seatFees');
        }, this);

        this.aggregateSeatFeesPositive = ko.computed(function () {
            return _.filter(this.aggregateSeatFees(), function (d) { return d.amount() > 0; });
        }, this);

        this.aggregateSeatFeesNegative = ko.computed(function () {
            return _.filter(this.aggregateSeatFees(), function (d) { return d.amount() < 0; });
        }, this);

        this.totalSeatFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateSeatFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.oldTotalSeatFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateSeatFees(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalSeatFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateSeatFees(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalSeatFeesPositive = ko.computed(function () {
            var sum = _.reduce(this.aggregateSeatFeesPositive(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.totalSeatFeesNegative = ko.computed(function () {
            var sum = _.reduce(this.aggregateSeatFeesNegative(), function (memo, d) { return memo + d.amount(); }, 0);
            return Math.abs(sum);
        }, this);

        this.aggregateBagFees = ko.computed(function () {
            return this.getAggregate('bagFees');
        }, this);

        this.aggregateBagFeesPositive = ko.computed(function () {
            return _.filter(this.aggregateBagFees(), function (d) { return d.amount() > 0; });
        }, this);

        this.aggregateBagFeesNegative = ko.computed(function () {
            return _.filter(this.aggregateBagFees(), function (d) { return d.amount() < 0; });
        }, this);
        
        this.totalBagFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateBagFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.oldTotalBagFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateBagFees(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalBagFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateBagFees(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalBagFeesPositive = ko.computed(function () {
            var sum = _.reduce(this.aggregateBagFeesPositive(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.totalBagFeesNegative = ko.computed(function () {
            var sum = _.reduce(this.aggregateBagFeesNegative(), function (memo, d) { return memo + d.amount(); }, 0);
            return Math.abs(sum);
        }, this);

        this.aggregateBasicBundleFees = ko.computed(function () {
            return this.getAggregate('basicBundleFees');
        }, this);

        this.aggregateBasicBundleFeesPositive = ko.computed(function () {
            return _.filter(this.aggregateBasicBundleFees(), function (d) { return d.amount() > 0; });
        }, this);

        this.aggregateBasicBundleFeesNegative = ko.computed(function () {
            return _.filter(this.aggregateBasicBundleFees(), function (d) { return d.amount() < 0; });
        }, this);

        this.totalBasicBundleFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateBasicBundleFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.oldTotalBasicBundleFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateBasicBundleFees(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalBasicBundleFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateBasicBundleFees(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalBasicBundleFeesPositive = ko.computed(function () {
            var sum = _.reduce(this.aggregateBasicBundleFeesPositive(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.totalBasicBundleFeesNegative = ko.computed(function () {
            var sum = _.reduce(this.aggregateBasicBundleFeesNegative(), function (memo, d) { return memo + d.amount(); }, 0);
            return Math.abs(sum);
        }, this);

        this.aggregatePetcFees = ko.computed(function () {
            return this.getAggregate('petcFees');
        }, this);

        this.aggregatePetcFeesPositive = ko.computed(function () {
            return _.filter(this.aggregatePetcFees(), function (d) { return d.amount() > 0; });
        }, this);

        this.aggregatePetcFeesNegative = ko.computed(function () {
            return _.filter(this.aggregatePetcFees(), function (d) { return d.amount() < 0; });
        }, this);

        this.totalPetcFees = ko.computed(function () {
            var sum = _.reduce(this.aggregatePetcFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.oldTotalPetcFees = ko.computed(function () {
            var sum = _.reduce(this.aggregatePetcFees(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalPetcFees = ko.computed(function () {
            var sum = _.reduce(this.aggregatePetcFees(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalPetcFeesPositive = ko.computed(function () {
            var sum = _.reduce(this.aggregatePetcFeesPositive(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.totalPetcFeesNegative = ko.computed(function () {
            var sum = _.reduce(this.aggregatePetcFeesNegative(), function (memo, d) { return memo + d.amount(); }, 0);
            return Math.abs(sum);
        }, this);

        this.aggregateChangeCancelFees = ko.computed(function () {
            return this.getAggregate('changeCancelFees');
        }, this);

        this.oldTotalChangeCancelFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateChangeCancelFees(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalChangeCancelFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateChangeCancelFees(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalChangeCancelFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateChangeCancelFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.aggregateOtherFees = ko.computed(function () {
            return this.getAggregate('otherFees');
        }, this);

        this.aggregateOtherFeesPositive = ko.computed(function () {
            return _.filter(this.aggregateOtherFees(), function (d) { return d.amount() > 0; });
        }, this);

        this.aggregateOtherFeesNegative = ko.computed(function () {
            return _.filter(this.aggregateOtherFees(), function (d) { return d.amount() < 0; });
        }, this);

        this.aggregateAddonFees = ko.computed(function () {
            return this.getAggregate('addonFees');
        }, this);

        this.aggregateAddonFeesPositive = ko.computed(function () {
            return _.filter(this.aggregateAddonFees(), function (d) { return d.amount() > 0; });
        }, this);

        this.aggregateAddonFeesNegative = ko.computed(function () {
            return _.filter(this.aggregateAddonFees(), function (d) { return d.amount() < 0; });
        }, this);

        this.hasRefundAddon = ko.computed(function () {
            return _.find(this.aggregateAddonFees(), function (d) { return d.chargeCode() === 'RFN' || d.chargeCode() === 'RFND'; });
        }, this);

        this.hasFlexAddon = ko.computed(function () {
            return _.find(this.aggregateAddonFees(), function (d) { return d.chargeCode() === 'FLX' || d.chargeCode() === 'FLEX'; });
        }, this);

        this.hasFlexRefundAddon = ko.computed(function () {
            return _.find(this.aggregateAddonFees(), function (d) { return d.chargeCode() === 'FXRF' || d.chargeCode() === 'FLRF'; });
        }, this);

        this.hasBundle = ko.computed(function () {
            var bundle = _.find(this.aggregateBundleFees(), function (d) { 
                return _.contains(porter.BUNDLE_SSR_LIST, d.chargeCode()); });
            if (bundle) return true;
            return false;
        }, this);

        this.totalOtherFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateOtherFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.oldTotalOtherFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateOtherFees(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalOtherFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateOtherFees(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalOtherFeesPositive = ko.computed(function () {
            var sum = _.reduce(this.aggregateOtherFeesPositive(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.totalOtherFeesNegative = ko.computed(function () {
            var sum = _.reduce(this.aggregateOtherFeesNegative(), function (memo, d) { return memo + d.amount(); }, 0);
            return Math.abs(sum);
        }, this);
		
        this.totalAddons = ko.computed(function () {
            var sum = _.reduce(this.aggregateAddonFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.oldTotalAddonsFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateAddonFees(), function (memo, d) { return memo + d.oldAmount(); }, 0);
            return sum;
        }, this);

        this.newTotalAddonsFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateAddonFees(), function (memo, d) { return memo + d.newAmount(); }, 0);
            return sum;
        }, this);

        this.totalAddonsFeesPositive = ko.computed(function () {
            var sum = _.reduce(this.aggregateAddonFeesPositive(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.totalAddonsFeesNegative = ko.computed(function () {
            var sum = _.reduce(this.aggregateAddonFeesNegative(), function (memo, d) { return memo + d.amount(); }, 0);
            return Math.abs(sum);
        }, this);

        this.getAllBaggageFees = ko.computed(function () {
            var arr = [];
            for (var x = 0; x < this.segments().length; x++) {
                var segment = this.segments()[x];
                for (var y = 0; y < segment.bagFees().length; y++) {
                    arr.push(segment.bagFees()[y]);
                }
            }
            var ret = this.groupBaggageFeeByChargeCode(arr);
            return ret.sort(function(a, b) { return a.chargeCode() > b.chargeCode() ? 1 : -1; });
        }, this);

        this.getAllBundleFees = ko.computed(function () {
            var arr = [];
            for (var x = 0; x < this.segments().length; x++) {
                var segment = this.segments()[x];
                for (var y = 0; y < segment.bundleFees().length; y++) {
                    arr.push(segment.bundleFees()[y]);
                }
            }
            return this.groupBundleFeeByChargeCode(arr);
        }, this);

        this.getAllAddonFees = ko.computed(function () {
            var charges = {};

            // existing fees on segments
            for (var x = 0; x < this.segments().length; x++) {
                var segment = this.segments()[x];
                for (var y = 0; y < segment.addonFees().length; y++) {
                    var fee = segment.addonFees()[y]
                    for (var z = 0; z < fee.allCharges().length; z++) {
                        var serviceCharge = fee.allCharges()[z];
                        if (!charges[serviceCharge.chargeCode()]) {
                            var newServiceCharge = new ServiceCharge();
                            newServiceCharge.copyData(serviceCharge);
                            charges[serviceCharge.chargeCode()] = newServiceCharge;
                        } else {
                            // Update amount
                            charges[serviceCharge.chargeCode()].newAmount(charges[serviceCharge.chargeCode()].newAmount() + serviceCharge.newAmount());
                            charges[serviceCharge.chargeCode()].oldAmount(charges[serviceCharge.chargeCode()].oldAmount() + serviceCharge.oldAmount());
                        }
                    }
                }
            }

            var arr = [];
            for (var prop in charges) {
                if (charges.hasOwnProperty(prop)) {
                    if (charges[prop].amount() !== 0) {
                        arr.push(charges[prop]);
                    }
                }
            }
            return _.sortBy(arr, 'amount');
        }, this);

        this.totalSinglePassengerPoints = ko.computed(function () {
            var sum =
                this.totalFarePoints();
            var singleAmount = sum / parent.paxCount();
            return singleAmount;
        }, this);

        this.totalSinglePassengerAmount = ko.computed(function () {
            var sum =
                this.totalAirTransportationCost() +
                this.totalTaxesFeesCharges();
            var singleAmount = sum / parent.paxCount();
            return singleAmount;
        }, this);

        this.newTotalSinglePassengerAmount = ko.computed(function () {
            var sum =
                this.newTotalAirTransportationCost() +
                this.newTotalTaxesFeesCharges();
            var singleAmount = sum / parent.paxCount();
            return singleAmount;
        }, this);

        this.oldTotalSinglePassengerAmount = ko.computed(function () {
            var sum =
                this.oldTotalAirTransportationCost() +
                this.oldTotalTaxesFeesCharges();
            var singleAmount = sum / parent.paxCount();
            return singleAmount;
        }, this);

        this.totalJourneyAmount = ko.computed(function () {
            var sum = 
                this.totalAirTransportationCost() +
                this.totalTaxesFeesCharges() +
                this.totalBundleFees() +
                this.totalSeatFees() +
                this.totalBagFees() +
                this.totalBasicBundleFees() +
                this.totalPetcFees() +
                this.totalChangeCancelFees() +
                this.totalOtherFees() +
                this.totalAddons();
            return sum;
        }, this);

        this.oldTotalJourneyAmount = ko.computed(function () {
            var sum = 0;
            //    this.oldTotalAirTransportationCost() +
            //    this.oldTotalTaxesFeesCharges() +
            //    //this.totalSeatFees() +
            //    this.oldTotalBagFees() +
            //    this.oldTotalBasicBundleFees() +
            //    this.oldTotalChangeCancelFees() +
            //    this.oldTotalOtherFees();
            //if (this.totalSeatFees() < 0) { // this is so when changing flights, we only show the difference in seat charges
            //    sum -= this.totalSeatFees();
            //}

            if (this.isNewFlight()) {
                sum +=
                    this.oldTotalAirTransportationCost() +
                    this.oldTotalTaxesFeesCharges();
            } else {
                sum +=
                    this.totalTaxesFeesChargesNegative();
                if (this.totalAirTransportationCost() < 0) {
                    sum += Math.abs(this.totalAirTransportationCost());
                }
            }
                sum += this.totalBundleFeesNegative();
            //if (this.totalSeatFees() !== 0) {
                sum += this.totalSeatFeesNegative();
            //}
            //if (this.totalBagFees() !== 0) {
                sum += this.totalBagFeesNegative();
            //}
            //if (this.totalBasicBundleFees() !== 0) {
                sum += this.totalBasicBundleFeesNegative();
            //}
            sum += this.totalPetcFeesNegative();
            if (this.totalChangeCancelFees() < 0) {
                sum += Math.abs(this.totalChangeCancelFees());
            }
            if (this.totalAddons() !== 0) {
                sum += this.totalAddonsFeesNegative();
            }
            sum += this.totalOtherFeesNegative();
            return sum;
        }, this);

        this.oldTotalJourneyAmountCancelling = ko.computed(function () {
            var sum = 
                this.oldTotalAirTransportationCost() +
                this.oldTotalTaxesFeesCharges() +
                this.oldTotalBundleFees() +
                this.oldTotalSeatFees() +
                this.oldTotalBagFees() +
                this.oldTotalBasicBundleFees() +
                this.oldTotalPetcFees() +
                this.oldTotalChangeCancelFees() +
                this.oldTotalAddonsFees() +
                this.oldTotalOtherFees();
            return sum;
        }, this);

        this.newTotalJourneyAmount = ko.computed(function () {
            var sum = 0;
            if (this.isNewFlight()) {
                sum +=
                    this.newTotalAirTransportationCost() +
                    this.newTotalTaxesFeesCharges();
            } else {
                sum +=
                    this.totalAirTransportationCost() +
                    this.totalTaxesFeesChargesPositive();
            }
                sum += this.totalBundleFeesPositive();
            //if (this.totalSeatFees() !== 0) {
                sum += this.totalSeatFeesPositive();
            //}
            //if (this.totalBagFees() !== 0) {
                sum += this.totalBagFeesPositive();
            //}
            //if (this.totalBasicBundleFees() !== 0) {
                sum += this.totalBasicBundleFeesPositive();
            //}
            sum += this.totalPetcFeesPositive();
            if (this.totalChangeCancelFees() > 0) {
                sum += this.totalChangeCancelFees();
            }
            sum += this.totalAddonsFeesPositive();
            sum += this.totalOtherFeesPositive();
            return sum;
        }, this);

        this.stationsArray = ko.computed(function () {
            var stations = [];
            
            for (var i = 0; i < this.segments().length; i++) {                
                var segment = this.segments()[i];
                for (var j = 0; j < segment.legs().length; j++) {
                    var leg = segment.legs()[j];
                    if (!stations.includes(leg.DepartureAirportLongName())) {
                        stations.push(leg.DepartureAirportLongName());
                    }
                    if (!stations.includes(leg.ArrivalAirportLongName())) {
                        stations.push(leg.ArrivalAirportLongName());
                    }
                }
            }

            return stations;

        }, this);
       
        //availableJourney.EstimatedDuration = staUTC - stdUTC;
        //if (availableJourney.EstimatedDuration.Seconds > 0) {
        //    availableJourney.EstimatedDuration = new TimeSpan(availableJourney.EstimatedDuration.Hours, availableJourney.EstimatedDuration.Hours, availableJourney.EstimatedDuration.Minutes + 1, 0);
        //}

        this.EstimatedDuration = ko.computed(function () {                        
            
            return moment.duration(this.Duration());
            
            /*
            if (this.STA()) {                                
                //return this.STA().diff(this.STD());
                //debugger
                //return moment.duration(this.STA().diff(this.STD())).add(1, 'minutes'); //WEB-16903 -match with server side code, whcih adds 1 minute
            }

            return null;
            */

        }, this);

        this.stops = ko.computed(function () {
            return this.stationsArray().length - 2;

        }, this);

        this.stationNodes = ko.computed(function () {


            var stationNodes = [];
            
            for (var i = 0; i < this.segments().length; i++) {
                var segment = this.segments()[i];
                for (var j = 0; j < segment.legs().length; j++) {

                    var leg = segment.legs()[j];
                    var stationAdded = _.filter(stationNodes, function (p) { return p.airportName === leg.DepartureStationName() }).length > 0;
                    //if (!stationNodes.includes(leg.DepartureAirportLongName())) {
                    if (!stationAdded) {
                        //var newStationNode = new this.stationNode(leg.DepartureAirportLongName(), leg.DepartureStation());
                        var stationNode = {};
                        stationNode.airportName = leg.DepartureStationName();
                        stationNode.airportCode = leg.DepartureStation();
                        stationNode.airportLongName = leg.DepartureAirportLongName();
                        stationNodes.push(stationNode);
                    }

                    stationAdded = _.filter(stationNodes, function (p) { return p.airportName === leg.ArrivalStationName() }).length > 0;
                    //if (!stationNodes.includes(leg.ArrivalAirportLongName())) {
                    if (!stationAdded) {
                        //var newStationNode = new this.stationNode(leg.ArrivalAirportLongName(), leg.ArrivalStation());                        
                        var stationNode = {};
                        stationNode.airportName = leg.ArrivalStationName();
                        stationNode.airportCode = leg.ArrivalStation();
                        stationNode.airportLongName = leg.ArrivalAirportLongName();
                        stationNodes.push(stationNode);
                    }
                }
            }

            /*
             *                 if (segment.legs().length == 0) {
                    var stationAdded = _.filter(stationNodes, function (p) { return p.airportName === segment.newDepartureStationName() }).length > 0;
                    //if (!stationNodes.includes(leg.DepartureAirportLongName())) {
                    if (!stationAdded) {
                        //var newStationNode = new this.stationNode(leg.DepartureAirportLongName(), leg.DepartureStation());
                        var stationNode = {};
                        stationNode.airportName = segment.newDepartureStationName();
                        stationNode.airportCode = segment.newDepartureStationCode();
                        stationNode.airportLongName = segment.newDepartureStationName();
                        stationNodes.push(stationNode);
                    }

                    stationAdded = _.filter(stationNodes, function (p) { return p.airportName === segment.newArrivalStationName() }).length > 0;
                    //if (!stationNodes.includes(leg.ArrivalAirportLongName())) {
                    if (!stationAdded) {
                        //var newStationNode = new this.stationNode(leg.ArrivalAirportLongName(), leg.ArrivalStation());
                        var stationNode = {};
                        stationNode.airportName = segment.newArrivalStationName();
                        stationNode.airportCode = segment.newArrivalStationCode();
                        stationNode.airportLongName = segment.newArrivalStationName();
                        stationNodes.push(stationNode);
                    }
                }*/
            ////add buffer nodes to maintain flight node length

            //if (stationNodes.length == 2) {
            //    var stationNode = {};
            //    stationNode.airportName = '';
            //    stationNode.airportCode = '';

            //    stationNodes.splice(index, 0, );
            //}

            return stationNodes;

        }, this);

        this.stationLabels = ko.computed(function () {

            var label = '';

            if (this.stationNodes) {
                for (var i = 0; i < this.stationNodes().length; i++) {
                    if (i != 0 && i != (this.stationNodes().length - 1)) {
                        label += this.stationNodes()[i].airportCode;
                        if (i < this.stationNodes().length - 2) {
                            label += ',';
                        }
                    }
                }
            }

            label = '(' + label + ')';
            return label;

        }, this);

        this.charLimitReached = ko.computed(function () {

            var totalLength = 0;
           
            for (var i = 0; i < this.stationsArray().length; i++) {
                if (i != 0 && i + 1 != this.stationsArray().length) {

                    totalLength += this.stationsArray()[i].length;
                }
            }

            return totalLength > 20;

        }, this);       
    };

    $.extend(Journey.prototype, {
        // arrName is the name of observable array in the PaxFare object as a string
        groupPaxFareByPaxType: function (arrName) {
            var paxFares = this.paxFares();
            var paxTypes = {};
            // paxTypes will be in the structure of
            // { ADT: { charges: { HST: ServiceCharge, GST: ServiceCharge } } }
            for (var x = 0; x < paxFares.length; x++) {
                var paxFare = paxFares[x];
                if (!_.isEmpty(paxFare)) {
                    if (!paxTypes[paxFare.paxType()]) {
                        paxTypes[paxFare.paxType()] = {
                            charges: {}
                        };
                    }
                    var charges = paxTypes[paxFare.paxType()].charges;
                    // Loop through charges and combine
                    for (var y = 0; y < paxFare[arrName]().length; y++) {
                        var charge = paxFare[arrName]()[y];
                        if (!charges[charge.chargeCode()]) {
                            var newServiceCharge = new ServiceCharge();
                            newServiceCharge.copyData(charge);
                            charges[charge.chargeCode()] = newServiceCharge;
                        } else {
                            // Update amount
                            charges[charge.chargeCode()].newAmount(charges[charge.chargeCode()].newAmount() + charge.newAmount());
                            charges[charge.chargeCode()].oldAmount(charges[charge.chargeCode()].oldAmount() + charge.oldAmount());
                        }
                    }
                }
            }
            var returnPaxTypes = {};
            for (var prop in paxTypes) {
                if (paxTypes.hasOwnProperty(prop)) {
                    var arr = [];
                    for (var prop2 in paxTypes[prop].charges) {
                        if (paxTypes[prop].charges.hasOwnProperty(prop2)) {
                            // Change the property into an array
                            arr.push(paxTypes[prop].charges[prop2]);
                        }
                    }
                    returnPaxTypes[prop] = arr;
                }
            }
            // returnPaxTypes will be in the structure of
            // { ADT: [ ServiceCharge, ServiceCharge ], CHD: [ ServiceCharge, ServiceCharge ] }
            // The service charge amounts will be for one passenger
            return returnPaxTypes;
        },
        // Combine pax fares for all passenger types
        // For shopping cart
        getAggregatePaxFares: function (groupedCharges, otherCharges) {
            var charges = {};
            if (!_.isEmpty(groupedCharges)) {
                
                for (var paxType in groupedCharges) {
                    if (groupedCharges.hasOwnProperty(paxType)) {
                        var paxCount = 0;
                        if (paxType === porter.PAX_TYPE.ADULT) {
                            paxCount = this.parent.numberOfAdults();
                        } else if (paxType === porter.PAX_TYPE.CHILD) {
                            paxCount = this.parent.numberOfChildren();
                        }
                        if (paxCount > 0) {
                            var paxCharges = groupedCharges[paxType];
                            // Loop through charges and combine
                            for (var x = 0; x < paxCharges.length; x++) {
                                var charge = paxCharges[x];
                                if (!charges[charge.chargeCode()]) {
                                    var newServiceCharge = new ServiceCharge();
                                    newServiceCharge.copyData(charge);
                                    newServiceCharge.newAmount(paxCount * charge.newAmount());
                                    newServiceCharge.oldAmount(paxCount * charge.oldAmount());
                                    charges[charge.chargeCode()] = newServiceCharge;
                                } else {
                                    // Update amount
                                    charges[charge.chargeCode()].newAmount(charges[charge.chargeCode()].newAmount() + (paxCount * charge.newAmount()));
                                    charges[charge.chargeCode()].oldAmount(charges[charge.chargeCode()].oldAmount() + (paxCount * charge.oldAmount()));
                                }
                            }
                        }
                    }
                }
            }
            //check and combine infant tax charges
            if (otherCharges !== 'undefined') {//infant tax charges
                var checkInfant = _.filter(otherCharges, function (f) { return f.chargeCode() === porter.CODES.INFANT });
                if (checkInfant.length > 0) {
                    for (var i = 0; i < otherCharges.length; i++) {
                        var infantCharge = otherCharges[i];
                        //WEB-19169
                        //add US tax fees imposed on infant to taxesFeesCharges (for US destination)
                        if (infantCharge.chargeCode() !== porter.CODES.INFANT) {//skip the first charge for infant (INFT charge = 0)
                            var checkCharge = _.filter(charges, function (f) { return f.chargeCode() === infantCharge.chargeCode() });
                            if (checkCharge.length > 0) {
                                checkCharge[0].newAmount(checkCharge[0].newAmount() + infantCharge.newAmount());
                                checkCharge[0].oldAmount(checkCharge[0].oldAmount() + infantCharge.oldAmount());
                            }
                        }
                    }
                }
            }

            var arr = [];
            for (var prop in charges) {
                if (charges.hasOwnProperty(prop)) {
                    arr.push(charges[prop]);
                }
            }
            return arr;
        },

        // arrName is the name of observable array in the Segment object as a string
        // e.g. 'seatFees' -> segment.seatFees(), 'bagFees' -> segment.bagFees(), 'otherFees' -> segment.otherFees()
        getAggregate: function (arrName) {
            var passengerFees = [];
            for (var x = 0; x < this.segments().length; x++) {
                var segment = this.segments()[x];
                for (var y = 0; y < segment[arrName]().length; y++) {
                    passengerFees.push(segment[arrName]()[y]);
                }
            }
            var arr = getAggregate(passengerFees);
            return arr;
        },
        //group Baggage Fee by ChargeCode
        groupBaggageFeeByChargeCode: function (arr) {  
            var chargeArr = [];
            var returnArr = [];
            
            if (!_.isEmpty(arr)) {
                for (var x = 0; x < arr.length; x++) {
                    var item = arr[x].allCharges(); 
                    for (var y = 0; y < item.length; y++) {
                        var filterArray = chargeArr.filter(function (i) { return i.chargeCode === arr[x].feeCode() });
                        if (filterArray.length < 1) { // if no codes match, we just add a $0 obj of the item
                            //Baggage section update WEB-18744
                            chargeArr.push({ "chargeCode": item[y].chargeCode(), "baseAmount": item[y].amount(), "baseAmountTotal": item[y].amount(), "totalAmount": item[y].amount(), "count": 1, "GST": 0, "HST": 0, "QST": 0 });
                        }
                        else {    
                            var selectedItem = filterArray[0];         ;                   
                            //tax processing
                            if (item[y].chargeCode() === "HST") {
                                selectedItem.HST += item[y].amount();                               
                            }
                            else if (item[y].chargeCode() === "GST") {
                                selectedItem.GST += item[y].amount();
                            }
                            else if (item[y].chargeCode() === "QST") {
                                selectedItem.QST += item[y].amount();
                            }
                            else {
                                selectedItem.count++;
                                selectedItem.baseAmountTotal += item[y].amount();
                            }
                            selectedItem.totalAmount += item[y].amount();
                        }
                    }
                }
                //display bag charges grouping by charge type (BAG/HST/GST/QST) when user in baggage page
                var filterArray = chargeArr.filter(function (i) { return i.chargeCode === "BAG"; });
                if (filterArray.length > 0) {
                    chargeArr.length = 0;
                    for (var i = 0; i < this.aggregateBagFees().length; i++) {
                        var chargeCode = this.aggregateBagFees()[i].chargeCode();
                        if (chargeCode.indexOf("BG") > -1) {
                            chargeCode = "BAG";
                        } 
                        chargeArr.push({ "chargeCode": chargeCode, "baseAmount": this.aggregateBagFees()[i].amount(), "totalAmount": this.aggregateBagFees()[i].amount(), "count": 1, "GST": 0, "HST": 0, "QST": 0 });
                    }
                }          
            }
            for (var i = 0; i < chargeArr.length; i++) {  
                var charge = new BaggageCharge();
                // check for existing charge to consolidate taxes
                var existingCharge = _.find(returnArr, function(r) { return r.chargeCode() === chargeArr[i].chargeCode; });
                if (!_.isEmpty(existingCharge)) {
                    existingCharge.baseAmount(existingCharge.baseAmount() + chargeArr[i].baseAmount);
                    existingCharge.totalAmount(existingCharge.totalAmount() + chargeArr[i].totalAmount);
                    existingCharge.count(existingCharge.count() + 1);
                } else {
                    charge.injectData(chargeArr[i]);
                    returnArr.push(charge);
                }
            }
            return returnArr;
        },
        
        groupBundleFeeByChargeCode: function (arr) {  
            var chargeArr = [];
            var returnArr = [];
            if (!_.isEmpty(arr)) {
                for (var x = 0; x < arr.length; x++) {
                    var item = arr[x].allCharges();
                    for (var y = 0; y < item.length; y++) {
                        var filterArray = chargeArr.filter(function (i) { return i.chargeCode === arr[x].feeCode(); });
                        if (filterArray.length < 1) {
                            chargeArr.push({ "chargeCode": item[y].chargeCode(), "baseAmount": item[y].amount(), "totalAmount": item[y].amount(), "count": 1, "GST": 0, "HST": 0, "QST": 0 });
                        }
                        else {                   
                            var selectedItem = filterArray[0];                            
                            //tax processing
                            if (item[y].chargeCode() === "HST") {
                                selectedItem.HST += item[y].amount();                               
                            }
                            else if (item[y].chargeCode() === "GST") {
                                selectedItem.GST += item[y].amount();
                            }
                            else if (item[y].chargeCode() === "QST") {
                                selectedItem.QST += item[y].amount();
                            }
                            else {
                                selectedItem.count++;
                            }
                            selectedItem.totalAmount += item[y].amount();
                        }
                    }
                }
                //display bag charges grouping by charge type (BAG/HST/GST/QST) when user in baggage page

                // console.log("chargeArr", chargeArr)
                // var filterArray = chargeArr.filter(function (i) { return i.chargeCode === "BAG"; });

                // if (filterArray.length > 0) {
                //     chargeArr.length = 0;
                //     for (var i = 0; i < this.aggregateBagFees().length; i++) {
                //         var chargeCode = this.aggregateBagFees()[i].chargeCode();
                //         if (chargeCode.indexOf("BG") > -1) {
                //             chargeCode = "BAG";
                //         }
                //         chargeArr.push({ "chargeCode": chargeCode, "baseAmount": this.aggregateBagFees()[i].amount(), "totalAmount": this.aggregateBagFees()[i].amount(), "count": 1, "GST": 0, "HST": 0, "QST": 0 });
                //     }
                // }           
            }

            for (var i = 0; i < chargeArr.length; i++) {
                var charge = new BaggageCharge();
                charge.injectData(chargeArr[i]);
                returnArr.push(charge);
            }
            return returnArr;
        },
        // Try to use existing functions to find the station name
        getStationName: function (stationCode) {            
            // stations is declared on a per page level (aspx)
            if (typeof stations !== 'undefined') {
                if (typeof getStationName !== 'undefined') {
                    return getStationName(stationCode, stations);
                } else if (typeof porter.getStationName !== 'undefined') {
                    return porter.getStationName(stationCode, stations);
                }
            }            
            return stationCode;
        },
        toggleSeats: function() {
        this.collapseSeats(!this.collapseSeats());
        },

        toggleBundles: function() {
            this.collapseBundles(!this.collapseBundles());
        },

        toggleFareToolTip: function (groupedCharges) {
            this.fareToolTipVisible(!this.fareToolTipVisible());
        },

        toggleTaxes: function(){
            this.collapseTaxes(!this.collapseTaxes());
        },

        toggleBags: function() {
            this.collapseBags(!this.collapseBags());
        },

        toggleBasicBundle: function() {
            this.collapseBasicBundle(!this.collapseBasicBundle());
        },
        togglePetc: function () {
            this.collapsePetc(!this.collapsePetc());
        },
        toggleOther:function(){
            this.collapseOther(!this.collapseOther());
        },
        toggleChange:function(){
            this.collapseChange(!this.collapseChange());
        },
        toggleAddon: function () {
            this.collapseAddon(!this.collapseAddon());
        },
        toggleTotalAir: function(){
            this.collapseTotalAir(!this.collapseTotalAir());
        },
        toggleOldBookingTotal: function(){
            this.collapseOldBookingTotal(!this.collapseOldBookingTotal());
        },

        showFareToolTip: function (groupedCharges) {                        
            this.fareToolTipVisible(true);
        },
        hideFareToolTip: function (groupedCharges) {            
            this.fareToolTipVisible(false);
        },
        setFareToolTipModal: function (groupedCharges) {
            if (this.newProductName()) {
                // fareSummaryVM.fareToolTipModalMsg(this.fareToolTip());
                // fareSummaryVM.fareToolTipModalProduct(this.newProductName());
                this.parent.fareToolTipModalMsg(this.fareToolTip());
                this.parent.fareToolTipModalProduct(this.newProductName());
            } else if (this.oldProductName()) {
                // fareSummaryVM.fareToolTipModalMsg(this.fareToolTip());
                // fareSummaryVM.fareToolTipModalProduct(this.oldProductName());
                this.parent.fareToolTipModalMsg(this.fareToolTip());
                this.parent.fareToolTipModalProduct(this.oldProductName());
            }
            //$('.modal-backdrop').removeClass("modal-backdrop");    // on mobile view, the backdrop accidentally hides the modal content. This fixes it
            return true;
        },
        // data is of type BookingSummaryJourneyViewModel
        injectData: function (data) {
            if (!_.isEmpty(data)) {
                this.newFlightReference(data.Segments[0].NewFlightReference);
                this.newJourneySellKey(data.NewJourneySellKey);
                this.oldJourneySellKey(data.OldJourneySellKey);
                this.flightModifyType(data.FlightModifyType);
                this.B2CPromotionCode(data.B2CPromotionCode);
                this.corporatePromotionCode(data.CorporatePromotionCode);
                this.promotionCode(data.PromotionCode);  
                this.Duration(data.Duration);
                if (data.Segments.length > 0 && data.Segments[0].Fares && data.Segments[0].Fares.length > 0) {
                    if (data.Segments[0].Fares[0].NewProductToolTip) {
                        this.fareToolTip(data.Segments[0].Fares[0].NewProductToolTip);
                    } else if (data.Segments[0].Fares[0].OldProductToolTip) {
                        this.fareToolTip(data.Segments[0].Fares[0].OldProductToolTip);
                    }
                }
                this.isOneTimeUsePromoCode(data.IsOneTimeUsePromoCode);
                if (!_.isEmpty(data.Segments)) {
                    for (var x = 0; x < data.Segments.length; x++) {
                        var segment = data.Segments[x];
                        var newSegment = new Segment(this);
                        newSegment.injectData(segment);
                        this.segments.push(newSegment);

                        //if (segment.Legs) {
                        //    for (var y = 0; y < segment.Legs.length; y++) {
                        //        var leg = segment.Legs[y];
                        //        var newLeg = new Leg(segment);
                        //        newLeg.injectData(leg);
                        //        newSegment.legs.push(newLeg);
                        //    }
                        //}

                        if (segment.NewSegmentLegs) {
                            for (var y = 0; y < segment.NewSegmentLegs.length; y++) {
                                var leg = segment.NewSegmentLegs[y];
                                var newLeg = new Leg(newSegment);
                                newLeg.injectData(leg);
                                newSegment.legs.push(newLeg);
                            }
                        } else if (segment.OldSegmentLegs) {
                            for (var y = 0; y < segment.OldSegmentLegs.length; y++) {
                                var leg = segment.OldSegmentLegs[y];
                                var newLeg = new Leg(newSegment);
                                newLeg.injectData(leg);
                                newSegment.legs.push(newLeg);
                            }
                        }
                    }
                }
            }
        }
    });

    var PassengerFee = function (parent) {
        var _self = this;

        // parent is a Passenger
        this.parent = parent;

        this.feeCode = ko.observable();
        this.feeDetail = ko.observable();
        this.newFlightReference = ko.observable();
        this.oldFlightReference = ko.observable();

        this.serviceCharges = ko.observableArray();
        this.discounts = ko.observableArray();
        this.taxes = ko.observableArray();

        // Return serviceCharges, discounts, and taxes as one array
        this.allCharges = ko.computed(function () {
            return this.serviceCharges().concat(this.discounts()).concat(this.taxes());
        }, this);

        this.oldTotalAmount = ko.computed(function () {
            return this.getTotal('oldAmount');
        }, this);

        this.newTotalAmount = ko.computed(function () {
            return this.getTotal('newAmount');
        }, this);

        this.totalAmount = ko.computed(function () {
            return this.getTotal('amount');
        }, this);
    };

    $.extend(PassengerFee.prototype, {
        // amtName is the name of the observable in the ServiceCharge object
        // e.g. 'amount' -> serviceCharge.amount()
        getTotal: function (amtName) {
            var sum = 0;
            for (var x = 0; x < this.serviceCharges().length; x++) {
                sum += this.serviceCharges()[x][amtName]();
            }
            for (var x = 0; x < this.discounts().length; x++) {
                sum += this.discounts()[x][amtName]();
            }
            for (var x = 0; x < this.taxes().length; x++) {
                sum += this.taxes()[x][amtName]();
            }
            return sum;
        },
        // data is of type BookingSummaryPassengerFeeViewModel
        injectData: function (data) {
            if (!_.isEmpty(data)) {
                this.feeCode(data.FeeCode);
                this.feeDetail(data.FeeDetail);
                this.newFlightReference(data.NewFlightReference);
                this.oldFlightReference(data.OldFlightReference);
                if (_.isEmpty(data.FeeDetail) && !_.isEmpty(data.ServiceCharges)) {
                    for (var x = 0; x < data.ServiceCharges.length; x++) {
                        this.feeDetail(data.ServiceCharges[0].Description);
                    }
                }
                if (!_.isEmpty(data.ServiceCharges)) {
                    for (var x = 0; x < data.ServiceCharges.length; x++) {
                        var serviceCharge = data.ServiceCharges[x];
                        var newServiceCharge = new ServiceCharge(this);
                        newServiceCharge.injectData(serviceCharge);
                        this.serviceCharges.push(newServiceCharge);
                    }
                }
                if (!_.isEmpty(data.Discounts)) {
                    for (var x = 0; x < data.Discounts.length; x++) {
                        var serviceCharge = data.Discounts[x];
                        var newServiceCharge = new ServiceCharge(this);
                        newServiceCharge.injectData(serviceCharge);
                        // Populate discounts as negative amounts
                        newServiceCharge.newAmount(-newServiceCharge.newAmount());
                        newServiceCharge.oldAmount(-newServiceCharge.oldAmount());
                        this.discounts.push(newServiceCharge);
                    }
                }
                if (!_.isEmpty(data.Taxes)) {
                    for (var x = 0; x < data.Taxes.length; x++) {
                        var serviceCharge = data.Taxes[x];
                        var newServiceCharge = new ServiceCharge(this);
                        newServiceCharge.injectData(serviceCharge);
                        this.taxes.push(newServiceCharge);
                    }
                }
            }
        }
    });

    // For the Booking summary
    var PassengerJourney = function (parent) {
        var _self = this;

        // parent is a Passenger
        this.parent = parent;

        this.journey = ko.observable();

        this.collapse = ko.observable(false);
        this.collapseFareTotal = ko.observable(false);
        this.collapseFare = ko.observable(false);
        this.collapseTaxes = ko.observable(false);
        this.collapseSeats = ko.observable(true);
        this.collapseBags = ko.observable(true);
        this.collapseBasicBundle = ko.observable(true);
        this.collapsePetc = ko.observable(true);
        this.collapseChangeCancel = ko.observable(true);
        this.collapseAddons = ko.observable(true);
        this.collapseOther = ko.observable(true);

        this.collapseCartSeats = ko.observable(true);
        this.collapseCartBags = ko.observable(true);
        this.collapseCartBasicBundle = ko.observable(true);
        this.collapseCartPetc = ko.observable(true);
        this.collapseCartAddons = ko.observable(true);
        this.hasSeatChange = ko.observable(false); // only for pnr mod, to check if seats have been changed

        this.showCollapseBtn = ko.computed(function () {
            var root = this.parent.parent;
            // Maybe check if there are any free bags/seats
            if (root.showAllCharges() || this.seatFeesTotal() !== 0 || this.bagFeesTotal() !== 0 || this.basicBundleFeesTotal() !== 0 ||
                this.petcFeesTotal() !== 0 || this.changeCancelFeesTotal() !== 0 || (typeof this.addonsFeesTotal != 'undefined' && this.addonsFeesTotal() !== 0) || this.otherFeesTotal() !== 0) {
                return true;
            }
            return false;
        }, this);

        this.discounts = ko.computed(function () {
            if (!_.isEmpty(this.journey())) {
                return this.journey().groupedDiscounts()[this.parent.paxType()];
            }
        }, this);

        this.flightCharges = ko.computed(function () {
            if (!_.isEmpty(this.journey())) {
                return this.journey().groupedFlightCharges()[this.parent.paxType()];
            }
        }, this);

        this.taxesFeesCharges = ko.computed(function () {
            if (!_.isEmpty(this.journey())) {
                return this.journey().groupedTaxesFeesCharges()[this.parent.paxType()];
            }
        }, this);

        // Returns an object sorted by segment station pair
        // Data structure of { 'YTZ-EWR': PaxSeat }
        this.paxSeats = ko.computed(function () {
            var segments = {};
            if (!_.isEmpty(this.journey())) {
                var paxNumber = this.parent.passengerNumber();
                for (var x = 0; x < this.journey().segments().length; x++) {
                    var segment = this.journey().segments()[x];
                    for (var y = 0; y < segment.paxSeats().length; y++) {
                        var seat = segment.paxSeats()[y];
                        // Look for seats for this passenger
                        if (seat.passengerNumber() === paxNumber) {
                            // Arrange by segment
                            segments[segment.newStationPair()] = seat;
                        }
                    }
                }
            }
            return segments;
        }, this);

        this.newSeatNumbers = ko.computed(function () {
            var arr = [];
            for (var prop in this.paxSeats()) {
                if (this.paxSeats().hasOwnProperty(prop)) {
                    var seatNumber = this.paxSeats()[prop].newUnitDesignator();
                    if (!_.isEmpty(seatNumber) && seatNumber !== 'Aisle' && seatNumber !== 'Window') {
                        arr.push(seatNumber);
                    }
                    if (seatNumber !== this.paxSeats()[prop].oldUnitDesignator()) {
                        this.hasSeatChange(true);
                    }
                }
            }
            return arr;
        }, this);

        this.seatFees = ko.computed(function () {
            var arr = [];
            if (!_.isEmpty(this.journey())) {
                var paxNumber = this.parent.passengerNumber();
                for (var x = 0; x < this.journey().segments().length; x++) {
                    var segment = this.journey().segments()[x];
                    for (var y = 0; y < segment.seatFees().length; y++) {
                        var fee = segment.seatFees()[y];
                        if (fee.parent.passengerNumber() === paxNumber) {
                            arr.push(fee);
                        }
                    }
                }
            }
            return arr;
        }, this);

        // Return seatFees as a list of service charges with charges first followed by taxes
        this.sortedSeatCharges = ko.computed(function () {
            var charges = [];
            var taxes = [];
            for (var x = 0; x < this.seatFees().length; x++) {
                var fee = this.seatFees()[x];
                charges = charges.concat(fee.serviceCharges()).concat(fee.discounts());
                taxes = taxes.concat(fee.taxes());
            }
            return charges.concat(taxes);
        }, this);

        this.aggregateSeatCharges = ko.computed(function () {
            return getAggregate(this.seatFees());
        }, this);

        this.oldSeatFeesTotal = ko.computed(function () {
            return _.reduce(this.seatFees(), function (memo, d) { return memo + d.oldTotalAmount(); }, 0);
        }, this);

        this.newSeatFeesTotal = ko.computed(function () {
            return _.reduce(this.seatFees(), function (memo, d) { return memo + d.newTotalAmount(); }, 0);
        }, this);

        this.seatFeesTotal = ko.computed(function () {
            return _.reduce(this.seatFees(), function (memo, d) { return memo + d.totalAmount(); }, 0);
        }, this);

        this.bagFees = ko.computed(function () {
            var arr = [];
            if (!_.isEmpty(this.journey())) {
                var paxNumber = this.parent.passengerNumber();
                for (var x = 0; x < this.journey().segments().length; x++) {
                    var segment = this.journey().segments()[x];
                    for (var y = 0; y < segment.bagFees().length; y++) {
                        var fee = segment.bagFees()[y];
                        if (fee.parent.passengerNumber() === paxNumber) {
                            arr.push(fee);
                        }
                    }
                }
            }
            return arr;
        }, this);

        this.aggregateBagCharges = ko.computed(function () {
            return getAggregate(this.bagFees());
        }, this);

        this.oldBagFeesTotal = ko.computed(function () {
            return _.reduce(this.bagFees(), function (memo, d) { return memo + d.oldTotalAmount(); }, 0);
        }, this);

        this.newBagFeesTotal = ko.computed(function () {
            return _.reduce(this.bagFees(), function (memo, d) { return memo + d.newTotalAmount(); }, 0);
        }, this);

        this.bagFeesTotal = ko.computed(function () {
            return _.reduce(this.bagFees(), function (memo, d) { return memo + d.totalAmount(); }, 0);
        }, this);

        this.basicBundleFees = ko.computed(function () {
            var arr = [];
            if (!_.isEmpty(this.journey())) {
                var paxNumber = this.parent.passengerNumber();
                for (var x = 0; x < this.journey().segments().length; x++) {
                    var segment = this.journey().segments()[x];
                    for (var y = 0; y < segment.basicBundleFees().length; y++) {
                        var fee = segment.basicBundleFees()[y];
                        if (fee.parent.passengerNumber() === paxNumber) {
                            arr.push(fee);
                        }
                    }
                }
            }
            return arr;
        }, this);

        this.aggregateBasicBundleCharges = ko.computed(function () {
            return getAggregate(this.basicBundleFees());
        }, this);

        this.oldBasicBundleFeesTotal = ko.computed(function () {
            return _.reduce(this.basicBundleFees(), function (memo, d) { return memo + d.oldTotalAmount(); }, 0);
        }, this);

        this.newBasicBundleFeesTotal = ko.computed(function () {
            return _.reduce(this.basicBundleFees(), function (memo, d) { return memo + d.newTotalAmount(); }, 0);
        }, this);

        this.basicBundleFeesTotal = ko.computed(function () {
            return _.reduce(this.basicBundleFees(), function (memo, d) { return memo + d.totalAmount(); }, 0);
        }, this);

        this.petcFees = ko.computed(function () {
            var arr = [];
            if (!_.isEmpty(this.journey())) {
                var paxNumber = this.parent.passengerNumber();
                for (var x = 0; x < this.journey().segments().length; x++) {
                    var segment = this.journey().segments()[x];
                    for (var y = 0; y < segment.petcFees().length; y++) {
                        var fee = segment.petcFees()[y];
                        if (fee.parent.passengerNumber() === paxNumber) {
                            arr.push(fee);
                        }
                    }
                }
            }
            return arr;
        }, this);

        this.aggregatePetcCharges = ko.computed(function () {
            return getAggregate(this.petcFees());
        }, this);

        this.oldPetcFeesTotal = ko.computed(function () {
            return _.reduce(this.petcFees(), function (memo, d) { return memo + d.oldTotalAmount(); }, 0);
        }, this);

        this.newPetcFeesTotal = ko.computed(function () {
            return _.reduce(this.petcFees(), function (memo, d) { return memo + d.newTotalAmount(); }, 0);
        }, this);

        this.petcFeesTotal = ko.computed(function () {
            return _.reduce(this.petcFees(), function (memo, d) { return memo + d.totalAmount(); }, 0);
        }, this);

        this.changeCancelFees = ko.computed(function () {
            var arr = [];
            if (!_.isEmpty(this.journey())) {
                var paxNumber = this.parent.passengerNumber();
                for (var x = 0; x < this.journey().segments().length; x++) {
                    var segment = this.journey().segments()[x];
                    for (var y = 0; y < segment.changeCancelFees().length; y++) {
                        var fee = segment.changeCancelFees()[y];
                        if (fee.parent.passengerNumber() === paxNumber) {
                            arr.push(fee);
                        }
                    }
                }
            }
            return arr;
        }, this);

        this.aggregateChangeCancelCharges = ko.computed(function () {
            return getAggregate(this.changeCancelFees());
        }, this);

        this.oldChangeCancelFeesTotal = ko.computed(function () {
            return _.reduce(this.changeCancelFees(), function (memo, d) { return memo + d.oldTotalAmount(); }, 0);
        }, this);

        this.newChangeCancelFeesTotal = ko.computed(function () {
            return _.reduce(this.changeCancelFees(), function (memo, d) { return memo + d.newTotalAmount(); }, 0);
        }, this);

        this.changeCancelFeesTotal = ko.computed(function () {
            return _.reduce(this.changeCancelFees(), function (memo, d) { return memo + d.totalAmount(); }, 0);
        }, this);

        this.addonFees = ko.computed(function () {
            var arr = [];
            if (!_.isEmpty(this.journey())) {
                var paxNumber = this.parent.passengerNumber();
                for (var x = 0; x < this.journey().segments().length; x++) {
                    var segment = this.journey().segments()[x];
                    for (var y = 0; y < segment.addonFees().length; y++) {
                        var fee = segment.addonFees()[y];
                        if (fee.parent.passengerNumber() === paxNumber) {
                            arr.push(fee);
                        }
                    }
                }
            }
            return arr;
        }, this);

        this.aggregateAddonCharges = ko.computed(function () {
            return getAggregate(this.addonFees());
        }, this);

        this.oldAddonFeesTotal = ko.computed(function () {
            return _.reduce(this.addonFees(), function (memo, d) { return memo + d.oldTotalAmount(); }, 0);
        }, this);

        this.newAddonFeesTotal = ko.computed(function () {
            return _.reduce(this.addonFees(), function (memo, d) { return memo + d.newTotalAmount(); }, 0);
        }, this);

        this.addonFeesTotal = ko.computed(function () {
            return _.reduce(this.addonFees(), function (memo, d) { return memo + d.totalAmount(); }, 0);
        }, this);

        this.otherFees = ko.computed(function () {
            var arr = [];
            if (!_.isEmpty(this.journey())) {
                var paxNumber = this.parent.passengerNumber();
                for (var x = 0; x < this.journey().segments().length; x++) {
                    var segment = this.journey().segments()[x];
                    for (var y = 0; y < segment.otherFees().length; y++) {
                        var fee = segment.otherFees()[y];
                        if (fee.parent.passengerNumber() === paxNumber) {
                            arr.push(fee);
                        }
                    }
                }
            }
            return arr;
        }, this);

        this.aggregateOtherCharges = ko.computed(function () {
            return getAggregate(this.otherFees());
        }, this);

        this.oldOtherFeesTotal = ko.computed(function () {
            return _.reduce(this.otherFees(), function (memo, d) { return memo + d.oldTotalAmount(); }, 0);
        }, this);

        this.newOtherFeesTotal = ko.computed(function () {
            return _.reduce(this.otherFees(), function (memo, d) { return memo + d.newTotalAmount(); }, 0);
        }, this);

        this.otherFeesTotal = ko.computed(function () {
            return _.reduce(this.otherFees(), function (memo, d) { return memo + d.totalAmount(); }, 0);
        }, this);

        this.oldTotalFareCost = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                sum += this.journey().oldSingleFareCost();
                var discounts = this.discounts();
                if (discounts) {
                    sum += _.reduce(discounts, function (memo, d) { return memo + d.oldAmount(); }, 0);
                }
            }
            return sum;
        }, this);

        this.newTotalFareCost = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                sum += this.journey().newSingleFareCost();
                var discounts = this.discounts();
                if (discounts) {
                    sum += _.reduce(discounts, function (memo, d) { return memo + d.newAmount(); }, 0);
                }
            }
            return sum;
        }, this);

        this.totalFareCost = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                sum += this.journey().singleFareCost();
                var discounts = this.discounts();
                if (discounts) {
                    sum += _.reduce(discounts, function (memo, d) { return memo + d.amount(); }, 0);
                }
            }
            return sum;
        }, this);

        this.oldTotalTaxesFeesCharges = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                var taxes = this.taxesFeesCharges();
                if (!_.isEmpty(taxes)) {
                    sum += _.reduce(taxes, function (memo, d) { return memo + d.oldAmount(); }, 0);
                }
            }
            return sum;
        }, this);

        this.newTotalTaxesFeesCharges = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                var taxes = this.taxesFeesCharges();
                if (!_.isEmpty(taxes)) {
                    sum += _.reduce(taxes, function (memo, d) { return memo + d.newAmount(); }, 0);
                }
            }
            return sum;
        }, this);

        this.totalTaxesFeesCharges = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                var taxes = this.taxesFeesCharges();
                if (!_.isEmpty(taxes)) {
                    sum += _.reduce(taxes, function (memo, d) { return memo + d.amount(); }, 0);
                }
            }
            return sum;
        }, this);

        this.oldTotalAirTransportationCost = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                sum += this.oldTotalFareCost();
                var flightCharges = this.flightCharges();
                if (flightCharges) {
                    sum += _.reduce(flightCharges, function (memo, d) { return memo + d.oldAmount(); }, 0);
                }
                sum += this.oldTotalTaxesFeesCharges();
            }
            return sum;
        }, this);

        this.newTotalAirTransportationCost = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                sum += this.newTotalFareCost();
                var flightCharges = this.flightCharges();
                if (flightCharges) {
                    sum += _.reduce(flightCharges, function (memo, d) { return memo + d.newAmount(); }, 0);
                }
                sum += this.newTotalTaxesFeesCharges();
            }
            return sum;
        }, this);

        this.totalAirTransportationCost = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                sum += this.totalFareCost();
                var flightCharges = this.flightCharges();
                if (flightCharges) {
                    sum += _.reduce(flightCharges, function (memo, d) { return memo + d.amount(); }, 0);
                }
                sum += this.totalTaxesFeesCharges();
            }
            return sum;
        }, this);

        this.oldTotalAmount = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                var paxType = this.parent.paxType();
                sum += this.oldTotalAirTransportationCost();
                var fees = this.seatFees().concat(this.bagFees()).concat(this.basicBundleFees()).concat(this.petcFees()).concat(this.changeCancelFees()).concat(this.addonFees()).concat(this.otherFees());
                sum += _.reduce(fees, function (memo, d) { return memo + d.oldTotalAmount(); }, 0);
            }
            return sum;
        }, this);

        this.newTotalAmount = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                var paxType = this.parent.paxType();
                sum += this.newTotalAirTransportationCost();
                var fees = this.seatFees().concat(this.bagFees()).concat(this.basicBundleFees()).concat(this.petcFees()).concat(this.changeCancelFees()).concat(this.addonFees()).concat(this.otherFees());
                sum += _.reduce(fees, function (memo, d) { return memo + d.newTotalAmount(); }, 0);
            }
            return sum;
        }, this);

        this.totalAmount = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                var paxType = this.parent.paxType();
                sum += this.totalAirTransportationCost();
                var fees = this.seatFees().concat(this.bagFees()).concat(this.basicBundleFees()).concat(this.petcFees()).concat(this.changeCancelFees()).concat(this.addonFees()).concat(this.otherFees());
                sum += _.reduce(fees, function (memo, d) { return memo + d.totalAmount(); }, 0);
            }
            return sum;
        }, this);

        this.oldTotalPoints = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                sum += this.journey().oldSingleFarePoints();
            }
            return sum;
        }, this);

        this.newTotalPoints = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                sum += this.journey().newSingleFarePoints();
            }
            return sum;
        }, this);

        this.totalPoints = ko.computed(function () {
            var sum = 0;
            if (!_.isEmpty(this.journey())) {
                sum += this.journey().singleFarePoints();
            }
            return sum;
        }, this);
    };

    var Passenger = function (parent) {
        var _self = this;

        // parent is a FareSummaryVM
        this.parent = parent;

        this.passengerNumber = ko.observable();
        this.paxType = ko.observable();
        this.hasInfant = ko.observable(false);

        this.name = ko.observable({
            first: ko.observable(),
            last: ko.observable(),
            middle: ko.observable()
        });

        this.infant = ko.observable({
            name: ko.observable({
                first: ko.observable(),
                last: ko.observable(),
                middle: ko.observable()
            })
        });

        // Fees for all journeys and segments are stored together
        // Use flight reference to determine which segment the fee belongs to
        this.seatFees = ko.observableArray();
        this.bagFees = ko.observableArray();
        this.basicBundleFees = ko.observableArray();
        this.petcFees = ko.observableArray();
        this.changeCancelFees = ko.observableArray();
        this.insuranceFees = ko.observableArray();
        this.otherFees = ko.observableArray();
        this.addonFees = ko.observableArray();
        this.passengerSSRs = ko.observableArray();
        this.bundleFees = ko.observableArray();

        this.addedSeatCharges = ko.observableArray();
        this.addedBagCharges = ko.observableArray();
        this.addedBasicBundleCharges = ko.observableArray();
        this.addedPetcCharges = ko.observableArray();

        this.showSummary = ko.observable(true);
        this.showEditBtn = ko.observable(false);
        this.collapseInsurance = ko.observable(false);
        this.collapseAddons = ko.observable(false);
        this.viporterNumber = ko.observable();

        this.hasBundle = ko.observable(false);

        // Group the added charges by charge detail which should be the segment stations
        // e.g. 'YTZ-EWR'
        this.groupedAddedSeatCharges = ko.computed(function () {
            return _.groupBy(this.addedSeatCharges(), function (s) { return s.chargeDetail(); });
        }, this);
        this.groupedAddedBagCharges = ko.computed(function () {
            return _.groupBy(this.addedBagCharges(), function (s) { return s.chargeDetail(); });
        }, this);
        this.groupedAddedBasicBundleCharges = ko.computed(function () {
            return _.groupBy(this.addedBasicBundleCharges(), function (s) { return s.chargeDetail(); });
        }, this);
        this.groupedAddedPetcCharges = ko.computed(function () {
            return _.groupBy(this.addedPetcCharges(), function (s) { return s.chargeDetail(); });
        }, this);

        // journeys is used on the booking summary only
        this.journeys = ko.computed(function () {
            var arr = [];
            for (var x = 0; x < this.parent.journeys().length; x++) {
                var journey = this.parent.journeys()[x];
                if (!_.isEmpty(journey)) {
                    var newPassengerJourney = new PassengerJourney(this);
                    newPassengerJourney.journey(journey);
                    if (newPassengerJourney.totalAmount() === 0) {
                        newPassengerJourney.collapse(true);
                    }
                    arr.push(newPassengerJourney);
                }
            }
            return arr;
        }, this, { 'deferEvaluation': true });

        // Combined insurance charges
        this.insuranceCharges = ko.computed(function () {
            var charges = {};
            // Look for insurance fees
            for (var x = 0; x < this.parent.insuranceFees().length; x++) {
                var fee = this.parent.insuranceFees()[x];
                for (var y = 0; y < fee.allCharges().length; y++) {
                    var serviceCharge = fee.allCharges()[y];
                    if (!charges[serviceCharge.chargeCode()]) {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.copyData(serviceCharge);
                        newServiceCharge.newAmount(serviceCharge.newAmount() / this.parent.paxCount());
                        newServiceCharge.oldAmount(serviceCharge.oldAmount() / this.parent.paxCount());
                        charges[serviceCharge.chargeCode()] = newServiceCharge;
                    } else {
                        // Update amount
                        charges[serviceCharge.chargeCode()].newAmount(charges[serviceCharge.chargeCode()].newAmount() +
                            (serviceCharge.newAmount() / this.parent.paxCount()));
                        charges[serviceCharge.chargeCode()].oldAmount(charges[serviceCharge.chargeCode()].oldAmount() +
                            (serviceCharge.oldAmount() / this.parent.paxCount()));
                    }
                }
            }
            for (var x = 0; x < this.insuranceFees().length; x++) {
                var fee = this.insuranceFees()[x];
                for (var y = 0; y < fee.allCharges().length; y++) {
                    var serviceCharge = fee.allCharges()[y];
                    if (!charges[serviceCharge.chargeCode()]) {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.copyData(serviceCharge);
                        newServiceCharge.newAmount(serviceCharge.newAmount());
                        newServiceCharge.oldAmount(serviceCharge.oldAmount());
                        charges[serviceCharge.chargeCode()] = newServiceCharge;
                    } else {
                        // Update amount
                        charges[serviceCharge.chargeCode()].newAmount(charges[serviceCharge.chargeCode()].newAmount() +
                            serviceCharge.newAmount());
                        charges[serviceCharge.chargeCode()].oldAmount(charges[serviceCharge.chargeCode()].oldAmount() +
                            serviceCharge.oldAmount());
                    }
                }
            }
            var arr = [];
            for (var prop in charges) {
                if (charges.hasOwnProperty(prop)) {
                    arr.push(charges[prop]);
                }
            }
            return arr;
        }, this);

        this.oldInsuranceChargesTotal = ko.computed(function () {
            return _.reduce(this.insuranceCharges(), function (memo, d) { return memo + d.oldAmount(); }, 0);
        }, this);

        this.newInsuranceChargesTotal = ko.computed(function () {
            return _.reduce(this.insuranceCharges(), function (memo, d) { return memo + d.newAmount(); }, 0);
        }, this);

        this.insuranceChargesTotal = ko.computed(function () {
            return _.reduce(this.insuranceCharges(), function (memo, d) { return memo + d.amount(); }, 0);
        }, this);

        this.changeCancelFeesTotal = ko.computed(function () {
            var sum = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                sum += this.journeys()[x].changeCancelFeesTotal();
            }
            return sum;
        }, this);

        this.newTotalAmountDue = ko.computed(function () {
            var sum = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                sum += this.journeys()[x].newTotalAmount();
            }
            for (var x = 0; x < this.insuranceCharges().length; x++) {
                sum += this.insuranceCharges()[x].newAmount();
            }
            return sum;
        }, this);

        // totalAmountDue is the passenger total for all flights and fees
        this.totalAmountDue = ko.computed(function () {
            var sum = 0;
            //var paxType = this.paxType();
            for (var x = 0; x < this.journeys().length; x++) {
                sum += this.journeys()[x].totalAmount();
            }
            for (var x = 0; x < this.insuranceCharges().length; x++) {
                sum += this.insuranceCharges()[x].amount();
            }
            return sum;
        }, this);

        this.oldTotalPointsDue = ko.computed(function () {
            var sum = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                sum += this.journeys()[x].oldTotalPoints();
            }
            return sum;
        }, this);

        this.newTotalPointsDue = ko.computed(function () {
            var sum = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                sum += this.journeys()[x].newTotalPoints();
            }
            return sum;
        }, this);

        this.totalPointsDue = ko.computed(function () {
            var sum = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                sum += this.journeys()[x].totalPoints();
            }
            return sum;
        }, this);
    };

    $.extend(Passenger.prototype, {
        // data is of type BookingSummaryPassengerViewModel
        injectData: function (data) {
            if (!_.isEmpty(data)) {
                this.passengerNumber(data.PassengerNumber);
                this.viporterNumber(data.VIPorterNumber);

                if (!_.isEmpty(data.Name)) {
                    this.name().first(data.Name.First);
                    this.name().last(data.Name.Last);
                    this.name().middle(data.Name.Middle);
                }
                if (!_.isEmpty(data.Infant) && !_.isEmpty(data.Infant.Name)) {                    
                    this.infant().name().first(data.Infant.Name.First);
                    this.infant().name().last(data.Infant.Name.Last);
                    this.infant().name().middle(data.Infant.Name.Middle);
                }
                if (data.PaxType) {
                    this.paxType(data.PaxType);
                } else if (!_.isEmpty(data.TypeInfo)) {
                    // This is for when data is a PassengerViewModel object
                    if (data.TypeInfo.length > 0) {
                        this.paxType(data.TypeInfo[0].PaxType);
                    }
                }
                this.hasInfant(data.HasInfant);
                if (!_.isEmpty(data.SeatFees)) {
                    for (var x = 0; x < data.SeatFees.length; x++) {
                        var passengerFee = data.SeatFees[x]
                        var newPassengerFee = new PassengerFee(this);
                        newPassengerFee.injectData(passengerFee);
                        this.seatFees.push(newPassengerFee);
                    }
                }
                if (!_.isEmpty(data.BagFees)) {
                    for (var x = 0; x < data.BagFees.length; x++) {
                        var passengerFee = data.BagFees[x]
                        var newPassengerFee = new PassengerFee(this);
                        newPassengerFee.injectData(passengerFee);
                        this.bagFees.push(newPassengerFee);
                    }
                }
                if (!_.isEmpty(data.BasicBundleFees)) {
                    for (var x = 0; x < data.BasicBundleFees.length; x++) {
                        var passengerFee = data.BasicBundleFees[x]
                        var newPassengerFee = new PassengerFee(this);
                        newPassengerFee.injectData(passengerFee);
                        this.basicBundleFees.push(newPassengerFee);
                    }
                }
                if (!_.isEmpty(data.PETCFees)) {
                    for (var x = 0; x < data.PETCFees.length; x++) {
                        var passengerFee = data.PETCFees[x]
                        var newPassengerFee = new PassengerFee(this);
                        newPassengerFee.injectData(passengerFee);
                        this.petcFees.push(newPassengerFee);
                    }
                }
                if (!_.isEmpty(data.ChangeCancelFees)) {
                    for (var x = 0; x < data.ChangeCancelFees.length; x++) {
                        var passengerFee = data.ChangeCancelFees[x]
                        var newPassengerFee = new PassengerFee(this);
                        newPassengerFee.injectData(passengerFee);
                        this.changeCancelFees.push(newPassengerFee);
                    }
                }
                if (!_.isEmpty(data.InsuranceFees)) {
                    for (var x = 0; x < data.InsuranceFees.length; x++) {
                        var passengerFee = data.InsuranceFees[x]
                        var newPassengerFee = new PassengerFee(this);
                        newPassengerFee.injectData(passengerFee);
                        this.insuranceFees.push(newPassengerFee);
                    }
                }
                
                
                if (!_.isEmpty(data.OtherFees)) {
                    for (var x = 0; x < data.OtherFees.length; x++) {
                        var passengerFee = data.OtherFees[x]
                        var newPassengerFee = new PassengerFee(this);
                        newPassengerFee.injectData(passengerFee);
                        // Set hasInfant if the passenger has an infant SSR
                        // For the booking flow flight search results page because hasInfant is false
                        if (newPassengerFee.feeCode() === porter.CODES.INFANT) {
                            this.hasInfant(true);
                        }
                        if (!_.contains(porter.BUNDLE_SSR_LIST, newPassengerFee.feeCode())) {
                            this.otherFees.push(newPassengerFee);
                        }
                    }
                }

                if (!_.isEmpty(data.OtherFees)) {
                    for (var x = 0; x < data.OtherFees.length; x++) {
                        var passengerFee = data.OtherFees[x]
                        var newPassengerFee = new PassengerFee(this);
                        newPassengerFee.injectData(passengerFee);
                        if (_.contains(porter.BUNDLE_SSR_LIST, newPassengerFee.feeCode())) {
                            this.hasBundle(true);
                            this.bundleFees.push(newPassengerFee);
                        }
                    }
                }

                if (!_.isEmpty(data.AddonFees)) {
                    for (var x = 0; x < data.AddonFees.length; x++) {
                        var passengerFee = data.AddonFees[x]
                        var newPassengerFee = new PassengerFee(this);
                        newPassengerFee.injectData(passengerFee);
                        if (_.contains(porter.BOOKING_ADDON_SSR_LIST, passengerFee.FeeCode)) {
                            this.parent.additionalFees.push(newPassengerFee);
                        } else {
                            this.addonFees.push(newPassengerFee);
                        }
                    }
                }
                if (!_.isEmpty(data.PassengerSSRs)) {
                    for (var x = 0; x < data.PassengerSSRs.length; x++) {
                        var paxSSR = data.PassengerSSRs[x]
                        var newPassengerSSR = new PassengerSSR(this);
                        newPassengerSSR.injectData(paxSSR);                
                        this.passengerSSRs.push(newPassengerSSR);                        
                    }

                    /*
                    var filter = _.filter(this.passengerSSRs(), function (p) { return p.() === porter.PAX_TYPE.ADULT; }).length;
                    this.passengerSSRs()
                    */                    
                }
            }
        },
        passengerSSRsFilterJourney: function (journeySellKey) {
            var ret =  _.filter(this.passengerSSRs(), function (p) {
                return p.journeySellKey() === journeySellKey && _.contains(porter.INCLUDED_SSR_LIST, p.ssrCode());
            });
            return ret;
        },
        passengerAddOnsFilterJourney: function (flightReference) {
            var ret = _.filter(this.addonFees(), function (p) {
                return p.newFlightReference() == flightReference && _.contains(porter.JOURNEY_ADDON_SSR_LIST, p.feeCode());
            });
            var ret2 = _.filter(this.basicBundleFees(), function (p) {
                return p.newFlightReference() == flightReference && _.contains(porter.JOURNEY_ADDON_SSR_LIST, p.feeCode());
            });
            ret = ret.concat(ret2);
            return ret;
        },
        passengerBundlesFilterJourney: function (flightReference) {
            var ret = _.filter(this.bundleFees(), function (p) {
                return p.newFlightReference() == flightReference;
            });
            return ret;
        },
    });

    var PassengerSSR = function () {
        var _self = this;

        //parent is a Passenger
        //this.parent = parent;
        
        this.ssrCode = ko.observable();
        this.ssrDisplay = ko.observable();
        this.journeySellKey = ko.observable();
        
    };

    $.extend(PassengerSSR.prototype, {
        // data is of type BookingSummaryPaxSSRViewModel
        injectData: function (data) {
            if (!_.isEmpty(data)) {
                this.ssrCode(data.SSRCode);
                this.ssrDisplay(data.SSRDisplay);             
                this.journeySellKey(data.JourneySellKey);
            }
            
        }       
    });

    var FareSummaryVM = function () {
        var _self = this;

        this.currencyCode = ko.observable('');
        this.balanceDue = ko.observable(0);
        this.pointsBalanceDue = ko.observable(0);
        this.flightBalanceDue = ko.observable(0);
        this.addonBalanceDue = ko.observable(0);
        this.flightpointsDue = ko.observable(30);

        // WEB-24479 - Bring IsInterline flag to Passenger level
        this.isInterline = ko.observable(false);

        this.journeys = ko.observableArray();
        this.passengers = ko.observableArray();
        this.insuranceFees = ko.observableArray();
        this.additionalFees = ko.observableArray();

        this.addedAdditionalCharges = ko.observableArray();
        this.addedAdditionalJourneyCharges = ko.observableArray();
        this.collapse = ko.observable(true);
        this.collapseBooking = ko.observable(true);
        this.collapseFareSelection = ko.observable(true);
        this.summaryCartHeight = ko.observable();
        this.bookingModuleHeight = ko.observable();
        this.fareSelectorHeight = ko.observable();

        //this.onBookingModFlow = ko.observable(false);
        this.onCheckInPage = ko.observable(false);
        this.onBoardingPassPage = ko.observable(false);
        this.onPNRModFlow = ko.observable(false);
        this.onRebookFlow = ko.observable(false);
        this.onPNRModItinerary = ko.observable(false);

        this.isModifying = ko.observable(false);
        this.isCancelling = ko.observable(false);
        this.isCheckinFlow = ko.observable(false);

        this.isEligibleForCreditCardRefund = ko.observable();

        this.canViewPaymentDetails = ko.observable(true);
        this.canViewTransactionOverview = ko.observable(true);

        // showAllCharges will show charges even if the amount is zero
        // meant for flight changes and booking flow
        this.showAllCharges = ko.observable(true);

        //this.isSubmitDisabled = ko.observable(false);

        this.generalErrorMsg = ko.observable();

        this.fareToolTipModalMsg = ko.observable('');
        this.fareToolTipModalProduct = ko.observable('');

        this.financing = ko.observable();

        this.collapseAddons = ko.observable(false);

        this.errors = {
            Example: ko.observable(false)
        };

        this.accessibility = {};
        this.accessibility.cartFocusTarget = ko.observable(); 

        this.isFullCancellation = ko.computed(function() {
            return _.every(this.journeys(), function (j) { return j.isCancelled() === true })
        }, this);

        // Stored the observable for showCredit in the static class
        this.showCredit = ko.computed(function () {
            return porter.FareSummaryVM.showCredit();
        }, this);

        this.numberOfAdults = ko.computed(function () {
            return _.filter(this.passengers(), function (p) { return p.paxType() === porter.PAX_TYPE.ADULT; }).length;
        }, this);

        this.numberOfChildren = ko.computed(function () {
            return _.filter(this.passengers(), function (p) { return p.paxType() === porter.PAX_TYPE.CHILD; }).length;
        }, this);

        this.numberOfInfants = ko.computed(function () {
            return _.filter(this.passengers(), function (p) { return p.hasInfant() || p.paxType() === porter.PAX_TYPE.INFANT; }).length;
        }, this);

        this.paxCount = ko.computed(function () {
            return this.numberOfAdults() + this.numberOfChildren();
        }, this);

        this.hasInsurance = ko.computed(function () {
            var hasInsurance = false;
            for (var x = 0; x < this.passengers().length; x++) {
                if (this.passengers()[x].insuranceCharges().length > 0) {
                    hasInsurance = true;
                }
            }
            return hasInsurance || this.insuranceFees().length > 0;
        }, this);

        this.collapseInsurance = ko.observable(true);

        this.toggleInsurance = function() {
            this.collapseInsurance(!this.collapseInsurance());
        };

        // showSeatsLink and showBagsLink are for showing/hiding the links on the pnr mod add seats and bags flows
        this.showSeatsLink = ko.observable(true);
        this.showBagsLink = ko.observable(true);

        this.collapseAddons = ko.observable(true);

        this.toggleAddons = function () {
            this.collapseAddons(!this.collapseAddons());
        };

        this.hasBundle = ko.observable(false);

        this.prepaySeatsUrl = ko.observable("#");
        this.prepayBagsUrl = ko.observable("#");
        this.prepayBundlesUrl = ko.observable("#");
        this.prepayAddonsUrl = ko.observable("#");

        if (document.querySelectorAll('a[href*="prepay"]').length > 0) {
            this.prepaySeatsUrl(document.querySelectorAll('a[href*="prepay"]')[0].href);

        }

        if (document.querySelectorAll('a[href*="prepay"]').length > 0) {
            this.prepayBagsUrl(document.querySelectorAll('a[href*="prepay"]')[0].href);

        }

        if (document.querySelectorAll('a[href*="prepay"]').length > 0) {
            this.prepayBundlesUrl(document.querySelectorAll('a[href*="prepay"]')[0].href);

        }

        if (document.querySelectorAll('a[href*="prepay"]').length > 0) {
            this.prepayAddonsUrl(document.querySelectorAll('a[href*="prepay"]')[0].href);

        }

        this.aggregateInsuranceFees = ko.computed(function () {

            var charges = {};
            // Look for insurance fees
            for (var x = 0; x < this.insuranceFees().length; x++) {
                var fee = this.insuranceFees()[x];
                for (var y = 0; y < fee.allCharges().length; y++) {
                    var serviceCharge = fee.allCharges()[y];
                    if (!charges[serviceCharge.chargeCode()]) {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.copyData(serviceCharge);
                        charges[serviceCharge.chargeCode()] = newServiceCharge;
                    } else {
                        // Update amount
                        charges[serviceCharge.chargeCode()].newAmount(charges[serviceCharge.chargeCode()].newAmount() + serviceCharge.newAmount());
                        charges[serviceCharge.chargeCode()].oldAmount(charges[serviceCharge.chargeCode()].oldAmount() + serviceCharge.oldAmount());
                    }
                }
            }
            var arr = [];
            for (var prop in charges) {
                if (charges.hasOwnProperty(prop)) {
                    if (charges[prop].amount() !== 0) {
                        arr.push(charges[prop]);
                    }
                }
            }

            return arr;

        }, this);

        this.aggregateAdditionalFees = ko.computed(function () {

            var charges = {};
 

            // Look for additional fees at the booking level
            for (var x = 0; x < this.additionalFees().length; x++) {
                var fee = this.additionalFees()[x];
                for (var y = 0; y < fee.allCharges().length; y++) {
                    var serviceCharge = fee.allCharges()[y];
                    if (!charges[serviceCharge.chargeCode()]) {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.copyData(serviceCharge);
                        charges[serviceCharge.chargeCode()] = newServiceCharge;
                    } else {
                        // Update amount
                        charges[serviceCharge.chargeCode()].newAmount(charges[serviceCharge.chargeCode()].newAmount() + serviceCharge.newAmount());
                        charges[serviceCharge.chargeCode()].oldAmount(charges[serviceCharge.chargeCode()].oldAmount() + serviceCharge.oldAmount());
                    }
                }
            }
            // Look for additional fees at the passenger level
            for (var x = 0; x < this.passengers().length; x++) {
                var passenger = this.passengers()[x];
                for (var y = 0; y < passenger.otherFees().length; y++) {
                    var fee = passenger.otherFees()[y];
                    // Fees with no flight reference
                    if (_.isEmpty(fee.oldFlightReference()) &&
                        _.isEmpty(fee.newFlightReference())) {
                        for (var z = 0; z < fee.allCharges().length; z++) {
                            var serviceCharge = fee.allCharges()[z];
                            if (!charges[serviceCharge.chargeCode()]) {
                                var newServiceCharge = new ServiceCharge();
                                newServiceCharge.copyData(serviceCharge);
                                charges[serviceCharge.chargeCode()] = newServiceCharge;
                            } else {
                                // Update amount
                                charges[serviceCharge.chargeCode()].newAmount(charges[serviceCharge.chargeCode()].newAmount() + serviceCharge.newAmount());
                                charges[serviceCharge.chargeCode()].oldAmount(charges[serviceCharge.chargeCode()].oldAmount() + serviceCharge.oldAmount());
                            }
                        }
                    }
                }

                // removed due to the only passenger level addon being FLEX, which should not be added into the total additional fees at the booking level
                // for (var y = 0; y < passenger.addonFees().length; y++) {
                //     var fee = passenger.addonFees()[y];
                //     for (var z = 0; z < fee.allCharges().length; z++) {
                //         var serviceCharge = fee.allCharges()[z];
                //         if (!charges[serviceCharge.chargeCode()]) {
                //             var newServiceCharge = new ServiceCharge();
                //             newServiceCharge.copyData(serviceCharge);
                //             charges[serviceCharge.chargeCode()] = newServiceCharge;
                //         } else {
                //             // Update amount
                //             charges[serviceCharge.chargeCode()].newAmount(charges[serviceCharge.chargeCode()].newAmount() + serviceCharge.newAmount());
                //             charges[serviceCharge.chargeCode()].oldAmount(charges[serviceCharge.chargeCode()].oldAmount() + serviceCharge.oldAmount());
                //         }
                //     }
                // }
            }
            // Look for dynamically added additional fees
            for (var x = 0; x < this.addedAdditionalCharges().length; x++) {
                var serviceCharge = this.addedAdditionalCharges()[x];
                if (serviceCharge.chargeCode() != 'AZIIN' && serviceCharge.chargeCode() != 'AZITX') {
                    if (!charges[serviceCharge.chargeCode()]) {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.copyData(serviceCharge);
                        charges[serviceCharge.chargeCode()] = newServiceCharge;
                    } else {
                        // Update amount
                        charges[serviceCharge.chargeCode()].newAmount(charges[serviceCharge.chargeCode()].newAmount() + (serviceCharge.newAmount()));
                        charges[serviceCharge.chargeCode()].oldAmount(charges[serviceCharge.chargeCode()].oldAmount() + (serviceCharge.oldAmount()));
                    }
                }
            }

            var arr = [];
            for (var prop in charges) {
                if (charges.hasOwnProperty(prop)) {
                    if (charges[prop].amount() !== 0) {
                        arr.push(charges[prop]);
                    }
                }
            }
            return _.sortBy(arr, 'amount');
        }, this);

        this.sortedAdditionalFees = ko.computed(function () {
            return this.aggregateAdditionalFees().sort(function (left, right) {
                if (left.amount() == right.amount())
                    return 0;
                else if (left.amount() > right.amount())
                    return -1;
                else
                    return 1;
            });
        },this);
        this.refundAddon = ko.computed(function () {
            var arr = [];
            if (typeof this.aggregateAdditionalFees != 'undefined' ) {
                return _.filter(this.aggregateAdditionalFees(), function (a) { return (a.chargeCode() == "RFN" || a.chargeCode() == "RFND") && a.amount() > 0})
            }
            return arr;
        }, this);
        this.flexAddon = ko.computed(function () {
            var arr = [];
            if (typeof this.aggregateAdditionalFees != 'undefined') {
                return _.filter(this.aggregateAdditionalFees(), function (a) { return a.chargeCode() == "FLX" || a.chargeCode() == "FLEX" })
            }
            return arr;
        }, this);
        this.flexRefundAddon = ko.computed(function () {
            var arr = [];
            if (typeof this.aggregateAdditionalFees != 'undefined') {
                return _.filter(this.aggregateAdditionalFees(), function (a) { return (a.chargeCode() == "FXRF" || a.chargeCode() == "FLRF") && a.amount() > 0 })
            }
            return arr;
        }, this);

        this.totalAddonFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateAdditionalFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);


        this.totalInsuranceFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateInsuranceFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        this.totalAdditionalFees = ko.computed(function () {
            var sum = _.reduce(this.aggregateAdditionalFees(), function (memo, d) { return memo + d.amount(); }, 0);
            var insuranceSum = _.reduce(this.aggregateInsuranceFees(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum + insuranceSum;
        }, this);

        // Dynamically added fees
        this.totalAddedFees = ko.computed(function () {
            var sum = 0;
            for (var x = 0; x < this.passengers().length; x++) {
                var passenger = this.passengers()[x];
                sum += _.reduce(passenger.addedSeatCharges(), function (memo, d) { return memo + d.amount(); }, 0);
                sum += _.reduce(passenger.addedBagCharges(), function (memo, d) { return memo + d.amount(); }, 0);
                sum += _.reduce(passenger.addedBasicBundleCharges(), function (memo, d) { return memo + d.amount(); }, 0);
                sum += _.reduce(passenger.addedPetcCharges(), function (memo, d) { return memo + d.amount(); }, 0);
            }
            for (var i = 0; i < this.journeys().length; i++) {
                var journey = this.journeys()[i];
                sum += _.reduce(journey.addedAdditionalJourneyCharges(), function (memo, d) { return memo + d.amount(); }, 0);
                sum += _.reduce(journey.addedAdditionalBundleCharges(), function (memo, d) { return memo + d.totalAmount(); }, 0);
            }
            sum += _.reduce(this.addedAdditionalCharges(), function (memo, d) { return memo + d.amount(); }, 0);
            return sum;
        }, this);

        // Balance due plus added fees
        this.totalAmountDue = ko.computed(function () {
            var sum = this.balanceDue() +
                this.totalAddedFees();
            sum = Number(sum.toFixed(2));
            return sum;
        }, this);

        // for cancellations/change flight
        this.oldTotalAmountDue = ko.computed(function() {
            var sum = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                //if (this.journeys()[x].isCancelled()) {
                //    sum += this.journeys()[x].oldTotalJourneyAmountCancelling(); 
                //} else {
                //    sum += this.journeys()[x].oldTotalJourneyAmount();
                //}
                //if (this.journeys()[x].isNewFlight()) {
                //    sum += this.journeys()[x].oldTotalJourneyAmount();
                //} else {
                //    sum += this.journeys()[x].totalJourneyCredits();
                //}
                sum += this.journeys()[x].oldTotalJourneyAmount();
            }
            return sum;
        }, this);

        // for cancellations/change flight
        this.oldTotalPointsDue = ko.computed(function() {
            var sum = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                if (this.journeys()[x].isCancelled() || this.journeys()[x].isModified()) {
                    sum += this.journeys()[x].oldTotalFarePoints();
                } 
            }
            return sum;
        }, this);

        this.totalCalculatedAmountDue = ko.computed(function () {
            var sum = 0;
            for (var x = 0; x < this.passengers().length; x++) {
                sum += this.passengers()[x].totalAmountDue();
            }
            //sum += this.totalAddedFees();
            return sum;
        }, this);

        this.showDetails = ko.computed(function () {
            return (this.journeys().length !== 0 && !_.isEmpty(this.journeys()[0].departureStationCode())) && (this.totalAmountDue() !== 0 || this.onBoardingPassPage() || this.pointsBalanceDue() !== 0);
        }, this);

        this.flightBalanceDue = ko.computed(function(){
            var totalFlightCost = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                var journey = this.journeys()[x];
                totalFlightCost += (journey.totalAirTransportationCost() + journey.totalTaxesFeesCharges());
            }
            return totalFlightCost;
        }, this);

        this.flightpointsDue = ko.computed(function(){
            var totalFlightPoints = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                var journey = this.journeys()[x];
                totalFlightPoints  += journey.totalFarePoints();
            }
            return totalFlightPoints ;
        }, this);

        this.addonBalanceDue = ko.computed(function () {
            var totalAddonCost = 0;
            for (var x = 0; x < this.journeys().length; x++) {
                var journey = this.journeys()[x];
                totalAddonCost += (journey.totalJourneyAmount() - (journey.totalAirTransportationCost() + journey.totalTaxesFeesCharges()));
                totalAddonCost -= journey.totalAddons();

            }

            for (var i = 0; i < this.passengers().length; i++) {
                var pax = this.passengers()[i];
                for (var ii = 0; ii < pax.addonFees().length; ii++) {
                    totalAddonCost += pax.addonFees()[ii].totalAmount();
                }
            }

            for (var j = 0; j < this.insuranceFees().length; j++) {
                totalAddonCost += this.insuranceFees()[j].totalAmount();
            }

            totalAddonCost += _.reduce(this.aggregateAdditionalFees(), function (memo, d) { return memo + d.amount(); }, 0);

            return totalAddonCost;
            return 0;
        }, this);
    };

    // Static methods
    $.extend(FareSummaryVM, {
        showCredit: ko.observable(true), 
        // FormatAmount is for formatting the display money amount
        // Used this function in case we need to change the format for all amounts
        formatAmount: function (amt) {
            // Will convert the amount to absolute value if we want to show credit
            if (this.showCredit()) {
                return porter.getPositiveAmountWithCommasAndDollarSign(amt);
            }
            // Otherwise it will return a negative amount for negative values
            return porter.getAmountWithCommasAndDollarSign(amt);
        },
        formatPoints: function (amt) {
            return porter.getNumberWithCommas(Math.abs(amt));
        },
        formatAmountWithNoDollarSign: function (amt) {//WEB-18925
            if (this.showCredit()) {
                return porter.getPositiveAmountWithCommas(amt);
            }
            return porter.getAmountWithCommas(amt);
        }
    });

    // Methods as part of the FareSummaryVM object
    $.extend(FareSummaryVM.prototype, {
        findSegment: function (departureStation, arrivalStation) {
            for (var x = 0; x < this.journeys().length; x++) {
                var journey = this.journeys()[x];
                for (var y = 0; y < journey.segments().length; y++) {
                    var segment = journey.segments()[y];
                    if (segment.newDepartureStationCode() === departureStation && segment.newArrivalStationCode() === arrivalStation) {
                        return segment;
                    }
                }
            }
        },
        // updateSeatFees is for the booking flow seats pages where the fare summary is dynamically updated
        // serviceCharges is an array of ServiceChargeViewModel
        // Each service charge requires passenger number, charge code, and charge detail
        updateSeatFees: function (serviceCharges) {
            if (!_.isEmpty(serviceCharges)) {
                var oldTotal = this.totalAmountDue();
                for (var x = 0; x < serviceCharges.length; x++) {
                    var serviceCharge = serviceCharges[x];
                    var passenger = _.find(this.passengers(), function (p) { return p.passengerNumber() === serviceCharge.PassengerNumber; });
                    if (!_.isEmpty(passenger)) {
                        // Use ChargeDetail as the key
                        var existingCharge = _.find(passenger.addedSeatCharges(), function (c) {
                            return c.chargeCode() === serviceCharge.ChargeCode && c.chargeDetail() === serviceCharge.ChargeDetail;
                        });
                        if (!_.isEmpty(existingCharge)) {
                            existingCharge.newAmount(existingCharge.newAmount() + serviceCharge.Amount);
                        } else {
                            var newServiceCharge = new ServiceCharge(passenger);
                            newServiceCharge.injectData(serviceCharge);
                            newServiceCharge.newAmount(serviceCharge.Amount);
                            passenger.addedSeatCharges.push(newServiceCharge);
                        }
                    }
                }

                animatePrice(oldTotal, this.totalAmountDue());
            }
        },
        // updateBagFees is for bag pages where the fare summary is dynamically updated
        // serviceCharges is an array of ServiceChargeViewModel
        // Each service charge requires passenger number, charge code, and direction
        updateBagFees: function (serviceCharges) {
            if (!_.isEmpty(serviceCharges)) {
                var oldTotal = this.totalAmountDue();
                for (var x = 0; x < serviceCharges.length; x++) {
                    var serviceCharge = serviceCharges[x];
                    var passenger = _.find(this.passengers(), function (p) { return p.passengerNumber() === serviceCharge.PassengerNumber; });
                    if (!_.isEmpty(passenger)) {
                        // Charge detail is not passed from service charges
                        // Use Direction to find the charge detail
                        var chargeDetail;
                        if (serviceCharge.Direction === porter.DIRECTION.OUTBOUND && this.journeys().length > 0) {
                            chargeDetail = this.journeys()[0].firstSegment().newStationPair();
                        } else if (serviceCharge.Direction === porter.DIRECTION.INBOUND && this.journeys().length > 1) {
                            chargeDetail = this.journeys()[1].firstSegment().newStationPair();
                        }
                        var existingCharge = _.find(passenger.addedBagCharges(), function (c) {
                            return c.chargeCode() === serviceCharge.ChargeCode && c.chargeDetail() === chargeDetail;
                        });
                        if (!_.isEmpty(existingCharge)) {
                            existingCharge.newAmount(existingCharge.newAmount() + serviceCharge.Amount);
                        } else {
                            var newServiceCharge = new ServiceCharge(passenger);
                            newServiceCharge.injectData(serviceCharge);
                            newServiceCharge.newAmount(serviceCharge.Amount);
                            newServiceCharge.chargeDetail(chargeDetail);
                            passenger.addedBagCharges.push(newServiceCharge);
                        }
                    }
                }
               // bagsVM.summary().balanceDue(this.totalAmountDue());
                animatePrice(oldTotal, this.totalAmountDue());
            }
        },
        // updateBasicBundleFees is for bag pages where the fare summary is dynamically updated
        // serviceCharges is an array of ServiceChargeViewModel
        // Each service charge requires passenger number and charge code
        updateBasicBundleFees: function (serviceCharges, journeySellKey) {
            if (!_.isEmpty(serviceCharges)) {
                var oldTotal = this.totalAmountDue();
                for (var x = 0; x < serviceCharges.length; x++) {
                    var serviceCharge = serviceCharges[x];
                    var passenger = _.find(this.passengers(), function (p) { return p.passengerNumber() === serviceCharge.PassengerNumber; });
                    if (!_.isEmpty(passenger)) {
                        var chargeDetail;
                        var journey = _.find(this.journeys(), function (j) { return j.newJourneySellKey() === journeySellKey; });
                        if (!_.isEmpty(journey)) {
                            chargeDetail = journey.firstSegment().newStationPair();
                        }
                        var existingCharge = _.find(passenger.addedBasicBundleCharges(), function (c) {
                            return c.chargeCode() === serviceCharge.ChargeCode && c.chargeDetail() === chargeDetail;
                        });
                        if (!_.isEmpty(existingCharge)) {
                            existingCharge.newAmount(existingCharge.newAmount() + serviceCharge.Amount);
                        } else {
                            var newServiceCharge = new ServiceCharge(passenger);
                            newServiceCharge.injectData(serviceCharge);
                            newServiceCharge.newAmount(serviceCharge.Amount);
                            newServiceCharge.chargeDetail(chargeDetail);
                            passenger.addedBasicBundleCharges.push(newServiceCharge);
                        }
                    }
                }

                animatePrice(oldTotal, this.totalAmountDue());
            }
        },

        updatePetcFees: function () {
            // TODO: if we ever want to update the PETC fee dynamically
        },

        updatePerJourneyAddons: function (serviceCharges) {
            if (!_.isEmpty(serviceCharges)) {
                var oldTotal = this.totalAmountDue();

                for (var x = 0; x < serviceCharges.length; x++) {
                    var serviceCharge = serviceCharges[x];
                    var journeyIndex = serviceCharge.JourneyIndex;
                    var journey = this.journeys()[journeyIndex];

                    var existingCharge = _.find(journey.addedAdditionalJourneyCharges(), function(c) {
                        return c.chargeCode() === serviceCharge.ChargeCode;
                    });

                    if (!_.isEmpty(existingCharge)) {
                        existingCharge.newAmount(existingCharge.newAmount() + serviceCharge.Amount);
                    } else {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.injectData(serviceCharge);
                        newServiceCharge.newAmount(serviceCharge.Amount);
                        journey.addedAdditionalJourneyCharges().push(newServiceCharge);  
                    }
                }
                journey.addedAdditionalJourneyCharges(_.sortBy(journey.addedAdditionalJourneyCharges(), 'amount').reverse());
                animatePrice(oldTotal, this.totalAmountDue());
            }
        },

        updatePerJourneyBundles: function (bundleCharge, taxCharge) {
            var oldTotal = this.totalAmountDue();

            var journeyIndex = bundleCharge.JourneyIndex;
            var journey = this.journeys()[journeyIndex];
            var feeCode = bundleCharge.TicketCode;

            // create new service charge obj
            var newBundleCharge = new ServiceCharge();
            newBundleCharge.injectData(bundleCharge, feeCode);
            newBundleCharge.newAmount(bundleCharge.Amount);

            var newTaxCharge = new ServiceCharge();
            newTaxCharge.injectData(taxCharge, feeCode);
            newTaxCharge.newAmount(taxCharge.Amount);

            // create new pax fee
            var newFee = new PassengerFee(this.passengers()[0]);
            newFee.newFlightReference(journey.segments()[0].newFlightReference()); 
            newFee.oldFlightReference(journey.segments()[0].oldFlightReference());
            newFee.feeCode(newBundleCharge.feeCode());
            newFee.serviceCharges.push(newBundleCharge);
            newFee.taxes.push(newTaxCharge);

            journey.addedAdditionalBundleCharges().push(newFee);
            journey.addedAdditionalBundleCharges(_.sortBy(journey.addedAdditionalBundleCharges(), 'amount').reverse());
            animatePrice(oldTotal, this.totalAmountDue());
            
            // if (!_.isEmpty(serviceCharges)) {
            //     var oldTotal = this.totalAmountDue();

            //     for (var x = 0; x < serviceCharges.length; x++) {
            //         var serviceCharge = serviceCharges[x];
            //         var journeyIndex = serviceCharge.JourneyIndex;
            //         var journey = this.journeys()[journeyIndex];
            //         var feeCode = serviceCharge.TicketCode;

            //         var existingCharge = _.find(journey.addedAdditionalBundleCharges(), function(c) {
            //             return c.chargeCode() === serviceCharge.ChargeCode && c.feeCode() === serviceCharge.TicketCode;
            //         });
            //         if (!_.isEmpty(existingCharge)) {
            //             existingCharge.newAmount(existingCharge.newAmount() + serviceCharge.Amount); // we are consolidating the same bundle
            //         } else {
            //             var newServiceCharge = new ServiceCharge();
            //             newServiceCharge.injectData(serviceCharge, feeCode);
            //             newServiceCharge.newAmount(serviceCharge.Amount);
            //             journey.addedAdditionalBundleCharges().push(newServiceCharge);
            //         }
            //     }
            //     journey.addedAdditionalBundleCharges(_.sortBy(journey.addedAdditionalBundleCharges(), 'amount').reverse());
            //     animatePrice(oldTotal, this.totalAmountDue());
            // }
        },

        // currently used for booking-level add ons
        updateFees: function (serviceCharges) {
            if (!_.isEmpty(serviceCharges)) {
                var oldTotal = this.totalAmountDue();
                for (var x = 0; x < serviceCharges.length; x++) {
                    var serviceCharge = serviceCharges[x];
                    var existingCharge = _.find(this.addedAdditionalCharges(), function (c) {
                        return c.chargeCode() === serviceCharge.ChargeCode;
                    });
                    if (serviceCharge.Amount <= 0) {
                        if (_.contains(porter.BOOKING_ADDON_SSR_LIST, serviceCharge.TicketCode))
                            this.additionalFees.removeAll();
                    }
                    if (!_.isEmpty(existingCharge)) {
                        existingCharge.newAmount(existingCharge.newAmount() + serviceCharge.Amount);
                    } else {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.newAmount(serviceCharge.Amount);
                        newServiceCharge.chargeCode(serviceCharge.ChargeCode);
                        newServiceCharge.description(serviceCharge.Description);
                        this.addedAdditionalCharges.push(newServiceCharge);

                    }
                }
                this.addedAdditionalCharges(_.sortBy(this.addedAdditionalCharges(), 'amount').reverse());
                animatePrice(oldTotal, this.totalAmountDue());
                focusFirst();               
            }
        },
        collapseAllPassengerJourneys: function () {
            for (var x = 0; x < this.passengers().length; x++) {
                var passenger = this.passengers()[x];
                for (var y = 0; y < passenger.journeys().length; y++) {
                    var journey = passenger.journeys()[y];
                    journey.collapse(true);
                }
            }
        },
        // data is of type BookingSummaryViewModel
        injectData: function (data) {
            if (!_.isEmpty(data)) {                
                if (data.CurrencyCode) {
                    this.currencyCode(data.CurrencyCode);
                } else {
                    this.currencyCode(porter.isUS ? 'USD' : 'CAD');
                }
                if (_.isNumber(data.BalanceDue) && !_.isNaN(data.BalanceDue)) {
                    this.balanceDue(data.BalanceDue);
                }
                if (_.isNumber(data.PointsBalanceDue) && !_.isNaN(data.PointsBalanceDue)) {
                    this.pointsBalanceDue(data.PointsBalanceDue);
                }
                if (!_.isEmpty(data.Journeys)) {
                    // Remove existing data
                    this.journeys.removeAll();
                    for (var x = 0; x < data.Journeys.length; x++) {
                        var journey = data.Journeys[x];
                        var newJourney = new Journey(this);
                        newJourney.injectData(journey);
                        this.journeys.push(newJourney);
                        if (newJourney.isCancelled()) {
                            this.isCancelling(true);
                        }
                        if (newJourney.isModified()) {
                            this.isModifying(true);
                        }
                        var isNewFlight = true;
                        if (newJourney.isCancelled() ||
                            (!_.isEmpty(journey.NewJourneySellKey) && _.find(data.Journeys, function (j) { return j.OldJourneySellKey === journey.NewJourneySellKey; }))) {
                            isNewFlight = false;
                        }
                        newJourney.isNewFlight(isNewFlight);
                    }
                }
                if (!_.isEmpty(data.Passengers)) {
                    // Remove existing data
                    this.passengers.removeAll();
                    for (var x = 0; x < data.Passengers.length; x++) {
                        var passenger = data.Passengers[x];
                        var newPassenger = new Passenger(this);
                        newPassenger.injectData(passenger);
                        this.passengers.push(newPassenger);
                    }
                }
                if (!_.isEmpty(data.InsuranceFees)) {
                    // Remove existing data
                    this.insuranceFees.removeAll();
                    for (var x = 0; x < data.InsuranceFees.length; x++) {
                        var fee = data.InsuranceFees[x];
                        var newFee = new PassengerFee();
                        newFee.injectData(fee);
                        this.insuranceFees.push(newFee);
                    }
                }
                if (!_.isEmpty(data.AdditionalFees)) {
                    // Remove existing data
                    this.additionalFees.removeAll();
                    for (var x = 0; x < data.AdditionalFees.length; x++) {
                        var fee = data.AdditionalFees[x];
                        var newFee = new PassengerFee();
                        newFee.injectData(fee);
                        this.additionalFees.push(newFee);
                    }
                }

                // WEB-24479 - Bring IsInterline flag to Passenger level
                if (_.isBoolean(data.IsInterline)) {
                    this.isInterline(data.IsInterline);
                }
            }
        },
        // data is an array of Passengers
        injectPassengers: function (data) {
            this.passengers.removeAll();
            if (!_.isEmpty(data)) {
                for (var x = 0; x < data.length; x++) {
                    var passenger = data[x];
                    var newPassenger = new Passenger(this);
                    newPassenger.injectData(passenger);
                    this.passengers.push(newPassenger);
                }
            }
        },
        // For setting basic fare journeys from JourneyAccessFlags
        // data is a list of JourneyAccessFlags
        injectJourneyAccessRules: function (data, oldData) {
            if (!_.isEmpty(data)) {
                for (var x = 0; x < data.length; x++) {
                    var journeyAccessRule = data[x];
                    var matchingJourney = _.find(this.journeys(), function (j) { return j.newJourneySellKey() === journeyAccessRule.SellKey; });
                    if (!_.isEmpty(matchingJourney)) {
                        matchingJourney.isBasicFare(journeyAccessRule.IsBasicFare);
                    }
                }
            }
            if (!_.isEmpty(oldData)) {
                for (var x = 0; x < oldData.length; x++) {
                    var journeyAccessRule = oldData[x];
                    var matchingJourney = _.find(this.journeys(), function (j) { return j.oldJourneySellKey() === journeyAccessRule.SellKey; });
                    if (!_.isEmpty(matchingJourney) &&
                        !matchingJourney.isBasicFare()) {
                        matchingJourney.isBasicFare(journeyAccessRule.IsBasicFare);
                    }
                }
            }
        },
        // Call this function on any page with financing
        addFinancing: function (data, config) {
            var financingVM = new porter.FinancingViewModel();
            financingVM.activateFareSummary(data, config);
            this.financing(financingVM);

            // Update the monthly pricing amount
            this.totalAmountDue.subscribe(function (val) {
                this.financing().updatePrice(val);
            }, this);
        },
        activate: function (data, target) {
            if (!_.isEmpty(data)) {
                this.injectData(data);
            }
            // For seats page and bags page where we dynamically add charges
            if (typeof bookingCommon !== 'undefined') {
                bookingCommon.seatsVMUpdateSeats.subscribe(function (serviceCharges) {
                    this.updateSeatFees(serviceCharges);
                }, this, "messageToPublish");

                bookingCommon.bagsVMUpdateBags.subscribe(function (serviceCharges) {
                        this.updateBagFees(serviceCharges);
                    }, this, "messageToPublish");
            }         

            if (_.isElement(target)) {
                ko.applyBindings(this, target);
            }
            this.compositionComplete();
        },
        compositionComplete: function () {
            //this.snapOnScroll();
        },

        toggleFareContainer: function (container, e) {
            //var windowHeight = 1200;
            //var windowHeight = $(window).height();
            this.collapse(!this.collapse());
            if (!this.collapse()) {                
                this.collapseBooking(true);
                //var windowHeight = $('.c-fare-summary-details-container').height();                
                //this.summaryCartHeight(windowHeight + 'px');
                //console.log("CART summary hright " + this.summaryCartHeight());
                this.bookingModuleHeight(0); 


                var offset = $('section.header').height() + $('.c-fare-summary-head-container').height() + $('.c-fare-summary-financing-module').height() + 24; 
                var footerOffset = $('.content-body').height() + offset + 45;
                $('.content-body').css({ 'position' : 'fixed', 'top': offset, 'left': '50%', 'transform' : 'translateX(-50%)', 'width' : '100%'});
                $('footer').css({'position' : 'fixed', 'top': footerOffset});
            }
            else {
                $('.content-body').css({ 'position' : 'relative', 'top': '0', 'left': '0', "transform" : "none"});
                $('footer').css({'position' : 'static', 'top': '0'});
                //this.summaryCartHeight(0);
            } 
            return null;           
        },

        toggleShoppingCart: function (target) {
            if (this.collapse()) {
                this.openShoppingCart(target)
            } else {
                this.closeShoppingCart(this.accessibility.cartFocusTarget);
            }
        },

        openShoppingCart: function (target) {
            if (this.totalAmountDue() != 0 || this.pointsBalanceDue() !== 0) { // don't show expanded cart if there is nothing in it
                this.toggleFareContainer();
                this.accessibility.cartFocusTarget(target);
                document.getElementById("cart-top").focus();
                document.accessibility.readText("Viewing your shopping cart.");

                document.addEventListener("keydown", this.keyDownCartListener);
            }
        },

        keyDownCartListener: function (e) {        
            //close cart on escape key and cart is expanded
            if(e.keyCode==27 && !fareSummaryVM.collapse()) {
                fareSummaryVM.closeShoppingCart();
            }
        },

        closeShoppingCart: function() {
            this.toggleFareContainer();            
            document.accessibility.readText("Shopping cart closed."); // this is getting read after the focus below
            $('.' + this.accessibility.cartFocusTarget()).focus();            

         },

        toggleBookingContainer: function () {
            var windowHeight = $(window).height();
            $('.flyporter-loader__svg').hide();
            this.collapseBooking(!this.collapseBooking());

            if (!this.collapseBooking()) {
                this.collapse(true);
                //this.summaryCartHeight(0);
                this.bookingModuleHeight(windowHeight + 'px');
                document.getElementById('booking-widget').focus();
            }
            else{
                this.bookingModuleHeight(0);
            }
        },

        toggleMobileFareSelection: function () {
            var windowHeight = $(window).height();
            $('.flyporter-loader__svg').hide();
            this.collapseFareSelection(!this.collapseFareSelection());

            if (!this.collapseFareSelection()) {
                this.collapse(true);
                this.fareSelectorHeight(windowHeight + 'px');
            }
            else {
                this.fareSelectorHeight(0);
            }
        },

        // Sticky scrolling
        snapOnScroll: function () {
            var fareSummaryBg = $('.fare-summary-bg');
            var fareSummaryPlaceholder = $('.fare-summary-placeholder');
            var fareSummaryDetailsContainer = $('.fare-summary-details-container');
            var fareSummaryHead = $('.fare-summary-head');

            // _nextEl =  point of reference 
            var _nextEl = fareSummaryBg.next();

            //ignore script tag, script tag will break the scrolling
            var $currentElement = _nextEl;
            while ($currentElement.prop("tagName") == "SCRIPT") {
                $currentElement = $currentElement.next();

                if ($currentElement.prop("tagName") != "SCRIPT") {
                    _nextEl = $currentElement;
                    break;
                }
            }

            _nextEl = $(".fare-summary-point-of-reference");

            var _self = this;
            $(window).on('scroll resize', _.throttle(function (e) {
                if (_nextEl.length > 0) {
                    var _bottom = _nextEl.offset().top + 90;
                    var _scrollTop = $(window).scrollTop();
                    var _windowH = $(window).height();

                    // snap to place
                    if (_bottom < (_scrollTop + _windowH)) {
                        fareSummaryBg.removeClass('fixed');
                        fareSummaryPlaceholder.hide();
                        fareSummaryDetailsContainer.css({ maxHeight: (_scrollTop - fareSummaryHead.offset().top - fareSummaryHead.height() + _windowH) });
                    }
                        // fix to the bottom of the screen
                    else {
                        fareSummaryBg.addClass('fixed');
                        fareSummaryPlaceholder.show();
                        fareSummaryDetailsContainer.css({ maxHeight: '' });
                    }
                }
            }, 50));
        },
        // for flight options/passenger details module
        bookingAddOnsFiltered: function () {
            var ret = [];
            if (this.additionalFees().length > 0) {       
                var addon = _.find(this.additionalFees(), function (p) {
                    return _.contains(porter.BOOKING_ADDON_SSR_LIST, p.feeCode());
                });
                if (addon) {
                    ret.push(addon);
                }
            }
            return ret;
        }
    });

    porter.FareSummaryVM = FareSummaryVM;

    // absoluteValue = Math.Abs -> force positive amount
    function animatePrice(oldValue, newValue, callbackFunction, absoluteVal) {

        if (oldValue == undefined) {
            oldValue = parseFloat(fareSummaryVM.totalAmountDue());
        }

        if (oldValue !== newValue) {
            var priceSelector = $('#main-price .main-price-amount').length ?
            '#main-price .main-price-amount' : '#main-price';

            $({ someValue: oldValue }).animate({ someValue: newValue }, {
                duration: 500,
                easing: 'swing',
                step: function () {
                    var value = this.someValue;
                    if (absoluteVal == true) {
                        value = Math.abs(value);
                    }

                    $(priceSelector).text(porter.getAmountWithCommasAndDollarSign(value));
                },
                start: function () {
                    
                },
                complete: function () {
                    var value = newValue
                    if (absoluteVal == true) {
                        value = Math.abs(newValue);
                    }
                    $(priceSelector).text(porter.getAmountWithCommasAndDollarSign(value));
                    document.accessibility.readText($('#fare-summary-total-price-wrapper').find(":not([aria-hidden='true'])").text());

                    if (callbackFunction != null) {
                        callbackFunction();
                    }
                }
            });
        }
    }

    // Combine multiple fees to get an aggregate of each service charge
    // arr is an array of PassengerFee
    function getAggregate(arr) {
        var charges = {};
        var taxes = {};
        if (!_.isEmpty(arr) && arr.length) {
            var maxBGCount = 0;
            var maxGBGCount = 0;
            for (var x = 0; x < arr.length; x++) {
                var fee = arr[x];
                for (var y = 0; y < fee.serviceCharges().length; y++) {
                    var serviceCharge = fee.serviceCharges()[y];
                    var chargeCode = serviceCharge.chargeCode();
                    // Combine bag charges, 1BG, 2BG, 3BG
                    if (chargeCode.indexOf('BG') === 1) {
                        maxBGCount = Math.max(chargeCode.substr(0, 1), maxBGCount);
                        chargeCode = 'BAG';
                    } else if (chargeCode.indexOf('GBG') === 1) {
                        maxGBGCount = Math.max(chargeCode.substr(0, 1), maxGBGCount);
                        chargeCode = 'GBG';
                    }
                    if (!charges[chargeCode]) {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.copyData(serviceCharge);
                        charges[chargeCode] = newServiceCharge;
                    } else {
                        // Update amount
                        charges[chargeCode].newAmount(charges[chargeCode].newAmount() + (serviceCharge.newAmount()));
                        charges[chargeCode].oldAmount(charges[chargeCode].oldAmount() + (serviceCharge.oldAmount()));
                    }
                }
                for (var y = 0; y < fee.discounts().length; y++) {
                    var discount = fee.discounts()[y];
                    if (!charges[discount.chargeCode()]) {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.copyData(discount);
                        charges[discount.chargeCode()] = newServiceCharge;
                    } else {
                        // Update amount
                        charges[discount.chargeCode()].newAmount(charges[discount.chargeCode()].newAmount() + (discount.newAmount()));
                        charges[discount.chargeCode()].oldAmount(charges[discount.chargeCode()].oldAmount() + (discount.oldAmount()));
                    }
                }
                for (var y = 0; y < fee.taxes().length; y++) {
                    var tax = fee.taxes()[y];
                    if (!taxes[tax.chargeCode()]) {
                        var newServiceCharge = new ServiceCharge();
                        newServiceCharge.copyData(tax);
                        taxes[tax.chargeCode()] = newServiceCharge;
                    } else {
                        // Update amount
                        taxes[tax.chargeCode()].newAmount(taxes[tax.chargeCode()].newAmount() + (tax.newAmount()));
                        taxes[tax.chargeCode()].oldAmount(taxes[tax.chargeCode()].oldAmount() + (tax.oldAmount()));
                    }
                }
            }
            if (maxBGCount > 0) {
                charges.BAG.chargeCode(maxBGCount + 'BG');
            }
            if (maxGBGCount > 0) {
                charges.GBG.chargeCode(maxBGCount + 'GBG');
            }
        }
        var returnArr = [];
        for (var prop in charges) {
            if (charges.hasOwnProperty(prop)) {
                returnArr.push(charges[prop]);
            }
        }
        // Put taxes after the charges
        for (var prop in taxes) {
            if (taxes.hasOwnProperty(prop)) {
                returnArr.push(taxes[prop]);
            }
        }
        return returnArr;
    }


    // misc event handlers
    $(document).ready(function () {

        // close booking widget on esc key
        document.addEventListener("keydown", function(e) { 
            if (e.which == 27 && !fareSummaryVM.collapseBooking()) {
                $('.booking-widget-calendar').hide();
                fareSummaryVM.toggleBookingContainer();
                document.accessibility.readText("Booking widget closed.");
                document.querySelector('.booking-widget-toggle-btn').focus();
            }
        });

        //modals 
        $(document).on('click', '#fare-tooltip-modal--phone', function () {
            $(this).modal('hide');
        });            
    });

    $(window).scroll(function () {

        var headerTop = $(".header-container").offset().top + $(".header-container").outerHeight();
        if (typeof $(".booking-widget-calendar") != 'undefined' && $(".booking-widget-calendar")[0]) {
            if ($(window).scrollTop() > headerTop) {
                //when the header reaches the top of the window change position to fixed
                $(".booking-widget-calendar")[0].classList.add("booking-widget-calendar__fixed_position");
                $(".booking-widget-calendar")[0].classList.remove("booking-widget-calendar__adjusted");
            } else {
                //put position back to relative
                $(".booking-widget-calendar")[0].classList.remove("booking-widget-calendar__fixed_position");
                $(".booking-widget-calendar")[0].classList.add("booking-widget-calendar__adjusted");
            }
        }
    });

}());

$(document).on('click', "#fare-summary-skip-to-total, .fare-summary-skip-to-total", function (e) {

    $(".c-fare-summary-total-price-wrapper")[0].focus()

});

function focusFirst(e) {
    //console.log(e);

    //$(document).keydown(function(e) {
    //    console.log('this is the keyCode'+ e.keyCode);
    //});

    //$('.alert').eq(1).keydown(function (e) {
    //    if (e.which === 40) {
    //        console.log('40');
    //        e.stopPropagation();
    //        e.preventDefault();

    //    }
    //});

    // ON TAB
//    $('.prev-focus').eq(1).blur(function () {
//        $('.addons-focus:first').focus();
//    });
    //$('.addons-focus:first').blur(function () {
    //    $('.c-newsearch__btn--expandable').focus();
    //});

    //$('a.inline').blur(function () {
    //    $('.focusOrder').focus();
    //});
    //$('a.inline').blur(function () {

    //    if (e.which = 16 && 9) {
    //        console.log()
    //    }
    //    $('.focusOrder').focus();
    //});

    
}


