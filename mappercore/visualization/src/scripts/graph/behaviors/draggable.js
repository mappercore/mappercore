define(function (require) {
  const d3 = require('d3');
  const GraphBehavior = require('../behavior');

  class Draggable extends GraphBehavior {

    constructor() {
      super();
      this.name = 'draggable';
    }

    didMount() {
      super.didMount();
      this.listenTo('graph:didRender', () => {
        this.forceSimulation = this.graph.behaviors.get('force-simulation');
        this.graph.nodes.call(d3.drag()
          .on("start", (d) => {
            this.dragStarted(d);
          })
          .on("drag", (d) => {
            this.dragged(d);
          })
          .on("end", (d) => {
            this.dragEnded(d);
          }));
      });
    }

    dragStarted(d) {
      if (this.paused) {
        return false;
      }

      if (this.forceSimulation && !d3.event.active) {
        this.forceSimulation.simulation.alphaTarget(0.3).restart();
      }

      d.fx = d.x;
      d.fy = d.y;
    };

    dragged(d) {
      if (this.paused) {
        return false;
      }
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    };

    dragEnded(d) {
      if (this.paused) {
        return false;
      }

      if (this.forceSimulation && !d3.event.active) {
        this.forceSimulation.simulation.alphaTarget(0);
      }

      d.fx = null;
      d.fy = null;
    };
  }


  return Draggable;

});