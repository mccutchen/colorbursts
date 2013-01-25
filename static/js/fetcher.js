var Fetcher = (function() {
    var apiHost = 'https://api-ssl.bitly.com',
        seenPhrases = {},
        seenTitles = {},
        seenImages = {};

    function genericError(resp) {
        App.trigger('Fetcher:error', resp);
    }

    function apiRequest(url, params, success) {
        var promise = $.ajax({
            type: 'GET',
            url: apiHost + url,
            data: _.merge(params || {}, {
                access_token: localStorage.accessToken
            }),
            dataType: 'json',
            traditional: true
        });

        // Unify handling of bitly-style error responses and actual HTTP
        // errors by transforming the latter into the former.
        promise.done(function(data) {
            if (data.status_code != 200) {
                genericError(data);
            } else {
                success(data.data);
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
        apiRequest('/v3/realtime/bursting_phrases', {}, onBursts);
    }

    function onBursts(data) {
        App.trigger('Fetcher:bursting_phrases', data);
        data.phrases.forEach(function(burst) {
            if (!seenPhrases[burst.phrase]) {
                fetchStory(new Item({phrase: burst.phrase}));
                seenPhrases[burst.phrase] = 1;
            } else {
                console.log('Skipping phrase:', burst.phrase);
            }
        });
    }

    function fetchStory(item) {
        var callback = _.partial(onStory, item);
            params = {
                phrases: item.get('phrase')
            };
        apiRequest('/v3/story_api/story_from_phrases', params, callback);
    }

    function onStory(item, story) {
        App.trigger('Fetcher:story_from_phrases', story);
        item.set('storyId', story.story_id);
        fetchStoryTitle(item);
        fetchStoryMetadata(item);
    }

    function fetchStoryTitle(item) {
        var callback = _.partial(onStoryTitle, item),
            params = {
                story_id: item.get('storyId')
            };
        apiRequest('/v3/story_api/title', params, callback);
    }

    function onStoryTitle(item, titleData) {
        App.trigger('Fetcher:title', titleData);
        if (!seenTitles[titleData.title]) {
            item.set('title', titleData.title);
            seenTitles[titleData.title] = 1;
        } else {
            console.log('Skipping title:', titleData.title);
        }
    }

    function fetchStoryMetadata(item) {
        var callback = _.partial(onStoryMetadata, item),
            params = {
                story_id: item.get('storyId'),
                field: ['titles', 'images', 'clicks']
            };
        apiRequest('/v3/story_api/metadata', params, callback);
    }

    function onStoryMetadata(item, metadata) {
        App.trigger('Fetcher:metadata', metadata);
        item.set('clicks', metadata.clicks);
        if (metadata.images && metadata.images.length > 0) {
            console.log('Sorting images:', metadata.images);
            var imageUrl = metadata.images.sort(function(a, b) {
                return (a.width * a.height >= b.width * b.height) ? -1 : 1;
            })[0].url;
            console.log('Best image:', imageUrl);
            if (!seenImages[imageUrl]) {
                item.set('imageUrl', imageUrl);
                seenImages[imageUrl] = 1;
            } else {
                console.log('Skipping image:', imageUrl);
            }
        }
    }

    return {
        fetchBursts: fetchBursts
    };
})();
