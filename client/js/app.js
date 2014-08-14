/** @jsx React.DOM */

var React = require('react');

var Fetcher = require('./fetcher');
var Utils = require('./utils');

var FETCH_INTERVAL = 30 * 1000;
var UPDATE_INTERVAL = 1 * 1000;


var Item = React.createClass({
    render: function() {
        var style = {
            'background-color': this.props.colors[0].css,
            'background-image': Utils.colorsToGradient(this.props.colors)
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
        Fetcher.start(FETCH_INTERVAL);
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

