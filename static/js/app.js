/** @jsx React.DOM */

var React = require('react');
var Fetcher = require('./fetcher');

var FETCH_INTERVAL = 30 * 1000;
var UPDATE_INTERVAL = 1 * 1000;


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
    return '-webkit-linear-gradient(left, ' + stops.join(', ') + ')';
}

var Item = React.createClass({
    render: function() {
        var style = {
            'background-color': this.props.colors[0].css,
            'background-image': colorsToGradient(this.props.colors)
        };
        return (
            <div className="item" style={style}>
                <a href={this.props.url}>{this.props.title}</a>
            </div>
        );
    }
});


var ItemList = React.createClass({
    getInitialState: function() {
        return {
            items: []
        };
    },

    componentWillMount: function() {
        console.log('Fetching new items?');
        Fetcher.fetch();
        setInterval(Fetcher.fetch, FETCH_INTERVAL);
        setInterval(this.checkQueue, UPDATE_INTERVAL);
    },

    checkQueue: function() {
        var item = Fetcher.queue.pop();
        if (item) {
            this.setState({
                items: [item].concat(this.state.items)
            });
        }
    },

    render: function() {
        var items = this.state.items.map(function(item) {
            return <Item key={item.url} title={item.title} url={item.url} colors={item.colors} />;
        });
        if (items) {
            return <div className="items-container">{items}</div>;
        } else {
            return <div className="loading">Loading&hellip;</div>;
        }
    }
});


React.renderComponent(
    <ItemList />,
    document.getElementById('app')
);

