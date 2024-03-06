// For reference purposes only
nodeTypes = [
    "VARIABLE",
    "FUNCTION",
    "RELATION",
    "QUANTIFIER",
    "BINARY-CONNECTIVE",
    "UNARY-CONNECTIVE"
]

function untilValid(ls, f) {
    for (let i = 0; i < ls.length; i++) {
        let res = f(ls.at(i));
        if (res != undefined) {
            return res
        }
    }
    return undefined
}

class FirstOrderNode {
    constructor(token, children) {
        this.token = token;
        this.children = children;
    }
}

class FirstOrderParser {
    constructor(varTokens, fxnTokens, relTokens, cstTokens) {
        this.varTokens = varTokens;
        this.fxnTokens = fxnTokens;
        this.relTokens = relTokens;
        this.cstTokens = cstTokens;
        this.qfrTokens = ['A', 'E'];
        this.binConTokens = ['&', '|'];
        this.unConTokens = ['~'];

        this.unconsumed = "";
    }

    tryParseToken(tok) {
        while (this.unconsumed.startsWith(' ')) {
            this.unconsumed = this.unconsumed.slice(1);
        }
        if (this.unconsumed.startsWith(tok)) {
            this.unconsumed = this.unconsumed.slice(tok.length)
            return new FirstOrderNode(tok, [])
        }
        return undefined
    }

    tryParseAnyToken(toks) {
        for (let i = 0; i < toks.length; i++) {
            let res = this.tryParseToken(toks.at(i));
            if (res != undefined) return res
        }
        return undefined
    }

    tryParseVar() {
        return this.tryParseAnyToken(this.varTokens)
    }

    tryParseCst() {
        return this.tryParseAnyToken(this.cstTokens)
    }

    mustParseFxn() {
        let fxn = this.tryParseAnyToken(this.fxnTokens);
        if (fxn == undefined) return undefined
        if (this.tryParseToken('(') == undefined)
            throw new SyntaxError("Expected open paren following function name " + fxn.token)
        let args = []
        args.push(this.mustParseExpr())
        while (this.tryParseToken(',') != undefined) {
            args.push(this.mustParseExpr())
        }
        if (this.tryParseToken(')') == undefined)
            throw new SyntaxError("Expected close paren following args of function " + fxn.token)
        fxn.children = args
        return fxn
    }

    mustParseExpr() {
        // An expression can be a constant...
        let res = this.tryParseCst();
        if (res != undefined) return res;

        // ... or a variable...
        res = this.tryParseVar();
        if (res != undefined) return res;

        // ... or a function evaluation.
        res = this.mustParseFxn()
        if (res != undefined) return res;

        throw new SyntaxError("Expected expression, but instead found " + this.unconsumed)
    }

    mustParseFormula(withBinop = true) {
        // A formula can be a parenthesized formula...
        let fNode = undefined;
        let res = this.tryParseToken("(");
        if (res != undefined) {
            fNode = this.mustParseFormula();
            if (this.tryParseToken(")") == undefined)
                throw new SyntaxError("Expected close paren closing parenthesized formula");
        }

        // ... or it can start with a unary connective...
        if (fNode == undefined) {
            res = this.tryParseAnyToken(this.unConTokens);
            if (res != undefined) {
                fNode = res;
                fNode.children.push(this.mustParseFormula(false));
                if (withBinop) {
                    res = this.tryParseAnyToken(this.binConTokens);
                    if (res != undefined) {
                        let fNode2 = res;
                        fNode2.children = [fNode, this.mustParseFormula()];
                        fNode = fNode2;
                    }
                }
            }
        }

        // ... or it can start with a quantifier...
        if (fNode == undefined) {
            res = this.tryParseAnyToken(this.qfrTokens);
            if (res != undefined) {
                fNode = res;
                res = this.tryParseAnyToken(this.varTokens);
                if (res == undefined)
                    throw new SyntaxError("Expected variable name after quantifier " + fNode.token);
                fNode.children = [res, this.mustParseFormula(false)];
            }
        }

        // ... or it can consist of a relation evaluation.
        if (fNode == undefined) {
            res = this.tryParseAnyToken(this.relTokens);
            if (res != undefined) {
                fNode = res;
                if (this.tryParseToken('(') == undefined)
                    throw new SyntaxError("Expected open paren for call to relation " + fNode.token);
                fNode.children.push(this.mustParseExpr());
                while (this.tryParseToken(',') != undefined) {
                    fNode.children.push(this.mustParseExpr());
                }
                if (this.tryParseToken(')') == undefined)
                    throw new SyntaxError("Expected close paren for call to relation " + fNode.token);
            }
        }

        if (fNode == undefined)
            throw new SyntaxError("Expected string starting with formula, but found " + this.unconsumed);

        // Optionally, the formula can be conjoined with others using binary connectives.
        if (withBinop) {
            res = this.tryParseAnyToken(this.binConTokens);
            if (res != undefined) {
                let fNode2 = res;
                fNode2.children = [fNode, this.mustParseFormula()];
                fNode = fNode2;
            }
        }

        return fNode
    }

    mustParseEntireFormula() {
        let fNode = this.mustParseFormula();
        if (this.unconsumed.replace(/\s/g, "").length > 0) {
            throw new SyntaxError("Unexpected tokens at end of string: " + this.unconsumed);
        }
        return fNode;
    }
    
}

class FirstOrderModel {
    constructor(universe, cmap, fmap, rmap) {
        this.universe = universe;
        this.cmap = cmap;
        this.fmap = fmap;
        this.rmap = rmap;

        let vars = [...Array(99).keys()].map((n)=>{ return "x"+n });
        this.parser = new FirstOrderParser(vars, Object.keys(fmap), Object.keys(rmap), Object.keys(cmap));
    }

    evaluateExprNodeInContext(eNode, table) {
        // Function evaluation
        if (Object.keys(this.fmap).indexOf(eNode.token) > -1) {
            let f = this.fmap[eNode.token];
            if (eNode.children.length != f.length)
                throw new Error("Function " + eNode.token + " expected " + f.length + " arguments, got " + eNode.children.length);
            return f(...(eNode.children.map((en) => { return this.evaluateExprNodeInContext(en, table) }))); 
        }

        // Constant symbol evaluation
        if (Object.keys(this.cmap).indexOf(eNode.token) > -1) {
            return this.cmap[eNode.token];
        }

        // Variable evaluation, in context
        if (Object.keys(table).indexOf(eNode.token) > -1) {
            return table[eNode.token];
        }

        throw new Error("Literal '" + eNode.token + "' unrecognized");
    }

    evaluateExpr(strin) {
        this.parser.unconsumed = strin;
        let eNode = this.parser.mustParseExpr();
        return this.evaluateNodeInContext(eNode, {});
    }

    evaluateFormulaNodeInContext(fNode, table) {
        if (this.parser.unConTokens.indexOf(fNode.token) > -1) {
            if (fNode.token == "~") {
                return !(this.evaluateFormulaNodeInContext(fNode.children[0], table));
            }
        }

        if (this.parser.binConTokens.indexOf(fNode.token) > -1) {
            if (fNode.token === "&") {
                return this.evaluateFormulaNodeInContext(fNode.children[0], table)
                        && this.evaluateFormulaNodeInContext(fNode.children[1], table)
            } else if (fNode.token === "|") {
                return this.evaluateFormulaNodeInContext(fNode.children[0], table)
                        || this.evaluateFormulaNodeInContext(fNode.children[1], table)
            }
        }

        if (this.parser.relTokens.indexOf(fNode.token) > -1) {
            let rel = this.rmap[fNode.token];
            let args = fNode.children.map((eNode) => { return this.evaluateExprNodeInContext(eNode, table) });
            return rel(...args)
        }

        if (this.parser.qfrTokens.indexOf(fNode.token) > -1) {
            if (fNode.token === "A") {
                for (let i = 0; i < this.universe.length; i++) {
                    let augTable = table;
                    augTable[fNode.children[0].token] = this.universe[i];
                    let truthVal = this.evaluateFormulaNodeInContext(fNode.children[1], augTable);
                    if (!truthVal) return false;
                }
                return true;
            } else if (fNode.token === "E") {
                for (let i = 0; i < this.universe.length; i++) {
                    let augTable = table;
                    augTable[fNode.children[0].token] = this.universe[i];
                    let truthVal = this.evaluateFormulaNodeInContext(fNode.children[1], augTable);
                    if (truthVal) return true;
                }
                return false;
            }
        }

        throw new SyntaxError("Unrecognized token " + fNode.token);
    }

    evaluateFormulaInContext(strin, table) {
        this.parser.unconsumed = strin;
        let fNode = this.parser.mustParseEntireFormula();
        return this.evaluateFormulaNodeInContext(fNode, table);
    }
}

varnames = ["y"].concat(Array.from(Array(99).keys()).map((n) => `x${n}`))
fop = new FirstOrderParser(varnames, [], ['eq', 'R'], [])

