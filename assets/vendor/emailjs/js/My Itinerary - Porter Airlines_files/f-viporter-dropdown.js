(function () {
    var nTimer = setInterval(function () {
        if (window.jQuery) {

            $(document).ready(function () {

            //VIPorter login form - Anon
            $('#viporter-dropdown-trigger_anon').on('click', function (event) {
                event.stopPropagation();
                $('#viporter-dropdown-form-anon').slideToggle();

                if ($('#viporter-dropdown-trigger_anon').attr('aria-expanded') === 'true') {
                    $('#viporter-dropdown-trigger_anon').attr('aria-expanded', 'false');
                } else if ($('#viporter-dropdown-trigger_anon').attr('aria-expanded') === 'false') {
                    $('#viporter-dropdown-trigger_anon').attr('aria-expanded', 'true')
                }
            });

            //Viporter logged in dropdown menu
            $('#viporter-dropdown-trigger_logged-in').on('click', function (event) {
                event.stopPropagation();
                $('#viporter-dropdown-logged-in').slideToggle();

                if ($('#viporter-dropdown-trigger_logged-in').attr('aria-expanded') === 'true') {
                    $('#viporter-dropdown-trigger_logged-in').attr('aria-expanded', 'false');
                } else if ($('#viporter-dropdown-trigger_logged-in').attr('aria-expanded') === 'false') {
                    $('#viporter-dropdown-trigger_logged-in').attr('aria-expanded', 'true')
                }
                if (!$('#viporter__dropdown-arrow').hasClass('c-viporter__dropdown-arrow--flip')) {
                    $('#viporter__dropdown-arrow').addClass('c-viporter__dropdown-arrow--flip');
                } else {
                    $('#viporter__dropdown-arrow').removeClass('c-viporter__dropdown-arrow--flip');
                }
            })

            //On clicking elsewhere, close everythhing
            $(document).on("click", function (e) {
                $("#viporter-dropdown-form-anon").slideUp();
                $("#viporter-dropdown-logged-in").slideUp();
                $('#viporter__dropdown-arrow').removeClass('c-viporter__dropdown-arrow--flip');
                $('#viporter-dropdown-trigger_logged-in').attr('aria-expanded', 'false');
                $('#viporter-dropdown-trigger_anon').attr('aria-expanded', 'false');
            });
});


            clearInterval(nTimer);
        }
    }, 100);
})();

