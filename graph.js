function erdosRenyi(n, p) {
    let upto = Array.from(Array(n).keys());
    let allPairs = [].concat(...upto.map((i) => upto.map((j) => [i,j])));
    return Array.from(allPairs.filter((x) => Math.random() < p))
}

function visNodesList(n) {
    let upto = Array.from(Array(n).keys());
    return upto.map((i) => { return { id: i, label: '', color: 'black' } })
}

function visEdgesList(edg) {
    return edg.map((e) => { return { from: e[0], to: e[1], width: 1 } })
}

function modelFromEdgeList(n, edg) {
    let nodes = Array.from(Array(n).keys())
    return new FirstOrderModel(
        nodes,
        {},
        {},
        {
            'eq': ((x,y) => (x == y)),
            'R' : ((x,y) => edg.some((e) => e[0] === x && e[1] === y))
        }
    )
}

function highlightSat(visNodes, fom, formula) {
    let upto = Array.from(Array(visNodes.length).keys());
    let satNodes = Array.from(upto.map((i) => fom.evaluateFormulaInContext(formula, { "y": i })))
    for (let i = 0; i < visNodes.length; i++) {
        if (satNodes[i])
            visNodes.update({ id: i, color: 'orange' })
        else
            visNodes.update({ id: i, color: 'black' })
    }
} 
