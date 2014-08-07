var Fetcher = (function() {
    var apiPrefix = '/bitly',
        seenPhrases = {},
        seenTitles = {};

    function genericError(resp) {
        App.trigger('Fetcher:error', resp);
    }

    function embedlyPreview(url, success) {
        var promise = $.ajax({
            type: 'GET',
            url: '/embedly',
            data: { url: url },
            dataType: 'json',
            traditional: true
        });

        promise.done(function(data) {
            console.log('Embedly response:', data);
            return success(data);
        }).fail(function(xhr) {
            console.log('Embedly error:', xhr);
            return genericError({
                status_code: xhr.statusCode,
                status_txt: xhr.body,
                data: null
            });
        });
    }

    function apiRequest(url, params, success) {
        var promise = $.ajax({
            type: 'GET',
            url: apiPrefix + url,
            data: params,
            dataType: 'json',
            traditional: true
        });

        // Unify handling of bitly-style error responses and actual HTTP
        // errors by transforming the latter into the former.
        promise.done(function(data) {
            if (data.status_code !== 200) {
                return genericError(data);
            } else {
                return success(data.data);
            }
        }).fail(function(xhr) {
            return genericError({
                status_code: xhr.statusCode,
                status_txt: xhr.body,
                data: null
            });
        });
    }

    function fetchBursts() {
        App.trigger('Fetcher:loading');
        apiRequest('/v3/realtime/bursting_phrases', {limit: 1}, onBursts);
    }

    function onBursts(data) {
        App.trigger('Fetcher:bursting_phrases', data);
        data.phrases.forEach(function(burst) {
            if (burst.ghashes && !seenPhrases[burst.phrase]) {
                var item = new Item({
                    phrase: burst.phrase,
                    ghash: burst.ghashes[0].ghash
                });
                fetchEmbedlyPreview(item, 'http://bit.ly/' + item.get('ghash'));
                seenPhrases[burst.phrase] = 1;
            } else {
                console.log('Skipping phrase:', burst.phrase);
            }
        });
    }

    function fetchEmbedlyPreview(item, url) {
        var callback = onEmbedlyPreview.bind(null, item);
        embedlyPreview(url, callback);
    }

    function onEmbedlyPreview(item, preview) {
        App.trigger('Fetcher:preview', preview);
        if (seenTitles[preview.title]) {
            console.log('Skipping dupe title:', preview.title);
            return;
        }
        item.set({
            'title': preview.title,
            'url': preview.url
        });
        seenTitles[preview.title] = 1;
        if (preview.images.length > 0 && preview.images[0].colors && preview.images[0].colors.length > 0) {
            item.set('colors', preview.images[0].colors);
        }
    }

    return {
        fetchBursts: fetchBursts
    };
})();
