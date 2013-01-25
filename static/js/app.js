var App = (function(){
    var App = Backbone.View.extend({
        el: $('body').get(0),

        events: {
            '#prompt submit': 'setAccessToken'
        },

        initialize: function() {
            this.items = new ItemList();
            this.container = $('#items-container').masonry({columnWidth: 100});
            this.prompt = $('#prompt');

            this.on('Item:loaded', function(item) {
                this.items.add(item);
            });

            this.items.on('add', this.addItem, this);

            this.items.on('all', function(name, data) {
                console.log('ITEMS EVENT:', name, data);
            });

            this.on('App:ready', function() {
                this.prompt.hide();
                Fetcher.fetchBursts();
                setInterval(Fetcher.fetchBursts, 30 * 1000);
            });

            this.on('all', function(name, data) {
                console.debug('APP EVENT:', name, data);
            });
        },

        init: function() {
            if (!localStorage['accessToken']) {
                this.prompt.show();
            } else {
                this.trigger('App:ready');
            }
        },

        addItem: function(item) {
            var view = new ItemView({model: item}),
                $el = view.render().$el;
            $el.appendTo(this.container).fadeIn();
            this.container.masonry('appended', $el);
            this.container.masonry('reload');
        },

        setAccessToken: function(e) {
            e.preventDefault();
            var token = $('#access-token').val();
            if (token) {
                localStorage['accessToken'] = token;
                this.trigger('App:ready');
            }
        }
    });

    return new App();
})();
