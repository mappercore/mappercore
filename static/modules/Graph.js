"use strict";

/**
 * Create a set of graph UI elements include graph structure, toolbar and popovers.
 */
define((require) => {
  const { d3, _, $, b: { View, Model }, guard } = window;

  const Toolbar = require('./graph/Toolbar');
  const ModesManager = require('./graph/helpers/Modes');
  const BehaviorsManager = require('./graph/helpers/Behaviors');
  const ViewMode = require('./graph/modes/View');
  const Registry = require('./Registry');


  return View.extend({

    CLASS_NAME_VERTEX: 'viewer-graph__vertex',
    CLASS_NAME_EDGE: 'viewer-graph__edge',
    CLASS_NAME_SELECTED: '--selected',
    CLASS_NAME_UNAVAILABLE: '--unavailable',
    CLASS_NAME_CANDIDATE: '--candidate',
    EVENT_CLICK_LINK: 'click:link',
    EVENT_MOUSEOVER_LINK: 'mouseover:link',
    EVENT_MOUSEOUT_LINK: 'mouseout:link',
    EVENT_CLICK_NODE: 'click:node',
    EVENT_MOUSEOVER_NODE: 'mouseover:node',
    EVENT_MOUSEOUT_NODE: 'mouseout:node',
    EVENT_MOUSEENTER_NODE: 'mouseenter:node',
    EVENT_CHANGE_SELECTION: 'change:selection',
    EVENT_WILL_RENDER: 'willRender',
    EVENT_DID_RENDER: 'didRender',
    EVENT_WILL_LOAD: 'didLoad',
    EVENT_DID_LOAD: 'didLoad',
    EVENT_DID_LAYOUT: 'didLayout',
    EVENT_MODE_ACTIVATED: 'activate:mode',

    initialize: function (states) {
      this.config = new Model(_.extend({
        data: null,
        app: null,
        selection: null,
      }, states));

      this.app = this.config.get('app');

      // init html
      this.$el.addClass('viewer-graph');

      // init toolbar
      this.toolbar = new Toolbar({ el: d3.select(this.el).append('div').classed('viewer-graph__toolbar', true).node() });
      this.toolbar.setGraph(this);

      // init graph container
      this.container = d3.select(this.el).append('div').classed('viewer-graph__graph', true).node();
      this.$container = $(this.container);

      // init modes & behaviors
      this.modes = new ModesManager(this);
      this.behaviors = new BehaviorsManager(this);

      // init customizations
      this.modes.add(new ViewMode());
      this._initConfig();
      this.modes.activate('view');

      this._initEvents();
    },

    updateData(data) {
      this.config.set('data', data);
    },

    render: function () {
      this.toolbar.render();

      let width = this.$container.width();
      let height = Math.max(this.$container.height(), 800);

      d3.select(this.container).html("");

      this.svg = d3.select(this.container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      if (!this.config.get('data')) {
        this.svg
          .append('text')
          .attr('x', width / 2)
          .attr('y', 100)
          .attr('fill', 'gray')
          .attr('text-anchor', 'middle')
          .attr('font-size', 35)
          .text("no graph loaded yet");
        return;
      }

      this.links = null;
      this.nodes = null;

      this.trigger('willRender');
      this._renderLinks();
      this._renderNodes();
      this.trigger('didRender');
    },

    _initEvents() {
      this.listenTo(this.config, 'change:data', () => {
        this.modes.activate('view');
        this.render();
      });

      this.listenTo(this.config, 'change:selection', () => {
        this.trigger(this.EVENT_CHANGE_SELECTION);
      });
    },

    _renderNodes() {
      this.nodes = this.svg
        .selectAll("circle")
        .data(this.config.get("data")["nodes"])
        .enter()
        .append("circle")
        .classed(this.CLASS_NAME_VERTEX, true)
        .on("click", () => {
          this.trigger(this.EVENT_CLICK_NODE, d3.event);
        })
        .on("mouseenter", () => {
          this.trigger(this.EVENT_MOUSEENTER_NODE, d3.event);
        })
        .on("mouseover", () => {
          this.trigger(this.EVENT_MOUSEOVER_NODE, d3.event);
        })
        .on("mouseout", () => {
          this.trigger(this.EVENT_MOUSEOUT_NODE, d3.event);
        });
    },

    _renderLinks() {
      let data = this.config.get("data");
      this.links = this.svg
        .append('g')
        .selectAll("line")
        .data(this.config.get("data")["links"])
        .enter()
        .append("line")
        .classed(this.CLASS_NAME_EDGE, true)
        .on("click", () => {
          this.trigger(this.EVENT_CLICK_LINK, d3.event);
        })
        .on("mouseover", () => {
          this.trigger(this.EVENT_MOUSEOVER_LINK, d3.event);
        })
        .on("mouseout", () => {
          this.trigger(this.EVENT_MOUSEOUT_LINK, d3.event);
        });
    },

    selectNode(id) {
      this.nodes.filter((d) => d['id'] === id).classed(this.CLASS_NAME_SELECTED, true);
      this.updateSelection();
    },

    selectNodeList(list) {
      list.map((id) => {
        this.nodes.filter((d) => d['id'] === id).classed(this.CLASS_NAME_SELECTED, true);
      });
      this.updateSelection();
    },

    unselectNode(id) {
      this.nodes
        .filter((d) => d['id'] === id)
        .classed(this.CLASS_NAME_SELECTED, false);
      this.updateSelection();
    },

    unselectNodeList(list) {
      list.map((id) => {
        this.nodes.filter((d) => d['id'] === id).classed(this.CLASS_NAME_SELECTED, false);
      });
      this.updateSelection();
    },

    isNodeSelected(id) {
      return this.nodes.filter((d) => d['id'] === id)
        .classed(this.CLASS_NAME_SELECTED);
    },

    selectLink(targetEndPoints) {
      targetEndPoints = targetEndPoints.sort();

      this.links.filter((d) => {
        let testEndPoints = [d['source']['id'], d['target']['id']].sort();
        return testEndPoints[0] === targetEndPoints[0] && testEndPoints[1] === targetEndPoints[1];
      }).classed(this.CLASS_NAME_SELECTED, true);
    },

    updateSelection() {
      let selection = this.svg.selectAll('circle.' + this.CLASS_NAME_SELECTED).data();
      this.config.set('selection', selection.map((n) => n['id']));
    },

    clearSelection() {
      this.nodes.classed(this.CLASS_NAME_SELECTED, false);
      this.config.set('selection', []);
    },

    _initConfig() {
      guard(this.app.getOption('behaviors'), []).map((item) => {
        let Module = this._parseModule('behaviors', item);
        this.behaviors.add(new Module());
      });

      guard(this.app.getOption('modes'), []).map((item) => {
        let Module = this._parseModule('modes', item);
        this.modes.add(new Module());
      });
    },

    _parseModule(category, name) {
      if ((typeof name) === 'string') {
        if (!Registry[category][name]) {
          throw "Unknown " + category + ': ' + name;
        }
        return Registry[category][name];
      } else {
        return name;
      }
    }

  });
});
