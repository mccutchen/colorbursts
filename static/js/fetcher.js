var Fetcher = (function() {
    var apiHost = 'https://api-ssl.bitly.com',
        seenPhrases = {};

    function apiRequest(url, params, success) {
        var error = function(resp) {
            App.trigger('Fetcher:error', resp);
        };
        params = _.merge(params || {}, {
            access_token: localStorage.accessToken
        });
        promise = $.ajax({
            type: 'GET',
            url: apiHost + url,
            data: params,
            dataType: 'json',
            traditional: true
        });

        // Unify handling of bitly-style error responses and actual HTTP
        // errors by transforming the latter into the former.
        promise.done(function(data) {
            if (data.status_code != 200) {
                error(data);
            } else {
                success(data.data);
            }
        }).fail(function(xhr) {
            return error({
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
        item.set('title', titleData.title);
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
        metadata.images = makeFakeImages();
        getBestImage(metadata.images, _.partial(onStoryImage, item));
    }

    function makeFakeImages() {
        var sizeParts = [100, 150, 200, 250, 300, 350, 400],
            sizes = [],
            count = Math.floor(Math.random() * 10),
            i, w, h;
        for (i = 0; i < count; i++) {
            w = sizeParts[Math.floor(Math.random() * sizeParts.length)];
            h = sizeParts[Math.floor(Math.random() * sizeParts.length)];
            sizes.push(w + 'x' + h);
        }
        return sizes.map(function(size) {
            return 'http://placehold.it/' + size;
        });
    }

    function onStoryImage(item, img) {
        console.log('Fetcher:image', img);
        if (img) {
            item.set('imageUrl', img.src);
        }
    }

    function getBestImage(imageUrls, callback) {
        var images = imageUrls.map(function(src) {
                var img = new Image();
                img.src = src;
                return img;
            }),
            timeout = 1000,
            start = new Date().getTime();

        (function await() {
            var loaded = images.filter(function(img) { return img.complete; }),
                result = null,
                i;
            if (loaded.length < images.length && (new Date().getTime() - start) < timeout) {
                setTimeout(await, 20);
            } else {
                if (loaded.length > 0) {
                    result = loaded.sort(function(a, b) {
                        return (a.width * a.height >= b.width * b.height) ? -1 : 1;
                    })[0];
                }
                for (i = 0; i < images.length; i++) {
                    if (result === null || images[i].src !== result.src)
                        delete images[i];
                }
                callback(result);
            }
        })();
    }

    return {
        fetchBursts: fetchBursts
    };
})();
