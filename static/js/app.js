var App = (function(){
    var App = Backbone.View.extend({
        el: $('body').get(0),

        events: {
        },

        initialize: function() {
            this.items = new ItemList();
            this.container = $('#items-container');
            this.spinner = $('#spinner');

            this.on('Item:loaded', function(item) {
                this.spinner.hide();
                this.items.add(item);
            });

            this.items.on('add', this.addItem, this);

            this.items.on('all', function(name, data) {
                console.log('ITEMS EVENT:', name, data);
            });

            this.on('App:ready', function() {
                Fetcher.fetchBursts();
                setInterval(Fetcher.fetchBursts, 30 * 1000);
            });

            this.on('all', function(name, data) {
                console.debug('APP EVENT:', name, data);
            });
        },

        init: function() {
            this.trigger('App:ready');
        },

        addItem: function(item) {
            var view = new ItemView({model: item}),
                $el = view.render().$el;
            $el.prependTo(this.container).fadeIn();
        }
    });

    return new App();
})();
