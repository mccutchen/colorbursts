/** @jsx React.DOM */

var React = require('react');
var Fetcher = require('./fetcher');

var FETCH_INTERVAL = 10 * 1000;
var UPDATE_INTERVAL = 1 * 1000;


var Item = React.createClass({
    render: function() {
        return (
            <div className="item">
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
                items: this.state.items.concat([item])
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

