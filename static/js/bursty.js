$(function() {
    console.log('Loaded');
    console.log('accessToken:', accessToken);

    var container = $('#container'),
        masonry = new Masonry(container.get(0), {columnWidth: 100});

    function startSearch() {
        $.ajax({
            type: 'GET',
            url: 'https://api-ssl.bitly.com/beta/search',
            data: {
                domain: 'flickr.com',
                type: 'burst',
                access_token: accessToken
            },
            dataType: 'json',
            success: bitlyResponse(searchSuccess, searchError)
        });
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
        $.ajaxJSONP({
            url: oembedUrl,
            success: oembedSuccess,
            error: oembedError,
            complete: function() {}
        });
    }

    function oembedSuccess(data) {
        console.log('oembed success:', data);
        var el = $(render('item-template', data)).css({opacity: 0});
        el.appendTo(container).animate({opacity: 1});
        masonry.appended(el);
    }

    function oembedError() {
        console.log('oembed error:', arguments);
        // alert('oembed error!');
    }

    var _templateCache = {};
    function render(template, context) {
        if (!_templateCache[template]) {
            _templateCache[template] = Handlebars.compile($('#' + template).html());
        }
        return _templateCache[template](context);
    }

    startSearch();
});
