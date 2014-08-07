var Item = Backbone.Model.extend({
    defaults: {
        phrase: null,
        title: null,
        ghash: null,
        url: null,
        colors: null
    },

    initialize: function() {
        this.on('change', function(item) {
            var awaiting = _.keys(item.attributes).filter(function(key) {
                return item.get(key) === null;
            });
            if (awaiting.length === 0) {
                App.trigger('Item:loaded', item);
            }
        });
    }
});


var ItemList = Backbone.Collection.extend({
    model: Item
});
