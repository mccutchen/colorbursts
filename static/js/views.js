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

        // Color data for some photos come back with weights that don't add up
        // to 1, so we normalize the weight if necessary.
        var totalWidth = $(document.body).width(),
            colors = this.model.get('colors'),
            count = colors.length,
            totalWeight = colors.reduce(function(sum, color) {
                return sum + color.weight;
            }, 0.0),
            weightDelta = (1 - totalWeight) / count,
            offset = 0;

        colors.forEach(function(color, i) {
            color.css = this.formatColor.apply(null, color.color);
            color.width = Math.ceil(totalWidth * (color.weight + weightDelta));
            color.offset = offset;
            offset += color.width;
        }, this);

        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },

    formatColor: function(r, g, b) {
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
});
