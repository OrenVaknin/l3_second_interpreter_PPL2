import { ClassExp,isLetExp,makeLetExp, makeIfExp,makeVarDecl, isLitExp, isProcExp,isAppExp,makeAppExp, makeDefineExp, makeBoolExp, makeProgram, isIfExp, isAtomicExp, makePrimOp, makeLitExp, makeVarRef, ProcExp, Exp, Program, makeProcExp, isClassExp, isProgram, isDefineExp, isCExp, isExp, Binding, CExp, VarDecl } from "./L3-ast";
import { Result, makeFailure, bind, makeOk, mapResult } from "../shared/result";
import { map } from "ramda";


/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp => {
    const fields = exp.fields; // Use the fields directly as VarDecl[]

    const createMethodIfExp = (method: Binding, acc: CExp): CExp =>
        makeIfExp(
            makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(`'${method.var.var}`)]),
            makeAppExp(method.val, []), // Directly use the method value
            acc
        );

    const body = exp.methods.reduceRight((acc: CExp, method: Binding) =>
        createMethodIfExp(method, acc),
        makeBoolExp(false)
    );

    const finalBody = makeProcExp([makeVarDecl("msg")],[body]);
    
    return makeProcExp(fields,[finalBody]);
};
/*
Purpose: Transform all class forms in the given AST to procs
Signature: lexTransform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const lexTransform = (exp: Exp | Program): Result<Exp | Program> =>
    isProgram(exp) ? 
        bind(mapResult(lexTransform, exp.exps), (exps: (Exp | Program)[]) => 
            makeOk(makeProgram(exps.filter(isExp) as Exp[]))) :
    makeOk(rewriteAllClassExp(exp));


const rewriteAllClassExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllClassCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllClassCExp(exp.val)) :
    exp;


const rewriteAllClassCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllClassCExp(exp.test),
                             rewriteAllClassCExp(exp.then),
                             rewriteAllClassCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllClassCExp(exp.rator),
                               map(rewriteAllClassCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllClassCExp, exp.body)) :
    isLetExp(exp) ? makeLetExp(exp.bindings, map(rewriteAllClassCExp, exp.body)) :
    isClassExp(exp) ? class2proc(exp) :
    exp;

/* export const lexTransform = (exp: Exp | Program): Result<Exp | Program> => {
    if (isProgram(exp)) {
        return bind(mapResult(lexTransform, exp.exps), (exps: (Exp | Program)[]) => {
            const filteredExps = exps.filter((e): e is Exp => isExp(e)); // Filter out non-Exp elements
            return makeOk({ ...exp, exps: filteredExps });
        });
    } else if (isDefineExp(exp)) {
        return bind(lexTransform(exp.val), (val: Exp | Program) => makeOk({ ...exp, val: val as Exp }));
    } else if (isClassExp(exp)) {
        return makeOk(class2proc(exp));
    } else if (isCExp(exp)) {
        return mapCExp(lexTransform, exp);
    } else {
        return makeOk(exp);
    }
}; */