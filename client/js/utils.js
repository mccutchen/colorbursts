// Use something like so to get hard edges between gradients:
// background: linear-gradient(left,
//                             #fdd107 0,   #fdd107 44%,
//                             #fdb614 44%, #fdb614 70%,
//                             #f47f1f 70%, #f47f1f 88%,
//                             #ee5725 88%, #ee5725 100%);

var vendorPrefix = (function() {
    var ua = navigator.userAgent;
    if (/webkit/i.test(ua)) {
        return '-webkit-';
    } else if (/gecko/i.test(ua)) {
        return '-moz-';
    }
    return '';
})();


function colorsToGradient(colors) {
    if (colors.length === 1) {
        return colors.css;
    }
    var total = 0;
    var stops = [];
    for (var i = 0; i < colors.length; i++) {
        var c = colors[i];
        var pct = Math.round(c.weight * 100);
        stops.push(c.css + ' ' + total + '%');
        total += pct;
        stops.push(c.css + ' ' + total + '%');
    }
    // Because of an issue with React, we have to guess the single, vendor-
    // prefixed version of the gradient rule to use:
    // https://github.com/facebook/react/pull/723
    return vendorPrefix + 'linear-gradient(left, ' + stops.join(', ') + ')';
}

module.exports = {
    colorsToGradient: colorsToGradient
};
