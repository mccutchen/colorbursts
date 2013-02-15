var ItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'item',

    initialize: function() {
        this.template = Handlebars.compile($('#item-template').html());
    },

    /*
    <script id="item-template" type="text/x-handlebars-template">
            <h2><a href="http://bit.ly/{{ ghash }}">{{ title }}</a></h2>
            {{#colors}}
                <div class="color" style="background-color:{{color}}; width:50px; height: 50px;">&nbsp;</div>
            {{/colors}}
        </script>
    */

    render: function() {
        console.log('Rendering data: %o', this.model.toJSON());
        var totalWidth = $(document.body).width(),
            colors = this.model.get('colors'),
            offset = 0;

        for (var i = 0; i < colors.length; i++) {
            var color = colors[i];
            color.width = Math.ceil(totalWidth * color.weight);
            color.width = Math.ceil(totalWidth / colors.length);
            color.offset = offset;
            offset += color.width;
        }
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});
