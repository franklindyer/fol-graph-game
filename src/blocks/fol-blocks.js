import * as Blockly from 'blockly';

export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([{
  "type": "binary_op",
  "message0": "%1 %2 %3",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "OPERATION",
      "options": [
        ["and", "AND"],
        ["or", "OR"]
      ]
    },
    {
      "type": "input_value",
      "name": "OPERAND1",
      "check": "bool"
    },
    {
      "type": "input_value",
      "name": "OPERAND2",
      "check": "bool"
    }
  ],
  "output": "bool",
  "colour": 190,
},
{
  "type": "not",
  "message0": "not %1",
  "args0": [
    {
      "type": "input_value",
      "name": "OPERAND",
      "check": "bool"
    }
  ],
  "output": "bool",
  "colour": 190
},
{
  "type": "node",
  "message0": "⚪️ %1",
  "args0": [{
    "type": "field_dropdown",
    "name": "VARNAME",
    "options": [["a","a"], ["b","b"], ["c","c"], ["d","d"], ["e","e"], ["f","f"], ["g","g"]] 
  }],
  "output": ["expr", "variable"],
  "colour": 45
},
{
  "type": "target_node",
  "message0": "🟢",
  "args0": [],
  "output": "expr",
  "colour": 45
},
{
  "type": "eq",
  "message0": "%1 = %2",
  "args0": [
    {
        "type": "input_value",
        "name": "LHS",
        "check": "expr"
    },
    {
        "type": "input_value",
        "name": "RHS",
        "check": "expr"
    }
  ],
  "output": "bool",
  "colour": 190,
  "inputsInline": true
},
{
  "type": "points_to",
  "message0": "%1↪%2",
  "args0": [
    {
        "type": "input_value",
        "name": "SOURCE",
        "check": "expr"
    },
    {
        "type": "input_value",
        "name": "TARGET",
        "check": "expr"
    }
  ],
  "output": "bool",
  "colour": 190,
  "inputsInline": false
},
{
  "type": "quantifier",
  "message0": "%1 %2 %3",
  "args0": [
    {
        "type": "field_dropdown",
        "name": "QUANTIFIER",
        "options": [
            ["∀", "FORALL"],
            ["∃", "EXISTS"]
        ]
    },
    {
        "type": "input_value",
        "name": "FREEVAR",
        "check": "variable" 
    },
    {
        "type": "input_value",
        "name": "PREDICATE",
        "check": "bool"
    }
  ],
  "output": "bool",
  "colour": 190,
  "inputsInline": false
}
]);
