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
        this.frequency = itemJSON.frequency;
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
    stringIdentifier: function() {
        var names = this.path.map(function(x) { return x.name;});
        names.push(this.name);
        return names.join('->');
    },
    /**
     * Performs hit test on menu item and all submenus
     * @param rx x relative to left of parent
     * @param ry y relative totop of parent
     * @param props menu display properties
     * @return undefined if
     */
    hit: function(rx, ry, props) {
        // If we are not the topmost element, and our parent is not active,
        // then we are not visible so we do not get hit
        if(this.path.length > 0 && !this.path[this.path.length - 1].is_active) {
            return undefined;
        }
        var item_width = this.path.length === 0 ? props.top_item_width : props.item_width;
        var item_x = this.path.length === 0 ? this.index_in_parent * props.top_item_width : 0;
        var item_y = this.path.length === 0 ? 0 : this.index_in_parent * props.item_height;
        var rx2 = rx - item_x;
        var ry2 = ry - item_y;
        if(rx2 > 0 && rx2 < item_width && ry2 > 0 && ry2 < props.item_height) {
            return this;
        }
        for(var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            // Left of sub-menu
            var left = this.path.length === 0 ? item_x : item_x + item_width;
            var top = this.path.length === 0 ? item_y + props.item_height : item_y;
            rx2 = rx - left;
            ry2 = ry - top;
            var result = this.children[i].hit(rx2, ry2, props);
            if(result) {
                return result;
            }
        }
        return undefined;
    },
    getDescendants: function() {
        var result = [];
        var q = [];
        for(var i = 0; this.children && i < this.children.length; i++) {
            q.push(this.children[i]);
        }
        while(q.length > 0) {
            var current = q.splice(0,1)[0];
            result.push(current);
            for(var i = 0; current.children &&  i < current.children.length; i++) {
                q.push(current.children[i]);
            }
        }
        return result;
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
        this.initFSM();
    },
    initFSM: function() {
        var predictTransition = new Transition({
            to: "down",
            source: "virtual",
            type: "menu",
            predicate: function(predictionEvent) {
                var menuItems = this.depthFirstTraversal();
                var needle_id = predictionEvent.item.stringIdentifier();
                console.log("needle: ", needle_id);
                for(var i = 0; i < menuItems.length; i++) {
                    if(menuItems[i].stringIdentifier() === needle_id) {
                        this.setActiveChild(menuItems[i]);
                        break;
                    }
                }
            },
            feedback_action: this.onDown,
            handles_event: true
        });
        this.fsm_description = {
            start: [
                new MouseDownTransition(
                    "down",
                    this.hitTestAndUpdate,
                    this.onDown,
                    undefined,
                    true
                ),
                predictTransition
            ],
            down: [
                new MouseMoveTransition(
                    "down",
                    this.hitTestAndUpdate,
                    this.onMenuItemUpdate,
                    undefined,
                    true
                ),
                new MouseDownTransition(
                    "start",
                    this.hitTestAndUpdate,
                    undefined,
                    this.selectActiveChild,
                    true
                ),
                new MouseDownTransition(
                    "start",
                    function(e){return !this.hitTestAndUpdate(e);},
                    undefined,
                    this.closeMenu,
                    true
                ),
                new KeydownTransition(
                    "start",
                    function(e) { return e.keyCode === 13; }, // 13 is enter
                    undefined,
                    this.selectActiveChild,
                    true
                ),
                predictTransition
            ]
        };
    },
    /**
     * Closes the menu
     * @param e
     */
    closeMenu: function() {
        this.active_child = undefined;
    },
    /**
     * Perform a hit test given the mouse event e
     * and update the currently active item
     * @param e mouse event
     */
    hitTestAndUpdate: function(e){
        var rx = e.element_x - this.properties.x;
        var ry = e.element_y - this.properties.y;
        var result = this.hitTest(rx, ry);
        if(result) {
            this.setActiveChild(result);
            return true;
        }
        return false;
    },
    selectActiveChild: function(e, rootView) {
        console.log('here');
        if(this.onItemSelected) {
            this.onItemSelected(this.active_child);
        }
        this.closeMenu();
    },
    /**
     * Feedback Called when the menu initially gets clicked
     * @param e
     * @param rootView
     */
    onDown: function(e, rootView) {

    },
    /**
     * Feedback Called when the active menu item updates
     * @param e
     * @param rootView
     */
    onMenuItemUpdate: function(e, rootView) {

    },
    /** Set the active menu item
     * Unsets the previous active menu item.
     */
    setActiveChild: function(child){
        if(this.active_child) {
            for(var i = 0; i < this.active_child.path.length; i++) {
                delete this.active_child.path[i].is_active;
            }
            delete this.active_child.is_active;
        }
        for(var i = 0; i < child.path.length; i++) {
            child.path[i].is_active = true;
        }
        child.is_active = true;
        this.active_child = child;
    },
    /**
     * Performs a hit test on the menu, returning the menu item hit.
     * If no menu item is hit, returns undefined
     * @param x The x coordinate relative to the interface
     * @param y The y coordinate relative to the interface
     */
    hitTest: function(x, y) {
        var rx = x - this.properties.x;
        var ry = y - this.properties.y;
        for(var i = 0; i < this.menuItems.length; i++) {
            var result = this.menuItems[i].hit(rx, ry, this.properties);
            if(result) {
                return result;
            }
        }
        return undefined;
    },
    depthFirstTraversal: function() {
        if(this.dfsCache) {
            return this.dfsCache;
        }
        var s = [];
        var result = [];
        var i = 0;
        for (i = 0; i < this.menuItems.length; i++) {
            s.push(this.menuItems[i]);
        }
        while(s.length > 0) {
            // Remove the first element and return the value. It is returned in an array
            // e.g. [1,2,3].splice(0,1) returne [1]
            var current = s.splice(-1,1)[0];
            result.push(current);
            for(i = 0; current.children && i < current.children.length; i++) {
                s.push(current.children[i]);
            }
        }
        return result.reverse();
    },

    clone: function() {
        var result = this._super();
        var dfs = this.depthFirstTraversal();
        var activeIndex = -1;
        for(var i = 0; i < dfs.length; i++) {
            if(dfs[i] === this.active_child) {
                activeIndex = i;
            }
        }
        result.menuItems = deepCopy(this.menuItems);
        if(activeIndex > -1) {
            dfs = result.depthFirstTraversal();
            result.active_child = dfs[activeIndex];
        }
        result.onItemSelected = this.onItemSelected;
        return result;
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
            var current_level = -1;
            var selected_index = -1;

            // Draw the menus in the path, e.g. the parent menus
            for(var i = 0; i < this.active_child.path.length; i++) {
                // we need to create a new matrix every time because translate appends to current translation,
                // we want translation to be from 0,0 every time
                m = new Snap.Matrix();
                current_level = i;
                selected_index = this.active_child.path[i].index_in_parent;

                this.drawSubMenu(current_children, current_level, selected_index, current_group);
                if(current_level === 0) {
                    m.translate(this.properties.top_item_width * selected_index, this.properties.item_height);
                } else {
                    m.translate(this.properties.item_width, this.properties.item_height * (selected_index));
                }

                // update variables
                current_children = this.active_child.path[i].children;
                current_group = current_group.group();
                current_group.attr({transform: m.toTransformString()});
            }
            current_level++;

            // Draw the menu at our level
            this.drawSubMenu(current_children, current_level, this.active_child.index_in_parent,  current_group);
            selected_index = this.active_child.index_in_parent;

            // If the active item has children, draw the menus there also
            if(this.active_child.children && this.active_child.children.length > 0) {
                current_level++;
                m = new Snap.Matrix();
                if(current_level == 1) {
                    m.translate(this.properties.top_item_width * selected_index, this.properties.item_height);
                } else {
                    m.translate(this.properties.item_width, this.properties.item_height * (selected_index));
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
                    parent.rect(0, i * props.item_height, props.item_width, props.item_height).attr({fill: props.highlight_color});
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
