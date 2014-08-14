// background: linear-gradient(left, #fdd107 0, #fdd107 44%, #fdb614 44%, #fdb614 70%, #f47f1f 70%, #f47f1f 88%, #ee5725 88%, #ee5725 100%);
// background: -webkit-linear-gradient(left, #fdd107 0, #fdd107 44%, #fdb614 44%, #fdb614 70%, #f47f1f 70%, #f47f1f 88%, #ee5725 88%, #ee5725 100%);
// background: -moz-linear-gradient(left, #fdd107 0, #fdd107 44%, #fdb614 44%, #fdb614 70%, #f47f1f 70%, #f47f1f 88%, #ee5725 88%, #ee5725 100%);

function colorsToGradient(colors) {
    if (colors.length === 1) {
        return colors.css;
    }
    var total = 0;
    var stops = [];
    for (var i = 0; i < colors.length; i++) {
        var c = colors[i];
        var pct = Math.ceil(c.weight * 100);
        stops.push(c.css + ' ' + total + '%');
        total += pct;
        stops.push(c.css + ' ' + total + '%');
    }
    var gradient = 'linear-gradient(left, ' + stops.join(', ') + ')';
    var prefixes = ['', '-webkit-', '-moz-'];
    return prefixes.map(function(prefix) {
        return prefix + gradient;
    }).join(', ');
}

module.exports = {
    colorsToGradient: colorsToGradient
};
