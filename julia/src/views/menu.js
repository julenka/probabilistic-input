/**
 * Created by julenka on 7/23/14.
 */

var MenuItem = Object.subClass({
    className: "MenuItem",
    /**
     * Initialize a MenuItem using a JSON description, e.g.: {name:"MyApp", children: []},
     * If no children are present, then the children variable actually doesn't have to be defined
     * @param name Name of this menu item
     * @param path path to the root
     */
    init: function(itemJSON, path, index_in_parent) {
        this.name = itemJSON.name;
        this.path = path;
        this.children = [];
        // Index of this item in the parent list
        this.index_in_parent = index_in_parent;
        for(var i = 0; itemJSON.children && i < itemJSON.children.length; i++) {
            var path_copy = [];
            path_copy.extend(path);
            path_copy.push(this);

            this.children.push(new MenuItem(itemJSON.children[i], path_copy, i));
        }
    },
    toString: function() {
        var names = this.path.map(function(x) { return x.name});
        return names.join('->');
    }
});

var Menu = FSMView.subClass({
    className: "Menu",
    /**
     * Build a menu item from a JSON-like description, e.g.
     *
     var menuItems = [
         {name:"MyApp", children: []},
         {name:"File", children: []},
         {name:"Edit", children: []},
         {name:"Help", children: []}
     ];
     * @param julia
     * @param properties
     *     menuItems
     */
    init: function(julia, menuItemsJSON, properties) {
        var defaults = {
            x: 0,
            y: 0,
            item_height: 30,
            top_item_width: 60,
            item_width: 100,
            inner_padding: 10,
            bar_width: 1000,
            bar_height: 30,
            text_height: 10,
            highlight_color: "#5776F1"
        };
        this._super(julia, properties, defaults);

        this.menuItems = [];
        for(var i = 0; i < menuItemsJSON.length; i++) {
            var itemJSON = menuItemsJSON[i];
            this.menuItems.push(new MenuItem(itemJSON, [], i));
        }
        console.log(this.menuItems);
    },
    clone: function() {
        var result = this._super();
        result.menuItems = deepCopy(this.menuItems);
    },
    draw: function($el) {
        var snap = Snap($el[0]);

        var current_group = snap.group();
        var m = new Snap.Matrix();
        m.translate(this.properties.x, this.properties.y);
        current_group.attr({transform: m.toTransformString()});
        if(this.active_child) {
            // always draw the top
            var current_children = this.menuItems;
            var current_level = 0;
            var selected_index = -1;
            // Draw the menus in the path
            for(var i = 0; i < this.active_child.path; i++) {
                selected_index = this.active_child.path[i].index_in_parent;
                this.drawSubMenu(current_children, current_level, selected_index, current_group);
                current_children = this.active_child.path[i].children;
                current_level++;
                current_group = current_group.group();
                current_group.attr({transform: m.toTransformString()});
                if(current_level == 0) {
                    m.translate(this.properties.top_item_width * selected_index, this.properties.item_height);
                } else {
                    m.translate(this.properties.item_width, this.properties.item_height * selected_index);
                }

            }
            // Draw the menu at our level
            this.drawSubMenu(this.menuItems, current_level, this.active_child.index_in_parent,  current_group);
            selected_index = this.active_child.index_in_parent;
            if(this.active_child.children && this.active_child.children.length > 0) {
                current_level++;
                console.log(selected_index)
                if(current_level == 1) {
                    m.translate(this.properties.top_item_width * selected_index, this.properties.item_height);
                } else {
                    m.translate(this.properties.item_width, this.properties.item_height * selected_index);
                }
                current_children = this.active_child.children;
                current_group = current_group.group();
                current_group.attr({transform: m.toTransformString()});
                this.drawSubMenu(current_children, current_level, -1, current_group);
            }
        } else {
            this.drawSubMenu(this.menuItems, 0, -1, current_group);
        }
    },
    /**
     * Draws a single subMenu
     * Encapsulates this menu in a gropu which is applies a translation to
     * @param items array of items to draw (this method does not recurse)
     * @param level level of the menu (draw level 0 differently)
     * @param selected_index index of the item that is 'active' at this level. -1 if non
     * @param left left coordinate of menu (relative to parent group)
     * @param top top coordinate (relative to parent group
     * @parent containing item (Snap object). Can be a group or Snap root
     */
    drawSubMenu: function(items, level, selected_index, parent) {
        var props = this.properties;
        if(level === 0 ) {
            parent.rect(0, 0, props.bar_width, props.bar_height).attr({fill: "white"});
            for(var i = 0; i < items.length; i++) {
                if(i === selected_index) {
                    parent.rect(i * props.top_item_width, 0, props.top_item_width, props.item_height)
                        .attr({fill: props.highlight_color});
                }
                var t = parent.text(i * props.top_item_width  + props.inner_padding, props.inner_padding + props.text_height, items[i].name )
                    .attr({'font-family': 'Helvetica'});
                if(i === selected_index) {
                    t.attr({fill: 'white'});
                }
            }
        } else {
            parent.rect(0,0, props.item_width, props.item_height * items.length)
                .attr({fill: "white"});
            for(var i = 0; i < items.length; i++) {
                if( i === selected_index) {
                    parent.rect(0, i * props.item_height, props.item_width, props.item_height);
                }
                var text_x = props.inner_padding;
                var text_y = i * props.item_height + props.inner_padding + props.text_height;
                var text_fill = i === selected_index ? 'white' : 'black';
                var text_attrs = {'font-family': 'Helvetica', fill: text_fill};
                parent.text(text_x, text_y, items[i].name)
                    .attr(text_attrs);
                if(items[i].children && items[i].children.length > 0) {
                    parent.text(text_x + props.item_width - 30, text_y, '>').attr(text_attrs);
                }
            }
        }
    }
});