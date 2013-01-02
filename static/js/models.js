var Item = Backbone.Model.extend({
    defaults: {
        storyId: null,
        phrase: null,
        title: null,
        imageUrl: null,
        clicks: null
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
