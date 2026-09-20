(function () {
    var nTimer = setInterval(function () {
        if (window.jQuery) {

            $('.c-widget-tab__list').on('click keydown', function(event){
                if (!porter.isMobile()) {
                $('html').animate({
                    scrollTop : $(this).offset().top - 50
                }, 500);
}
            });
            clearInterval(nTimer);
        }
    }, 100);

    $('.tab-info').hide();
    $('.tab-info--first').show();

    $('.c-standalone-tab').on('click', function () {
        $('.c-standalone-tab__list').find('li').removeClass('c-standalone-tab--active');
        $('.c-standalone-tab__list').find('a').removeClass('c-standalone-tab__link--active');
        $(this).addClass('c-standalone-tab--active');
        $(this).find('a').addClass('c-standalone-tab__link--active');
        // show tab
        $('.tab-info').hide();
        $('#tab-info__' + this.dataset.id).show();
    })
    //apply theme for pe calendar widget
    $('.book-a-flight, .porter-pass, .flight-status, .my-bookings, .check-in ').on('click', function () {
        document.body.classList.remove("peDatePicker");
    })
    $('.book-a-hotel').on('click', function () {
        document.body.classList.add("peDatePicker");
    })
})();

