import * as Blockly from 'blockly';
import * as FOL from '../../logic/fol';

export const folGenerator = new Blockly.Generator('fol');

const Order = {
    ATOMIC: 0,
};

folGenerator.forBlock['target_node'] = function(block, generator) {
    return ["y", Order.ATOMIC];
};

folGenerator.forBlock['node'] = function(block, generator) {
    return [`x${block.getFieldValue("VARNAME").charCodeAt(0)-97}`, Order.ATOMIC];
};

folGenerator.forBlock['points_to'] = function(block, generator) {
    return [`R(${generator.valueToCode(block,"SOURCE",Order.ATOMIC)},${generator.valueToCode(block,"TARGET",Order.ATOMIC)})`, Order.ATOMIC];
};

folGenerator.forBlock['binary_op'] = function(block, generator) {
    var op_type = block.getFieldValue("OPERATION");
    var op_token = (op_type === "AND") ? '&' : '|';
    return [`${op_token}(${generator.valueToCode(block,"OPERAND1",Order.ATOMIC)},${generator.valueToCode(block,"OPERAND2",Order.ATOMIC)})`, Order.ATOMIC];
};

folGenerator.forBlock['not'] = function(block, generator) {
    return [`~(${generator.valueToCode(block,"OPERAND",Order.ATOMIC)})`, Order.ATOMIC];
};

folGenerator.forBlock['quantifier'] = function(block, generator) {
    var qfr_type = block.getFieldValue("QUANTIFIER");
    var qfr_token = (qfr_type === "FORALL") ? 'A' : 'E';
    return [`${qfr_token}${generator.valueToCode(block,"FREEVAR",Order.ATOMIC)}(${generator.valueToCode(block,"PREDICATE",Order.ATOMIC)})`, Order.ATOMIC];
}
