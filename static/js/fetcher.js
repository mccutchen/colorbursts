var $ = require('jquery');

var queue = [];
var seen = {};


function isNewBurst(burst) {
    if (seen[burst.phrase]) {
        console.debug('Skipping seen phrase: %o', burst.phrase);
        return false;
    }
    if (!(burst.ghashes && burst.ghashes.length > 0)) {
        console.debug('Skipping invalid phrase: %o', burst);
        return false;
    }
    return true;
}


function isNewPreview(preview) {
    if (seen[preview.title]) {
        console.debug('Skipping dupe title: %o', preview.title);
        return false;
    }
    if (seen[preview.url]) {
        console.debug('Skipping dupe url:', preview.url);
        return false;
    }
    return true;
}


function processColors(colors) {
    var totalWeight = colors.reduce(function(sum, color) {
        return sum + color.weight;
    }, 0.0);
    var ratio = 1 / totalWeight;
    return colors.map(function(color) {
        return {
            css: 'rgb(' + color.color.join(',') + ')',
            weight: color.weight * ratio
        };
    });
}


function getImageColors(preview) {
    if (!(preview.images &&
          preview.images.length > 0 &&
          preview.images[0].colors &&
          preview.images[0].colors.length > 0)) {
        console.debug('No colors for preview:', preview);
        return null;
    }
    return processColors(preview.images[0].colors);
}


function fetchBursts() {
    return $.ajax({
        type: 'GET',
        url: '/bitly/v3/realtime/bursting_phrases',
        data: {limit: 1},
        dataType: 'json'
    });
}


function fetchPreview(url) {
    return $.ajax({
        type: 'GET',
        url: '/embedly',
        data: { url: url },
        dataType: 'json'
    });
}


function handleBurst(burst) {
    var url = 'http://bit.ly/' + burst.ghashes[0].ghash;
    return fetchPreview(url).then(function(preview) {
        if (!isNewPreview(preview)) {
            return null;
        }

        seen[burst.phrase] = 1;
        seen[preview.title] = 1;
        seen[preview.url] = 1;

        var colors = getImageColors(preview);
        if (!colors) {
            return null;
        }

        return {
            title: preview.title,
            phrase: burst.phrase,
            url: preview.url,
            colors: colors
        };
    }, function(xhr) {
        console.error('Failed to fetch embedly preview:', xhr);
    });
}


function handleItem(item) {
    if (item) {
        queue.push(item);
    }
}


function fetch() {
    fetchBursts().done(function(resp) {
        var bursts = resp.data.phrases;
        bursts.filter(isNewBurst).map(handleBurst).map(function(promise) {
            promise.done(handleItem);
        });
    }).fail(function(xhr) {
        console.error('Failed to fetch bursting phrases:', xhr);
    });
}

window.queue = queue;

module.exports = {
    fetch: fetch,
    queue: queue
};
