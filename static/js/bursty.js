$(function() {

    var container = $('#container').masonry({columnWidth: 100}),
        loaded = false,
        loading = false,
        perPage = 20,
        offset = 0;

    function startSearch() {
        loading = true;
        if (!loaded) {
            $('#spinner').show();
        }
        $.ajax({
            type: 'GET',
            url: 'https://api-ssl.bitly.com/beta/search',
            data: {
                domain: 'flickr.com',
                type: 'burst',
                rows: perPage,
                start: offset,
                access_token: localStorage['accessToken']
            },
            dataType: 'json'
        }).done(bitlyResponse(searchSuccess, searchError));
        offset += perPage;
    }

    function bitlyResponse(success, error) {
        return function(data) {
            if (data.status_code != 200) {
                error(data.status_code, data.status_txt, data.data);
            } else {
                success(data.data);
            }
        };
    }

    function searchSuccess(data) {
        console.log('search success:', data);
        data.results.forEach(function(item) {
            startOembed(item.displayUrl);
        });
    }

    function searchError() {
        console.log('search error:', arguments);
        alert('search error!');
    }

    function startOembed(url) {
        if (!/^https?:\/\//.test(url)) {
            url = 'http://' + url;
        }
        oembedUrl = 'http://www.flickr.com/services/oembed/' +
            '?url=' + encodeURIComponent(url) +
            '&maxwidth=320&format=json&jsoncallback=?';
        $.ajax({
            url: oembedUrl,
            dataType: 'jsonp'
        }).done(oembedSuccess);
    }

    function oembedSuccess(data) {
        if (!loaded) {
            $('#spinner').hide();
            loaded = true;
        }
        if (loading) {
            loading = false;
        }
        var el = $(render('item-template', data));
        el.appendTo(container).fadeIn();
        container.masonry('appended', el);
        container.masonry('reload');
    }

    var _templateCache = {};
    function render(template, context) {
        if (!_templateCache[template]) {
            _templateCache[template] = Handlebars.compile($('#' + template).html());
        }
        return _templateCache[template](context);
    }

    $(window).scroll(function(e) {
        if (!loading && document.body.scrollTop == $(document).height() - $(window).height()) {
           startSearch();
        }
    });

    $('#prompt').submit(function(e) {
        e.preventDefault();
        var token = $('#access-token').val();
        if (token) {
            localStorage['accessToken'] = token;
            $(this).hide();
            startSearch();
        }
    });

    function init() {
        if (!localStorage['accessToken']) {
            $('#prompt').show();
        } else {
            startSearch();
        }
    }
    init();
});
