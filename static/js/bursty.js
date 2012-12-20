$(function() {

    var Item = Backbone.Model.extend({
        defaults: {
            storyId: null,
            phrase: null,
            title: null,
            imageUrl: undefined,
            clicks: null
        },

        initialize: function() {
            this.on('change', function(item) {
                if (item.get('storyId') !== null &&
                    item.get('phrase') !== null &&
                    item.get('title') !== null &&
                    item.get('clicks')!== null &&
                    item.get('imageUrl') !== undefined) {
                    console.log('Item complete:', item, item.toJSON());
                    item.trigger('complete', item);
                }
            });

            this.on('complete', renderItem);
        }
    });


    var container = $('#container'),
        initialized = false,
        loading = false,
        apiHost = 'https://api-ssl.bitly.com';

    function apiRequest(url, params, success, error) {
        params = _.merge(params || {}, {access_token: localStorage.accessToken});
        success = success || function() {};
        error = error || function() {},
        promise = $.ajax({
            type: 'GET',
            url: apiHost + url,
            data: params,
            dataType: 'json',
            traditional: true
        });

        // We need to wrap the given success and error callbacks to unify
        // error handling for bitly's "expected" API error response and
        // for legit HTTP errors that crop up.
        promise.done(function(data) {
            if (data.status_code != 200) {
                console.log('Error:', data);
                error(data);
            } else {
                console.log('Success:', data);
                success(data.data);
            }
        }).fail(function(xhr) {
            console.log('HTTP error:', xhr, arguments);
            if (!error)
                return;
            return error({
                status_code: xhr.statusCode,
                status_txt: xhr.body,
                data: null
            });
        });
    }

    function onGenericError(resp) {
        console.log('error:', resp);
    }

    function fetchBursts() {
        loading = true;
        if (!initialized) {
            $('#spinner').show();
        }
        apiRequest('/v3/realtime/bursting_phrases', {}, onBursts);
    }

    function onBursts(data) {
        data.phrases.forEach(function(burst) {
            console.log('burst:', burst);
            var item = new Item({
                phrase: burst.phrase
            });
            fetchStory(item);
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
        console.log('story:', story);
        item.set('storyId', story.story_id);
        fetchStoryMetadata(item);
        fetchStoryTitle(item);
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
        console.log('meta:', metadata);
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

    function fetchStoryTitle(item) {
        var callback = _.partial(onStoryTitle, item),
            params = {
                story_id: item.get('storyId')
            };
        apiRequest('/v3/story_api/title', params, callback);
    }

    function onStoryTitle(item, titleData) {
        console.log('title:', titleData.title);
        item.set('title', titleData.title);
    }

    function onStoryImage(item, img) {
        console.log('best image:', img);
        item.set('imageUrl', img.src);
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

    function renderItem(item) {
        if (!initialized) {
            $('#spinner').hide();
            initialized = true;
        }
        if (loading) {
            loading = false;
        }
        var el = $(render('item-template', item.toJSON()));
        el.appendTo(container).fadeIn();
        // container.masonry('appended', el);
        // container.masonry('reload');
    }

    var _templateCache = {};
    function render(template, context) {
        if (!_templateCache[template]) {
            _templateCache[template] = Handlebars.compile($('#' + template).html());
        }
        return _templateCache[template](context);
    }

    // $(window).scroll(function(e) {
    //     if (!loading && document.body.scrollTop == $(document).height() - $(window).height()) {
    //        fetchBursts();
    //     }
    // });

    $('#prompt').submit(function(e) {
        e.preventDefault();
        var token = $('#access-token').val();
        if (token) {
            localStorage['accessToken'] = token;
            $(this).hide();
            fetchBursts();
        }
    });

    function init() {
        if (!localStorage['accessToken']) {
            $('#prompt').show();
        } else {
            fetchBursts();
        }
    }
    init();
});
