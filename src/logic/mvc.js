import * as FOL from './fol';
// import * as Vis from 'vis-network';
import { Network, DataSet } from 'vis-network/standalone';

export class Model {
    constructor() {
        this.level = -1;
        this.size = 0;
        this.edglist = [];
        this.targets = [];
        this.selected = [];
        var varnames = ["y"].concat(Array.from(Array(99).keys()).map((n) => `x${n}`));
        this.fop = new FOL.FirstOrderParser(varnames, [], ['eq', 'R'], []);
        this.fom = undefined;
    }

    erdosRenyi(n, p) {
        this.size = n;
        let upto = Array.from(Array(n).keys());
        let allPairs = [].concat(...upto.map((i) => upto.map((j) => [i,j])));
        return Array.from(allPairs.filter((x) => Math.random() < p))
    }

    fromEdgeList(n, edg) {
        this.size = n;
        let nodes = Array.from(Array(n).keys())
        this.fom = new FOL.FirstOrderModel(
            nodes,
            {},
            {},
            {
                'eq': ((x,y) => (x == y)),
                'R' : ((x,y) => edg.some((e) => e[0] === x && e[1] === y))
            }
        )
    }

    getSat(formula) {
        let upto = Array.from(Array(this.fom.universe.length).keys());
        let satNodes = Array.from(upto.map((i) => this.fom.evaluateFormulaInContext(formula, { "y": i })))
        return upto.filter((i) => satNodes[i])
    }

    runRandomGraph(numNodes, probEdge) {
        var edgesList = this.erdosRenyi(numNodes, probEdge);
        this.edglist = edgesList;
        this.fromEdgeList(numNodes, edgesList);
        this.fom.parser = this.fop;
        this.level = -1;
        this.target = [];
    }

    runLevelGraph(level) {
        var numNodes = level.nodes; 
        var edgesList = level.edges;
        this.edglist = edgesList;
        this.fromEdgeList(numNodes, edgesList);
        this.fom.parser = this.fop;
        this.target = level.target;
    }
}

export class View {
    constructor() {
        this.visNodes = undefined;
        this.visEdges = undefined;
        this.network = undefined;
    }

    visNodesList(n) {
        let upto = Array.from(Array(n).keys());
        let visNodes = upto.map((i) => { 
            return { 
                id: i, 
                label: '', 
                color: {
                    background: "black",
                    border: "orange",
                    highlight: {
                        background: "black",
                        border: "orange"
                    }
                }, 
                borderWidth: 0 
            } 
        })
        this.visNodes = new DataSet(visNodes)
    }

    
    visEdgesList(edg) {
        var visEdges = [];
        for (let i = 0; i < edg.length; i++) {
            var e = edg[i];
            if (visEdges.some((ve) => ve.from === e[1] && ve.to === e[0])) continue;
            if (edg.slice(i).some((e2) => e2[0] === e[1] && e2[1] === e[0]))
                visEdges.push({ from: e[0], to: e[1], width: 1 })
            else
                visEdges.push({ from: e[0], to: e[1], width: 1, arrows: "to" })
        }
        this.visEdges = new DataSet(visEdges)
    }

    setNodeColor(i, background, border) {
        this.visNodes.update({
            id: i,
            color: {
                background: background,
                border: border,
                highlight: {
                    background: background,
                    border: border
                }
            }
        })
    }

    setNodeBorder(i, borderWidth) {
        this.visNodes.update({
            id: i,
            borderWidth: borderWidth,
            borderWidthSelected: borderWidth
        })
    }

    highlightSelected(sel) {
        let upto = Array.from(Array(this.visNodes.length).keys());
        for (let i = 0; i < this.visNodes.length; i++) {
            if (sel.includes(i))    this.setNodeBorder(i, 3)
            else                    this.setNodeBorder(i, 0)
        }
    }

    render() {
        scroll(0,0)
        var data = { nodes: this.visNodes, edges: this.visEdges };
        var options = {
            edges: {
                color: {
                    inherit: false
                }
            }
        }
        this.network = new Network(document.getElementById('networkbox'), data, options);
    }

    styleNodes(special) {
        for (let i = 0; i < this.visNodes.length; i++) {
            if (special.includes(i))    this.setNodeColor(i, "#22A7F0", "orange")
            else                        this.setNodeColor(i, "black", "orange")
        }
    }

    markLevelCompleted(levelNum) {
        var levelMarker = document.getElementById(`level-marker-${levelNum}`);
        levelMarker.innerHTML = " ✅";
    } 

}

export class Controller {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    randomize() {
        this.model.runRandomGraph(20, 0.1);
        this.view.visNodesList(this.model.size);
        this.view.visEdgesList(this.model.edglist);
        this.view.render()
    }

    runLevel(level) {
        this.model.runLevelGraph(level);
        this.model.level = level.num;
        this.view.visNodesList(this.model.size);
        this.view.visEdgesList(this.model.edglist);
        this.view.render();
        this.view.styleNodes(this.model.target);
    }

    tryPredicate(pred) {
        var sel = this.model.getSat(pred);
        this.view.highlightSelected(sel);
        var complete = this.model.level != -1 && sel.toString() === this.model.target.toString();
        if (complete) this.view.markLevelCompleted(this.model.level);
        return complete
    }

}

export const levels = [
    {
        num: 0,
        name: "Two nodes",
        nodes: 2,
        edges: [[0,1]],
        target: [0]
    },
    {
        num: 1,
        name: "Lonely node",
        nodes: 5,
        edges: [[0,1],[1,0],[0,2],[2,0],[0,3],[3,0],[1,2],[2,1],[1,3],[3,1],[2,3],[3,2]],
        target: [4]
    },
    {
        num: 2,
        name: "Lollipop",
        nodes: 7,
        edges: [[0,1],[1,0],[1,2],[2,1],[2,3],[3,2],[3,4],[4,3],[4,5],[5,4],[5,0],[0,5],[3,6],[6,3]],
        target: [0]
    },
    {
        num: 3,
        name: "Triangle square",
        nodes: 7,
        edges: [[0,1],[1,2],[2,0],[3,4],[4,5],[5,6],[6,3]],
        target: [0,1,2]
    },
    {
        num: 4,
        name: "Taffy",
        nodes: 9,
        edges: [[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[7,8]],
        target: [3]
    },
    {
        num: 5,
        name: "Tree",
        nodes: 9,
        edges: [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[6,7],[6,8]],
        target: [5]
    }
]

