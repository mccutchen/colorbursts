var ItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'item',

    initialize: function() {
        this.template = Handlebars.compile($('#item-template').html());
    },

    render: function() {
        console.log('Rendering data: %o', this.model.toJSON());
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});
